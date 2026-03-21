// lib/engine/ambiguityDetector.ts
// Detects vague language that prevents confident allergen assessment.
// These don't tell us WHAT allergens are present, only that we can't be sure.

import type { AllergenId, RiskSignal } from "./types";

type AmbiguityPattern = {
  terms: string[];
  /** Which allergens to flag (i.e. which user allergens we can't rule out) */
  allergens: AllergenId[];
  reason: string;
};

const AMBIGUITY_PATTERNS: AmbiguityPattern[] = [
  {
    terms: ["house sauce", "our sauce", "house dressing", "our dressing", "house-made sauce"],
    allergens: ["egg", "dairy", "soy", "wheat", "gluten", "sesame", "mustard"],
    reason: "House sauce ingredients are not disclosed — ask staff for a full list",
  },
  {
    terms: ["secret sauce", "special sauce", "signature sauce", "chef sauce"],
    allergens: ["egg", "dairy", "soy", "wheat", "gluten", "sesame"],
    reason: "Proprietary sauce recipes may contain any allergen",
  },
  {
    terms: ["mystery"],
    allergens: ["egg", "dairy", "soy", "wheat", "gluten"],
    reason: "Unknown ingredient composition",
  },
  {
    terms: ["seasonal", "market fresh", "rotating", "changes daily"],
    allergens: ["shellfish", "fish", "dairy", "egg", "tree-nut"],
    reason: "Seasonal menu items vary and may include any of these allergens",
  },
  {
    terms: ["chef's choice", "chefs choice", "chef's special", "chefs special", "chef special"],
    allergens: ["shellfish", "fish", "dairy", "egg", "wheat", "gluten", "tree-nut"],
    reason: "Chef's choice items are not standardized — confirm ingredients",
  },
  {
    terms: ["may contain", "may be prepared with", "processed in a facility"],
    allergens: ["peanut", "tree-nut", "dairy", "egg", "wheat", "gluten", "shellfish", "fish", "sesame"],
    reason: "May contain warnings indicate cross-contact risk",
  },
  {
    terms: ["assorted", "assortment", "mixed", "variety"],
    allergens: ["dairy", "egg", "wheat", "gluten", "tree-nut"],
    reason: "Assorted items may include unpredictable ingredients",
  },
  {
    terms: ["garnish", "garnished"],
    allergens: ["sesame", "tree-nut", "peanut", "dairy"],
    reason: "Garnishes may add hidden allergens not listed in the main dish",
  },
  {
    terms: ["served with", "comes with"],
    allergens: ["dairy", "egg", "wheat", "gluten"],
    reason: "Accompanying sides or sauces may introduce allergens",
  },
  {
    terms: ["ask server", "ask staff", "inquire", "upon request"],
    allergens: ["dairy", "egg", "wheat", "gluten", "fish", "shellfish", "peanut", "tree-nut"],
    reason: "Staff consultation indicates ingredients are not fully standardized",
  },
  {
    terms: ["nut", "nuts"],
    allergens: ["peanut", "tree-nut"],
    reason: "Generic 'nuts' could be peanuts or tree nuts or both",
  },
  {
    terms: ["dairy free", "dairy-free", "vegan"],
    allergens: ["soy", "tree-nut"],
    reason: "Dairy-free items may use soy or nut-based substitutes — confirm",
  },
  {
    terms: ["gluten free", "gluten-free"],
    allergens: ["wheat", "gluten"],
    reason: "Cross-contamination is possible even on gluten-free items — confirm kitchen practices",
  },
];

/** Escape a string for use in a RegExp */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Test for whole-word match to avoid "nut" matching inside "minute", "peanut", etc. */
function matchesWord(text: string, term: string): boolean {
  return new RegExp(`\\b${escapeRe(term)}\\b`).test(text);
}

/** Returns ambiguity signals (weight 1) for allergens in user's profile we can't rule out */
export function getAmbiguitySignals(
  normalized: string,
  userAllergens: AllergenId[]
): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const pattern of AMBIGUITY_PATTERNS) {
    const matchedTerm = pattern.terms.find((t) => matchesWord(normalized, t));
    if (!matchedTerm) continue;
    for (const allergen of pattern.allergens) {
      if (!userAllergens.includes(allergen)) continue;
      signals.push({
        allergen,
        source:  "ambiguity",
        weight:  1,
        trigger: matchedTerm,
        reason:  pattern.reason,
      });
    }
  }

  return signals;
}
