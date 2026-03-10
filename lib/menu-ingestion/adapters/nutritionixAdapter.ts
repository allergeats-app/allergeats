/**
 * lib/menu-ingestion/adapters/nutritionixAdapter.ts
 *
 * Adapter for Nutritionix /v2/nutrients response data.
 *
 * Accepts the `NutritionixFood[]` array returned by the existing
 * /api/nutritionix route, which already fetches and annotates items
 * with their _id and _category from the calling context.
 *
 * Maps nf_contains_* boolean fields → allergen string arrays so items
 * flow through the pipeline with structured allergen data rather than
 * relying solely on ingredient statement text parsing.
 *
 * Confidence: HIGH (aggregator_api — structured per-item allergen flags).
 *
 * Required env vars (consumed by /api/nutritionix, not this adapter):
 *   NUTRITIONIX_APP_ID
 *   NUTRITIONIX_APP_KEY
 */

import type { MenuIngestionAdapter, NormalizedMenu, NormalizedMenuSection, IngestionMeta } from "../types";
import { buildMenuShell, generateItemId } from "./base";

/** Mirrors NutritionixFood from app/api/nutritionix/route.ts */
export type NutritionixFood = {
  food_name:                    string;
  brand_name?:                  string;
  nf_ingredient_statement?:     string | null;
  nf_contains_milk?:            number | null;
  nf_contains_eggs?:            number | null;
  nf_contains_fish?:            number | null;
  nf_contains_shellfish?:       number | null;
  nf_contains_tree_nuts?:       number | null;
  nf_contains_peanuts?:         number | null;
  nf_contains_wheat?:           number | null;
  nf_contains_soybeans?:        number | null;
  nf_contains_sesame?:          number | null;
  nf_contains_gluten?:          number | null;
  _id:                          string;
  _category?:                   string;
};

/** Maps Nutritionix allergen flag keys → canonical allergen IDs */
const NIX_ALLERGEN_MAP: Array<[keyof NutritionixFood, string]> = [
  ["nf_contains_milk",       "dairy"],
  ["nf_contains_eggs",       "egg"],
  ["nf_contains_fish",       "fish"],
  ["nf_contains_shellfish",  "shellfish"],
  ["nf_contains_tree_nuts",  "tree-nuts"],
  ["nf_contains_peanuts",    "peanuts"],
  ["nf_contains_wheat",      "wheat"],
  ["nf_contains_soybeans",   "soy"],
  ["nf_contains_sesame",     "sesame"],
];

function extractAllergens(food: NutritionixFood): string[] {
  const allergens: string[] = [];
  for (const [field, allergenId] of NIX_ALLERGEN_MAP) {
    if (food[field] === 1) allergens.push(allergenId);
  }
  return allergens;
}

export class NutritionixAdapter implements MenuIngestionAdapter<NutritionixFood[]> {
  readonly sourceType = "aggregator_api" as const;

  async ingest(foods: NutritionixFood[], meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("aggregator_api", meta);

    const categoryMap = new Map<string, NormalizedMenuSection>();

    for (const food of foods) {
      const categoryName = food._category ?? "Menu";

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, { sectionName: categoryName, items: [] });
      }

      const section       = categoryMap.get(categoryName)!;
      const description   = food.nf_ingredient_statement ?? undefined;
      const rawText       = food.food_name + (description ? ` — ${description}` : "");
      const allergens     = extractAllergens(food);
      const signals: string[] = ["nutritionix — structured allergen flags"];
      if (allergens.length > 0) signals.push(`contains: ${allergens.join(", ")}`);

      section.items.push({
        itemId:           food._id ?? generateItemId("nix"),
        itemName:         food.food_name,
        description,
        allergens:        allergens.length > 0 ? allergens : undefined,
        rawText,
        normalizedText:   "", // filled by pipeline
        sourceConfidence: "high",
        sourceSignals:    signals,
      });
    }

    menu.sections   = Array.from(categoryMap.values());
    menu.confidence = "high";

    return menu;
  }
}
