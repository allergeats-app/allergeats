// lib/engine/cuisineInference.ts
// Cuisine-level allergen risk signals.
// When a restaurant or menu section is tagged with a cuisine type,
// certain allergens have elevated baseline risk due to common cooking practices.

import type { AllergenId, RiskSignal } from "./types";

type CuisinePattern = {
  /** Lowercase substrings to match against the cuisine/restaurant name */
  match: string[];
  signals: Array<{ allergen: AllergenId; reason: string }>;
};

const CUISINE_PATTERNS: CuisinePattern[] = [
  {
    match: ["japanese", "sushi", "ramen", "izakaya", "japanese fusion"],
    signals: [
      { allergen: "soy",      reason: "Soy sauce is used extensively in Japanese cooking" },
      { allergen: "wheat",    reason: "Most soy sauce contains wheat (shoyu); also used in tempura batter" },
      { allergen: "gluten",   reason: "Wheat/gluten present in soy sauce and tempura" },
      { allergen: "fish",     reason: "Dashi stock (bonito/kelp) is a base for many Japanese dishes" },
      { allergen: "sesame",   reason: "Sesame oil and seeds are common in Japanese dressings" },
    ],
  },
  {
    match: ["chinese", "cantonese", "szechuan", "sichuan", "dim sum", "taiwanese", "hong kong"],
    signals: [
      { allergen: "soy",      reason: "Soy sauce and oyster sauce are staple Chinese condiments" },
      { allergen: "wheat",    reason: "Soy sauce, dumpling wrappers, and lo mein contain wheat" },
      { allergen: "gluten",   reason: "Wheat-based sauces and noodles are prevalent" },
      { allergen: "shellfish",reason: "Oyster sauce and shrimp paste are common bases" },
      { allergen: "sesame",   reason: "Sesame oil is a finishing ingredient in many dishes" },
      { allergen: "peanut",   reason: "Peanuts appear in Kung Pao and cold noodle dishes" },
    ],
  },
  {
    match: ["thai", "thai fusion"],
    signals: [
      { allergen: "peanut",   reason: "Peanuts are common in Thai curries, satay, and Pad Thai" },
      { allergen: "shellfish",reason: "Shrimp paste (kapi) is a base for many Thai curries and sauces" },
      { allergen: "fish",     reason: "Fish sauce is a foundational Thai ingredient" },
      { allergen: "soy",      reason: "Soy sauce used in stir-fries and noodle dishes" },
      { allergen: "egg",      reason: "Eggs are standard in Pad Thai and fried rice" },
      { allergen: "tree-nut", reason: "Cashews appear in stir-fries and garnishes" },
    ],
  },
  {
    match: ["indian", "south asian", "punjabi", "bangladeshi", "sri lankan", "nepali", "curry house"],
    signals: [
      { allergen: "dairy",    reason: "Ghee, cream, paneer, and yogurt are core Indian ingredients" },
      { allergen: "legumes",  reason: "Dal, chickpeas, and lentils are staples across Indian cuisine" },
      { allergen: "sesame",   reason: "Sesame seeds are used in many Indian breads and snacks" },
      { allergen: "mustard",  reason: "Mustard seeds are a common tempering spice in Indian cooking" },
      { allergen: "tree-nut", reason: "Cashews and almonds appear in curries and biryanis" },
      { allergen: "wheat",    reason: "Naan, chapati, and samosa pastry contain wheat" },
      { allergen: "gluten",   reason: "Wheat-based breads are staple accompaniments" },
    ],
  },
  {
    match: ["mexican", "tex-mex", "taqueria", "cantina", "burrito", "taco"],
    signals: [
      { allergen: "wheat",    reason: "Flour tortillas, burritos, and quesadillas contain wheat" },
      { allergen: "gluten",   reason: "Flour-based items are common alongside corn options" },
      { allergen: "dairy",    reason: "Cheese, sour cream, and crema are standard toppings" },
      { allergen: "legumes",  reason: "Black beans, pinto beans, and refried beans are ubiquitous" },
      { allergen: "corn",     reason: "Corn tortillas, corn chips, and hominy are common" },
    ],
  },
  {
    match: ["italian", "pizzeria", "pasta", "trattoria", "osteria", "ristorante"],
    signals: [
      { allergen: "wheat",    reason: "Pasta, pizza dough, and bread are Italian staples" },
      { allergen: "gluten",   reason: "Wheat-based items dominate Italian menus" },
      { allergen: "dairy",    reason: "Parmesan, mozzarella, ricotta, and cream sauces are common" },
      { allergen: "egg",      reason: "Fresh pasta and desserts (tiramisu) often contain egg" },
      { allergen: "fish",     reason: "Anchovies in Caesar salad, pizza, and puttanesca sauce" },
      { allergen: "tree-nut", reason: "Pine nuts in pesto; almonds in biscotti and desserts" },
    ],
  },
  {
    match: ["mediterranean", "greek", "lebanese", "middle eastern", "falafel"],
    signals: [
      { allergen: "sesame",   reason: "Tahini and hummus are Mediterranean staples" },
      { allergen: "legumes",  reason: "Hummus (chickpeas), falafel, and lentil dishes are common" },
      { allergen: "wheat",    reason: "Pita bread and phyllo pastry are widely used" },
      { allergen: "gluten",   reason: "Wheat appears in breads and pastries" },
      { allergen: "dairy",    reason: "Feta, labneh, and yogurt sauces are common" },
      { allergen: "tree-nut", reason: "Pine nuts and pistachios in rice dishes and desserts" },
    ],
  },
  {
    match: ["vietnamese", "pho", "banh mi", "viet"],
    signals: [
      { allergen: "fish",     reason: "Fish sauce is a primary seasoning in Vietnamese cooking" },
      { allergen: "shellfish",reason: "Shrimp paste is common in Vietnamese condiments" },
      { allergen: "wheat",    reason: "Banh mi uses a baguette; soy sauce contains wheat" },
      { allergen: "gluten",   reason: "Wheat in banh mi bread and soy-based sauces" },
      { allergen: "peanut",   reason: "Crushed peanuts garnish many Vietnamese dishes" },
      { allergen: "soy",      reason: "Soy sauce used in marinades and dipping sauces" },
    ],
  },
  {
    match: ["korean", "k-bbq", "korean bbq", "bibimbap", "korean fusion"],
    signals: [
      { allergen: "soy",      reason: "Soy sauce and doenjang (fermented soy) are foundational" },
      { allergen: "wheat",    reason: "Gochujang and soy sauce typically contain wheat" },
      { allergen: "gluten",   reason: "Wheat in many Korean condiments and marinades" },
      { allergen: "sesame",   reason: "Sesame oil and seeds are used in virtually every Korean dish" },
      { allergen: "shellfish",reason: "Fermented seafood (jeotgal) used in kimchi and banchan" },
    ],
  },
  {
    match: ["french", "bistro", "brasserie", "french cuisine"],
    signals: [
      { allergen: "dairy",    reason: "Butter, cream, and cheese are central to French cooking" },
      { allergen: "egg",      reason: "Eggs in sauces (hollandaise, béarnaise) and pastries" },
      { allergen: "wheat",    reason: "Bread, crepes, tarts, and roux-thickened sauces" },
      { allergen: "gluten",   reason: "Wheat in baguettes, pastries, and thickened sauces" },
      { allergen: "fish",     reason: "Anchovies in classic sauces; Niçoise and other fish dishes" },
      { allergen: "tree-nut", reason: "Almonds and walnuts in tarts, sauces, and pastries" },
    ],
  },
  {
    match: ["filipino", "pilipino", "pinoy", "filipino cuisine"],
    signals: [
      { allergen: "soy",      reason: "Soy sauce (toyo) is used in almost every Filipino dish — adobo, sinigang, kare-kare" },
      { allergen: "fish",     reason: "Fish sauce (patis) is a primary seasoning in Filipino cooking" },
      { allergen: "shellfish",reason: "Bagoong (fermented shrimp paste) is a common condiment and cooking ingredient" },
      { allergen: "peanut",   reason: "Kare-kare (peanut stew) and peanut-based sauces are Filipino staples" },
    ],
  },
  {
    match: ["brazilian", "churrasco", "rodizio", "churrascaria"],
    signals: [
      { allergen: "dairy",    reason: "Cheese and cream sauces are common in Brazilian side dishes" },
      { allergen: "wheat",    reason: "Pão de queijo uses tapioca but many dishes use wheat flour" },
      { allergen: "egg",      reason: "Eggs are used in Brazilian desserts and rice dishes" },
    ],
  },
  {
    match: ["american", "bar & grill", "bar and grill", "gastropub", "pub grub", "comfort food", "bbq", "barbecue"],
    signals: [
      { allergen: "wheat",    reason: "Burgers, sandwiches, and fried items use wheat-based buns and breading" },
      { allergen: "dairy",    reason: "Cheese, ranch, and blue cheese dressings are staples" },
      { allergen: "egg",      reason: "Mayo-based sauces and dressings contain egg" },
      { allergen: "soy",      reason: "Worcestershire sauce and marinades often contain soy" },
    ],
  },
  {
    match: ["peruvian", "ceviche", "peruvian cuisine"],
    signals: [
      { allergen: "fish",     reason: "Ceviche (raw fish) and fish-based dishes are central to Peruvian cuisine" },
      { allergen: "shellfish",reason: "Shrimp and shellfish are common in Peruvian coastal dishes" },
      { allergen: "corn",     reason: "Choclo (giant corn) is a staple Peruvian ingredient" },
    ],
  },
  {
    match: ["ethiopian", "eritrean", "east african"],
    signals: [
      { allergen: "wheat",    reason: "Injera is a fermented flatbread (teff + sometimes wheat)" },
      { allergen: "legumes",  reason: "Misir (lentils), shiro (chickpea), and split peas are staples" },
      { allergen: "sesame",   reason: "Sesame seeds used in many Ethiopian spice blends and breads" },
    ],
  },
];

/** Escape a string for use in a RegExp */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Match a cuisine keyword with word boundaries to avoid "pho" matching "photography" */
function matchesCuisine(text: string, keyword: string): boolean {
  return new RegExp(`\\b${escapeRe(keyword)}\\b`).test(text);
}

/** Returns cuisine-context signals (weight 2 = "cuisine") for a given menu context */
export function getCuisineSignals(
  cuisineOrName: string,
  userAllergens: AllergenId[]
): RiskSignal[] {
  const lower = cuisineOrName.toLowerCase();
  const signals: RiskSignal[] = [];

  for (const pattern of CUISINE_PATTERNS) {
    const matched = pattern.match.find((m) => matchesCuisine(lower, m));
    if (!matched) continue;
    for (const s of pattern.signals) {
      if (!userAllergens.includes(s.allergen)) continue;
      signals.push({
        allergen: s.allergen,
        source:   "cuisine",
        weight:   2,
        trigger:  matched,
        reason:   s.reason,
      });
    }
  }

  return signals;
}
