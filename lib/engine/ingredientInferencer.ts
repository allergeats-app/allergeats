/**
 * lib/engine/ingredientInferencer.ts
 *
 * Matches dish text against DISH_ONTOLOGY and emits RiskSignal[] using
 * structured ingredient-chain reasoning.
 *
 *   "common"  ingredient → source "dish-common",  weight 3 (Avoid)
 *   "possible" ingredient → source "dish-possible", weight 2 (Ask)
 *
 * Matching strategy:
 *   1. Sort all variants longest-first (avoid "mac" matching before "mac and cheese")
 *   2. For each entry, test every variant against the normalized text using
 *      whole-word boundary matching to avoid false positives (e.g. "ramen"
 *      should not match inside "caramel").
 *   3. Emit one signal per (allergen, dishEntry) pair — keeping the
 *      highest-confidence ingredient if multiple map to the same allergen.
 */

import type { AllergenId } from "@/lib/types";
import type { RiskSignal } from "./types";
import { SIGNAL_WEIGHT } from "./types";
import { DISH_ONTOLOGY, type DishEntry, type DishIngredient } from "./dishOntology";

// Pre-sort: longest variant first so specific matches win over generic
const SORTED_ONTOLOGY: DishEntry[] = [...DISH_ONTOLOGY].sort((a, b) => {
  const maxA = Math.max(...a.variants.map((v) => v.length));
  const maxB = Math.max(...b.variants.map((v) => v.length));
  return maxB - maxA;
});

/** True if `variant` appears as a whole word (or phrase) inside `text` */
function matchesVariant(text: string, variant: string): boolean {
  // Build a regex with word boundaries.
  // Escape special regex chars in the variant string.
  const escaped = variant.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // \b works for ASCII word boundaries; for phrases with spaces we anchor
  // on start/end-of-word at the outer edges only.
  const re = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, "i");
  return re.test(text);
}

/** Find all ontology entries whose variants match the normalized text */
function matchedEntries(normalized: string): DishEntry[] {
  const matched: DishEntry[] = [];
  for (const entry of SORTED_ONTOLOGY) {
    for (const variant of entry.variants) {
      if (matchesVariant(normalized, variant)) {
        matched.push(entry);
        break; // one variant match per entry is enough
      }
    }
  }
  return matched;
}

/**
 * For each matched dish entry, pick the highest-confidence ingredient
 * per allergen (avoid emitting both "common" and "possible" for the
 * same allergen from the same dish).
 */
function bestIngredientPerAllergen(
  ingredients: DishIngredient[],
  userAllergens: AllergenId[],
): DishIngredient[] {
  const best = new Map<AllergenId, DishIngredient>();
  for (const ing of ingredients) {
    if (!userAllergens.includes(ing.allergen)) continue;
    const existing = best.get(ing.allergen);
    if (!existing) {
      best.set(ing.allergen, ing);
    } else {
      // "common" > "possible"
      if (ing.confidence === "common" && existing.confidence === "possible") {
        best.set(ing.allergen, ing);
      }
    }
  }
  return [...best.values()];
}

/**
 * Detect ingredient-chain signals from structured dish knowledge.
 *
 * @param normalized   Lowercased, OCR-cleaned text (name + description)
 * @param userAllergens  The user's allergy profile
 * @returns RiskSignal[] with source "dish-common" or "dish-possible"
 */
export function detectIngredientSignals(
  normalized: string,
  userAllergens: AllergenId[],
): RiskSignal[] {
  if (userAllergens.length === 0) return [];

  const signals: RiskSignal[] = [];
  const entries = matchedEntries(normalized);

  for (const entry of entries) {
    const topIngredients = bestIngredientPerAllergen(entry.ingredients, userAllergens);
    for (const ing of topIngredients) {
      const source = ing.confidence === "common" ? "dish-common" : "dish-possible";
      signals.push({
        allergen: ing.allergen,
        source,
        weight:   SIGNAL_WEIGHT[source],
        trigger:  entry.canonical,
        reason:   ing.reason,
      });
    }
  }

  return signals;
}
