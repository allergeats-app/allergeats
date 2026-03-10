// lib/engine/questionGenerator.ts
// Generates specific, actionable staff questions based on detected signals.
// Questions are dish-specific, not generic.

import type { AllergenId, RiskSignal } from "./types";

const ALLERGEN_LABELS: Record<AllergenId, string> = {
  dairy:    "dairy (milk, butter, cream, cheese)",
  egg:      "eggs",
  wheat:    "wheat",
  gluten:   "gluten",
  soy:      "soy",
  peanut:   "peanuts",
  "tree-nut": "tree nuts (almonds, cashews, walnuts, etc.)",
  sesame:   "sesame",
  fish:     "fish",
  shellfish: "shellfish (shrimp, crab, lobster, etc.)",
  mustard:  "mustard",
  corn:     "corn",
  legumes:  "legumes (beans, chickpeas, lentils, etc.)",
  oats:     "oats",
};

/** Context-specific question templates keyed by signal source */
type QuestionTemplate = {
  source: RiskSignal["source"];
  allergen?: AllergenId; // if undefined, matches any allergen
  trigger?: string;      // substring match on trigger term
  question: (allergen: AllergenId, dishName: string, trigger: string) => string;
};

const QUESTION_TEMPLATES: QuestionTemplate[] = [
  // Direct ingredient in name — confirm and ask about variants
  {
    source: "direct",
    allergen: "dairy",
    question: (_, dish) => `Does "${dish}" contain dairy in any form — milk, butter, cream, or cheese?`,
  },
  {
    source: "direct",
    allergen: "egg",
    question: (_, dish) => `Does "${dish}" contain eggs or any egg-based ingredients like mayo or aioli?`,
  },
  {
    source: "direct",
    allergen: "wheat",
    question: (_, dish) => `Is "${dish}" made with wheat flour? Is there a gluten-free version available?`,
  },
  {
    source: "direct",
    allergen: "gluten",
    question: (_, dish) => `Does "${dish}" contain gluten? Is a gluten-free version available or can it be modified?`,
  },
  {
    source: "direct",
    allergen: "peanut",
    question: (_, dish) => `Does "${dish}" contain peanuts or peanut-derived ingredients like peanut oil or peanut butter?`,
  },
  {
    source: "direct",
    allergen: "tree-nut",
    question: (_, dish) => `Does "${dish}" contain any tree nuts — almonds, cashews, walnuts, pine nuts, or others?`,
  },
  {
    source: "direct",
    allergen: "shellfish",
    question: (_, dish) => `Does "${dish}" contain any shellfish — shrimp, crab, lobster, or mollusks?`,
  },
  {
    source: "direct",
    allergen: "fish",
    question: (_, dish) => `Does "${dish}" contain any fish or fish-derived ingredients like fish sauce or anchovy?`,
  },
  {
    source: "direct",
    allergen: "soy",
    question: (_, dish) => `Does "${dish}" contain soy — soy sauce, tofu, or soy-based seasonings?`,
  },
  {
    source: "direct",
    allergen: "sesame",
    question: (_, dish) => `Does "${dish}" contain sesame — sesame oil, sesame seeds, or tahini?`,
  },

  // Dish-level inference — explain reasoning
  {
    source: "dish",
    trigger: "caesar",
    question: (_, dish) => `Traditional Caesar dressing contains anchovies and egg — does "${dish}" use a traditional Caesar dressing or a modified version?`,
  },
  {
    source: "dish",
    trigger: "alfredo",
    question: (_, dish) => `"${dish}" typically uses a cream and parmesan sauce — is this dish made with dairy or is there a dairy-free option?`,
  },
  {
    source: "dish",
    trigger: "carbonara",
    question: (_, dish) => `Carbonara traditionally contains egg and cheese — does "${dish}" follow this recipe?`,
  },
  {
    source: "dish",
    trigger: "pad thai",
    question: (_, dish) => `Pad Thai often contains shrimp paste, fish sauce, and egg — what are the actual ingredients in your "${dish}"?`,
  },
  {
    source: "dish",
    trigger: "satay",
    question: (_, dish) => `Satay sauce is peanut-based — is the "${dish}" served with satay sauce, and can it be omitted?`,
  },
  {
    source: "dish",
    trigger: "pesto",
    question: (_, dish) => `Pesto typically contains pine nuts and parmesan — does "${dish}" use traditional pesto?`,
  },
  {
    source: "dish",
    trigger: "bisque",
    question: (_, dish) => `Bisques are typically cream-based — does "${dish}" contain dairy and/or shellfish?`,
  },
  {
    source: "dish",
    trigger: "hummus",
    question: (_, dish) => `"${dish}" contains chickpeas and tahini (sesame) — is this prepared in-house and what are the full ingredients?`,
  },
  {
    source: "dish",
    trigger: "hollandaise",
    question: (_, dish) => `Hollandaise sauce is made with butter and egg yolks — does "${dish}" use real hollandaise?`,
  },

  // Sauce signals — ask about the sauce specifically
  {
    source: "sauce",
    question: (allergen, dish, trigger) =>
      `The sauce in "${dish}" (${trigger}) may contain ${ALLERGEN_LABELS[allergen]} — can you tell me what's in it?`,
  },

  // Ingredient ontology: "common" — allergen almost always present, confirm and ask about variants
  {
    source: "dish-common",
    question: (allergen, dish, trigger) =>
      `"${dish}" typically contains ${ALLERGEN_LABELS[allergen]} as part of the classic ${trigger} recipe. Can you confirm, and is a ${allergen}-free version available?`,
  },

  // Ingredient ontology: "possible" — allergen appears in many but not all versions
  {
    source: "dish-possible",
    question: (allergen, dish, trigger) =>
      `Some versions of ${trigger} contain ${ALLERGEN_LABELS[allergen]}. Does your "${dish}" include it, and can you check with the kitchen?`,
  },

  // Prep signals — cross-contact risks
  {
    source: "prep",
    trigger: "fried",
    question: (allergen, dish) =>
      `Is "${dish}" cooked in a dedicated fryer, or is the fryer shared with breaded/wheat-containing items? I have a ${ALLERGEN_LABELS[allergen]} allergy.`,
  },
  {
    source: "prep",
    trigger: "breaded",
    question: (_, dish) => `What are the breadcrumbs in "${dish}" made from — do they contain wheat or gluten?`,
  },
  {
    source: "prep",
    trigger: "battered",
    question: (_, dish) => `What is the batter for "${dish}" made with — does it contain wheat flour or egg?`,
  },
  {
    source: "prep",
    trigger: "glazed",
    question: (_, dish) => `What is the glaze on "${dish}" made from — does it contain soy sauce or other allergens?`,
  },
  {
    source: "prep",
    trigger: "marinated",
    question: (_, dish) => `What is in the marinade for "${dish}"? Does it contain soy sauce or wheat-based ingredients?`,
  },
  {
    source: "prep",
    trigger: "house sauce",
    question: (allergen, dish) =>
      `Can you tell me exactly what's in the house sauce on "${dish}"? I have a ${ALLERGEN_LABELS[allergen]} allergy.`,
  },
  {
    source: "prep",
    trigger: "stuffed",
    question: (allergen, dish) =>
      `What is the stuffing/filling in "${dish}" made from? It may contain ${ALLERGEN_LABELS[allergen]}.`,
  },

  // Cuisine baseline risks
  {
    source: "cuisine",
    allergen: "soy",
    question: (_, dish) => `Does "${dish}" contain soy sauce or other soy-based seasonings?`,
  },
  {
    source: "cuisine",
    allergen: "fish",
    question: (_, dish) => `Does "${dish}" or its sauce contain fish sauce or other fish-derived ingredients?`,
  },
  {
    source: "cuisine",
    allergen: "shellfish",
    question: (_, dish) => `Does "${dish}" contain any shellfish or shellfish-derived sauces like oyster sauce or shrimp paste?`,
  },
  {
    source: "cuisine",
    allergen: "peanut",
    question: (_, dish) => `Does "${dish}" contain peanuts or peanut oil?`,
  },
  {
    source: "cuisine",
    allergen: "sesame",
    question: (_, dish) => `Does "${dish}" contain sesame oil or sesame seeds?`,
  },
  {
    source: "cuisine",
    allergen: "dairy",
    question: (_, dish) => `Does "${dish}" contain any dairy — ghee, cream, paneer, or yogurt?`,
  },

  // Ambiguity catch-all
  {
    source: "ambiguity",
    question: (allergen, dish) =>
      `The description for "${dish}" is vague and I cannot tell if it contains ${ALLERGEN_LABELS[allergen]}. Can you share the full ingredient list or check with the kitchen?`,
  },
];

/** Fallback question if no specific template matches */
function fallbackQuestion(allergen: AllergenId, dishName: string): string {
  return `Does "${dishName}" contain ${ALLERGEN_LABELS[allergen]}? I have a severe allergy.`;
}

/** Find the best matching question template for a signal */
function findTemplate(signal: RiskSignal): QuestionTemplate | undefined {
  // Try to find a specific match (source + allergen + trigger)
  for (const t of QUESTION_TEMPLATES) {
    if (t.source !== signal.source) continue;
    if (t.allergen && t.allergen !== signal.allergen) continue;
    if (t.trigger && !signal.trigger.includes(t.trigger)) continue;
    return t;
  }
  // Fallback: match on source only (no allergen/trigger constraint)
  return QUESTION_TEMPLATES.find((t) => t.source === signal.source && !t.allergen && !t.trigger);
}

/**
 * Generate a deduplicated list of staff questions for a set of risk signals.
 * @param signals   All signals detected for this item
 * @param dishName  The dish name (for question context)
 * @param maxQ      Max questions to return (default 4 — don't overwhelm)
 */
export function generateStaffQuestions(
  signals: RiskSignal[],
  dishName: string,
  maxQ = 4
): string[] {
  const seen = new Set<string>();
  const questions: string[] = [];

  // Sort by weight descending so highest-risk signals get questions first
  const sorted = [...signals].sort((a, b) => b.weight - a.weight);

  for (const signal of sorted) {
    if (questions.length >= maxQ) break;
    const template = findTemplate(signal);
    const q = template
      ? template.question(signal.allergen, dishName, signal.trigger)
      : fallbackQuestion(signal.allergen, dishName);
    if (!seen.has(q)) {
      seen.add(q);
      questions.push(q);
    }
  }

  return questions;
}
