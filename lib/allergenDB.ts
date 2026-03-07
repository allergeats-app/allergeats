// lib/allergenDB.ts

export type Allergen =
  | "dairy"
  | "egg"
  | "soy"
  | "wheat"
  | "fish"
  | "shellfish"
  | "nuts"
  | "sesame"
  | "corn"
  | "mustard";

export type TermRule = {
  term: string;
  allergens: Allergen[];
  confidence: number;
  note?: string;
};

export const TERM_RULES: TermRule[] = [
  // Dairy
  { term: "milk", allergens: ["dairy"], confidence: 5 },
  { term: "butter", allergens: ["dairy"], confidence: 5 },
  { term: "cheese", allergens: ["dairy"], confidence: 5 },
  { term: "cream", allergens: ["dairy"], confidence: 5 },
  { term: "whey", allergens: ["dairy"], confidence: 5 },
  { term: "casein", allergens: ["dairy"], confidence: 5 },

  // Egg
  { term: "egg", allergens: ["egg"], confidence: 5 },
  { term: "mayo", allergens: ["egg"], confidence: 5 },
  { term: "mayonnaise", allergens: ["egg"], confidence: 5 },
  { term: "aioli", allergens: ["egg"], confidence: 4, note: "Commonly mayo-based" },
  { term: "brioche", allergens: ["wheat", "egg", "dairy"], confidence: 4, note: "Often contains egg + butter" },

  // Soy
  { term: "soy", allergens: ["soy"], confidence: 5 },
  { term: "tofu", allergens: ["soy"], confidence: 5 },
  { term: "miso", allergens: ["soy"], confidence: 5 },
  { term: "soy sauce", allergens: ["soy", "wheat"], confidence: 5 },

  // Wheat
  { term: "flour", allergens: ["wheat"], confidence: 5 },
  { term: "bread", allergens: ["wheat"], confidence: 4 },
  { term: "bun", allergens: ["wheat"], confidence: 4 },
  { term: "tempura", allergens: ["wheat", "egg"], confidence: 4 },

  // Fish / Shellfish
  { term: "shrimp", allergens: ["shellfish"], confidence: 5 },
  { term: "crab", allergens: ["shellfish"], confidence: 5 },
  { term: "lobster", allergens: ["shellfish"], confidence: 5 },
  { term: "anchovy", allergens: ["fish"], confidence: 5 },

  // Nuts
  { term: "pesto", allergens: ["nuts"], confidence: 3, note: "Often pine nuts" },
  { term: "peanut", allergens: ["nuts"], confidence: 5 },

  // Sesame
  { term: "sesame", allergens: ["sesame"], confidence: 5 },
  { term: "tahini", allergens: ["sesame"], confidence: 5 },

  // Corn
  { term: "corn", allergens: ["corn"], confidence: 5 },
  { term: "cornstarch", allergens: ["corn"], confidence: 4 },

  // Mustard
  { term: "mustard", allergens: ["mustard"], confidence: 5 },
];
