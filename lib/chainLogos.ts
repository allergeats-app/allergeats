/**
 * Known chains that have Wikipedia articles with good thumbnail images.
 * Used to route requests to /api/wiki-thumb for reliable branded imagery.
 */
const KNOWN_CHAINS = new Set([
  "mcdonald's", "chipotle mexican grill", "subway", "chick-fil-a",
  "taco bell", "burger king", "wendy's", "domino's", "domino's pizza",
  "kfc", "panera bread", "panera", "pizza hut", "starbucks",
  "dunkin'", "dunkin", "popeyes", "five guys", "in-n-out burger",
  "in-n-out", "shake shack", "olive garden", "red lobster", "ihop",
  "denny's", "the cheesecake factory", "cheesecake factory",
  "buffalo wild wings", "wingstop", "panda express", "p.f. chang's",
  "raising cane's", "sonic drive-in", "sonic", "arby's", "whataburger",
  "dairy queen", "papa john's", "papa johns", "qdoba", "qdoba mexican eats",
  "tgi fridays", "red robin",
  "cracker barrel", "cracker barrel old country store",
  "jack in the box", "culver's", "noodles & company", "yard house",
  // Additional chains
  "jersey mike's", "jersey mikes",
  "jimmy john's", "jimmy johns",
  "chili's", "chili's grill & bar",
  "outback steakhouse",
  "applebee's", "applebees",
  "texas roadhouse",
  "longhorn steakhouse",
  "ruth's chris steak house", "ruths chris steak house",
  "cooper's hawk winery & restaurants", "coopers hawk winery and restaurant",
]);

/**
 * Returns a /api/wiki-thumb URL for known chains (Wikipedia photos, no API key),
 * or null for unknown restaurants.
 */
export function chainLogoUrl(name: string): string | null {
  const key = name.toLowerCase().trim();
  return KNOWN_CHAINS.has(key)
    ? `/api/wiki-thumb?name=${encodeURIComponent(name)}`
    : null;
}
