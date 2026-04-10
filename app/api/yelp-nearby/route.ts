/**
 * app/api/yelp-nearby/route.ts
 *
 * Server-side proxy for Yelp Fusion Business Search API.
 * Hides YELP_API_KEY from the client and provides a rate-limited endpoint.
 *
 * Free tier: 500 API calls/day, 5 QPS.
 * Env var required: YELP_API_KEY
 *   → Get one free at: https://docs.developer.yelp.com/docs/fusion-intro
 *
 * Returns restaurants matching the food/restaurant category near coordinates.
 */

import { NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const BASE = "https://api.yelp.com/v3";
const WINDOW_MS = 60_000;
const MAX_REQ   = 20; // conservative — Yelp free tier is 500/day, 5 QPS

export type YelpBusiness = {
  id:         string;
  name:       string;
  alias:      string;
  rating:     number;
  review_count: number;
  phone:      string;
  categories: Array<{ alias: string; title: string }>;
  coordinates: { latitude: number; longitude: number };
  location: {
    address1:    string;
    city:        string;
    state:       string;
    zip_code:    string;
    display_address: string[];
  };
  distance:   number;  // metres from search point
  url:        string;
  image_url:  string;
  is_closed:  boolean;
};

type RequestBody = {
  lat:         number;
  lng:         number;
  radiusMiles: number;
};

export async function POST(req: Request) {
  if (await isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ businesses: [] }, { status: 429 });
  }

  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    // Return empty rather than 503 — caller treats missing Yelp as "no extra results"
    return NextResponse.json({ businesses: [] });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ businesses: [] }, { status: 400 });
  }

  const { lat, lng, radiusMiles } = body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return NextResponse.json({ businesses: [] }, { status: 400 });
  }

  // Yelp radius is in metres, max 40000m
  const radiusMetres = Math.min(Math.round(radiusMiles * 1609.34), 40_000);

  const params = new URLSearchParams({
    latitude:   String(lat),
    longitude:  String(lng),
    radius:     String(radiusMetres),
    categories: "restaurants,food",
    limit:      "50",
    sort_by:    "distance",
  });

  try {
    const res = await fetch(`${BASE}/businesses/search?${params}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error("[yelp-nearby] API error:", res.status);
      return NextResponse.json({ businesses: [] });
    }

    const data = await res.json() as { businesses?: YelpBusiness[] };
    const businesses = (data.businesses ?? []).filter((b) => !b.is_closed);

    return NextResponse.json({ businesses });
  } catch (err) {
    console.error("[yelp-nearby] fetch error:", err);
    return NextResponse.json({ businesses: [] });
  }
}