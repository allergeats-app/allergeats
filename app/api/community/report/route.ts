import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function normalizeDish(name: string): string {
  // Strip OCR description suffix ("Truffle Pasta — butter, parmesan" → "truffle pasta")
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

export async function POST(req: Request) {
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  let body: {
    dishName: string;
    restaurantName?: string;
    allergen: string;
    outcome: "safe" | "reaction" | "uncertain";
    userId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { dishName, restaurantName, allergen, outcome, userId } = body;
  if (!dishName || !allergen || !outcome) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const VALID_OUTCOMES = new Set(["safe", "reaction", "uncertain"]);
  if (!VALID_OUTCOMES.has(outcome)) {
    return NextResponse.json({ error: "Invalid outcome value" }, { status: 400 });
  }

  // Cap field lengths to prevent oversized inserts
  if (dishName.length > 200 || allergen.length > 100 || (restaurantName && restaurantName.length > 200)) {
    return NextResponse.json({ error: "Field value too long" }, { status: 400 });
  }

  const dish_normalized = normalizeDish(dishName);
  const rest_normalized = normalizeRestaurant(restaurantName);

  const { error } = await db.from("dish_reports").insert({
    dish_name:       dishName,
    dish_normalized,
    restaurant_name: restaurantName ?? null,
    rest_normalized,
    allergen,
    outcome,
    user_id:         userId ?? null,
  });

  if (error) {
    console.error("[community/report]", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
