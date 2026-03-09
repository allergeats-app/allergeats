import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeDish(name: string): string {
  return name.split("—")[0].split("|")[0]
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeRestaurant(name: string | undefined): string | null {
  if (!name) return null;
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export type CommunityScore = {
  dishNormalized: string;
  allergen: string;
  total: number;
  safeCount: number;
  reactionCount: number;
  uncertainCount: number;
};

/**
 * POST /api/community/scores
 * Body: { dishes: string[], allergens: string[], restaurantName?: string }
 * Returns community scores for each (dish, allergen) pair.
 */
export async function POST(req: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ scores: [] });

  let body: { dishes: string[]; allergens: string[]; restaurantName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dishes, allergens, restaurantName } = body;
  if (!dishes?.length || !allergens?.length) {
    return NextResponse.json({ scores: [] });
  }

  const dishNorms = [...new Set(dishes.map(normalizeDish))];
  const restNorm = normalizeRestaurant(restaurantName);

  // Query all reports matching these dishes + allergens
  let query = db
    .from("dish_reports")
    .select("dish_normalized, rest_normalized, allergen, outcome")
    .in("dish_normalized", dishNorms)
    .in("allergen", allergens);

  // Prefer restaurant-scoped results, but fall back to global
  if (restNorm) {
    query = query.or(`rest_normalized.eq.${restNorm},rest_normalized.is.null`);
  }

  const { data, error } = await query;
  if (error || !data) return NextResponse.json({ scores: [] });

  // Aggregate in JS — simple and avoids a view dependency
  const map = new Map<string, CommunityScore>();
  for (const row of data as { dish_normalized: string; rest_normalized: string | null; allergen: string; outcome: string }[]) {
    const key = `${row.dish_normalized}::${row.allergen}`;
    let score = map.get(key);
    if (!score) {
      score = { dishNormalized: row.dish_normalized, allergen: row.allergen, total: 0, safeCount: 0, reactionCount: 0, uncertainCount: 0 };
      map.set(key, score);
    }
    score.total++;
    if (row.outcome === "safe") score.safeCount++;
    else if (row.outcome === "reaction") score.reactionCount++;
    else score.uncertainCount++;
  }

  return NextResponse.json({ scores: Array.from(map.values()) });
}
