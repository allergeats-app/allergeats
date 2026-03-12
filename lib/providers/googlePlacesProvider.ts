/**
 * lib/providers/googlePlacesProvider.ts
 *
 * GooglePlacesLocationProvider — wraps the /api/places-nearby route and maps
 * Google Places results into the canonical Restaurant type.
 *
 * Discovery hierarchy:
 *   1. Google Places  — tried first; returns rich, consistent data with photos
 *   2. LiveLocationProvider (Overpass/OSM) — automatic fallback when:
 *      - GOOGLE_PLACES_API_KEY is not configured (API returns { places: [] })
 *      - The API call fails (network error, 5xx)
 *      - Google returns fewer than MIN_GOOGLE_RESULTS results
 *
 * Chain template blending (same as LiveLocationProvider):
 *   When a result name matches a MOCK_RESTAURANTS entry, the canonical menu
 *   items from the mock are applied and menuIsGenericChainTemplate is set so
 *   the UI can show a "menu may vary" disclaimer.
 *
 * Usage: drop-in replacement for LiveLocationProvider. The default export in
 *   locationProvider.ts uses this class automatically.
 */

import type { Restaurant, RestaurantTag, SourceType } from "@/lib/types";
import type { LocationProvider, Coordinates }         from "./locationProvider";
import { LiveLocationProvider }                       from "./locationProvider";
import { MOCK_RESTAURANTS }                           from "@/lib/mockRestaurants";
import { upsertRestaurant }                           from "@/lib/registry";
import type { PlaceResult }                           from "@/app/api/places-nearby/route";

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * If Google returns fewer than this many results we treat it as a soft failure
 * and supplement with Overpass results. Avoids showing a nearly empty list when
 * the Places API is working but returns sparse data for the area.
 */
const MIN_GOOGLE_RESULTS = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Map Google Places type strings → RestaurantTag[] */
function tagsFromTypes(types: string[]): RestaurantTag[] {
  const tags: RestaurantTag[] = [];
  if (types.some((t) => /burger|american/.test(t)))         tags.push("burgers");
  if (types.some((t) => /mexican|taco/.test(t)))            tags.push("mexican");
  if (types.some((t) => /chicken|wings/.test(t)))           tags.push("chicken");
  if (types.some((t) => /coffee|cafe|bakery/.test(t)))      tags.push("coffee");
  if (types.some((t) => /sandwich|pizza|italian/.test(t)))  tags.push("sandwiches");
  return tags;
}

/** Format the primary cuisine label from Google types */
function cuisineFromTypes(types: string[]): string {
  const preferred = types.find((t) => t !== "restaurant" && t !== "food" && t !== "point_of_interest" && t !== "establishment");
  if (!preferred) return "Restaurant";
  return preferred
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function findMockMatch(name: string): Restaurant | undefined {
  const lower = name.toLowerCase();
  return MOCK_RESTAURANTS.find((m) => {
    const mockLower = m.name.toLowerCase();
    return lower.includes(mockLower) || mockLower.includes(lower);
  });
}

/** Strip store numbers for dedup: "McDonald's #4521" → "mcdonalds" */
function dedupKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/#\s*\d+/g, "")
    .replace(/\s+\d+$/, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export class GooglePlacesLocationProvider implements LocationProvider {
  private readonly _overpass = new LiveLocationProvider();

  async getUserLocation(): Promise<Coordinates | null> {
    return this._overpass.getUserLocation();
  }

  async searchRestaurants(
    lat: number,
    lng: number,
    radiusMiles: number,
    accuracy?: number,
  ): Promise<Restaurant[]> {
    const radiusMeters = Math.round(radiusMiles * 1609.34);

    let googlePlaces: PlaceResult[] = [];
    let googleFailed = false;

    try {
      const res = await fetch("/api/places-nearby", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ lat, lng, radiusMeters }),
        signal:  AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        const data = await res.json() as { places: PlaceResult[] };
        googlePlaces = data.places ?? [];
      } else {
        googleFailed = true;
      }
    } catch {
      googleFailed = true;
    }

    // Fall back to Overpass when Google has no key or fails
    if (googleFailed || googlePlaces.length < MIN_GOOGLE_RESULTS) {
      const overpassResults = await this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy);

      // If Google returned some results, merge them in (deduplicated)
      if (googlePlaces.length > 0) {
        return this._mergeResults(lat, lng, googlePlaces, overpassResults);
      }

      return overpassResults;
    }

    return this._mapPlaces(lat, lng, googlePlaces);
  }

  // ─── Mapping ────────────────────────────────────────────────────────────────

  private _mapPlaces(userLat: number, userLng: number, places: PlaceResult[]): Restaurant[] {
    const seen    = new Set<string>();
    const results: Restaurant[] = [];

    for (const p of places) {
      const key = dedupKey(p.name);
      if (seen.has(key)) continue;
      seen.add(key);

      const distance = Math.round(haversineDistance(userLat, userLng, p.lat, p.lng) * 10) / 10;
      const mock     = findMockMatch(p.name);

      const canonical = upsertRestaurant({
        displayName: p.name,
        address:     p.address || undefined,
        lat:         p.lat,
        lng:         p.lng,
        phone:       p.phone,
        website:     p.website,
        googlePlaceId: p.placeId,
        sourceType:  "google_places",
        confidence:  "high",
      });

      if (mock) {
        results.push({
          ...mock,
          id:       canonical.registryId,
          address:  p.address || mock.address,
          lat:      p.lat,
          lng:      p.lng,
          distance,
          menuIsGenericChainTemplate: true,
        });
      } else {
        const cuisine = cuisineFromTypes(p.types);
        results.push({
          id:         canonical.registryId,
          name:       p.name,
          cuisine,
          tags:       tagsFromTypes(p.types),
          address:    p.address,
          lat:        p.lat,
          lng:        p.lng,
          distance,
          phone:      p.phone,
          website:    p.website,
          sourceType: "scraped" as SourceType,
          menuItems:  [],
        });
      }
    }

    return results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  /**
   * Merge Google results (primary) with Overpass results (supplemental).
   * Google results take precedence — Overpass adds any restaurant not already present.
   */
  private _mergeResults(
    userLat: number,
    userLng: number,
    googlePlaces: PlaceResult[],
    overpassResults: Restaurant[],
  ): Restaurant[] {
    const googleMapped = this._mapPlaces(userLat, userLng, googlePlaces);
    const seen = new Set(googleMapped.map((r) => dedupKey(r.name)));

    for (const r of overpassResults) {
      if (!seen.has(dedupKey(r.name))) {
        googleMapped.push(r);
        seen.add(dedupKey(r.name));
      }
    }

    return googleMapped.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }
}
