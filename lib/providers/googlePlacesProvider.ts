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
import { getMockRestaurants, loadMockRestaurants }     from "@/lib/mockRestaurantsLazy";
import { upsertRestaurant, beginRegistryBatch, endRegistryBatch } from "@/lib/registry";
import type { PlaceResult }                           from "@/app/api/places-nearby/route";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Client-side sessionStorage cache TTL — 30 min reduces Google Places API spend. */
const PLACES_CACHE_TTL_MS = 30 * 60 * 1000;

/**
 * Minimum Google results before skipping the Overpass supplemental fetch.
 * Dense cities (NYC, Chicago, LA) return 60-100 Google results — no need to
 * also hit Overpass and parse potentially thousands of OSM nodes.
 */
const MIN_GOOGLE_FOR_OVERPASS = 15;

/** Max locations of any single chain shown per search — prevents Starbucks/McDonald's
 *  from filling all slots in dense cities regardless of proximity ranking. */
const MAX_PER_CHAIN = 4;

// ─── Client-side sessionStorage cache ────────────────────────────────────────
// Mirrors the Overpass cache pattern to avoid redundant API calls when the user
// moves only slightly or re-mounts the page within the same session.

function placesCacheKey(lat: number, lng: number, radiusMiles: number): string {
  // v3: toFixed(2) buckets at ~1.1km — absorbs GPS jitter without sacrificing freshness.
  // v2→v3 prefix bump intentionally invalidates old caches.
  return `gpf3_${lat.toFixed(2)}_${lng.toFixed(2)}_${radiusMiles}`;
}

function readPlacesCache(key: string): PlaceResult[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw) as { ts?: number; results?: PlaceResult[] };
    if (!obj.ts || !Array.isArray(obj.results)) return null;
    if (Date.now() - obj.ts > PLACES_CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return obj.results;
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

/**
 * Map Google Places API v1 type strings → RestaurantTag[].
 * v1 uses snake_case types like "steakhouse", "seafood_restaurant",
 * "italian_restaurant", "fast_food_restaurant", etc.
 */
function tagsFromTypes(types: string[]): RestaurantTag[] {
  const tags = new Set<RestaurantTag>();
  for (const t of types) {
    if (/burger|hamburger|american_restaurant/.test(t))                       tags.add("burgers");
    if (/mexican|taco/.test(t))                                               tags.add("mexican");
    if (/chicken|wing|fried_chicken/.test(t))                                 tags.add("chicken");
    if (/coffee|cafe|bakery|tea_house/.test(t))                               tags.add("coffee");
    if (/sandwich|sub_sandwich/.test(t))                                      tags.add("sandwiches");
    if (/pizza/.test(t))                                                      tags.add("pizza");
    if (/italian/.test(t))                                                    tags.add("italian");
    if (/seafood|fish_and_chips/.test(t))                                     tags.add("seafood");
    if (/steak/.test(t))                                                      tags.add("steakhouse");
    if (/chinese|japanese|thai|vietnamese|korean|sushi|ramen|asian/.test(t))  tags.add("asian");
    if (/breakfast|brunch/.test(t))                                           tags.add("breakfast");
    if (/sports_bar/.test(t))                                                 tags.add("sports-bar");
    if (/fine_dining|upscale/.test(t))                                        tags.add("fine-dining");
    if (/bar|pub|grill|casual_dining/.test(t))                                tags.add("casual");
  }
  return [...tags];
}

/**
 * Format the primary cuisine label from Google Places v1 types.
 * Strips "_restaurant" suffix so "fast_food_restaurant" → "Fast Food".
 */
function cuisineFromTypes(types: string[]): string {
  const SKIP = new Set([
    "restaurant", "food", "food_and_drink",
    "point_of_interest", "establishment",
    "meal_takeaway", "meal_delivery",
  ]);
  const preferred = types.find((t) => !SKIP.has(t));
  if (!preferred) return "Restaurant";
  return preferred
    .replace(/_restaurant$/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Pre-fetch mock data when the provider module loads so findMockMatch
// has it ready by the time the first Places results arrive.
loadMockRestaurants();

function findMockMatch(name: string): Restaurant | undefined {
  const lower = name.toLowerCase();
  return getMockRestaurants().find((m) => {
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

// ─── In-flight dedup ─────────────────────────────────────────────────────────
// Same pattern as LiveLocationProvider — prevents duplicate parallel requests
// when the component remounts or the effect fires twice in dev StrictMode.
const inFlight = new Map<string, Promise<Restaurant[]>>();

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
    const cacheKey = placesCacheKey(lat, lng, radiusMiles);

    // Return cached result immediately — do NOT await Overpass on a cache hit.
    // The previous pattern blocked for up to 20s on Overpass even with fresh cache.
    const cached = readPlacesCache(cacheKey);
    if (cached) {
      return this._mergeResults(lat, lng, cached, [])
        .filter((r) => r.distance == null || r.distance <= radiusMiles * 1.2);
    }

    // Dedup concurrent requests for the same cache key
    const existing = inFlight.get(cacheKey);
    if (existing) return existing;

    const promise = this._fetchAndMerge(lat, lng, radiusMiles, accuracy, cacheKey);
    inFlight.set(cacheKey, promise);
    promise.then(() => inFlight.delete(cacheKey), () => inFlight.delete(cacheKey));
    return promise;
  }

  private async _fetchAndMerge(
    lat: number,
    lng: number,
    radiusMiles: number,
    accuracy: number | undefined,
    cacheKey: string,
  ): Promise<Restaurant[]> {
    const radiusMeters = Math.round(radiusMiles * 1609.34);

    let googlePlaces: PlaceResult[] = [];
    let googleFailed = false;

    try {
        // Await the main search first. Keyword supplemental searches only fire when
        // the main result is sparse (< MIN_GOOGLE_FOR_OVERPASS) — this avoids 4
        // excess API calls in dense cities where the main result already has plenty.
        const mainResponse = await fetch("/api/places-nearby", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ lat, lng, radiusMeters }),
          signal:  AbortSignal.timeout(20_000),
        }).catch(() => null);

        if (mainResponse?.ok) {
          const data = await mainResponse.json() as { places: PlaceResult[] };
          googlePlaces = data.places ?? [];
        } else {
          googleFailed = true;
        }

        // Only fire keyword searches when the main result is sparse (rural / small towns).
        // Each keyword targets a category that fast-food chains suppress:
        //   casual dining → Chili's, Applebee's, Outback
        //   fine dining   → upscale restaurants
        //   steakhouse    → Ruth's Chris, LongHorn, etc.
        //   cafe coffee   → coffee shops not in broad Nearby types
        if (!googleFailed && googlePlaces.length < MIN_GOOGLE_FOR_OVERPASS) {
          const keywords = ["casual dining", "fine dining", "steakhouse", "cafe coffee", "local restaurant", "pizza restaurant"];
          // Expand search radius for keyword passes — sparse results mean the city
          // is small, so cast wider (capped at 25 km) to surface nearby restaurants.
          const keywordRadius = Math.min(Math.round(radiusMeters * 1.5), 25_000);
          const keywordResults = await Promise.allSettled(
            keywords.map((keyword) =>
              fetch("/api/places-nearby", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ lat, lng, radiusMeters: keywordRadius, keyword }),
                signal:  AbortSignal.timeout(8_000),
              })
            )
          );
          const seen = new Set(googlePlaces.map((p) => p.placeId));
          for (const result of keywordResults) {
            if (result.status === "fulfilled" && result.value.ok) {
              const supplementalData = await result.value.json() as { places: PlaceResult[] };
              for (const p of supplementalData.places ?? []) {
                if (!seen.has(p.placeId)) {
                  googlePlaces.push(p);
                  seen.add(p.placeId);
                }
              }
            }
          }
        }

        if (googlePlaces.length > 0) writePlacesCache(cacheKey, googlePlaces);
    } catch {
      googleFailed = true;
    }

    // Full failure or empty — fall back to Overpass, gracefully degrade to [] if that also fails
    if (googleFailed || googlePlaces.length === 0) {
      return this._overpass
        .searchRestaurants(lat, lng, radiusMiles, accuracy)
        .catch(() => [] as Restaurant[]);
    }

    // Only fetch supplemental sources when Google returns few results (rural areas, small towns).
    const needsSupplemental = googlePlaces.length < MIN_GOOGLE_FOR_OVERPASS;

    const overpassResults = needsSupplemental
      ? await this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy).catch(() => [] as Restaurant[])
      : [];

    const merged = this._mergeResults(lat, lng, googlePlaces, overpassResults);
    // Hard-filter: drop anything outside the search radius (guards against a
    // bad IP-geolocated user position returning distant restaurants).
    return merged.filter((r) => r.distance == null || r.distance <= radiusMiles * 1.2);
  }

  // ─── Mapping ────────────────────────────────────────────────────────────────

  private _mapPlaces(userLat: number, userLng: number, places: PlaceResult[]): Restaurant[] {
    const seen       = new Set<string>();
    const chainCount = new Map<string, number>(); // chain name → slot count
    const results: Restaurant[] = [];

    beginRegistryBatch();
    try {
      for (const p of places) {
        if (seen.has(p.placeId)) continue;

        // Cap any single chain at MAX_PER_CHAIN results so dense cities (NYC, Chicago)
        // don't end up showing 20 Starbucks / 15 McDonald's with no variety.
        const chain = dedupKey(p.name);
        const count = chainCount.get(chain) ?? 0;
        if (count >= MAX_PER_CHAIN) continue;
        chainCount.set(chain, count + 1);

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
    } finally {
      endRegistryBatch();
    }

    return results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

  /**
   * Merge Google results (primary) with Overpass results (supplemental).
   * Google results take precedence — Overpass adds any restaurant not already present.
   *
   * Dedup key is (chain-name, ~1.1km grid cell) so different locations of the same
   * chain (e.g. two McDonald's) are treated as distinct, while the exact same location
   * seen in both sources is correctly deduplicated.
   */
  private _mergeResults(
    userLat: number,
    userLng: number,
    googlePlaces: PlaceResult[],
    overpassResults: Restaurant[],
  ): Restaurant[] {
    const googleMapped = this._mapPlaces(userLat, userLng, googlePlaces);

    // Build seen set keyed by (normalised chain name, ~1.1km location bucket).
    // toFixed(2) ≈ 1.1km resolution — close enough to catch same-location dupes
    // while still allowing two different McDonald's across town to both appear.
    const seen = new Set(
      googleMapped.map((r) => {
        const locKey = r.lat != null && r.lng != null
          ? `${r.lat.toFixed(2)}_${r.lng.toFixed(2)}`
          : "no-coords";
        return `${dedupKey(r.name)}::${locKey}`;
      })
    );

    for (const r of overpassResults) {
      const locKey = r.lat != null && r.lng != null
        ? `${r.lat.toFixed(2)}_${r.lng.toFixed(2)}`
        : "no-coords";
      const key = `${dedupKey(r.name)}::${locKey}`;
      if (!seen.has(key)) {
        googleMapped.push(r);
        seen.add(key);
      }
    }

    return googleMapped.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }

}
