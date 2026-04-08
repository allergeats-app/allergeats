/**
 * POST /api/places-nearby
 *
 * Server-side proxy for the Google Places API (New Places API v1).
 * The API key stays server-side — the client never sees it.
 *
 * Strategy:
 *   - No keyword: Nearby Search with broad restaurant types (up to 20 results)
 *   - With keyword: Text Search scoped to the circle (up to 20 results)
 *   Client calls this 5× in parallel (1 broad + 4 keyword) and deduplicates.
 *
 * Request body: { lat: number; lng: number; radiusMeters: number; keyword?: string }
 * Response:     { places: PlaceResult[] }
 *
 * Returns 200 with { places: [] } when the key is not configured.
 * Returns 502 only on genuine upstream failures.
 */

import { isRateLimited, getClientIp } from "@/lib/rateLimit";

export type PlaceResult = {
  placeId:   string;
  name:      string;
  lat:       number;
  lng:       number;
  /** Formatted address */
  address:   string;
  /** Google place type strings */
  types:     string[];
  phone?:    string;
  website?:  string;
  /**
   * New Places API photo resource name, e.g. "places/{id}/photos/{ref}".
   * Pass to /api/places-photo to retrieve the image.
   */
  photoRef?: string;
};

// ─── New Places API v1 response shapes ────────────────────────────────────────

type V1Place = {
  id:                   string;
  displayName?:         { text: string };
  location?:            { latitude: number; longitude: number };
  formattedAddress?:    string;
  types?:               string[];
  nationalPhoneNumber?: string;
  websiteUri?:          string;
  photos?:              { name: string }[];
};

type V1Response = { places?: V1Place[] };

// ─── Constants ────────────────────────────────────────────────────────────────

const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const TEXT_URL   = "https://places.googleapis.com/v1/places:searchText";

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.location",
  "places.formattedAddress",
  "places.types",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.photos",
].join(",");

const FETCH_TIMEOUT_MS = 15_000;

// ─── Rate limiting ────────────────────────────────────────────────────────────
const WINDOW_MS              = 60_000;
const MAX_REQUESTS_PER_WINDOW = 30; // 30 calls/min per IP (5 searches × ~6/min)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapPlace(p: V1Place): PlaceResult | null {
  if (!p.id || !p.displayName?.text || !p.location) return null;
  return {
    placeId:  p.id,
    name:     p.displayName.text,
    lat:      p.location.latitude,
    lng:      p.location.longitude,
    address:  p.formattedAddress ?? "",
    types:    p.types ?? [],
    phone:    p.nationalPhoneNumber,
    website:  p.websiteUri,
    photoRef: p.photos?.[0]?.name,
  };
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  if (await isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQUESTS_PER_WINDOW)) {
    return new Response("Too many requests", { status: 429 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return Response.json({ places: [] });

  let lat: number, lng: number, radiusMeters: number, keyword: string | undefined;
  try {
    ({ lat, lng, radiusMeters, keyword } = await req.json() as {
      lat: number; lng: number; radiusMeters: number; keyword?: string;
    });
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  if (
    typeof lat !== "number"          || lat < -90    || lat > 90    ||
    typeof lng !== "number"          || lng < -180   || lng > 180   ||
    typeof radiusMeters !== "number" || radiusMeters < 1 || radiusMeters > 50_000
  ) {
    return new Response("Invalid coordinates or radius", { status: 400 });
  }
  if (keyword && (typeof keyword !== "string" || keyword.length > 100)) {
    return new Response("Invalid keyword", { status: 400 });
  }

  const apiHeaders = {
    "Content-Type":     "application/json",
    "X-Goog-Api-Key":   key,
    "X-Goog-FieldMask": FIELD_MASK,
  };

  const radius = Math.min(Math.round(radiusMeters), 50_000);

  try {
    let url: string;
    let body: object;

    if (keyword) {
      // Text Search — keyword finds the best category match *within* the area.
      // locationRestriction (hard cap) keeps results inside the radius.
      // Default RELEVANCE ranking returns the best/most-reviewed match, not just
      // the closest chain — DISTANCE here caused Chipotle to dominate NYC.
      url  = TEXT_URL;
      body = {
        textQuery: keyword,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        maxResultCount: 20,
        languageCode:   "en",
      };
    } else {
      // Nearby Search — broad restaurant discovery.
      // DISTANCE ranking: return the 20 *closest* places, not the 20 most globally
      // prominent. Without this, NYC returns mostly Starbucks (very high review counts).
      // "cafe" excluded here — coffee shops are fetched via keyword search instead,
      // so they don't crowd out food restaurants in the broad pass.
      url  = NEARBY_URL;
      body = {
        includedPrimaryTypes: [
          "restaurant",
          "fast_food_restaurant",
          "bar",
          "meal_takeaway",
        ],
        rankPreference: "DISTANCE",
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        maxResultCount: 20,
        languageCode:   "en",
      };
    }

    const res = await fetch(url, {
      method:  "POST",
      headers: apiHeaders,
      body:    JSON.stringify(body),
      cache:   "no-store",
      signal:  AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[places-nearby] API error", res.status, text.slice(0, 200));
      return new Response("Places API error", { status: 502 });
    }

    const data    = await res.json() as V1Response;
    const places  = (data.places ?? [])
      .map(mapPlace)
      .filter((p): p is PlaceResult => p !== null);

    return Response.json({ places });
  } catch (err) {
    console.error("[places-nearby]", err);
    return new Response("Internal error", { status: 500 });
  }
}
