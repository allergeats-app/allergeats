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
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// 30 requests per minute per IP — proxies external image APIs (Google, Yelp)
const IMAGE_WINDOW_MS = 60_000;
const IMAGE_MAX_REQ   = 30;

/**
 * Returns true when the URL targets a private/internal network address.
 * websiteImageProvider fetches the URL server-side, so we must block SSRF targets
 * (loopback, RFC1918 ranges, AWS link-local metadata, etc.) the same way fetch-menu does.
 */
function isSsrfBlocked(rawUrl: string): boolean {
  let parsed: URL;
  try { parsed = new URL(rawUrl); } catch { return true; }
  if (!["http:", "https:"].includes(parsed.protocol)) return true;
  const h = parsed.hostname.toLowerCase();
  return (
    h === "localhost"                                    ||
    /^127\./.test(h)                                    ||
    /^0\.0\.0\.0/.test(h)                               ||
    /^::1$/.test(h)                                     ||
    /^169\.254\./.test(h)                               || // link-local / AWS metadata
    /^10\./.test(h)                                     || // RFC1918
    /^172\.(1[6-9]|2[0-9]|3[01])\./.test(h)            || // RFC1918
    /^192\.168\./.test(h)                               || // RFC1918
    /^fc00:/i.test(h)                                   || // IPv6 unique local
    /^fe80:/i.test(h)                                      // IPv6 link-local
  );
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req), IMAGE_WINDOW_MS, IMAGE_MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests — please wait a moment" }, { status: 429 });
  }

  try {
    const body = await req.json() as RestaurantImageInput;
    if (!body?.name || typeof body.name !== "string" || body.name.length > 300) {
      return NextResponse.json({ error: "name is required (max 300 chars)" }, { status: 400 });
    }

    // Guard against SSRF: websiteImageProvider fetches input.website server-side
    if (body.website && isSsrfBlocked(body.website)) {
      return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
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
    console.error("[/api/restaurant-image] POST error:", err);
    return NextResponse.json({ error: "Failed to fetch restaurant image" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (isRateLimited(getClientIp(req), IMAGE_WINDOW_MS, IMAGE_MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests — please wait a moment" }, { status: 429 });
  }

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

  if (!input.name || input.name.length > 300) {
    return NextResponse.json({ error: "name is required (max 300 chars)" }, { status: 400 });
  }

  if (
    (input.lat !== undefined && (isNaN(input.lat) || input.lat < -90  || input.lat > 90))  ||
    (input.lng !== undefined && (isNaN(input.lng) || input.lng < -180 || input.lng > 180))
  ) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  // Guard against SSRF: websiteImageProvider fetches input.website server-side
  if (input.website && isSsrfBlocked(input.website)) {
    return NextResponse.json({ error: "Invalid website URL" }, { status: 400 });
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
    console.error("[/api/restaurant-image] GET error:", err);
    return NextResponse.json({ error: "Failed to fetch restaurant image" }, { status: 500 });
  }
}
