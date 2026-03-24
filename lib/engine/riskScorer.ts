// lib/engine/riskScorer.ts
// Aggregates all risk signals for one item into a final risk level + confidence.
//
// Conservative principle: when in doubt, escalate.
// Signal weight thresholds:
//   weight >= 3 → direct/synonym/dish = AVOID (these are near-certain allergen presence)
//   weight 1-2  → prep/cuisine/ambiguity = ASK (possible but not certain)
//   no signals  → SAFE

import type { AllergenId, RiskLevel, ConfidenceLevel, RiskSignal, SignalSource } from "./types";
import type { SourceType } from "@/lib/types";

type ScoreResult = {
  risk: RiskLevel;
  confidence: ConfidenceLevel;
  matchedAllergens: AllergenId[];
  explanation: string;
};

/**
 * Preferred source order for explanation text.
 * Ontology and sauce signals have the most informative reasons
 * (they describe the ingredient chain, not just the raw term).
 * Memory signals are always shown first — they're verified by real user experience.
 */
const EXPLANATION_PRIORITY: Record<SignalSource, number> = {
  memory:          0,
  "dish-common":   1,
  sauce:           2,
  dish:            3,
  "dish-possible": 4,
  direct:          5,
  synonym:         6,
  prep:            7,
  cuisine:         8,
  ambiguity:       9,
};

function prioritizeForExplanation(signals: RiskSignal[]): RiskSignal[] {
  return [...signals].sort(
    (a, b) => EXPLANATION_PRIORITY[a.source] - EXPLANATION_PRIORITY[b.source]
  );
}

/** Map source data quality to confidence */
function sourceToConfidence(sourceType?: SourceType): ConfidenceLevel {
  switch (sourceType) {
    case "official":
    case "verified-dataset":
      return "high";
    case "aggregator":
      return "medium";
    case "scraped":
    case "user-input":
    default:
      return "low";
  }
}

const ALLERGEN_LABEL: Partial<Record<AllergenId, string>> = {
  dairy: "Dairy", egg: "Egg", wheat: "Wheat", gluten: "Gluten",
  soy: "Soy", peanut: "Peanut", "tree-nut": "Tree nuts",
  sesame: "Sesame", fish: "Fish", shellfish: "Shellfish",
  mustard: "Mustard", corn: "Corn", legumes: "Legumes", oats: "Oats",
};
function allergenLabel(id: AllergenId): string {
  return ALLERGEN_LABEL[id] ?? id.replace(/-/g, " ");
}

/** Produce a concise human-readable explanation */
function buildExplanation(
  risk: RiskLevel,
  signals: RiskSignal[],
  matchedAllergens: AllergenId[]
): string {
  if (risk === "avoid") {
    // Group allergens by their best signal reason — avoids repeating the same sentence
    const reasonToAllergens = new Map<string, AllergenId[]>();
    for (const allergen of matchedAllergens) {
      const signal = prioritizeForExplanation(
        signals.filter((s) => s.allergen === allergen && s.weight >= 3)
      )[0];
      if (!signal) continue;
      const group = reasonToAllergens.get(signal.reason) ?? [];
      group.push(allergen);
      reasonToAllergens.set(signal.reason, group);
    }
    const parts = [...reasonToAllergens.entries()].slice(0, 3).map(([reason, allergens]) => {
      const labels = allergens.map(allergenLabel).join(", ");
      return `${labels}: ${reason}`;
    });
    return parts.length
      ? parts.join(". ") + "."
      : `Contains ${matchedAllergens.map(allergenLabel).join(", ")} — avoid.`;
  }

  if (risk === "ask") {
    // Same grouping — deduplicate reasons, prepend allergen labels
    const reasonToAllergens = new Map<string, AllergenId[]>();
    for (const allergen of matchedAllergens) {
      const signal = prioritizeForExplanation(
        signals.filter((s) => s.allergen === allergen)
      )[0];
      if (!signal) continue;
      const group = reasonToAllergens.get(signal.reason) ?? [];
      group.push(allergen);
      reasonToAllergens.set(signal.reason, group);
    }
    const parts = [...reasonToAllergens.entries()].slice(0, 2).map(([reason]) => reason);
    return parts.length
      ? parts.join(". ") + " — confirm with staff."
      : "Possible allergen presence — confirm with staff.";
  }

  return "No allergens detected for your profile. Always mention your allergy when ordering.";
}

/**
 * Priority order for per-allergen source attribution.
 * Prefers explicit ingredient mentions (direct/synonym/memory) over
 * dish-level inferences — "Contains shrimp" is clearer than "Contains pad thai".
 */
const ATTRIBUTION_PRIORITY: Record<SignalSource, number> = {
  memory:          0,
  direct:          1,
  synonym:         2,
  "dish-common":   3,
  "dish-possible": 4,
  sauce:           5,
  dish:            6,
  prep:            7,
  cuisine:         8,
  ambiguity:       9,
};

function prioritizeForAttribution(signals: RiskSignal[]): RiskSignal[] {
  return [...signals].sort(
    (a, b) => ATTRIBUTION_PRIORITY[a.source] - ATTRIBUTION_PRIORITY[b.source]
  );
}

/**
 * Returns a map of allergen → best signal reason for per-allergen UI chips.
 * Uses attribution priority (direct signals first) so "Contains shrimp" is
 * shown over "Contains pad thai" when the ingredient is explicitly named.
 */
export function getAllergenSources(
  signals: RiskSignal[],
  allergens: AllergenId[]
): Partial<Record<AllergenId, string>> {
  const result: Partial<Record<AllergenId, string>> = {};
  for (const allergen of allergens) {
    const signal = prioritizeForAttribution(
      signals.filter((s) => s.allergen === allergen)
    )[0];
    if (signal) result[allergen] = signal.reason;
  }
  return result;
}

/**
 * Score a single menu item.
 *
 * @param signals        All signals generated by all detection layers
 * @param userAllergens  The user's allergen profile
 * @param sourceType     Data source (affects confidence, not risk)
 */
export function scoreItem(
  signals: RiskSignal[],
  userAllergens: AllergenId[],
  sourceType?: SourceType
): ScoreResult {
  // Only consider signals for allergens in the user's profile
  const relevant = signals.filter((s) => userAllergens.includes(s.allergen));

  if (relevant.length === 0) {
    return {
      risk:             "safe",
      confidence:       sourceToConfidence(sourceType),
      matchedAllergens: [],
      explanation:      "No allergens detected for your profile. Always mention your allergy when ordering.",
    };
  }

  // High-confidence signals (weight >= 3): direct/synonym/dish/sauce → AVOID
  const highWeightHits = relevant.filter((s) => s.weight >= 3);
  if (highWeightHits.length > 0) {
    const allergens = [...new Set(highWeightHits.map((s) => s.allergen))];
    return {
      risk:             "avoid",
      confidence:       sourceToConfidence(sourceType),
      matchedAllergens: allergens,
      explanation:      buildExplanation("avoid", relevant, allergens),
    };
  }

  // Low-weight signals (weight 1-2): prep/cuisine/ambiguity → ASK
  const allergens = [...new Set(relevant.map((s) => s.allergen))];
  return {
    risk:             "ask",
    confidence:       sourceToConfidence(sourceType),
    matchedAllergens: allergens,
    explanation:      buildExplanation("ask", relevant, allergens),
  };
}
