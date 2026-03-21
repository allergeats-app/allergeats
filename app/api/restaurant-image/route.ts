// app/api/restaurant-image/route.ts
// Server-side endpoint for restaurant image enrichment.
//
// POST /api/restaurant-image
// Body: RestaurantImageInput
// Returns: RestaurantImageResult
//
// GET /api/restaurant-image?name=...&address=...&city=...&state=...&lat=...&lng=...
// Convenience GET variant for quick lookups.

import { NextResponse } from "next/server";
import { getRestaurantImage } from "@/lib/image/restaurantImageService";
import type { RestaurantImageInput } from "@/lib/image/types";

export async function POST(req: Request) {
  try {
    const body = await req.json() as RestaurantImageInput;
    if (!body?.name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }

    const forceRefresh = req.headers.get("x-force-refresh") === "1";
    const result = await getRestaurantImage(body, { skipCache: forceRefresh });

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": result.source === "placeholder"
          ? "no-store"
          : "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/restaurant-image] POST error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const input: RestaurantImageInput = {
    name:    searchParams.get("name")    ?? "",
    address: searchParams.get("address") ?? undefined,
    city:    searchParams.get("city")    ?? undefined,
    state:   searchParams.get("state")   ?? undefined,
    zip:     searchParams.get("zip")     ?? undefined,
    phone:   searchParams.get("phone")   ?? undefined,
    website: searchParams.get("website") ?? undefined,
    lat:     searchParams.get("lat")     ? parseFloat(searchParams.get("lat")!) : undefined,
    lng:     searchParams.get("lng")     ? parseFloat(searchParams.get("lng")!) : undefined,
  };

  if (!input.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  if (
    (input.lat !== undefined && (isNaN(input.lat) || input.lat < -90  || input.lat > 90))  ||
    (input.lng !== undefined && (isNaN(input.lng) || input.lng < -180 || input.lng > 180))
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const result = await getRestaurantImage(input);
    return NextResponse.json(result, {
      headers: {
        "Cache-Control": result.source === "placeholder"
          ? "no-store"
          : "public, max-age=3600, stale-while-revalidate=86400",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
