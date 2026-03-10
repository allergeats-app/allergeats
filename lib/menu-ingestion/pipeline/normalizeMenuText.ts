/**
 * lib/menu-ingestion/pipeline/normalizeMenuText.ts
 *
 * Converts raw menu item text into the normalizedText field used by the
 * allergy analysis engine.
 *
 * Philosophy:
 *   - Remove noise (prices, bullet markers, HTML entities)
 *   - Preserve meaning (food terms, ingredient names, modifiers)
 *   - Do NOT aggressively lowercase brand names in rawText — only in normalizedText
 *   - Do NOT strip words that might be allergen-relevant
 */

// ─── HTML entity map ──────────────────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  "&amp;":   "&",
  "&quot;":  '"',
  "&#39;":   "'",
  "&apos;":  "'",
  "&lt;":    "<",
  "&gt;":    ">",
  "&nbsp;":  " ",
  "&#8212;": "—",
  "&#8211;": "–",
  "&#x27;":  "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&[^;]+;/g, (match) => HTML_ENTITIES[match] ?? " ");
}

// ─── Common menu abbreviations ────────────────────────────────────────────────

const ABBREVIATIONS: [RegExp, string][] = [
  [/\bw\//gi,     "with"],
  [/\bw\/o\b/gi,  "without"],
  [/\bgf\b/gi,    "gluten free"],
  [/\bdf\b/gi,    "dairy free"],
  [/\bvg\b/gi,    "vegan"],
  [/\bv\b/gi,     "vegetarian"],
  [/\bbb?q\b/gi,  "barbecue"],
  [/\btbsp?\b/gi, "tablespoon"],
  [/\btsp\b/gi,   "teaspoon"],
  [/\boz\b/gi,    "ounce"],
  [/\blb\b/gi,    "pound"],
];

function expandAbbreviations(text: string): string {
  let result = text;
  for (const [re, replacement] of ABBREVIATIONS) {
    result = result.replace(re, replacement);
  }
  return result;
}

// ─── Noise patterns to strip ──────────────────────────────────────────────────

/** Price: $12, $12.99, 12.99, (12.99) */
const PRICE_RE = /\(?\$?\d+\.\d{2}\)?|\$\d+/g;
/** Calorie counts: 420 cal, 420 kcal, (420) */
const CALORIE_RE = /\d+\s*(cal|kcal|calories?)\b/gi;
/** Bullet/list markers */
const BULLET_RE = /^[\s•·▪▸▶‣◦\-*]+/gm;
/** Trailing asterisks, footnote markers */
const FOOTNOTE_RE = /[*†‡§¶#]+\s*$/gm;
/** Excess whitespace */
const WHITESPACE_RE = /\s{2,}/g;

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Build the normalizedText field for a menu item.
 *
 * @param raw  The raw item text (name + optional description combined)
 * @returns    Cleaned, lowercased, analysis-ready string
 */
export function normalizeMenuItemText(raw: string): string {
  let text = raw;

  // 1. Decode HTML entities
  text = decodeEntities(text);

  // 2. Strip prices and calorie counts (noise for allergen analysis)
  text = text.replace(PRICE_RE, " ");
  text = text.replace(CALORIE_RE, " ");

  // 3. Strip bullet markers and footnotes
  text = text.replace(BULLET_RE, "");
  text = text.replace(FOOTNOTE_RE, "");

  // 4. Expand abbreviations (before lowercasing so regex flags work right)
  text = expandAbbreviations(text);

  // 5. Normalize unicode punctuation to ASCII
  text = text
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[–—]/g, "-");

  // 6. Collapse whitespace
  text = text.replace(WHITESPACE_RE, " ").trim();

  // 7. Lowercase for analysis
  text = text.toLowerCase();

  return text;
}

/**
 * Lightweight normalization for section names (capitalized, no noise).
 */
export function normalizeSectionName(raw: string): string {
  return raw
    .replace(BULLET_RE, "")
    .replace(/:\s*$/, "")           // strip trailing colon
    .replace(WHITESPACE_RE, " ")
    .trim()
    // Title-case: uppercase each word
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
