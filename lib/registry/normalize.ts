/**
 * lib/registry/normalize.ts
 *
 * Text normalization utilities for restaurant deduplication.
 *
 * All functions produce a canonical string form that can be compared
 * with strict equality — no fuzzy matching needed when normalization
 * is applied consistently to both stored records and incoming candidates.
 */

// ─── Name normalization ───────────────────────────────────────────────────────

/**
 * Normalize a restaurant name for deduplication.
 *
 * Strips store numbers, common suffixes, articles, punctuation, and whitespace
 * so that "McDonald's #4521", "McDonald's", and "McDonalds" all collapse to
 * the same key: "mcdonalds".
 *
 * Never use this for display — the original displayName is always preserved.
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    // Strip store/branch identifiers: "#4521", "No. 12", "(Downtown)"
    .replace(/#\s*\d+/g, "")
    .replace(/\bno\.?\s*\d+/g, "")
    .replace(/\([^)]*\)/g, "")
    // Strip trailing store numbers: "Subway 123"
    .replace(/\s+\d+$/, "")
    // Strip possessives so "McDonald's" → "mcdonalds"
    .replace(/[''`]/g, "")
    // Strip common business-type suffixes
    .replace(/\b(restaurant|cafe|café|bar|grill|kitchen|bistro|diner|eatery|lounge|house)\b/g, "")
    // Strip articles
    .replace(/\b(the|a|an)\b/g, "")
    // Strip all non-alphanumeric characters
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ─── Address normalization ────────────────────────────────────────────────────

/** Common abbreviation expansions for street type dedup. */
const STREET_ABBR: [RegExp, string][] = [
  [/\bst\.?\b/g,   "street"],
  [/\bave\.?\b/g,  "avenue"],
  [/\bblvd\.?\b/g, "boulevard"],
  [/\bdr\.?\b/g,   "drive"],
  [/\brd\.?\b/g,   "road"],
  [/\bln\.?\b/g,   "lane"],
  [/\bct\.?\b/g,   "court"],
  [/\bpl\.?\b/g,   "place"],
  [/\bhwy\.?\b/g,  "highway"],
  [/\bpkwy\.?\b/g, "parkway"],
  [/\bsq\.?\b/g,   "square"],
  [/\bste\.?\b/g,  "suite"],
  [/\bapt\.?\b/g,  "apartment"],
  [/\bn\.?\b/g,    "north"],
  [/\bs\.?\b/g,    "south"],
  [/\be\.?\b/g,    "east"],
  [/\bw\.?\b/g,    "west"],
];

/**
 * Normalize an address for deduplication.
 *
 * Expands common abbreviations, strips punctuation, and collapses whitespace.
 * "123 Main St., Suite 4" and "123 main street suite 4" produce the same key.
 */
export function normalizeAddress(address: string): string {
  let s = address.toLowerCase();
  for (const [re, replacement] of STREET_ABBR) {
    s = s.replace(re, replacement);
  }
  return s
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Phone normalization ──────────────────────────────────────────────────────

/**
 * Normalize a phone number to digits only.
 * "+1 (415) 555-1234" → "14155551234"
 * "(415) 555-1234"    → "4155551234"
 *
 * Returns undefined for strings that are too short to be a real phone number.
 */
export function normalizePhone(phone: string): string | undefined {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : undefined;
}

// ─── Domain extraction ────────────────────────────────────────────────────────

/**
 * Extract the bare domain from a URL for deduplication.
 * "https://www.chipotle.com/menu" → "chipotle.com"
 * "chipotle.com"                  → "chipotle.com"
 *
 * Returns undefined if the string cannot be parsed as a URL.
 */
export function extractDomain(url: string): string | undefined {
  try {
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    const { hostname } = new URL(normalized);
    // Strip leading "www." and any region prefix like "uk.chipotle.com"
    return hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

// ─── Name similarity ──────────────────────────────────────────────────────────

/**
 * Returns true when two normalized names are "similar enough" to be the same
 * restaurant. Used as a secondary check in geo-based dedup.
 *
 * Similarity condition: one name starts with the other, OR they share a
 * common prefix of at least 4 characters. This handles chain variants like
 * "starbucksreserve" vs "starbucks".
 */
export function namesAreSimilar(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < 3 || b.length < 3) return false;
  const shorter = a.length < b.length ? a : b;
  const longer  = a.length < b.length ? b : a;
  // One is a prefix of the other
  if (longer.startsWith(shorter)) return true;
  // Shared prefix of at least 4 chars
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return i >= 4;
}
