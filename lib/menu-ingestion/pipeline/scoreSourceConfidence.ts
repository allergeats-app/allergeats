/**
 * lib/menu-ingestion/pipeline/scoreSourceConfidence.ts
 *
 * Assigns confidence levels to menu sources and individual items.
 *
 * Confidence reflects data trustworthiness — NOT allergen risk.
 * High confidence means the data is reliable; low means it needs verification.
 *
 * Menu-level confidence is now a two-factor score:
 *   1. Source baseline  — how trustworthy the source type is in general
 *   2. Extraction quality — how complete and well-structured this specific
 *                           extraction turned out to be
 *
 * This means the same "website_html" source can score "high" if the parser
 * extracted 40 items with descriptions, or "low" if it only found 2 fragments.
 *
 * Source baseline:
 *   official_api     → high   (restaurant-controlled, structured)
 *   aggregator_api   → high   (Nutritionix, structured third-party)
 *   verified_dataset → high   (manually curated seed data)
 *   website_html     → medium (extracted from public page, may miss items)
 *   pdf              → medium (parsed from PDF, layout may cause errors)
 *   image            → low    (OCR is error-prone)
 *   user_upload      → medium (human-typed, reasonable accuracy)
 */

import type { MenuIngestionSourceType, SourceConfidence, NormalizedMenu, NormalizedMenuItem } from "../types";

// ─── Source-level baseline ────────────────────────────────────────────────────

export const SOURCE_CONFIDENCE_BASELINE: Record<MenuIngestionSourceType, SourceConfidence> = {
  official_api:     "high",
  aggregator_api:   "high",
  verified_dataset: "high",
  website_html:     "medium",
  pdf:              "medium",
  image:            "low",
  user_upload:      "medium",
};

// ─── Confidence rank helpers ──────────────────────────────────────────────────

const RANK: SourceConfidence[] = ["low", "medium", "high"];

function rankOf(c: SourceConfidence): number {
  return RANK.indexOf(c);
}

function clamp(n: number): SourceConfidence {
  return RANK[Math.max(0, Math.min(2, n))];
}

function bump(base: SourceConfidence, delta: number): SourceConfidence {
  return clamp(rankOf(base) + delta);
}

// ─── Extraction quality signals ───────────────────────────────────────────────

/**
 * Measures how complete and well-structured a menu extraction actually was,
 * independent of source type.
 *
 * Returns a delta (-1, 0, or +1) to apply to the source baseline:
 *   +1 → extraction was high quality — upgrade confidence
 *    0 → extraction quality is typical for this source
 *   -1 → extraction was poor — downgrade confidence
 */
function extractionQualityDelta(menu: NormalizedMenu): { delta: -1 | 0 | 1; signals: string[] } {
  const signals: string[] = [];
  let score = 0;

  const allItems = menu.sections.flatMap((s) => s.items);
  const total    = allItems.length;

  // ── Item count ────────────────────────────────────────────────────────────
  if (total === 0) {
    signals.push("no items extracted");
    score -= 2; // hard downgrade — nothing usable
  } else if (total < 3) {
    signals.push(`very few items (${total}) — may be incomplete extraction`);
    score -= 1;
  } else if (total >= 10) {
    signals.push(`${total} items extracted — substantial menu coverage`);
    score += 1;
  }

  // ── Section structure ──────────────────────────────────────────────────────
  const sectionCount = menu.sections.length;
  if (sectionCount > 1) {
    signals.push(`${sectionCount} sections recognized — structured extraction`);
    score += 1;
  } else if (sectionCount === 1 && total >= 5) {
    // One flat section with items is fine; no signal either way
  }

  // ── Description coverage ──────────────────────────────────────────────────
  if (total > 0) {
    const withDesc = allItems.filter((i) => i.description).length;
    const descRatio = withDesc / total;
    if (descRatio >= 0.5) {
      signals.push(`${Math.round(descRatio * 100)}% of items have descriptions`);
      score += 1;
    } else if (descRatio === 0 && total >= 5) {
      signals.push("no item descriptions extracted — parser may be shallow");
      score -= 1;
    }
  }

  // ── Price coverage ────────────────────────────────────────────────────────
  if (total > 0) {
    const withPrice = allItems.filter((i) => i.price).length;
    const priceRatio = withPrice / total;
    if (priceRatio >= 0.5) {
      signals.push(`${Math.round(priceRatio * 100)}% of items have prices — likely real menu rows`);
      score += 1;
    }
  }

  // ── Official allergen coverage ────────────────────────────────────────────
  if (total > 0) {
    const withAllergens = allItems.filter((i) => i.allergens?.length).length;
    if (withAllergens > 0) {
      signals.push(`${withAllergens} item(s) carry official allergen data`);
      score += 1;
    }
  }

  // Clamp delta to [-1, 0, +1]
  const delta = score <= -1 ? -1 : score >= 2 ? 1 : 0;
  return { delta: delta as -1 | 0 | 1, signals };
}

// ─── Item-level signals ───────────────────────────────────────────────────────

const PRICE_RE      = /\$?\d+\.\d{2}/;
const SHORT_RE      = /^.{0,6}$/;
const FOOD_TERM_RE  =
  /(burger|taco|salad|pizza|chicken|steak|pasta|soup|wings|fries|sandwich|wrap|bowl|dessert|cake|coffee|tea|sushi|roll|rice|noodle|dumpling|curry|fish|shrimp|beef|pork|lamb|tofu|cheese|cream|sauce|dressing|bread|muffin|waffle|pancake|egg|bacon|veggie|mushroom|onion|pepper|tomato|avocado|spinach|lemon|garlic|ginger|coconut|peanut|almond|walnut)/i;
const VERY_LONG_RE  = /^.{200,}$/;
const DESCRIPTION_RE = /[,.].*[,.]|with\s|topped\s|served\s|made\s/i;

function evaluateItemSignals(item: Pick<NormalizedMenuItem, "rawText" | "itemName">): {
  signals: string[];
  adjustedConfidence: (base: SourceConfidence) => SourceConfidence;
} {
  const signals: string[] = [];
  let score = 0;

  if (PRICE_RE.test(item.rawText)) {
    signals.push("has price — likely a real menu item");
    score += 1;
  }
  if (FOOD_TERM_RE.test(item.rawText)) {
    signals.push("matched known food term");
    score += 1;
  }
  if (DESCRIPTION_RE.test(item.rawText)) {
    signals.push("has ingredient description");
    score += 1;
  }
  if (SHORT_RE.test(item.itemName)) {
    signals.push("very short name — may be fragment");
    score -= 1;
  }
  if (VERY_LONG_RE.test(item.rawText)) {
    signals.push("very long line — may be paragraph, not item");
    score -= 1;
  }

  function adjustedConfidence(base: SourceConfidence): SourceConfidence {
    return bump(base, Math.sign(score));
  }

  return { signals, adjustedConfidence };
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Score the overall confidence for a menu based on source type AND extraction quality.
 *
 * The two-factor score means that the same source type can land at different
 * confidence levels depending on how complete the actual extraction was:
 *   website_html + rich extraction (40 items, descriptions, prices) → "high"
 *   website_html + thin extraction (2 items, no descriptions)       → "low"
 *
 * For high-trust sources (official_api, aggregator_api, verified_dataset),
 * extraction quality can still downgrade confidence if the response was empty,
 * and upgrade is capped at "high" (already the max).
 */
export function scoreMenuConfidence(sourceType: MenuIngestionSourceType, menu?: NormalizedMenu): SourceConfidence {
  const baseline = SOURCE_CONFIDENCE_BASELINE[sourceType];

  // Source types that are structurally high-trust skip extraction quality check
  // unless the menu was unexpectedly empty (which always downgrades).
  if (!menu) return baseline;

  const { delta } = extractionQualityDelta(menu);
  return bump(baseline, delta);
}

/**
 * Score and annotate a single menu item's confidence.
 * Mutates the item in place (adds sourceConfidence + sourceSignals).
 *
 * For adapters that already set sourceConfidence (e.g. OfficialApiAdapter sets "high"),
 * item-level signals only narrow down — they can lower but never exceed the adapter's value.
 */
export function scoreItemConfidence(
  item: NormalizedMenuItem,
  menuSourceType: MenuIngestionSourceType,
): void {
  const base = item.sourceConfidence ?? SOURCE_CONFIDENCE_BASELINE[menuSourceType];
  const { signals, adjustedConfidence } = evaluateItemSignals(item);

  const adjusted = adjustedConfidence(base);

  // If the adapter already set a high sourceConfidence (e.g. official allergen data),
  // allow extraction signals to lower it but not exceed the adapter's ceiling.
  const adapterCeiling = item.sourceConfidence ? rankOf(item.sourceConfidence) : 2;
  item.sourceConfidence = clamp(Math.min(rankOf(adjusted), adapterCeiling));

  // Merge adapter-set signals with item-level signals
  item.sourceSignals = [...(item.sourceSignals ?? []), ...signals];
}
