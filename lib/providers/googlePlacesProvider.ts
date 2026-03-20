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

/** Client-side sessionStorage cache TTL — 30 min reduces Google Places API spend. */
const PLACES_CACHE_TTL_MS = 30 * 60 * 1000;

// ─── Client-side sessionStorage cache ────────────────────────────────────────
// Mirrors the Overpass cache pattern to avoid redundant API calls when the user
// moves only slightly or re-mounts the page within the same session.

function placesCacheKey(lat: number, lng: number, radiusMiles: number): string {
  // v2: invalidates caches written when type=restaurant was in use
  return `gpf2_${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusMiles}`;
}

function readPlacesCache(key: string): PlaceResult[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, results } = JSON.parse(raw) as { ts: number; results: PlaceResult[] };
    if (Date.now() - ts > PLACES_CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return results;
  } catch { return null; }
}

function writePlacesCache(key: string, results: PlaceResult[]): void {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), results })); }
  catch { /* ignore quota errors */ }
}

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
    const radiusMeters  = Math.round(radiusMiles * 1609.34);
    const cacheKey     = placesCacheKey(lat, lng, radiusMiles);

    let googlePlaces: PlaceResult[] = [];
    let googleFailed = false;

    const cached = readPlacesCache(cacheKey);
    if (cached) {
      googlePlaces = cached;
    } else {
      try {
        // Run all searches in parallel to overcome prominence-ranking bias.
        // Each keyword targets a category that fast-food chains suppress:
        //   casual dining      → Chili's, Applebee's, Outback
        //   fine dining        → upscale restaurants
        //   steakhouse         → Ruth's Chris, LongHorn, etc.
        //   winery restaurant  → Cooper's Hawk, etc.
        const keywords = ["casual dining", "fine dining", "steakhouse", "winery restaurant"];
        const [mainRes, ...keywordResponses] = await Promise.all([
          fetch("/api/places-nearby", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ lat, lng, radiusMeters }),
            signal:  AbortSignal.timeout(35_000),
          }),
          ...keywords.map((keyword) =>
            fetch("/api/places-nearby", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ lat, lng, radiusMeters, keyword }),
              signal:  AbortSignal.timeout(35_000),
            })
          ),
        ]);

        if (mainRes.ok) {
          const data = await mainRes.json() as { places: PlaceResult[] };
          googlePlaces = data.places ?? [];
        } else {
          googleFailed = true;
        }

        // Merge all keyword results by placeId — non-fatal if any fail
        const seen = new Set(googlePlaces.map((p) => p.placeId));
        for (const supplementalRes of keywordResponses) {
          if (supplementalRes.ok) {
            const supplementalData = await supplementalRes.json() as { places: PlaceResult[] };
            for (const p of supplementalData.places ?? []) {
              if (!seen.has(p.placeId)) {
                googlePlaces.push(p);
                seen.add(p.placeId);
              }
            }
          }
        }

        if (googlePlaces.length > 0) writePlacesCache(cacheKey, googlePlaces);
      } catch {
        googleFailed = true;
      }
    }

    // Full failure — go straight to Overpass
    if (googleFailed) {
      return this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy);
    }

    // Always merge Google + Overpass.
    // Google over-represents chain branches (10 nearby Subways all pass the
    // threshold but show zero diversity). Overpass fills in independent
    // restaurants and provides the variety users actually want.
    // _mergeResults deduplicates by name, so chains present in both sources
    // appear only once with Google's richer data taking precedence.
    if (googlePlaces.length === 0) {
      return this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy);
    }

    const overpassResults = await this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy).catch(() => [] as Restaurant[]);
    const merged = this._mergeResults(lat, lng, googlePlaces, overpassResults);
    // Hard-filter: drop anything outside the search radius (guards against a
    // bad IP-geolocated user position returning distant restaurants).
    return merged.filter((r) => r.distance == null || r.distance <= radiusMiles * 1.2);
  }

  // ─── Mapping ────────────────────────────────────────────────────────────────

  private _mapPlaces(userLat: number, userLng: number, places: PlaceResult[]): Restaurant[] {
    // Dedup by placeId — each Google place_id is a distinct physical location.
    // Name-based dedup was wrong: 10 nearby Subway locations all share a name
    // but are different restaurants and must each appear as a card.
    const seen    = new Set<string>();
    const results: Restaurant[] = [];

    for (const p of places) {
      if (seen.has(p.placeId)) continue;
      seen.add(p.placeId);

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
          id:            canonical.registryId,
          address:       p.address || mock.address,
          lat:           p.lat,
          lng:           p.lng,
          distance,
          googlePlaceId: p.placeId,
          menuIsGenericChainTemplate: true,
        });
      } else {
        const cuisine = cuisineFromTypes(p.types);
        results.push({
          id:            canonical.registryId,
          name:          p.name,
          cuisine,
          tags:          tagsFromTypes(p.types),
          address:       p.address,
          lat:           p.lat,
          lng:           p.lng,
          distance,
          phone:         p.phone,
          website:       p.website,
          googlePlaceId: p.placeId,
          sourceType:    "scraped" as SourceType,
          menuItems:     [],
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
