/**
 * POST /api/places-nearby
 *
 * Server-side proxy for Google Places Nearby Search (legacy API).
 * The API key stays server-side — the client never sees it.
 *
 * Fetches up to 3 pages (60 results max) by following next_page_token.
 * Google requires a ~2s pause between page requests — this is handled here
 * so the client gets all results in a single response.
 *
 * Request body: { lat: number; lng: number; radiusMeters: number }
 * Response:     { places: PlaceResult[] }
 *
 * Returns 200 with { places: [] } when the key is not configured.
 * Returns 500 only on genuine upstream failures.
 */

import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export type PlaceResult = {
  placeId:   string;
  name:      string;
  lat:       number;
  lng:       number;
  /** Formatted address (vicinity in Places API) */
  address:   string;
  /** Primary type string from Google, e.g. "restaurant", "cafe", "fast_food" */
  types:     string[];
  phone?:    string;
  website?:  string;
  /** First photo reference (pass to /api/places-photo) */
  photoRef?: string;
};

type NearbySearchResult = {
  place_id: string;
  name:     string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  types:    string[];
  photos?:  { photo_reference: string }[];
};

type NearbySearchPage = {
  status:            string;
  results:           NearbySearchResult[];
  next_page_token?:  string;
};

const BASE_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const MAX_PAGES = 3;
/** Google requires a short pause before the next_page_token becomes valid. */
const PAGE_DELAY_MS = 1500;
/** Timeout for each Google Places API fetch. */
const FETCH_TIMEOUT_MS = 40_000;

// ─── Rate limiting ────────────────────────────────────────────────────────────
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // 20 calls/min per IP (5 searches × 4 keywords)

function toPlaceResult(r: NearbySearchResult): PlaceResult {
  return {
    placeId:  r.place_id,
    name:     r.name,
    lat:      r.geometry.location.lat,
    lng:      r.geometry.location.lng,
    address:  r.vicinity,
    types:    r.types ?? [],
    photoRef: r.photos?.[0]?.photo_reference,
  };
}

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQUESTS_PER_WINDOW)) {
    return new Response("Too many requests", { status: 429 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;

  // Return empty — client falls back to Overpass
  if (!key) {
    return Response.json({ places: [] });
  }

  let lat: number, lng: number, radiusMeters: number, keyword: string | undefined;
  try {
    ({ lat, lng, radiusMeters, keyword } = await req.json() as { lat: number; lng: number; radiusMeters: number; keyword?: string });
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  // Validate coordinate + radius ranges
  if (
    typeof lat !== "number" || lat < -90   || lat > 90   ||
    typeof lng !== "number" || lng < -180  || lng > 180  ||
    typeof radiusMeters !== "number" || radiusMeters < 1 || radiusMeters > 50_000
  ) {
    return new Response("Invalid coordinates or radius", { status: 400 });
  }
  if (keyword && (typeof keyword !== "string" || keyword.length > 100)) {
    return new Response("Invalid keyword", { status: 400 });
  }

  try {
    const allPlaces: PlaceResult[] = [];

    // ── Page 1 ────────────────────────────────────────────────────────────────
    const firstUrl =
      `${BASE_URL}?location=${lat},${lng}` +
      `&radius=${Math.round(radiusMeters)}` +
      `&type=restaurant` +
      (keyword ? `&keyword=${encodeURIComponent(keyword)}` : "") +
      `&key=${key}`;

    const firstRes = await fetch(firstUrl, { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!firstRes.ok) return new Response("Places API error", { status: 502 });

    const firstPage = await firstRes.json() as NearbySearchPage;
    if (firstPage.status !== "OK" && firstPage.status !== "ZERO_RESULTS") {
      return new Response(`Places API status: ${firstPage.status}`, { status: 502 });
    }

    allPlaces.push(...(firstPage.results ?? []).map(toPlaceResult));

    // ── Pages 2–3 (follow next_page_token) ────────────────────────────────────
    let pageToken = firstPage.next_page_token;

    for (let page = 2; page <= MAX_PAGES && pageToken; page++) {
      // Google requires a short delay before the token is valid
      await new Promise((r) => setTimeout(r, PAGE_DELAY_MS));

      const pageRes = await fetch(
        `${BASE_URL}?pagetoken=${pageToken}&key=${key}`,
        { cache: "no-store", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
      );

      if (!pageRes.ok) break; // don't fail the whole request on a pagination error

      const pageData = await pageRes.json() as NearbySearchPage;
      if (pageData.status !== "OK") break;

      allPlaces.push(...(pageData.results ?? []).map(toPlaceResult));
      pageToken = pageData.next_page_token;
    }

    return Response.json({ places: allPlaces });
  } catch (err) {
    console.error("[places-nearby]", err);
    return new Response("Internal error", { status: 500 });
  }
}
