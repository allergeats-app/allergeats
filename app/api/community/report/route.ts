import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// 30 reports per minute per IP
const REPORT_WINDOW_MS = 60_000;
const REPORT_MAX_REQ   = 30;

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
  if (isRateLimited(getClientIp(req), REPORT_WINDOW_MS, REPORT_MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

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

  const VALID_ALLERGENS = new Set([
    "dairy", "egg", "soy", "wheat", "gluten", "fish", "shellfish",
    "nuts", "peanut", "tree-nut", "sesame", "corn", "mustard", "legumes", "oats",
  ]);
  if (!VALID_ALLERGENS.has(allergen)) {
    return NextResponse.json({ error: "Invalid allergen value" }, { status: 400 });
  }

  // Cap field lengths to prevent oversized inserts
  if (dishName.length > 200 || allergen.length > 100 || (restaurantName && restaurantName.length > 200)) {
    return NextResponse.json({ error: "Field value too long" }, { status: 400 });
  }

  const dish_normalized = normalizeDish(dishName);
  const rest_normalized = normalizeRestaurant(restaurantName);

  const { error: insertError } = await Promise.race([
    db.from("dish_reports").insert({
      dish_name:       dishName,
      dish_normalized,
      restaurant_name: restaurantName ?? null,
      rest_normalized,
      allergen,
      outcome,
      user_id:         userId ?? null,
    }),
    new Promise<{ error: { message: string } }>((_, reject) =>
      setTimeout(() => reject(new Error("DB timeout")), 5000)
    ),
  ]).catch((err) => ({ error: { message: err instanceof Error ? err.message : "timeout" } }));

  if (insertError) {
    console.error("[community/report]", insertError);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
