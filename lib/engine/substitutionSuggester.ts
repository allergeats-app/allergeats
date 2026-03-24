// lib/engine/substitutionSuggester.ts
// Context-aware substitution suggestions for allergen-flagged dishes.
// Matches the allergen + keywords from the dish text to produce actionable advice.

import type { AllergenId } from "./types";

type SubstitutionRule = {
  allergens: AllergenId[];
  /** If ANY of these terms appear in the normalized dish text, this rule fires. Empty = always applies as fallback. */
  contextTerms: string[];
  suggestion: string;
};

const RULES: SubstitutionRule[] = [
  // ─── DAIRY ───────────────────────────────────────────────────────────────
  { allergens: ["dairy"], contextTerms: ["coffee", "latte", "cappuccino", "espresso", "matcha", "chai", "mocha", "cortado", "macchiato", "flat white", "cold brew"],
    suggestion: "Ask for oat milk, almond milk, or soy milk" },
  { allergens: ["dairy"], contextTerms: ["cheese", "parmesan", "mozzarella", "cheddar", "brie", "gruyere", "feta", "ricotta", "gouda", "provolone"],
    suggestion: "Ask to omit the cheese or request a dairy-free alternative" },
  { allergens: ["dairy"], contextTerms: ["alfredo", "cream sauce", "béchamel", "bechamel", "white sauce"],
    suggestion: "Ask for a tomato-based or olive oil sauce instead" },
  { allergens: ["dairy"], contextTerms: ["butter", "buttered", "basted"],
    suggestion: "Ask for no butter or a plant-based butter substitute" },
  { allergens: ["dairy"], contextTerms: ["ice cream", "gelato", "soft serve", "frozen yogurt", "froyo"],
    suggestion: "Ask for sorbet or a dairy-free frozen option" },
  { allergens: ["dairy"], contextTerms: ["sour cream", "crema", "creme fraiche"],
    suggestion: "Ask to omit the sour cream or request a dairy-free substitute" },
  { allergens: ["dairy"], contextTerms: [],
    suggestion: "Ask about dairy-free preparation options" },

  // ─── EGG ─────────────────────────────────────────────────────────────────
  { allergens: ["egg"], contextTerms: ["mayo", "mayonnaise", "aioli"],
    suggestion: "Ask to omit the mayo, or request vegan mayo" },
  { allergens: ["egg"], contextTerms: ["breaded", "battered", "dredged", "coated", "fried", "crispy"],
    suggestion: "Ask if a grilled or baked version without egg wash is available" },
  { allergens: ["egg"], contextTerms: ["caesar", "caesar dressing"],
    suggestion: "Ask for a Caesar dressing made without raw egg" },
  { allergens: ["egg"], contextTerms: ["hollandaise", "béarnaise", "bearnaise"],
    suggestion: "Ask if the dish can be served without the sauce" },
  { allergens: ["egg"], contextTerms: [],
    suggestion: "Ask about egg-free preparation" },

  // ─── WHEAT / GLUTEN ───────────────────────────────────────────────────────
  { allergens: ["wheat", "gluten"], contextTerms: ["pasta", "spaghetti", "fettuccine", "penne", "linguine", "rigatoni", "tagliatelle", "farfalle"],
    suggestion: "Ask for gluten-free pasta" },
  { allergens: ["wheat", "gluten"], contextTerms: ["pizza"],
    suggestion: "Ask for a gluten-free crust (available at most pizzerias)" },
  { allergens: ["wheat", "gluten"], contextTerms: ["burger", "cheeseburger", "smash burger"],
    suggestion: "Ask for a gluten-free bun or a lettuce wrap" },
  { allergens: ["wheat", "gluten"], contextTerms: ["sandwich", "sub", "hoagie", "hero", "panini", "grinder"],
    suggestion: "Ask for gluten-free bread or a lettuce wrap" },
  { allergens: ["wheat", "gluten"], contextTerms: ["wrap", "flour tortilla", "quesadilla", "burrito"],
    suggestion: "Ask for a corn tortilla or a bowl without the wrap" },
  { allergens: ["wheat", "gluten"], contextTerms: ["breaded", "battered", "fried", "crispy", "dredged", "coated"],
    suggestion: "Ask for grilled or baked instead of breaded" },
  { allergens: ["wheat", "gluten"], contextTerms: ["soy sauce", "teriyaki", "hoisin", "tonkatsu"],
    suggestion: "Ask for tamari (gluten-free soy sauce) as a substitute" },
  { allergens: ["wheat", "gluten"], contextTerms: ["ramen", "noodle", "udon", "soba"],
    suggestion: "Ask if rice noodles or glass noodles can be substituted" },
  { allergens: ["wheat", "gluten"], contextTerms: [],
    suggestion: "Ask about gluten-free options or modifications" },

  // ─── SOY ─────────────────────────────────────────────────────────────────
  { allergens: ["soy"], contextTerms: ["soy sauce", "teriyaki", "stir fry", "stir-fry", "fried rice", "lo mein"],
    suggestion: "Ask for coconut aminos as a soy-free alternative, or request no sauce" },
  { allergens: ["soy"], contextTerms: ["edamame", "tofu", "tempeh", "miso"],
    suggestion: "Ask if the soy-based ingredient can be omitted" },
  { allergens: ["soy"], contextTerms: [],
    suggestion: "Ask if the marinade or sauce can be made without soy" },

  // ─── PEANUT ───────────────────────────────────────────────────────────────
  { allergens: ["peanut"], contextTerms: ["pad thai", "satay", "peanut sauce", "gado"],
    suggestion: "Ask for the dish without peanuts or peanut sauce — confirm no cross-contact" },
  { allergens: ["peanut"], contextTerms: [],
    suggestion: "Ask if the dish can be prepared peanut-free, and confirm kitchen cross-contact practices" },

  // ─── TREE NUT ─────────────────────────────────────────────────────────────
  { allergens: ["tree-nut"], contextTerms: ["pesto"],
    suggestion: "Ask for a nut-free pesto or a tomato-based sauce instead" },
  { allergens: ["tree-nut"], contextTerms: ["salad", "grain bowl"],
    suggestion: "Ask to omit the nuts from the salad or bowl" },
  { allergens: ["tree-nut"], contextTerms: [],
    suggestion: "Ask for the dish without nuts" },

  // ─── SESAME ───────────────────────────────────────────────────────────────
  { allergens: ["sesame"], contextTerms: ["bun", "burger", "bread"],
    suggestion: "Ask for a sesame-free bun" },
  { allergens: ["sesame"], contextTerms: ["tahini", "hummus"],
    suggestion: "Ask for the dish without tahini or hummus" },
  { allergens: ["sesame"], contextTerms: [],
    suggestion: "Ask to omit sesame seeds or sesame oil from the dish" },

  // ─── FISH ─────────────────────────────────────────────────────────────────
  { allergens: ["fish"], contextTerms: ["caesar", "caesar salad"],
    suggestion: "Ask for a Caesar dressing made without anchovies" },
  { allergens: ["fish"], contextTerms: ["worcestershire"],
    suggestion: "Ask for the dish to be prepared without Worcestershire sauce" },
  { allergens: ["fish"], contextTerms: ["pad thai", "thai", "vietnamese", "pho"],
    suggestion: "Ask for no fish sauce and confirm curry pastes are shrimp/fish-free" },
  { allergens: ["fish"], contextTerms: [],
    suggestion: "Ask staff to confirm no fish sauce, anchovies, or Worcestershire in the recipe" },

  // ─── SHELLFISH ─────────────────────────────────────────────────────────────
  { allergens: ["shellfish"], contextTerms: ["thai", "green curry", "red curry", "yellow curry", "panang", "pad thai"],
    suggestion: "Ask if the curry paste is shrimp-free, and request no shrimp or shellfish" },
  { allergens: ["shellfish"], contextTerms: ["fried rice", "stir fry"],
    suggestion: "Ask for the dish without shrimp and confirm no shrimp paste in the sauce" },
  { allergens: ["shellfish"], contextTerms: [],
    suggestion: "Ask for a shellfish-free version — confirm sauces and pastes contain no shrimp" },

  // ─── CORN ─────────────────────────────────────────────────────────────────
  { allergens: ["corn"], contextTerms: ["tortilla", "taco", "nacho", "chip"],
    suggestion: "Ask if flour tortilla or a wheat alternative is available" },
  { allergens: ["corn"], contextTerms: [],
    suggestion: "Ask if the corn ingredient can be omitted" },
];

/**
 * Returns actionable substitution suggestions for a flagged dish.
 * Rules are matched by allergen + context keywords found in the normalized dish text.
 * At most one suggestion per allergen is returned (the most specific match).
 *
 * @param matchedAllergens  Allergens from the user's profile that were detected
 * @param normalizedText    Normalized dish name + description (from ocrNormalizer)
 */
export function getSubstitutions(
  matchedAllergens: AllergenId[],
  normalizedText: string,
): string[] {
  const suggestions = new Set<string>();

  for (const allergen of matchedAllergens) {
    // Find rules for this allergen, try context-specific rules first (they have contextTerms)
    const relevantRules = RULES.filter(
      (r) => r.allergens.includes(allergen) && r.contextTerms.length > 0
    );
    const fallbackRule = RULES.find(
      (r) => r.allergens.includes(allergen) && r.contextTerms.length === 0
    );

    let matched = false;
    for (const rule of relevantRules) {
      if (rule.contextTerms.some((t) => normalizedText.includes(t))) {
        suggestions.add(rule.suggestion);
        matched = true;
        break; // one suggestion per allergen
      }
    }
    if (!matched && fallbackRule) {
      suggestions.add(fallbackRule.suggestion);
    }
  }

  return [...suggestions];
}
