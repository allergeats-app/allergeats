// lib/detectAllergens.ts
import { TERM_RULES, Allergen } from "./allergenDB";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function detectAllergensFromLine(line: string): { allergens: Allergen[]; hits: string[] } {
  const text = normalize(line);
  const allergens = new Set<Allergen>();
  const hits: string[] = [];

  const rules = [...TERM_RULES].sort((a, b) => b.term.length - a.term.length);

  for (const rule of rules) {
    const term = normalize(rule.term);
    if (text.includes(term)) {
      for (const a of rule.allergens) allergens.add(a);
      hits.push(rule.term);
    }
  }

  return { allergens: Array.from(allergens), hits };
}
