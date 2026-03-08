export const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  dairy: [
    "cheese",
    "milk",
    "butter",
    "cream",
    "alfredo",
    "frosty",
    "shake",
    "sour cream",
    "cheddar",
    "parmesan"
  ],

  egg: [
    "egg",
    "mayo",
    "aioli"
  ],

  wheat: [
    "bread",
    "bun",
    "pizza",
    "pasta",
    "wrap",
    "croissant",
    "muffin"
  ],

  soy: [
    "soy",
    "teriyaki",
    "tofu"
  ],

  fish: [
    "fish",
    "tuna",
    "filet"
  ],

  shellfish: [
    "shrimp",
    "crab",
    "lobster",
    "clam",
    "oyster",
    "scallop",
    "mussel",
    "calamari",
    "squid"
  ],

  peanut: [
    "peanut",
    "peanut butter",
    "satay",
    "pad thai"
  ],

  "tree-nut": [
    "almond",
    "walnut",
    "cashew",
    "pecan",
    "pistachio",
    "hazelnut",
    "macadamia",
    "pine nut",
    "pesto"
  ],

  sesame: [
    "sesame",
    "tahini",
    "hummus"
  ],

  corn: [
    "corn",
    "cornstarch",
    "masa",
    "polenta"
  ],

  mustard: [
    "mustard"
  ],

  legumes: [
    "chickpea",
    "chickpeas",
    "lentil",
    "lentils",
    "black bean",
    "kidney bean",
    "pinto bean",
    "fava bean",
    "lupin",
    "lupine"
  ],

  oats: [
    "oat",
    "oats",
    "oatmeal",
    "granola",
    "muesli"
  ]
};

export function inferAllergensFromKeywords(item: string): string[] {
  const text = item.toLowerCase();
  const hits = new Set<string>();

  for (const [allergen, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
    if (keywords.some((k) => text.includes(k))) {
      hits.add(allergen);
    }
  }

  return [...hits];
}