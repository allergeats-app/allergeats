/**
 * Maps Nutritionix API responses to our RawMenuItem type.
 *
 * Nutritionix provides two complementary sources of allergen info:
 *  1. nf_ingredient_statement — full ingredient text (runs through our detection pipeline)
 *  2. nf_contains_* boolean flags — official "big 9" allergen declarations
 *
 * Both are used: the ingredient statement feeds text-based detection,
 * and the boolean flags are stored as `allergens` to ensure nothing is missed.
 */

import type { NutritionixFood } from "@/app/api/nutritionix/route";
import type { RawMenuItem } from "./types";

/** Maps Nutritionix flag keys to our internal allergen strings */
const FLAG_MAP: Array<[keyof NutritionixFood, string]> = [
  ["nf_contains_milk",      "dairy"],
  ["nf_contains_eggs",      "egg"],
  ["nf_contains_fish",      "fish"],
  ["nf_contains_shellfish", "shellfish"],
  ["nf_contains_tree_nuts", "tree-nut"],
  ["nf_contains_peanuts",   "peanut"],
  ["nf_contains_wheat",     "wheat"],
  ["nf_contains_soybeans",  "soy"],
  ["nf_contains_sesame",    "sesame"],
];

export function mapNutritionixFood(food: NutritionixFood, index: number): RawMenuItem {
  // Extract official allergen flags
  const officialAllergens = [
    ...new Set(
      FLAG_MAP
        .filter(([key]) => (food[key] as number | null | undefined) === 1)
        .map(([, allergen]) => allergen)
    ),
  ];

  // Use the full ingredient statement as description for our text-based pipeline.
  // Fall back to a generated "Contains: X, Y" summary if no ingredient statement.
  const description =
    food.nf_ingredient_statement?.trim() ||
    (officialAllergens.length > 0 ? `Contains: ${officialAllergens.join(", ")}` : undefined);

  return {
    id: food._id ?? `nix-${index}`,
    name: food.food_name,
    description,
    category: food._category,
    sourceType: "official",
    allergens: officialAllergens.length > 0 ? officialAllergens : undefined,
  };
}

export function mapNutritionixResponse(foods: NutritionixFood[]): RawMenuItem[] {
  return foods.map((food, i) => mapNutritionixFood(food, i));
}

// ─── Brand registry ──────────────────────────────────────────────────────────
// Maps our restaurant IDs and common name variants to Nutritionix brand names.

const BRAND_REGISTRY: Record<string, string> = {
  "mcdonalds":             "McDonald's",
  "chipotle":              "Chipotle Mexican Grill",
  "chickfila":             "Chick-fil-A",
  "starbucks":             "Starbucks",
  "shakeshack":            "Shake Shack",
};

/**
 * Returns the Nutritionix brand string for a given restaurant,
 * or null if it's not a known chain.
 */
export function getNutritionixBrand(restaurantId: string, restaurantName: string): string | null {
  // Direct ID match (mock IDs)
  const byId = BRAND_REGISTRY[restaurantId];
  if (byId) return byId;

  // Live IDs are prefixed "live-{osmId}" — match by name
  const nameLower = restaurantName.toLowerCase();
  for (const [key, brand] of Object.entries(BRAND_REGISTRY)) {
    if (nameLower.includes(key) || brand.toLowerCase().includes(nameLower)) {
      return brand;
    }
  }

  return null;
}
