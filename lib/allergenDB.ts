// lib/allergenDB.ts

export type Allergen =
  | "dairy"
  | "egg"
  | "soy"
  | "wheat"
  | "gluten"
  | "fish"
  | "shellfish"
  | "nuts"
  | "peanut"
  | "tree-nut"
  | "sesame"
  | "corn"
  | "mustard"
  | "legumes"
  | "oats";

export type TermRule = {
  term: string;
  allergens: Allergen[];
  confidence: number;
  note?: string;
};

export const TERM_RULES: TermRule[] = [
  // Dairy
  { term: "milk",      allergens: ["dairy"], confidence: 5 },
  { term: "butter",    allergens: ["dairy"], confidence: 5 },
  { term: "cheese",    allergens: ["dairy"], confidence: 5 },
  { term: "cream",     allergens: ["dairy"], confidence: 5 },
  { term: "whey",      allergens: ["dairy"], confidence: 5 },
  { term: "casein",    allergens: ["dairy"], confidence: 5 },
  { term: "yogurt",    allergens: ["dairy"], confidence: 5 },
  { term: "yoghurt",   allergens: ["dairy"], confidence: 5 },

  // Egg
  { term: "egg",        allergens: ["egg"], confidence: 5 },
  { term: "mayo",       allergens: ["egg"], confidence: 5 },
  { term: "mayonnaise", allergens: ["egg"], confidence: 5 },
  { term: "aioli",      allergens: ["egg"], confidence: 4, note: "Commonly mayo-based" },
  { term: "brioche",    allergens: ["wheat", "gluten", "egg", "dairy"], confidence: 4, note: "Often contains egg + butter" },

  // Soy
  { term: "soy sauce", allergens: ["soy", "wheat", "gluten"], confidence: 5 },
  { term: "soy",       allergens: ["soy"], confidence: 5 },
  { term: "tofu",      allergens: ["soy"], confidence: 5 },
  { term: "miso",      allergens: ["soy"], confidence: 5 },
  { term: "edamame",   allergens: ["soy"], confidence: 5 },
  { term: "tempeh",    allergens: ["soy"], confidence: 5 },

  // Wheat / Gluten
  { term: "flour",     allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "bread",     allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "bun",       allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "tempura",   allergens: ["wheat", "gluten", "egg"], confidence: 4 },
  { term: "gluten",    allergens: ["gluten", "wheat"], confidence: 5 },
  { term: "barley",    allergens: ["gluten"], confidence: 5 },
  { term: "rye",       allergens: ["gluten"], confidence: 4, note: "Rye contains gluten" },
  { term: "pasta",     allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "noodle",    allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "crouton",   allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "tortilla",  allergens: ["wheat", "gluten"], confidence: 3, note: "Flour tortillas only; corn tortillas are wheat-free" },
  { term: "pretzel",   allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "croissant", allergens: ["wheat", "gluten", "dairy", "egg"], confidence: 5 },
  { term: "waffle",    allergens: ["wheat", "gluten", "egg", "dairy"], confidence: 5 },
  { term: "pancake",   allergens: ["wheat", "gluten", "egg", "dairy"], confidence: 4 },

  // Fish
  { term: "fish sauce",     allergens: ["fish"], confidence: 5 },
  { term: "worcestershire", allergens: ["fish"], confidence: 4, note: "Typically contains anchovies" },
  { term: "anchovy",        allergens: ["fish"], confidence: 5 },
  { term: "salmon",         allergens: ["fish"], confidence: 5 },
  { term: "tuna",           allergens: ["fish"], confidence: 5 },
  { term: "cod",            allergens: ["fish"], confidence: 5 },
  { term: "tilapia",        allergens: ["fish"], confidence: 5 },
  { term: "halibut",        allergens: ["fish"], confidence: 5 },

  // Shellfish
  { term: "shrimp",   allergens: ["shellfish"], confidence: 5 },
  { term: "crab",     allergens: ["shellfish"], confidence: 5 },
  { term: "lobster",  allergens: ["shellfish"], confidence: 5 },
  { term: "clam",     allergens: ["shellfish"], confidence: 5 },
  { term: "oyster",   allergens: ["shellfish"], confidence: 5 },
  { term: "scallop",  allergens: ["shellfish"], confidence: 5 },
  { term: "mussel",   allergens: ["shellfish"], confidence: 5 },
  { term: "calamari", allergens: ["shellfish"], confidence: 5 },
  { term: "squid",    allergens: ["shellfish"], confidence: 5 },

  // Peanuts (distinct from tree nuts)
  { term: "peanut butter", allergens: ["peanut", "nuts"], confidence: 5 },
  { term: "peanut",        allergens: ["peanut", "nuts"], confidence: 5 },
  { term: "satay",         allergens: ["peanut", "nuts"], confidence: 4, note: "Satay sauce typically contains peanuts" },
  { term: "pad thai",      allergens: ["peanut", "nuts"], confidence: 4, note: "Commonly garnished with crushed peanuts" },

  // Tree nuts (distinct from peanuts)
  { term: "pine nut",  allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "almond",    allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "walnut",    allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "cashew",    allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pecan",     allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pistachio", allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "hazelnut",  allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "macadamia", allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pesto",     allergens: ["tree-nut", "nuts"], confidence: 3, note: "Typically pine nuts or walnuts" },

  // Sesame
  { term: "sesame", allergens: ["sesame"], confidence: 5 },
  { term: "tahini", allergens: ["sesame"], confidence: 5 },
  { term: "hummus", allergens: ["sesame"], confidence: 4, note: "Hummus typically contains tahini" },

  // Corn
  { term: "cornstarch", allergens: ["corn"], confidence: 5 },
  { term: "corn",       allergens: ["corn"], confidence: 5 },
  { term: "masa",       allergens: ["corn"], confidence: 5 },
  { term: "polenta",    allergens: ["corn"], confidence: 5 },

  // Mustard
  { term: "mustard", allergens: ["mustard"], confidence: 5 },

  // Legumes (separate from soy — different allergen)
  { term: "lupin",       allergens: ["legumes"], confidence: 5 },
  { term: "lupine",      allergens: ["legumes"], confidence: 5 },
  { term: "fava bean",   allergens: ["legumes"], confidence: 5 },
  { term: "kidney bean", allergens: ["legumes"], confidence: 5 },
  { term: "pinto bean",  allergens: ["legumes"], confidence: 5 },
  { term: "black bean",  allergens: ["legumes"], confidence: 5 },
  { term: "chickpeas",   allergens: ["legumes"], confidence: 5 },
  { term: "chickpea",    allergens: ["legumes"], confidence: 5 },
  { term: "lentils",     allergens: ["legumes"], confidence: 5 },
  { term: "lentil",      allergens: ["legumes"], confidence: 5 },

  // Oats
  { term: "muesli",  allergens: ["oats"], confidence: 5 },
  { term: "oatmeal", allergens: ["oats"], confidence: 5 },
  { term: "granola", allergens: ["oats"], confidence: 4, note: "Granola is oat-based" },
  { term: "oats",    allergens: ["oats"], confidence: 5 },
  { term: "oat",     allergens: ["oats"], confidence: 5 },
];
