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

// ─── NEGATION DETECTION ──────────────────────────────────────────────────────
// Removes signals for allergens that are explicitly excluded in the item text
// (e.g. "dairy-free burger", "no butter", items in a VEGAN menu section).
// Ambiguity and memory signals are never suppressed — they represent uncertainty
// that exists regardless of allergen-exclusion claims (cross-contamination, etc.).

/**
 * Maps each allergen to the common words used to describe it when negating on menus.
 * e.g. "no dairy", "dairy-free", "without milk" → negate "dairy" signals.
 */
const ALLERGEN_NEGATION_WORDS: Partial<Record<AllergenId, string[]>> = {
  dairy:      ["dairy", "milk", "lactose"],
  egg:        ["egg"],
  wheat:      ["wheat", "gluten"],
  gluten:     ["gluten", "wheat"],
  soy:        ["soy", "soya"],
  peanut:     ["peanut"],
  "tree-nut": ["nut"],
  sesame:     ["sesame"],
  fish:       ["fish"],
  shellfish:  ["shellfish", "seafood"],
  corn:       ["corn"],
  oats:       ["oat"],
};

/**
 * Returns the set of allergens explicitly excluded in the text.
 * Checks both item text and (optionally) the menu section heading.
 * Patterns matched:
 *   "X free" / "X-free"   — e.g. "dairy free", "gluten-free"
 *   "free of X"            — e.g. "free of nuts"
 *   "no/without/omit X"    — e.g. "no butter", "without dairy"
 */
function getNegatedAllergens(normalized: string, sectionTag?: string): Set<AllergenId> {
  const combined = sectionTag ? `${normalized} ${sectionTag}` : normalized;
  const negated  = new Set<AllergenId>();

  for (const [allergen, words] of Object.entries(ALLERGEN_NEGATION_WORDS) as [AllergenId, string[]][]) {
    for (const word of words) {
      const esc = escapeRe(word);
      if (new RegExp(`\\b${esc}s?[\\s-]free\\b`).test(combined))                                                         { negated.add(allergen); break; }
      if (new RegExp(`\\bfree\\s+of\\s+${esc}s?\\b`).test(combined))                                                     { negated.add(allergen); break; }
      if (new RegExp(`\\b(?:no|not|without|hold|remove|omit|skip)\\b(?:\\s+\\w+){0,3}\\s+${esc}s?\\b`).test(combined)) { negated.add(allergen); break; }
    }
  }

  return negated;
}

/**
 * Returns true if a specific trigger term is negated in the text.
 * Handles ingredient-level negation: "no anchovies", "without butter".
 */
function isTriggerNegated(normalized: string, trigger: string): boolean {
  const esc = escapeRe(trigger);
  return new RegExp(
    `\\b(?:no|not|without|hold|remove|omit|skip)\\b(?:\\s+\\w+){0,3}\\s+${esc}(?:s|es)?\\b`
  ).test(normalized);
}

/** Remove signals for allergens/triggers explicitly excluded in the text */
function filterNegatedSignals(
  signals:          RiskSignal[],
  normalized:       string,
  negatedAllergens: Set<AllergenId>
): RiskSignal[] {
  return signals.filter((s) => {
    // Ambiguity/memory signals represent uncertainty — never suppress them
    if (s.source === "ambiguity" || s.source === "memory") return true;
    if (negatedAllergens.has(s.allergen)) return false;
    if (isTriggerNegated(normalized, s.trigger)) return false;
    return true;
  });
}

// ─── SAFE TERM OVERRIDES ─────────────────────────────────────────────────────
// Multi-word phrases where an allergen-adjacent word is NOT an allergen indicator.
// e.g. "cream soda" contains no dairy; "egg cream" (NYC drink) contains no egg;
// "bass ale" is a beer brand, not a fish dish.
// When a safe phrase is detected, signals whose trigger appears in that phrase
// and whose allergen is listed are suppressed.

type SafeTermOverride = {
  phrase:    string;
  allergens: AllergenId[];
};

const SAFE_TERM_OVERRIDES: SafeTermOverride[] = [
  { phrase: "cream soda",  allergens: ["dairy"] },
  { phrase: "cream ale",   allergens: ["dairy"] },
  { phrase: "egg cream",   allergens: ["egg"]   },  // NYC drink: seltzer + choc syrup + milk; no egg
  { phrase: "bass ale",    allergens: ["fish"]  },
  { phrase: "bass beer",   allergens: ["fish"]  },
  { phrase: "bass lager",  allergens: ["fish"]  },
  { phrase: "bass pale",   allergens: ["fish"]  },
];

/** Remove signals that are false positives for well-known drink / idiom phrases. */
function filterSafeTermSignals(signals: RiskSignal[], normalized: string): RiskSignal[] {
  const active = SAFE_TERM_OVERRIDES.filter(({ phrase }) =>
    new RegExp(`\\b${escapeRe(phrase)}\\b`).test(normalized)
  );
  if (active.length === 0) return signals;

  return signals.filter((signal) => {
    // Memory signals always take priority — never suppress
    if (signal.source === "memory") return true;
    for (const { phrase, allergens } of active) {
      if (
        allergens.includes(signal.allergen) &&
        phrase.includes(signal.trigger.toLowerCase())
      ) {
        return false;
      }
    }
    return true;
  });
}

// ─── CONTAINS-LABEL PARSING ──────────────────────────────────────────────────
// Menus sometimes include explicit allergen disclosures:
//   "Contains: wheat, eggs, milk"
//   "Allergens: gluten, sesame"
//   "Made with: butter, cream, eggs"
// These are the highest-quality signal we can get — emit weight-5 direct signals.

/** Maps tokens found in allergen/ingredient labels to their AllergenId */
const LABEL_ALLERGEN_MAP: Readonly<Record<string, AllergenId>> = {
  // Dairy
  wheat:        "wheat",
  flour:        "wheat",
  gluten:       "gluten",
  dairy:        "dairy",
  milk:         "dairy",
  lactose:      "dairy",
  cream:        "dairy",
  butter:       "dairy",
  cheese:       "dairy",
  yogurt:       "dairy",
  yoghurt:      "dairy",
  whey:         "dairy",
  casein:       "dairy",
  ghee:         "dairy",
  ricotta:      "dairy",
  mozzarella:   "dairy",
  parmesan:     "dairy",
  feta:         "dairy",
  "sour cream": "dairy",
  buttermilk:   "dairy",
  // Egg
  egg:          "egg",
  eggs:         "egg",
  // Soy
  soy:          "soy",
  soya:         "soy",
  soybeans:     "soy",
  tamari:       "soy",
  // Peanut
  peanut:       "peanut",
  peanuts:      "peanut",
  // Tree nuts
  "tree nut":   "tree-nut",
  "tree nuts":  "tree-nut",
  nuts:         "tree-nut",
  almond:       "tree-nut",
  almonds:      "tree-nut",
  cashew:       "tree-nut",
  cashews:      "tree-nut",
  walnut:       "tree-nut",
  walnuts:      "tree-nut",
  pecan:        "tree-nut",
  pecans:       "tree-nut",
  hazelnut:     "tree-nut",
  hazelnuts:    "tree-nut",
  pistachio:    "tree-nut",
  pistachios:   "tree-nut",
  macadamia:    "tree-nut",
  macadamias:   "tree-nut",
  // Sesame
  sesame:       "sesame",
  tahini:       "sesame",
  // Fish
  fish:         "fish",
  anchovy:      "fish",
  anchovies:    "fish",
  salmon:       "fish",
  tuna:         "fish",
  cod:          "fish",
  tilapia:      "fish",
  halibut:      "fish",
  trout:        "fish",
  sardine:      "fish",
  sardines:     "fish",
  mackerel:     "fish",
  herring:      "fish",
  snapper:      "fish",
  // Shellfish
  shellfish:    "shellfish",
  shrimp:       "shellfish",
  prawn:        "shellfish",
  prawns:       "shellfish",
  crab:         "shellfish",
  lobster:      "shellfish",
  clam:         "shellfish",
  clams:        "shellfish",
  oyster:       "shellfish",
  oysters:      "shellfish",
  scallop:      "shellfish",
  scallops:     "shellfish",
  // Mustard
  mustard:      "mustard",
  dijon:        "mustard",
  // Corn
  corn:         "corn",
  maize:        "corn",
  cornstarch:   "corn",
  cornmeal:     "corn",
  polenta:      "corn",
  grits:        "corn",
  // Oats
  oat:          "oats",
  oats:         "oats",
  oatmeal:      "oats",
  granola:      "oats",
  muesli:       "oats",
  "oat milk":   "oats",
  "oat flour":  "oats",
  // Legumes
  legumes:      "legumes",
  chickpea:     "legumes",
  chickpeas:    "legumes",
  lentil:       "legumes",
  lentils:      "legumes",
  lupin:        "legumes",
  lupine:       "legumes",
} as const;

const CONTAINS_LABEL_RE = /\b(?:contains?|allergens?|made\s+with|includes?|ingredients?)\s*[:]\s*([^.();\n]{3,300})/gi;

/**
 * Detects structured allergen/ingredient labels and emits weight-5 direct signals.
 * Much higher confidence than vocabulary matching because these are explicit disclosures.
 */
function detectContainsLabelSignals(normalized: string, userAllergens: AllergenId[]): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const re = new RegExp(CONTAINS_LABEL_RE.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = re.exec(normalized)) !== null) {
    const items = match[1].split(/[,;&]+/).map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      const allergen = LABEL_ALLERGEN_MAP[item.toLowerCase()];
      if (!allergen || !userAllergens.includes(allergen)) continue;
      signals.push({
        allergen,
        source:  "direct",
        weight:  5,
        trigger: item,
        reason:  `Explicitly listed in allergen/ingredient label`,
      });
    }
  }

  return signals;
}

// ─── MAY-CONTAIN / PRECAUTIONARY LABEL PARSING ───────────────────────────────
// Detects precautionary allergen disclosures:
//   "May contain: wheat, soy"
//   "May contain traces of peanuts"
//   "Made in a facility that processes dairy"
//   "Produced on shared equipment with tree nuts"
// These are important safety signals but weaker than definite "Contains:" labels —
// they indicate cross-contamination risk, not confirmed ingredient presence.

const MAY_CONTAIN_RE = new RegExp(
  "\\b(?:" +
    "may\\s+contain(?:\\s+traces?\\s+of)?|" +
    "traces?\\s+of|" +
    "(?:made|produced|processed|manufactured|packaged)\\s+(?:in|on)\\s+(?:a\\s+)?(?:shared\\s+)?(?:facility|equipment|line|plant)\\s+(?:that\\s+)?(?:also\\s+)?(?:process(?:es)?|handles?|uses?|contains?|with)" +
  ")\\s*:?\\s*([^.;\\n]{2,200})",
  "gi"
);

/**
 * Detects precautionary allergen disclosures and emits weight-2 signals.
 * Weight-2 maps to "ask" (not "avoid") — cross-contamination risk, not confirmed ingredient.
 */
function detectMayContainSignals(normalized: string, userAllergens: AllergenId[]): RiskSignal[] {
  const signals: RiskSignal[] = [];
  const re = new RegExp(MAY_CONTAIN_RE.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = re.exec(normalized)) !== null) {
    const items = match[1].split(/[,;&]+/).map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      const key = item.toLowerCase().replace(/\s+/g, " ").split(" ").slice(0, 3).join(" ");
      const allergen = LABEL_ALLERGEN_MAP[key] ?? LABEL_ALLERGEN_MAP[item.toLowerCase()];
      if (!allergen || !userAllergens.includes(allergen)) continue;
      signals.push({
        allergen,
        source:  "prep",  // reuse prep weight (2) — cross-contamination risk
        weight:  2,
        trigger: item,
        reason:  `May contain (precautionary label) — cross-contamination risk`,
      });
    }
  }

  return signals;
}

/** Analyze a single parsed dish */
function analyzeDish(
  dish: ParsedDish,
  userAllergens: AllergenId[],
  cuisineContext: string,
  sourceType?: SourceType
): AnalyzedItem {
  const allSignals: RiskSignal[] = [];

  // Layer 0a: precautionary "may contain..." / "made in a facility with..." labels — weight-2
  // Collected separately so we can identify allergens that are ONLY precautionary below.
  const mayContainSignals = detectMayContainSignals(dish.normalized, userAllergens);
  allSignals.push(...mayContainSignals);

  // Layer 0b: explicit "contains: ..." / "allergens: ..." labels — weight-5 direct signals
  allSignals.push(...detectContainsLabelSignals(dish.normalized, userAllergens));

  // Layer 1 + 2: direct ingredients + synonyms + dish/sauce inference (via vocab)
  allSignals.push(...detectVocabSignals(dish.normalized, userAllergens));

  // Layer 3: structured dish/ingredient ontology (ingredient-chain reasoning)
  allSignals.push(...detectIngredientSignals(dish.normalized, userAllergens));

  // Layer 4: preparation method risks
  allSignals.push(...getPrepSignals(dish.normalized, userAllergens));

  // Layer 5: cuisine context — also use section tag as a cuisine hint
  const contextStr = [cuisineContext, dish.sectionTag ?? ""].filter(Boolean).join(" ");
  const cuisineSignals = getCuisineSignals(contextStr, userAllergens);
  allSignals.push(...cuisineSignals);

  // Layer 6: ambiguity detection
  allSignals.push(...getAmbiguitySignals(dish.normalized, userAllergens));

  // Layer 7: negation filtering — remove signals for allergens explicitly excluded
  // ("dairy-free burger", "no butter", vegan/nut-free section headers)
  const negatedAllergens = getNegatedAllergens(dish.normalized, dish.sectionTag);
  const negationFiltered = filterNegatedSignals(allSignals, dish.normalized, negatedAllergens);
  const safeFiltered     = filterSafeTermSignals(negationFiltered, dish.normalized);

  const signals = deduplicateSignals(safeFiltered);

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

  // Identify allergens that were detected ONLY via precautionary "may contain" labels.
  // An allergen is precautionary-only if every surviving signal for it came from mayContainSignals
  // (i.e. no higher-weight definite signal exists after deduplication).
  const mayContainAllergenSet = new Set(mayContainSignals.map((s) => s.allergen));
  const definiteSignalAllergens = new Set(
    signals
      .filter((s) => !mayContainSignals.some((m) => m.allergen === s.allergen && m.trigger === s.trigger))
      .map((s) => s.allergen)
  );
  const precautionaryAllergens = scored.matchedAllergens.filter(
    (a) => mayContainAllergenSet.has(a) && !definiteSignalAllergens.has(a)
  ) as AllergenId[];

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
    precautionaryAllergens: precautionaryAllergens.length > 0 ? precautionaryAllergens : undefined,
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
