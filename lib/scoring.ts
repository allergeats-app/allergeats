/**
 * Central scoring pipeline.
 * Orchestrates allergen detection, inference, risk scoring, confidence,
 * explanation generation, and staff question generation for menu items.
 */

import { detectAllergensFromLine } from "./detectAllergens";
import { inferFromDishName } from "./inferFromDish";
import { inferAllergensFromKeywords } from "./allergenDictionary";
import { scoreRisk } from "./scoreRisk";
import { confidenceFromSource } from "./sourceConfidence";
import { explainRisk, buildStaffQuestions } from "./explainRisk";
import type {
  RawMenuItem,
  ScoredMenuItem,
  Restaurant,
  ScoredRestaurant,
  RestaurantSafetySummary,
  SourceType,
} from "./types";

const VAGUE_WORDS = [
  "sauce", "seasoning", "blend", "secret", "marinade",
  "glaze", "dressing", "rub", "may contain", "house",
];

function containsVagueWords(text: string): boolean {
  const lower = text.toLowerCase();
  return VAGUE_WORDS.some((w) => lower.includes(w));
}

/**
 * Scores a single raw menu item against the user's allergen list.
 *
 * @param item            - raw menu item (name + description from seed/adapter)
 * @param restaurantSource - source type inherited from the restaurant
 * @param userAllergens   - normalized allergen strings the user wants to avoid
 */
export function scoreMenuItem(
  item: RawMenuItem,
  restaurantSource: SourceType,
  userAllergens: string[]
): ScoredMenuItem {
  const sourceType = item.sourceType ?? restaurantSource;
  const text = [item.name, item.description].filter(Boolean).join(" ");

  // 1. Term matching (explicit detection)
  const { allergens: textDetected, hits } = detectAllergensFromLine(text);
  // Merge official allergen flags (from Nutritionix / authoritative source) if present.
  // These are treated as ground-truth and override any gaps in text detection.
  const detected: string[] = item.allergens
    ? [...new Set([...(textDetected as string[]), ...item.allergens])]
    : (textDetected as string[]);

  // 2. Dish-name inference
  const guesses = inferFromDishName(item.name);
  const keywordAllergens = inferAllergensFromKeywords(text);
  const inferredAllergens = [
    ...new Set([
      ...guesses.flatMap((g) => g.inferredAllergens),
      ...keywordAllergens,
    ]),
  ];
  const inferredReasons = guesses.map((g) => g.reason);

  // 3. Check for vague ingredients
  const isVague = containsVagueWords(text);

  // 4. An item is "ambiguous" if inferred allergens match user's list OR vague words present
  const inferredHits = userAllergens.filter((a) => inferredAllergens.includes(a));
  const isAmbiguous = isVague || inferredHits.length > 0;

  // 5. Score risk and get confidence
  const risk = scoreRisk(detected, userAllergens, sourceType, isAmbiguous);
  const confidence = confidenceFromSource(sourceType);

  // 6. Human-readable explanation
  const explanation = explainRisk({
    risk,
    confidence,
    detectedAllergens: detected,
    inferredAllergens,
    inferredReasons,
    sourceType,
    isVague,
  });

  // 7. Staff questions (only meaningful for non-likely-safe items)
  const staffQuestions =
    risk !== "likely-safe"
      ? buildStaffQuestions({
          userAllergens,
          detectedAllergens: detected,
          inferredAllergens,
          triggerTerms: hits,
          isVague,
        })
      : [];

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    sourceType,
    confidence,
    risk,
    detectedAllergens: detected,
    inferredAllergens,
    inferredReasons,
    triggerTerms: hits,
    explanation,
    staffQuestions,
  };
}

/**
 * Scores all menu items in a restaurant against the user's allergen list
 * and computes the safety summary.
 */
export function scoreRestaurant(
  restaurant: Restaurant,
  userAllergens: string[]
): ScoredRestaurant {
  const scoredItems = restaurant.menuItems.map((item) =>
    scoreMenuItem(item, restaurant.sourceType, userAllergens)
  );

  const summary: RestaurantSafetySummary = {
    likelySafe: scoredItems.filter((i) => i.risk === "likely-safe").length,
    ask: scoredItems.filter((i) => i.risk === "ask").length,
    avoid: scoredItems.filter((i) => i.risk === "avoid").length,
    unknown: scoredItems.filter((i) => i.risk === "unknown").length,
    total: scoredItems.length,
  };

  return { ...restaurant, scoredItems, summary };
}
