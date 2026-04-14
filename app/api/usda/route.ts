/**
 * app/api/usda/route.ts
 *
 * Server-side proxy for USDA FoodData Central API.
 * Looks up branded food items by name to get official ingredient lists
 * and allergen statements — useful for cross-checking chain restaurant data.
 *
 * Free tier: 1,000 requests/hour with API key, 30/min without.
 * Env var: FDC_API_KEY (optional — works without, just rate-limited)
 *   → Get one free at: https://fdc.nal.usda.gov/api-guide.html
 *
 * Returns allergen statements extracted from ingredient text.
 */

import { NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const BASE    = "https://api.nal.usda.gov/fdc/v1";
const WINDOW  = 60_000;
const MAX_REQ = 15;

// Server-side cache: avoids re-hitting USDA for the same dish+brand within a warm instance.
// Keys: "normalizedQuery::normalizedBrand" → detected allergen IDs
const _usdaCache = new Map<string, string[]>();
function cacheKey(query: string, brand?: string) {
  return `${query.toLowerCase().trim()}::${(brand ?? "").toLowerCase().trim()}`;
}

// FDA major allergens we extract from ingredient text
const ALLERGEN_PATTERNS: Array<{ id: string; patterns: RegExp[] }> = [
  { id: "dairy",     patterns: [/\b(milk|dairy|cream|cheese|butter|lactose|whey|casein)\b/i] },
  { id: "egg",       patterns: [/\b(egg|eggs)\b/i] },
  { id: "peanut",    patterns: [/\b(peanut|peanuts|groundnut)\b/i] },
  { id: "tree-nuts", patterns: [/\b(almond|cashew|walnut|pecan|pistachio|hazelnut|macadamia|brazil\s?nut|pine\s?nut|tree\s?nut)\b/i] },
  { id: "wheat",     patterns: [/\b(wheat|flour|gluten|semolina|spelt|farro|kamut|triticale)\b/i] },
  { id: "soy",       patterns: [/\b(soy|soya|soybean|tofu|edamame|miso|tempeh)\b/i] },
  { id: "fish",      patterns: [/\b(fish|salmon|tuna|cod|tilapia|halibut|flounder|anchov)\b/i] },
  { id: "shellfish", patterns: [/\b(shellfish|shrimp|crab|lobster|clam|oyster|scallop|mussel|prawn)\b/i] },
  { id: "sesame",    patterns: [/\b(sesame|tahini)\b/i] },
  { id: "corn",      patterns: [/\b(corn|maize|cornstarch|corn\s?syrup|dextrose)\b/i] },
];

function detectAllergens(text: string): string[] {
  const found = new Set<string>();
  for (const { id, patterns } of ALLERGEN_PATTERNS) {
    if (patterns.some((p) => p.test(text))) found.add(id);
  }
  return [...found];
}

type RequestBody = {
  query:     string;
  brandName?: string;
};

type FdcFood = {
  fdcId:           number;
  description:     string;
  brandName?:      string;
  brandOwner?:     string;
  ingredients?:    string;
  foodNutrients?:  unknown[];
};

export async function POST(req: Request) {
  if (await isRateLimited(getClientIp(req), WINDOW, MAX_REQ)) {
    return NextResponse.json({ results: [] }, { status: 429 });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  const { query, brandName } = body;
  if (!query || typeof query !== "string" || query.length > 200) {
    return NextResponse.json({ results: [] }, { status: 400 });
  }

  // Return cached result if available — avoids burning DEMO_KEY quota for repeated lookups
  const key = cacheKey(query, brandName);
  if (_usdaCache.has(key)) {
    return NextResponse.json({ results: [{ allergens: _usdaCache.get(key)! }] });
  }

  const apiKey = process.env.FDC_API_KEY ?? "DEMO_KEY"; // DEMO_KEY = 30 req/min, no signup
  const searchQuery = brandName ? `${brandName} ${query}` : query;

  const params = new URLSearchParams({
    query:    searchQuery,
    dataType: "Branded",
    pageSize: "5",
    api_key:  apiKey,
  });

  try {
    const res = await fetch(`${BASE}/foods/search?${params}`, {
      headers: { Accept: "application/json" },
      signal:  AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json() as { foods?: FdcFood[] };
    const foods = data.foods ?? [];

    const results = foods.map((food) => {
      const ingredients = food.ingredients ?? "";
      const allergens   = detectAllergens(ingredients);

      return {
        fdcId:       food.fdcId,
        name:        food.description,
        brand:       food.brandName ?? food.brandOwner ?? "",
        ingredients: ingredients.slice(0, 500),
        allergens,
      };
    });

    // Cache the first result's allergens for this query
    if (results.length > 0) {
      _usdaCache.set(key, results[0].allergens);
    }

    return NextResponse.json({ results });
  } catch (err) {
    console.error("[usda] fetch error:", err);
    return NextResponse.json({ results: [] });
  }
}