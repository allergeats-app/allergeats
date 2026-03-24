/**
 * POST /api/restaurants/cache
 *
 * Upserts a minimal restaurant record so that generateMetadata can produce
 * per-restaurant <title> and Open Graph tags for Google Places restaurants
 * (which only exist in the client's localStorage otherwise).
 *
 * Called fire-and-forget from RestaurantDetailClient on first view.
 * Non-fatal: metadata falls back to generic template if the row is missing.
 */

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// 60 upserts per minute per IP — one per restaurant view, generous headroom
const WINDOW_MS = 60_000;
const MAX_REQ   = 60;

export type RestaurantCacheInput = {
  id:       string;
  name:     string;
  cuisine?: string;
  address?: string;
  lat?:     number;
  lng?:     number;
};

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: RestaurantCacheInput;
  try {
    body = await req.json() as RestaurantCacheInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, name, cuisine, address, lat, lng } = body;

  if (!id || typeof id !== "string" || id.length > 200) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  if (!name || typeof name !== "string" || name.length > 300) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const { error } = await supabase
    .from("restaurant_cache")
    .upsert(
      { id, name, cuisine: cuisine ?? null, address: address ?? null, lat: lat ?? null, lng: lng ?? null, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) {
    console.error("[restaurants/cache] upsert error:", error.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
