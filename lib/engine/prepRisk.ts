// lib/engine/prepRisk.ts
// Preparation method risk signals.
// Certain cooking terms imply allergen presence even without explicit ingredients.

import type { AllergenId, RiskSignal } from "./types";

type PrepPattern = {
  /** Terms to match (substring, case-insensitive after normalization) */
  terms: string[];
  allergens: AllergenId[];
  reason: string;
};

const PREP_PATTERNS: PrepPattern[] = [
  {
    terms: ["breaded", "breading", "bread crumb", "breadcrumb", "panko", "crusted"],
    allergens: ["wheat", "gluten", "egg"],
    reason: "Breaded items typically use wheat breadcrumbs and egg wash",
  },
  {
    terms: ["battered", "beer battered", "tempura battered"],
    allergens: ["wheat", "gluten", "egg"],
    reason: "Batter is usually made with wheat flour and often egg",
  },
  {
    terms: ["fried", "deep fried", "deep-fried", "pan fried", "pan-fried", "crispy fried"],
    allergens: ["wheat", "gluten"],
    reason: "Shared fryer oil may be contaminated with wheat from breaded items — ask staff",
  },
  {
    terms: ["crispy", "crunchy"],
    allergens: ["wheat", "gluten"],
    reason: "Crispy texture often achieved with flour-based coating",
  },
  {
    terms: ["tempura"],
    allergens: ["wheat", "gluten", "egg"],
    reason: "Tempura batter is made with wheat flour and egg",
  },
  {
    terms: ["marinated", "marinade"],
    allergens: ["soy", "wheat", "gluten"],
    reason: "Many marinades use soy sauce which contains wheat and soy",
  },
  {
    terms: ["glazed", "glaze"],
    allergens: ["soy", "wheat", "gluten"],
    reason: "Glazes often contain soy sauce or hoisin (wheat-based)",
  },
  {
    terms: ["teriyaki"],
    allergens: ["soy", "wheat", "gluten"],
    reason: "Teriyaki sauce contains soy sauce (wheat + soy)",
  },
  {
    terms: ["wok", "stir fried", "stir-fried", "wok tossed"],
    allergens: ["soy", "wheat", "gluten", "sesame"],
    reason: "Wok cooking typically uses soy sauce and sesame oil",
  },
  {
    terms: ["grilled", "bbq", "chargrilled"],
    allergens: ["soy", "wheat", "gluten"],
    reason: "Grilled items are often marinated in soy-based sauces — ask about marinade",
  },
  {
    terms: ["smoked"],
    allergens: ["wheat", "gluten"],
    reason: "Some smoked preparations use soy or wheat-based rubs",
  },
  {
    terms: ["stuffed", "filled"],
    allergens: ["wheat", "gluten", "dairy", "egg"],
    reason: "Stuffed items may contain breadcrumb stuffing, cheese, or egg",
  },
  {
    terms: ["au gratin", "gratin"],
    allergens: ["dairy", "wheat", "gluten"],
    reason: "Gratin involves a cheese/cream sauce and sometimes breadcrumb topping",
  },
  {
    terms: ["creamy", "in cream sauce", "cream sauce"],
    allergens: ["dairy"],
    reason: "Creamy preparations contain dairy cream",
  },
  {
    terms: ["buttered", "sauteed in butter", "in butter"],
    allergens: ["dairy"],
    reason: "Butter is a dairy product",
  },
  {
    terms: ["egg wash"],
    allergens: ["egg"],
    reason: "Egg wash is brushed on before baking or frying",
  },
  {
    terms: ["house sauce", "house dressing", "our sauce", "secret sauce", "special sauce"],
    allergens: ["egg", "dairy", "soy", "wheat", "gluten", "sesame"],
    reason: "House/secret sauces have unknown ingredients — ask staff for full ingredient list",
  },
  {
    terms: ["chef's choice", "chefs choice", "market price", "seasonal"],
    allergens: ["shellfish", "fish", "dairy", "egg"],
    reason: "Variable/seasonal preparations may contain any allergen — confirm with staff",
  },
  {
    terms: ["meuniere", "meunière", "à la meunière", "a la meuniere"],
    allergens: ["dairy", "wheat", "gluten"],
    reason: "Meunière = fish dredged in flour and sautéed in browned butter",
  },
  {
    terms: ["wellington", "en croute", "en croûte", "in pastry", "wrapped in pastry"],
    allergens: ["wheat", "gluten", "dairy", "egg"],
    reason: "Wellington/en croûte involves wheat pastry dough, often with butter and egg wash",
  },
  {
    terms: ["piccata", "piccata style"],
    allergens: ["wheat", "gluten", "dairy"],
    reason: "Piccata = dredged in flour and finished with a butter and lemon pan sauce",
  },
  {
    terms: ["milanese", "alla milanese"],
    allergens: ["wheat", "gluten", "egg"],
    reason: "Milanese = breaded in flour and egg, then pan-fried",
  },
  {
    terms: ["smothered", "smothered in"],
    allergens: ["dairy"],
    reason: "Smothered preparations are typically covered in a cream or cheese sauce",
  },
  {
    terms: ["marsala", "marsala sauce", "chicken marsala"],
    allergens: ["wheat", "gluten", "dairy"],
    reason: "Marsala sauce is made with a butter and flour (roux) base finished with Marsala wine",
  },
  {
    terms: ["parmigiana", "parmesan crusted", "parm crusted"],
    allergens: ["dairy", "wheat", "gluten", "egg"],
    reason: "Parmigiana involves a breadcrumb + egg coating, baked with cheese and tomato sauce",
  },
];

/** Returns preparation-risk signals (weight 2 = "prep") for a normalized item string */
export function getPrepSignals(normalized: string, userAllergens: AllergenId[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const pattern of PREP_PATTERNS) {
    const matchedTerm = pattern.terms.find((t) => normalized.includes(t));
    if (!matchedTerm) continue;
    for (const allergen of pattern.allergens) {
      if (!userAllergens.includes(allergen)) continue;
      signals.push({
        allergen,
        source:  "prep",
        weight:  2,
        trigger: matchedTerm,
        reason:  pattern.reason,
      });
    }
  }

  return signals;
}
