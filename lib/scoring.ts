/**
 * Central scoring pipeline — powered by the conservative multi-layer engine.
 * Replaces the old detectAllergens → inferFromDish → allergenDictionary → scoreRisk chain.
 */

import { analyzeLine } from "./engine/analyzerPipeline";
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
  cuisineContext = ""
): ScoredMenuItem {
  const srcType = item.sourceType ?? restaurantSource;
  const text = [item.name, item.description].filter(Boolean).join(" ");

  // Run through the new engine
  const analyzed = analyzeLine(text, userAllergens, cuisineContext, srcType);

  // Official allergens from authoritative source (e.g. Nutritionix).
  // These are ground-truth and override any gaps in text detection.
  const officialAllergens = (item.allergens ?? []) as AllergenId[];
  const officialHits = officialAllergens.filter((a) => userAllergens.includes(a));

  const risk: Risk = officialHits.length > 0 ? "avoid" : mapRisk(analyzed.risk);
  const allDetected = [...new Set([...(analyzed.allDetectedAllergens as string[]), ...(officialAllergens as string[])])];
  const userAllergenHits = officialHits.length > 0
    ? [...new Set([...(analyzed.matchedAllergens as string[]), ...(officialHits as string[])])]
    : analyzed.matchedAllergens as string[];

  return {
    id:          item.id,
    name:        item.name,
    description: item.description,
    category:    item.category,
    sourceType:  srcType,
    confidence:  mapConfidence(analyzed.confidence),
    risk,
    detectedAllergens: allDetected,
    inferredAllergens: analyzed.signals
      .filter((s) => ["dish", "sauce", "cuisine", "prep"].includes(s.source))
      .map((s) => s.allergen as string),
    inferredReasons: [...new Set(
      analyzed.signals
        .filter((s) => s.source !== "direct" && s.source !== "synonym")
        .map((s) => s.reason)
    )],
    triggerTerms:  [...new Set(analyzed.signals.map((s) => s.trigger))],
    explanation:   analyzed.explanation,
    staffQuestions: analyzed.staffQuestions,
    userAllergenHits,
  };
}

/**
 * Scores all menu items in a restaurant and computes the safety summary.
 * @param userAllergens  AllergenId[] from the user's profile (no conversion needed)
 */
export function scoreRestaurant(
  restaurant: Restaurant,
  userAllergens: AllergenId[]
): ScoredRestaurant {
  const cuisineContext = restaurant.cuisine;
  const scoredItems = restaurant.menuItems.map((item) =>
    scoreMenuItem(item, restaurant.sourceType, userAllergens, cuisineContext)
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
