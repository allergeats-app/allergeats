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

    // Return cached result immediately
    const cached = readPlacesCache(cacheKey);
    if (cached) {
      // Skip Overpass for dense areas — avoids parsing thousands of OSM nodes
      const overpassResults = cached.length < MIN_GOOGLE_FOR_OVERPASS
        ? await this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy).catch(() => [] as Restaurant[])
        : [];
      return this._mergeResults(lat, lng, cached, overpassResults)
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
        // Run all searches in parallel to overcome prominence-ranking bias.
        // Each keyword targets a category that fast-food chains suppress:
        //   casual dining      → Chili's, Applebee's, Outback
        //   fine dining        → upscale restaurants
        //   steakhouse         → Ruth's Chris, LongHorn, etc.
        //   winery restaurant  → Cooper's Hawk, etc.
        // "cafe" is a keyword search (not in the broad Nearby types) so coffee shops
        // appear in results without crowding out food restaurants.
        const keywords = ["casual dining", "fine dining", "steakhouse", "cafe coffee"];
        const [mainRes, ...keywordResponses] = await Promise.all([
          fetch("/api/places-nearby", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ lat, lng, radiusMeters }),
            signal:  AbortSignal.timeout(20_000),
          }),
          ...keywords.map((keyword) =>
            fetch("/api/places-nearby", {
              method:  "POST",
              headers: { "Content-Type": "application/json" },
              body:    JSON.stringify({ lat, lng, radiusMeters, keyword }),
              signal:  AbortSignal.timeout(20_000),
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

    // Full failure — go straight to Overpass
    if (googleFailed) {
      return this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy);
    }

    if (googlePlaces.length === 0) {
      return this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy);
    }

    // Only fetch Overpass when Google returns few results (small towns, rural areas).
    // Dense cities like NYC return 60-100 Google results — running Overpass on top
    // would parse thousands of OSM nodes and freeze the main thread.
    const overpassResults = googlePlaces.length < MIN_GOOGLE_FOR_OVERPASS
      ? await this._overpass.searchRestaurants(lat, lng, radiusMiles, accuracy).catch(() => [] as Restaurant[])
      : [];
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

    beginRegistryBatch();
    try {
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
    } finally {
      endRegistryBatch();
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
