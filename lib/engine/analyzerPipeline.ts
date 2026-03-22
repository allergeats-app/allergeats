// lib/engine/analyzerPipeline.ts
// Main entry point for the conservative allergen detection engine.
// Orchestrates: OCR normalization → parsing → multi-layer signal detection → scoring → questions.

import type { AllergenId, AnalyzedItem, MenuAnalysisResult, RiskSignal, ParsedDish } from "./types";
import type { SourceType } from "@/lib/types";
import { ALLERGEN_VOCABULARY } from "./allergenVocabulary";
import { SIGNAL_WEIGHT } from "./types";
import { getCuisineSignals } from "./cuisineInference";
import { getPrepSignals } from "./prepRisk";
import { getAmbiguitySignals } from "./ambiguityDetector";
import { detectIngredientSignals } from "./ingredientInferencer";
import { scoreItem } from "./riskScorer";
import { generateStaffQuestions } from "./questionGenerator";
import { parseMenuLines } from "./menuParser";
import { normalizeText } from "./ocrNormalizer";

/** Escape a string for use in a RegExp */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Vocab entries pre-sorted longest-first with their word-boundary regexes compiled once.
 * Using \b word boundaries prevents "nut" matching inside "minute", "peanut", etc.
 */
const SORTED_VOCAB = [...ALLERGEN_VOCABULARY]
  .sort((a, b) => b.term.length - a.term.length)
  .map((entry) => {
    const normalized = normalizeText(entry.term);
    return { entry, re: new RegExp(`\\b${escapeRe(normalized)}s?\\b`) };
  });

/** Run all vocabulary-based detection layers on a normalized text string */
function detectVocabSignals(normalized: string, userAllergens: AllergenId[]): RiskSignal[] {
  const signals: RiskSignal[] = [];

  for (const { entry, re } of SORTED_VOCAB) {
    if (!re.test(normalized)) continue;
    for (const allergen of entry.allergens) {
      if (!userAllergens.includes(allergen)) continue;
      signals.push({
        allergen,
        source:  entry.source,
        weight:  SIGNAL_WEIGHT[entry.source],
        trigger: entry.term,
        reason:  entry.note ?? `Contains "${entry.term}"`,
      });
    }
  }


  return signals;
}

/** Deduplicate signals: keep highest-weight signal per (allergen, source) pair */
function deduplicateSignals(signals: RiskSignal[]): RiskSignal[] {
  const map = new Map<string, RiskSignal>();
  for (const s of signals) {
    const key = `${s.allergen}::${s.source}`;
    const existing = map.get(key);
    if (!existing || s.weight > existing.weight) {
      map.set(key, s);
    }
  }
  return [...map.values()];
}

/** Analyze a single parsed dish */
function analyzeDish(
  dish: ParsedDish,
  userAllergens: AllergenId[],
  cuisineContext: string,
  sourceType?: SourceType
): AnalyzedItem {
  const allSignals: RiskSignal[] = [];

  // Layer 1 + 2: direct ingredients + synonyms + dish/sauce inference (via vocab)
  allSignals.push(...detectVocabSignals(dish.normalized, userAllergens));

  // Layer 3: structured dish/ingredient ontology (ingredient-chain reasoning)
  allSignals.push(...detectIngredientSignals(dish.normalized, userAllergens));

  // Layer 4: preparation method risks
  allSignals.push(...getPrepSignals(dish.normalized, userAllergens));

  // Layer 5: cuisine context (only add if not already covered by vocab signals)
  const cuisineSignals = getCuisineSignals(cuisineContext, userAllergens);
  allSignals.push(...cuisineSignals);

  // Layer 6: ambiguity detection
  allSignals.push(...getAmbiguitySignals(dish.normalized, userAllergens));

  const signals = deduplicateSignals(allSignals);

  // Score the item
  const scored = scoreItem(signals, userAllergens, sourceType);

  // Collect ALL detected allergens (not just user's profile) for informational display
  // (e.g. "also contains shellfish" even if the user only set peanut allergy).
  const ALL_ALLERGENS: AllergenId[] = [
    "dairy", "egg", "wheat", "gluten", "soy", "peanut", "tree-nut",
    "sesame", "fish", "shellfish", "mustard", "corn", "legumes", "oats",
  ];
  const allVocabSignals = detectVocabSignals(dish.normalized, ALL_ALLERGENS);
  const allOntologySignals = detectIngredientSignals(dish.normalized, ALL_ALLERGENS);
  const allDetected = [...new Set([
    ...allVocabSignals.map((s) => s.allergen),
    ...allOntologySignals.map((s) => s.allergen),
  ])];

  // Generate staff questions for signals that hit user's profile
  const relevantSignals = signals.filter((s) => userAllergens.includes(s.allergen));
  const staffQuestions = generateStaffQuestions(relevantSignals, dish.name);

  return {
    raw:                  dish.raw,
    name:                 dish.name,
    description:          dish.description,
    signals,
    risk:                 scored.risk,
    confidence:           scored.confidence,
    matchedAllergens:     scored.matchedAllergens,
    allDetectedAllergens: allDetected,
    staffQuestions,
    explanation:          scored.explanation,
  };
}

/**
 * Analyze a list of raw menu text lines.
 *
 * @param rawLines       Lines from OCR, paste, or API
 * @param userAllergens  The user's allergy profile
 * @param cuisineContext Restaurant name or cuisine type (for cuisine inference)
 * @param sourceType     Data source quality (affects confidence display)
 */
export function analyzeMenu(
  rawLines: string[],
  userAllergens: AllergenId[],
  cuisineContext = "",
  sourceType?: SourceType
): MenuAnalysisResult {
  if (userAllergens.length === 0) {
    // No allergens configured — everything shows as safe/unknown
    const dishes = parseMenuLines(rawLines);
    const items: AnalyzedItem[] = dishes.map((d) => ({
      raw:                  d.raw,
      name:                 d.name,
      description:          d.description,
      signals:              [],
      risk:                 "safe",
      confidence:           "low",
      matchedAllergens:     [],
      allDetectedAllergens: [],
      staffQuestions:       [],
      explanation:          "No allergies configured. Add your allergens to get safety ratings.",
    }));
    return { items, safe: items, ask: [], avoid: [] };
  }

  const dishes = parseMenuLines(rawLines);
  const items = dishes.map((d) => analyzeDish(d, userAllergens, cuisineContext, sourceType));

  return {
    items,
    safe:  items.filter((i) => i.risk === "safe"),
    ask:   items.filter((i) => i.risk === "ask"),
    avoid: items.filter((i) => i.risk === "avoid"),
  };
}

/**
 * Analyze a single menu line (convenience wrapper for scan page).
 * Used when iterating line-by-line rather than as a full menu.
 */
export function analyzeLine(
  line: string,
  userAllergens: AllergenId[],
  cuisineContext = "",
  sourceType?: SourceType
): AnalyzedItem {
  const result = analyzeMenu([line], userAllergens, cuisineContext, sourceType);
  return result.items[0] ?? {
    raw: line, name: line, description: "",
    signals: [], risk: "safe", confidence: "low",
    matchedAllergens: [], allDetectedAllergens: [],
    staffQuestions: [],
    explanation: "Could not analyze this item.",
  };
}
