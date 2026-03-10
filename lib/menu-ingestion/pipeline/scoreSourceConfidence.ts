/**
 * lib/menu-ingestion/pipeline/scoreSourceConfidence.ts
 *
 * Assigns confidence levels to menu sources and individual items.
 *
 * Confidence reflects data trustworthiness — NOT allergen risk.
 * High confidence means the data is reliable; low means it needs verification.
 *
 * Source baseline confidence:
 *   official_api     → high   (restaurant-controlled, structured)
 *   aggregator_api   → high   (Nutritionix, structured third-party)
 *   verified_dataset → high   (manually curated seed data)
 *   website_html     → medium (extracted from public page, may miss items)
 *   pdf              → medium (parsed from PDF, layout may cause errors)
 *   image            → low    (OCR is error-prone)
 *   user_upload      → medium (human-typed, reasonable accuracy)
 */

import type { MenuIngestionSourceType, SourceConfidence, NormalizedMenuItem } from "../types";

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

// ─── Item-level signals ───────────────────────────────────────────────────────

/** Signals that increase or decrease item-level confidence */
type ConfidenceSignal = {
  label: string;
  delta: number; // +1 = bump up, -1 = bump down
};

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
    const rank: SourceConfidence[] = ["low", "medium", "high"];
    const idx = rank.indexOf(base);
    const adjusted = Math.max(0, Math.min(2, idx + Math.sign(score)));
    return rank[adjusted];
  }

  return { signals, adjustedConfidence };
}

// ─── Main exports ─────────────────────────────────────────────────────────────

/**
 * Score the overall confidence for a menu based on its source type.
 */
export function scoreMenuConfidence(sourceType: MenuIngestionSourceType): SourceConfidence {
  return SOURCE_CONFIDENCE_BASELINE[sourceType];
}

/**
 * Score and annotate a single menu item's confidence.
 * Mutates the item in place (adds sourceConfidence + sourceSignals).
 */
export function scoreItemConfidence(
  item: NormalizedMenuItem,
  menuSourceType: MenuIngestionSourceType,
): void {
  const base = SOURCE_CONFIDENCE_BASELINE[menuSourceType];
  const { signals, adjustedConfidence } = evaluateItemSignals(item);
  item.sourceConfidence = adjustedConfidence(base);
  item.sourceSignals    = signals;
}
