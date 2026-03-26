/**
 * Central scoring pipeline — powered by the conservative multi-layer engine.
 * Replaces the old detectAllergens → inferFromDish → allergenDictionary → scoreRisk chain.
 */

import { analyzeLine } from "./engine/analyzerPipeline";
import { getAllergenSources } from "./engine/riskScorer";
import { getSubstitutions } from "./engine/substitutionSuggester";
import type {
  RawMenuItem,
  ScoredMenuItem,
  Restaurant,
  ScoredRestaurant,
  RestaurantSafetySummary,
  SourceType,
  Risk,
  Confidence,
  AllergenId,
  AllergenSeverity,
} from "./types";

function mapRisk(r: "safe" | "ask" | "avoid"): Risk {
  return r === "safe" ? "likely-safe" : r;
}

function mapConfidence(c: "high" | "medium" | "low"): Confidence {
  if (c === "high") return "High";
  if (c === "medium") return "Medium";
  return "Low";
}

/**
 * Scores a single raw menu item against the user's allergen list.
 * Uses the new 5-layer detection engine (direct → synonym → dish/sauce → prep → cuisine/ambiguity).
 */
export function scoreMenuItem(
  item: RawMenuItem,
  restaurantSource: SourceType,
  userAllergens: AllergenId[],
  cuisineContext = "",
  severities: Partial<Record<AllergenId, AllergenSeverity>> = {}
): ScoredMenuItem {
  const srcType = item.sourceType ?? restaurantSource;

  // Prefer pre-cleaned normalizedText from the ingestion layer when available.
  // Falls back to joining name + description (same as before) for legacy items.
  const text = item.normalizedText || [item.name, item.description].filter(Boolean).join(" ");

  // Run through the new engine
  const analyzed = analyzeLine(text, userAllergens, cuisineContext, srcType);

  // Official allergens are ground-truth from a verified source (Nutritionix / official API).
  // If any hit the user's profile → always "avoid". No "ask" path for official data —
  // it's binary: the allergen is either present or it isn't.
  const officialAllergens: AllergenId[] = (item.allergens ?? []) as AllergenId[];
  const officialHits = officialAllergens.filter((a) => userAllergens.includes(a));

  // For official sourceType, the allergen list is ground-truth — trust it completely.
  // Don't let cuisine/dish inference override a verified clean ingredient list.
  const isOfficialData = srcType === "official";
  const risk: Risk = officialHits.length > 0
    ? "avoid"
    : isOfficialData
      ? "likely-safe"
      : mapRisk(analyzed.risk);
  const allDetected: string[] = [...new Set([...analyzed.allDetectedAllergens, ...officialAllergens])];
  const userAllergenHits: string[] = officialHits.length > 0
    ? [...new Set([...analyzed.matchedAllergens, ...officialHits])]
    : isOfficialData
      ? []
      : [...analyzed.matchedAllergens];

  // Build severity map for hits — only for allergens the user flagged as anaphylactic
  const severityHits: Partial<Record<string, AllergenSeverity>> = {};
  for (const hit of userAllergenHits) {
    const sev = severities[hit as AllergenId];
    if (sev) severityHits[hit] = sev;
  }

  // Escalate risk: if any hit allergen is anaphylactic, "ask" → "avoid"
  const hasAnaphylacticHit = userAllergenHits.some(
    (h) => severities[h as AllergenId] === "anaphylactic"
  );

  // Build explanation for this item.
  // Engine explanation covers allergens it detected with high confidence (weight ≥ 3).
  // For official items, also surface per-allergen notes for verified allergens that the
  // engine only flagged as "possible" (weight 1-2) — e.g. soy from fryer oil on a sandwich.
  let explanation: string;
  if (isOfficialData && officialHits.length === 0) {
    explanation = "No allergens from your profile detected in official ingredient data.";
  } else if (officialHits.length > 0 && analyzed.risk !== "avoid") {
    // Engine found nothing/ask, but official data confirms allergens — generic fallback
    explanation = `Contains ${officialHits.map((a) => a).join(", ")} — listed in official allergen data.`;
  } else {
    // Engine said avoid — use its per-allergen explanation.
    // Supplement with any officially-confirmed allergens the engine only inferred as possible.
    const engineCovered = new Set(analyzed.matchedAllergens);
    const uncovered = officialHits.filter((a) => !engineCovered.has(a));
    const supplement = uncovered.map((a) => {
      const signal = analyzed.signals.find((s) => s.allergen === a);
      return signal
        ? `${a.replace(/-/g, " ")}: ${signal.reason}`
        : `${a.replace(/-/g, " ")}: confirmed in official allergen data`;
    });
    explanation = supplement.length
      ? [analyzed.explanation.replace(/\.$/, ""), ...supplement].join(". ") + "."
      : analyzed.explanation;
  }

  // Per-item sourceConfidence from the ingestion adapter takes precedence over the
  // engine's own confidence estimate. This lets a single well-documented item inside
  // a medium-confidence scrape (e.g. one that listed official allergens inline) be
  // treated as high confidence without upgrading the whole restaurant's source tier.
  const confidence: Confidence = item.sourceConfidence
    ? mapConfidence(item.sourceConfidence)
    : mapConfidence(analyzed.confidence);

  // Determine allergen certainty: "precautionary" if ALL user allergen hits came only
  // from "may contain" / facility labels — i.e. cross-contamination risk, not confirmed presence.
  const precautionaryAllergens = analyzed.precautionaryAllergens ?? [];
  const allHitsPrecautionary =
    userAllergenHits.length > 0 &&
    userAllergenHits.every((h) => precautionaryAllergens.includes(h as AllergenId));
  const allergenCertainty: "definite" | "precautionary" | undefined =
    userAllergenHits.length === 0 ? undefined : allHitsPrecautionary ? "precautionary" : "definite";

  // Apply severity escalation: anaphylactic "ask" → "avoid"
  // But never escalate precautionary-only items — "may contain" is always capped at "ask".
  const canEscalate = !allHitsPrecautionary;
  const riskAfterPrecautionary: Risk = allHitsPrecautionary && risk === "avoid" ? "ask" : risk;
  const finalRisk: Risk = canEscalate && hasAnaphylacticHit && riskAfterPrecautionary === "ask"
    ? "avoid"
    : riskAfterPrecautionary;

  return {
    id:          item.id,
    name:        item.name,
    description: item.description,
    category:    item.category,
    sourceType:  srcType,
    confidence,
    risk: finalRisk,
    severityHits: Object.keys(severityHits).length > 0 ? severityHits : undefined,
    allergenCertainty,
    detectedAllergens: allDetected,
    inferredAllergens: analyzed.signals
      .filter((s) => ["dish", "sauce", "cuisine", "prep"].includes(s.source))
      // For official items, don't surface cuisine/dish inferences for allergens in the user's
      // profile — the official list is authoritative for those; only show inferred non-profile allergens.
      .filter((s) => !isOfficialData || !userAllergens.includes(s.allergen))
      .map((s) => s.allergen),
    inferredReasons: [...new Set(
      analyzed.signals
        .filter((s) => s.source !== "direct" && s.source !== "synonym")
        .map((s) => s.reason)
    )],
    triggerTerms:   [...new Set(analyzed.signals.map((s) => s.trigger))],
    explanation,
    // For official items with no allergen hits, suppress questions generated from
    // cuisine/dish inference — they'd be false positives on a verified clean ingredient.
    staffQuestions: isOfficialData && officialHits.length === 0 ? [] : analyzed.staffQuestions,
    userAllergenHits,
    allergenSources: getAllergenSources(analyzed.signals, userAllergenHits as AllergenId[]),
    substitutions:  finalRisk !== "likely-safe" ? getSubstitutions(userAllergenHits as AllergenId[], text.toLowerCase(), analyzed.signals) : [],
    sectionIndex:   item.sectionIndex,
    sourceSignals:  item.sourceSignals,
  };
}

// ─── Data quality / coverage tiers ───────────────────────────────────────────

export type CoverageTier = "full" | "partial" | "limited" | "none";

/**
 * Classifies a restaurant by how much menu data has been analyzed.
 *   full    ≥ 20 items — comprehensive, results are highly trustworthy
 *   partial  5–19 items — decent signal, most decisions are reliable
 *   limited  1–4 items — thin data, treat with caution
 *   none     0 items   — no analysis available
 */
export function coverageTier(total: number): CoverageTier {
  if (total === 0)  return "none";
  if (total < 5)   return "limited";
  if (total < 20)  return "partial";
  return "full";
}

export function coverageTierLabel(total: number): string {
  const tier = coverageTier(total);
  switch (tier) {
    case "full":    return "Strong coverage";
    case "partial": return `Moderate coverage · ${total} items`;
    case "limited": return `Limited coverage · ${total} item${total === 1 ? "" : "s"}`;
    case "none":    return "No menu data yet";
  }
}

export function coverageTierColor(tier: CoverageTier): string {
  switch (tier) {
    case "full":    return "#22c55e"; // green
    case "partial": return "#3b82f6"; // blue
    case "limited": return "#f59e0b"; // amber
    case "none":    return "#9ca3af"; // gray
  }
}

// ─── Coverage weight for scoring ─────────────────────────────────────────────

/**
 * Maps item count to a [0, 1] confidence weight aligned with coverage tiers.
 *   none    (0)     → 0
 *   limited (1–4)   → 0.05–0.20  (very thin, barely counts)
 *   partial (5–19)  → 0.25–0.97  (linearly scales to full)
 *   full    (20+)   → 1.0
 */
export function coverageWeight(total: number): number {
  if (total === 0)  return 0;
  if (total < 5)   return (total / 4) * 0.20;          // 0.05 → 0.20
  if (total < 20)  return 0.25 + ((total - 5) / 15) * 0.75; // 0.25 → 1.0
  return 1.0;
}

/**
 * Best-match ranking score for a ScoredRestaurant.
 *
 * Design goals (in priority order):
 *   1. Zero avoids with sufficient coverage → highest signal of safety
 *   2. High safe ratio, weighted by how much data we have
 *   3. Penalise avoid items by both ratio and absolute count
 *   4. Favour closer restaurants (diminishing returns, capped at 15mi)
 *   5. Penalise thin/no data so uncertain restaurants don't bubble up
 *
 * Returns a number in roughly (-0.7, 0.7) — higher is better.
 */
export function bestMatchScore(r: {
  summary: { likelySafe: number; avoid: number; total: number };
  distance?: number | null;
}): number {
  const { likelySafe, avoid, total } = r.summary;
  const dist = r.distance ?? 15;

  // No menu data: push toward bottom; tiebreak by distance
  if (total === 0) return -(0.5 + Math.min(dist, 15) / 150);

  const safeRatio  = likelySafe / total;
  const avoidRatio = avoid / total;
  const cw = coverageWeight(total);

  // Core safety signal — coverage-weighted safe ratio
  const safeScore = safeRatio * cw * 0.45;

  // Avoid penalty — both ratio and absolute count matter
  // (10 avoids is much worse than 1 even at the same ratio)
  const avoidPenalty = avoidRatio * 0.35 + (Math.min(avoid, 8) / 8) * 0.08;

  // Zero-avoid bonus: only meaningful at partial+ coverage (5+ items)
  const zeroAvoidBonus = avoid === 0 && total >= 5 ? 0.15 * cw : 0;

  // Distance penalty: diminishing returns, max effect at 15mi
  const distPenalty = (Math.min(dist, 15) / 15) * 0.08;

  return safeScore - avoidPenalty + zeroAvoidBonus - distPenalty;
}

/**
 * Scores all menu items in a restaurant and computes the safety summary.
 * @param userAllergens  AllergenId[] from the user's profile (no conversion needed)
 */
export function scoreRestaurant(
  restaurant: Restaurant,
  userAllergens: AllergenId[],
  severities: Partial<Record<AllergenId, AllergenSeverity>> = {}
): ScoredRestaurant {
  const cuisineContext = restaurant.cuisine;
  const scoredItems = restaurant.menuItems.map((item) =>
    scoreMenuItem(item, restaurant.sourceType, userAllergens, cuisineContext, severities)
  );

  const summary: RestaurantSafetySummary = {
    likelySafe: scoredItems.filter((i) => i.risk === "likely-safe").length,
    ask:        scoredItems.filter((i) => i.risk === "ask").length,
    avoid:      scoredItems.filter((i) => i.risk === "avoid").length,
    unknown:    scoredItems.filter((i) => i.risk === "unknown").length,
    total:      scoredItems.length,
  };

  return { ...restaurant, scoredItems, summary };
}
