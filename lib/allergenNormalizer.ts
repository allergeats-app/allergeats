const MAP: Record<string, string[]> = {
  milk: ["milk", "whey", "casein", "butter", "cream", "cheese"],
  egg: ["egg", "albumin", "egg yolk", "egg white"],
  wheat: ["wheat", "flour", "semolina", "breadcrumbs"],
  soy: ["soy", "soybean", "soy lecithin", "soy protein"],
  peanut: ["peanut", "groundnut"],
  tree_nut: ["almond", "cashew", "pecan", "walnut", "pistachio", "hazelnut"],
  sesame: ["sesame", "tahini"],
  fish: ["fish", "salmon", "tuna", "cod"],
  shellfish: ["shrimp", "crab", "lobster", "scallop"]
};

export function normalizeAllergens(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();

  for (const [allergen, terms] of Object.entries(MAP)) {
    if (terms.some(term => lower.includes(term))) {
      found.add(allergen);
    }
  }

  return [...found];
}