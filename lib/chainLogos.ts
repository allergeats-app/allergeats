/**
 * Maps well-known restaurant chain names to their Clearbit logo URL.
 * Clearbit returns a clean square brand logo — no API key required.
 * Used as a reliable fallback when Google Places API is unavailable.
 */
const CHAIN_DOMAINS: Record<string, string> = {
  "mcdonald's":           "mcdonalds.com",
  "chipotle":             "chipotle.com",
  "chipotle mexican grill": "chipotle.com",
  "subway":               "subway.com",
  "chick-fil-a":          "chick-fil-a.com",
  "taco bell":            "tacobell.com",
  "burger king":          "bk.com",
  "wendy's":              "wendys.com",
  "domino's":             "dominos.com",
  "domino's pizza":       "dominos.com",
  "kfc":                  "kfc.com",
  "panera bread":         "panerabread.com",
  "panera":               "panerabread.com",
  "pizza hut":            "pizzahut.com",
  "starbucks":            "starbucks.com",
  "dunkin'":              "dunkindonuts.com",
  "dunkin":               "dunkindonuts.com",
  "popeyes":              "popeyes.com",
  "five guys":            "fiveguys.com",
  "in-n-out burger":      "in-n-out.com",
  "in-n-out":             "in-n-out.com",
  "shake shack":          "shakeshack.com",
  "olive garden":         "olivegarden.com",
  "red lobster":          "redlobster.com",
  "ihop":                 "ihop.com",
  "denny's":              "dennys.com",
  "the cheesecake factory": "thecheesecakefactory.com",
  "cheesecake factory":   "thecheesecakefactory.com",
  "buffalo wild wings":   "buffalowildwings.com",
  "wingstop":             "wingstop.com",
  "panda express":        "pandaexpress.com",
  "p.f. chang's":         "pfchangs.com",
  "raising cane's":       "raisingcanes.com",
  "sonic drive-in":       "sonicdrivein.com",
  "sonic":                "sonicdrivein.com",
  "arby's":               "arbys.com",
  "whataburger":          "whataburger.com",
  "dairy queen":          "dairyqueen.com",
  "papa john's":          "papajohns.com",
  "papa johns":           "papajohns.com",
  "qdoba":                "qdoba.com",
  "qdoba mexican eats":   "qdoba.com",
  "tgi fridays":          "tgifridays.com",
  "red robin":            "redrobin.com",
  "cracker barrel":       "crackerbarrel.com",
  "jack in the box":      "jackinthebox.com",
  "culver's":             "culvers.com",
  "noodles & company":    "noodles.com",
  "yard house":           "yardhouse.com",
};

/** Returns a Clearbit logo URL for a known chain, or null for unknown restaurants. */
export function chainLogoUrl(name: string): string | null {
  const domain = CHAIN_DOMAINS[name.toLowerCase().trim()];
  return domain ? `https://logo.clearbit.com/${domain}` : null;
}
