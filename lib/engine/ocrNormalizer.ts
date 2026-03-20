// lib/engine/ocrNormalizer.ts
// Cleans and normalizes raw menu text before allergen analysis.
// Handles OCR artifacts, abbreviations, pricing noise, and formatting junk.

/** Abbreviation expansions — map common abbreviations to full words */
const ABBREVIATIONS: [RegExp, string][] = [
  [/\bw\//gi,     "with "],
  [/\bw\/o\b/gi,  "without "],
  [/\bgf\b/gi,    "gluten free "],
  [/\bv\b/gi,     "vegetarian "],
  [/\bvg\b/gi,    "vegan "],
  [/\bdf\b/gi,    "dairy free "],
  [/\bnf\b/gi,    "nut free "],
  [/\bpb\b/gi,    "peanut butter "],
  [/\bbbq\b/gi,   "barbecue "],
  [/\bsm\b/gi,    "small "],
  [/\blg\b/gi,    "large "],
  [/\bxl\b/gi,    "extra large "],
  [/\boz\b/gi,    "ounce "],
  [/\blb\b/gi,    "pound "],
];

/** OCR common misreads — character substitutions */
const OCR_FIXES: [RegExp, string][] = [
  [/0(?=[a-z])/gi, "o"],   // 0 → o when followed by letter (e.g. "0live" → "olive")
  [/1(?=[a-z])/gi, "l"],   // 1 → l when followed by letter (e.g. "1emon" → "lemon")
  [/\|/g,          "l"],   // pipe → l
  [/\bI(?=[a-z])/g,"l"],   // capital I → l mid-word (OCR common)
  [/rn/g,          "m"],   // "rn" → "m" (common OCR substitution e.g. "alrnond" → "almond")
  [/\bII\b/g,      "ll"],  // double I → ll
];

/** Patterns to strip from raw menu text */
const STRIP_PATTERNS: RegExp[] = [
  /\$\d+(\.\d{2})?/g,         // prices like $12.99
  /\d+(\.\d{2})?(?=\s*$)/g,   // trailing numbers (prices)
  /^\d+\.\s*/gm,               // numbered list items "1. Burger"
  /^[-•·*▸→]\s*/gm,            // bullet points
  /\([^)]*cal[^)]*\)/gi,       // calorie counts like "(500 cal)"
  /\b\d+\s*cal(ories)?\b/gi,   // calorie mentions
  /[\u{1F300}-\u{1FFFF}]/gu,   // emoji (may confuse matching)
  /\*{1,3}/g,                  // asterisks used as footnote markers
  /\s{2,}/g,                   // collapse extra whitespace (applied last)
];

const MAX_NORMALIZE_INPUT = 50_000;

export function normalizeText(raw: string): string {
  let text = raw.length > MAX_NORMALIZE_INPUT ? raw.slice(0, MAX_NORMALIZE_INPUT) : raw;

  // 1. Apply OCR fixes
  for (const [pattern, replacement] of OCR_FIXES) {
    text = text.replace(pattern, replacement);
  }

  // 2. Expand abbreviations
  for (const [pattern, replacement] of ABBREVIATIONS) {
    text = text.replace(pattern, replacement);
  }

  // 3. Strip noise patterns
  for (const pattern of STRIP_PATTERNS) {
    text = text.replace(pattern, " ");
  }

  // 4. Lowercase + collapse whitespace
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize a list of raw menu lines:
 * - Remove blank lines
 * - Remove lines that are pure section headers (ALL CAPS, no lowercase)
 * - Remove lines that are just numbers (page numbers, table numbers)
 */
export function filterMenuLines(lines: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 1)                       // drop empty/single char
    .filter((l) => !/^\d+$/.test(l))                   // drop pure numbers
    .filter((l) => !/^[A-Z\s&-]{3,}$/.test(l));        // drop ALL-CAPS headers
}
