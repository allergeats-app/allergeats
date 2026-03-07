import { NextResponse } from "next/server";

const BASE = "https://trackapi.nutritionix.com/v2";

export type NutritionixFood = {
  food_name: string;
  brand_name?: string;
  nf_ingredient_statement?: string | null;
  nf_contains_milk?: number | null;
  nf_contains_eggs?: number | null;
  nf_contains_fish?: number | null;
  nf_contains_shellfish?: number | null;
  nf_contains_tree_nuts?: number | null;
  nf_contains_peanuts?: number | null;
  nf_contains_wheat?: number | null;
  nf_contains_soybeans?: number | null;
  nf_contains_sesame?: number | null;
  nf_contains_gluten?: number | null;
  // Injected by this route to preserve original item metadata
  _id: string;
  _category?: string;
};

type RequestBody = {
  brand: string;
  items: Array<{ id: string; name: string; category?: string }>;
};

/**
 * POST /api/nutritionix
 * Fetches real ingredient + allergen data from Nutritionix for a list of
 * named menu items belonging to a specific restaurant brand.
 *
 * Body: { brand: string, items: [{id, name, category}] }
 * Returns: { foods: NutritionixFood[] }
 */
export async function POST(req: Request) {
  const appId  = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json({ error: "Nutritionix credentials not configured" }, { status: 503 });
  }

  const body: RequestBody = await req.json();
  const { brand, items } = body;

  if (!brand || !items?.length) {
    return NextResponse.json({ error: "brand and items are required" }, { status: 400 });
  }

  const headers = {
    "x-app-id": appId,
    "x-app-key": appKey,
    "Content-Type": "application/json",
  };

  const BATCH = 20;
  const allFoods: NutritionixFood[] = [];

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);

    try {
      const res = await fetch(`${BASE}/nutrients`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          foods: batch.map((item) => ({
            food_name: item.name,
            brand_name: brand,
          })),
        }),
      });

      if (!res.ok) {
        // Nutritionix 404s when it can't find an item — skip the batch
        continue;
      }

      const data = await res.json();
      const foods: NutritionixFood[] = data.foods ?? [];

      foods.forEach((food, j) => {
        allFoods.push({
          ...food,
          _id: batch[j]?.id ?? `nix-${i + j}`,
          _category: batch[j]?.category,
        });
      });
    } catch {
      // Network error on this batch — skip, caller falls back to mock data
    }
  }

  return NextResponse.json({ foods: allFoods });
}
