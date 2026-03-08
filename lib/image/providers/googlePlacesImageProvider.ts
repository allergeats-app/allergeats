// lib/image/providers/googlePlacesImageProvider.ts
// Fetches a restaurant image using the Google Places API (Legacy).
//
// Two-step process:
//   1. findplacefromtext → place_id + photo references + name/address/phone
//   2. photo reference → image URL (proxied through our /api/places-photo or direct)
//
// Env var required: GOOGLE_PLACES_API_KEY

import type { RestaurantImageInput, ProviderCandidate } from "../types";
import { scoreMatch, MATCH_THRESHOLD } from "../imageMatcher";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

/** Retry a fetch up to maxRetries times with exponential backoff */
async function fetchWithRetry(
  url: string,
  maxRetries = 2,
  baseDelayMs = 500
): Promise<Response> {
  let last: Error = new Error("unknown");
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        // Rate limited — wait longer
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt * 2));
        continue;
      }
      return res;
    } catch (err) {
      last = err as Error;
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** attempt));
      }
    }
  }
  throw last;
}

type PlaceCandidate = {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  photos?: Array<{ photo_reference: string; width: number; height: number; html_attributions: string[] }>;
};

/** Step 1: find the place by name + location */
async function findPlace(
  name: string,
  lat?: number,
  lng?: number,
  address?: string,
  apiKey?: string
): Promise<PlaceCandidate[]> {
  if (!apiKey) return [];

  // Build query: name + city/address for disambiguation
  const query = address ? `${name} ${address}` : name;
  const locationBias = lat != null && lng != null
    ? `&locationbias=circle:5000@${lat},${lng}`
    : "";

  const url =
    `${PLACES_BASE}/findplacefromtext/json` +
    `?input=${encodeURIComponent(query)}` +
    `&inputtype=textquery` +
    `&fields=place_id,name,formatted_address,photos` +
    `${locationBias}` +
    `&key=${apiKey}`;

  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.candidates ?? [];
  } catch (err) {
    console.warn("[googlePlacesImageProvider] findPlace failed:", err);
    return [];
  }
}

/** Step 2: get place details (phone, name, address) for a place_id */
async function getPlaceDetails(placeId: string, apiKey: string): Promise<PlaceCandidate | null> {
  const url =
    `${PLACES_BASE}/details/json` +
    `?place_id=${encodeURIComponent(placeId)}` +
    `&fields=name,formatted_address,formatted_phone_number,photos` +
    `&key=${apiKey}`;

  try {
    const res = await fetchWithRetry(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

/**
 * Build a direct Google Places Photo URL (not proxied).
 * Note: these URLs contain the API key and should only be used server-side.
 * For client-side display, use the /api/places-photo proxy route instead.
 */
function buildPhotoUrl(photoRef: string, maxWidth = 1200, apiKey?: string): string {
  return (
    `${PLACES_BASE}/photo` +
    `?maxwidth=${maxWidth}&photo_reference=${encodeURIComponent(photoRef)}&key=${apiKey}`
  );
}

/**
 * Build an attribution string from Google's html_attributions array.
 */
function buildAttribution(htmlAttributions: string[]): string | null {
  if (!htmlAttributions.length) return "Photo from Google Places";
  // Strip HTML from attribution strings
  return htmlAttributions
    .map((a) => a.replace(/<[^>]+>/g, ""))
    .join(", ");
}

/**
 * Provider: fetch a restaurant image from Google Places.
 * Returns null if no suitable match or no photo is found.
 */
export async function googlePlacesImageProvider(
  input: RestaurantImageInput
): Promise<ProviderCandidate | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("[googlePlacesImageProvider] GOOGLE_PLACES_API_KEY not set");
    return null;
  }

  // Step 1: Find candidate places
  const candidates = await findPlace(
    input.name,
    input.lat,
    input.lng,
    input.address,
    apiKey
  );

  if (!candidates.length) {
    console.log(`[googlePlacesImageProvider] ${input.name}: no candidates found`);
    return null;
  }

  // Step 2: For each candidate, get details and score the match
  let bestCandidate: PlaceCandidate | null = null;
  let bestScore = 0;

  for (const c of candidates.slice(0, 3)) { // check top 3 candidates
    // Fetch details to get phone number (for stronger matching)
    const details = await getPlaceDetails(c.place_id, apiKey);
    const candidate = details ?? c;

    const { score, reasons } = scoreMatch(input, {
      name:    candidate.name,
      address: candidate.formatted_address,
      phone:   candidate.formatted_phone_number,
    });

    console.log(
      `[googlePlacesImageProvider] ${input.name} ↔ "${candidate.name}": score=${score} (${reasons.join(", ")})`
    );

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  }

  if (!bestCandidate || bestScore < MATCH_THRESHOLD) {
    console.log(
      `[googlePlacesImageProvider] ${input.name}: best match score ${bestScore} below threshold ${MATCH_THRESHOLD}`
    );
    return null;
  }

  // Step 3: Get photo from best match
  const photo = bestCandidate.photos?.[0];
  if (!photo) {
    console.log(`[googlePlacesImageProvider] ${input.name}: no photo on best match`);
    return null;
  }

  const imageUrl = buildPhotoUrl(photo.photo_reference, 1200, apiKey);
  const thumbnailUrl = buildPhotoUrl(photo.photo_reference, 400, apiKey);
  const attribution = buildAttribution(photo.html_attributions ?? []);

  // Confidence based on match quality
  const confidence =
    bestScore >= 70 ? "high" :
    bestScore >= 45 ? "medium" :
    "low";

  console.log(
    `[googlePlacesImageProvider] ${input.name}: selected "${bestCandidate.name}" ` +
    `(score=${bestScore}, confidence=${confidence})`
  );

  return {
    imageUrl,
    thumbnailUrl,
    source:        "google_places",
    sourcePageUrl: `https://maps.google.com/?cid=${bestCandidate.place_id}`,
    attribution,
    confidence,
    matchedName:    bestCandidate.name,
    matchedAddress: bestCandidate.formatted_address,
    width:          photo.width ?? null,
    height:         photo.height ?? null,
    score:          bestScore,
  };
}
