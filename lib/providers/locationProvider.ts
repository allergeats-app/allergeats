/**
 * Location provider interface + implementations.
 *
 * LiveLocationProvider (default):
 *   - Gets real GPS via browser Geolocation API (accuracy + timestamp captured)
 *   - Falls back to last-known location (localStorage, 20min TTL) when GPS fails
 *   - Queries Overpass / OpenStreetMap for nearby restaurant discovery
 *   - Auto-expands search radius when accuracy is coarse (> 500m)
 *   - Blends live OSM results with MOCK_RESTAURANTS chain templates when a chain
 *     is matched — results tagged menuIsGenericChainTemplate=true for UI disclosure
 *
 * MockLocationProvider (fallback if Overpass fails):
 *   - Same GPS logic, but only returns MOCK_RESTAURANTS
 *
 * ── Discovery source hierarchy (aspirational) ───────────────────────────────
 * Overpass/OSM is the current live source. It is useful for bootstrapping but
 * has variable data quality and inconsistent chain coverage. The intended
 * production stack is:
 *
 *   1. Google Places API  — highest quality, consistent chain coverage, photos
 *   2. Yelp Fusion API    — strong community data, reviews, open hours
 *   3. Own canonical DB   — deduped cross-source registry (lib/registry/)
 *   4. Overpass/OSM       — supplemental, especially for independent restaurants
 *
 * When Google Places or Yelp is wired, implement them as additional LocationProvider
 * implementations and merge/dedup via upsertRestaurant() in the canonical registry.
 * Required env vars: GOOGLE_PLACES_API_KEY, YELP_API_KEY.
 *
 * ── Exported helpers ────────────────────────────────────────────────────────
 *   checkLocationPermission() → "granted" | "denied" | "prompt" | "unsupported"
 *   locationAccuracyLabel(accuracy) → "Approximate location" | "Nearby" | null
 *   isAccurate(accuracy) → boolean (≤ 100m)
 */

import type { Restaurant, RestaurantTag, SourceType } from "@/lib/types";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { upsertRestaurant } from "@/lib/registry";

export type Coordinates = {
  lat: number;
  lng: number;
  /**
   * Horizontal accuracy radius in metres (from GeolocationCoordinates.accuracy).
   * < 100m  → GPS / strong Wi-Fi — results are highly reliable
   * 100–1000m → Wi-Fi / cell — reasonable for nearby search
   * > 1000m → IP-based or very poor signal — show "Approximate location" in UI
   */
  accuracy?: number;
  /** Unix timestamp (ms) when the position was recorded. */
  timestamp?: number;
  /**
   * How this position was obtained — used for UI explainability and trust decisions.
   *   "gps"     → enableHighAccuracy succeeded (most reliable)
   *   "network" → low-accuracy fallback succeeded (cell/Wi-Fi/IP)
   *   "cached"  → pulled from last-known-location store (may be up to 20min stale)
   */
  source?: "gps" | "network" | "cached";
};

export interface LocationProvider {
  getUserLocation(): Promise<Coordinates | null>;
  /**
   * @param accuracy  Optional GPS accuracy in metres. When provided, the provider
   *                  can expand the search radius for coarse locations. Callers
   *                  should pass `coords.accuracy` from the result of getUserLocation().
   */
  searchRestaurants(lat: number, lng: number, radiusMiles: number, accuracy?: number): Promise<Restaurant[]>;
}

// ─── Permissions API probe (exported for UI) ──────────────────────────────────

export type LocationPermissionState = "granted" | "denied" | "prompt" | "unsupported";

/**
 * Check the browser's current geolocation permission state without triggering a prompt.
 *
 * - "granted"     → location was already approved; call getUserLocation() immediately
 * - "denied"      → user blocked location; show "Enable location" CTA, skip the wait
 * - "prompt"      → first time; show explanation copy before requesting
 * - "unsupported" → Permissions API unavailable (older browsers / server-side)
 *
 * Note: result can change while the app is open (user can revoke in browser settings),
 * so call this each time the location flow starts rather than caching the result.
 */
export async function checkLocationPermission(): Promise<LocationPermissionState> {
  if (typeof navigator === "undefined" || !navigator.permissions) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state as LocationPermissionState;
  } catch {
    return "unsupported";
  }
}

// ─── Accuracy helpers (exported for UI) ───────────────────────────────────────

/**
 * Return a human-readable accuracy label for display in the UI.
 *
 *  > 1000m → "Approximate location"  (IP-based; results may be off)
 *  101–1000m → "Nearby"             (cell/Wi-Fi; reasonable but not precise)
 *  ≤ 100m  → null                   (GPS-quality; no label needed)
 */
export function locationAccuracyLabel(accuracy?: number): string | null {
  if (accuracy == null) return null;
  if (accuracy > 1000) return "Approximate location";
  if (accuracy > 100)  return "Nearby";
  return null;
}

/**
 * True when accuracy is good enough to trust for precise nearby results.
 * Used internally to decide whether to expand the search radius.
 */
export function isAccurate(accuracy?: number): boolean {
  return accuracy != null && accuracy <= 100;
}

// ─── Last-known-location cache (localStorage, 20min TTL) ─────────────────────

const LAST_LOCATION_KEY = "allegeats_last_location";
const LAST_LOCATION_TTL_MS = 20 * 60 * 1000;

/** Only persist positions with accuracy better than 20 km — IP-geolocated positions
 *  (accuracy 50–100 km) are too coarse to be useful as a fallback and can place the
 *  user in the wrong city/state entirely. */
const MAX_SAVE_ACCURACY_M = 20_000;

function saveLastLocation(c: Coordinates): void {
  if (typeof localStorage === "undefined") return;
  if (c.accuracy != null && c.accuracy > MAX_SAVE_ACCURACY_M) return;
  try {
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({ ...c, savedAt: Date.now() }));
  } catch { /* ignore quota errors */ }
}

function loadLastLocation(): Coordinates | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const { savedAt, ...coords } = JSON.parse(raw) as Coordinates & { savedAt: number };
    if (Date.now() - savedAt > LAST_LOCATION_TTL_MS) {
      localStorage.removeItem(LAST_LOCATION_KEY);
      return null;
    }
    return coords;
  } catch { return null; }
}

// ─── Haversine ────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  /** Present on node elements. */
  lat?: number;
  lon?: number;
  /** Present on way/relation elements when `out center` is used. */
  center?: { lat: number; lon: number };
  tags: Record<string, string>;
};

function buildAddress(tags: Record<string, string>): string {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:city"],
    tags["addr:state"],
  ].filter(Boolean);
  return parts.join(", ") || tags["addr:full"] || "";
}

/** Derive structured tags from an Overpass cuisine string (e.g. "burger;american") */
function deriveTags(cuisine: string | undefined): RestaurantTag[] {
  if (!cuisine) return [];
  const c = cuisine.toLowerCase();
  const tags: RestaurantTag[] = [];
  if (/burger|american/.test(c))                      tags.push("burgers");
  if (/mexican|tex.mex|taco/.test(c))                 tags.push("mexican");
  if (/chicken|wings/.test(c))                        tags.push("chicken");
  if (/coffee|cafe|café|bakery|donut|pastry/.test(c)) tags.push("coffee");
  if (/sandwich|sub|pizza|italian/.test(c))           tags.push("sandwiches");
  return tags;
}

function formatCuisine(raw: string | undefined): string {
  if (!raw) return "Restaurant";
  return raw
    .split(/[;,]/)
    .map((s) => s.trim().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" / ");
}

function findMockMatch(liveName: string): Restaurant | undefined {
  const lower = liveName.toLowerCase();
  return MOCK_RESTAURANTS.find((m) => {
    const mockLower = m.name.toLowerCase();
    return lower.includes(mockLower) || mockLower.includes(lower);
  });
}

// ─── Radius expansion for coarse accuracy ─────────────────────────────────────

/**
 * When the user's GPS accuracy is poor, a fixed search radius will miss restaurants
 * that are actually nearby. Expand proportionally so poor-accuracy searches still
 * return useful results, capped at 3× the requested radius.
 *
 *  accuracy ≤ 100m  → no expansion (GPS-quality)
 *  100–500m         → 1.5× (Wi-Fi / cell — v1 multiplier, may tune per urban density)
 *  > 500m           → 2.5× (IP-based / very coarse)
 *
 * Future tuning: consider actual accuracy value (e.g. 150m vs 900m within the 100–1000m
 * band), retry with larger radius when zero results are returned, or use urban/suburban
 * density signals to calibrate expansion differently by area.
 */
function effectiveRadiusMiles(requestedMiles: number, accuracy?: number): number {
  if (!accuracy || accuracy <= 100) return requestedMiles;
  if (accuracy <= 500) return requestedMiles * 1.5;
  return requestedMiles * 2.5;
}

// ─── Overpass mirrors (tried in order until one succeeds) ─────────────────────

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

async function fetchOverpass(query: string): Promise<{ elements: OverpassElement[] }> {
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: query,
        signal: AbortSignal.timeout(20000),
      });
      if (res.ok) return await res.json();
    } catch { /* try next mirror */ }
  }
  throw new Error("All Overpass endpoints failed");
}

// ─── Spatial result cache ─────────────────────────────────────────────────────
// Buckets lat/lng to ~1.1km grid so minor movement reuses cached results.
// TTL: 5 minutes. Stored in sessionStorage so it clears on tab close.

const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Cache key for Overpass results.
 * toFixed(3) buckets at ~110m (vs toFixed(2) at ~1.1km) so users
 * moving a meaningful distance get a fresh query rather than stale results.
 * The effective radius (already expanded by effectiveRadiusMiles) is part of
 * the key, so coarse-location searches naturally get a different key than
 * precise ones without needing an explicit accuracy field.
 */
function overpassCacheKey(lat: number, lng: number, radiusMiles: number): string {
  return `oa_${lat.toFixed(3)}_${lng.toFixed(3)}_${radiusMiles}`;
}

function readOverpassCache(key: string): Restaurant[] | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { ts, results } = JSON.parse(raw) as { ts: number; results: Restaurant[] };
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    return results;
  } catch { return null; }
}

function writeOverpassCache(key: string, results: Restaurant[]): void {
  try { sessionStorage.setItem(key, JSON.stringify({ ts: Date.now(), results })); }
  catch { /* ignore quota errors */ }
}

// In-flight dedup: same cache key → same promise, prevents concurrent duplicate requests
const inFlight = new Map<string, Promise<Restaurant[]>>();

// ─── Geolocation (shared) ─────────────────────────────────────────────────────

function fromPosition(pos: GeolocationPosition, source: "gps" | "network"): Coordinates {
  return {
    lat:       pos.coords.latitude,
    lng:       pos.coords.longitude,
    accuracy:  pos.coords.accuracy,
    timestamp: pos.timestamp,
    source,
  };
}

function getRealLocation(): Promise<Coordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    let resolved = false;
    function done(c: Coordinates | null) {
      if (resolved) return;
      resolved = true;
      if (c) saveLastLocation(c); // persist for next session / fallback
      resolve(c);
    }

    // Try high-accuracy (GPS) with a 10s window (6s was too short indoors)
    navigator.geolocation.getCurrentPosition(
      (pos) => done(fromPosition(pos, "gps")),
      () => {
        // High-accuracy failed — fall back to network/IP location
        navigator.geolocation.getCurrentPosition(
          (pos) => done(fromPosition(pos, "network")),
          () => {
            // Both failed — use last-known location if fresh enough
            const cached = loadLastLocation();
            done(cached ? { ...cached, source: "cached" } : null);
          },
          { timeout: 10000, enableHighAccuracy: false },
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  });
}

/** Strip store numbers and normalise for deduplication: "McDonald's #4521" → "mcdonalds" */
function dedupKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/#\s*\d+/g, "")
    .replace(/\s+\d+$/, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

// ─── Live provider (Overpass API) ─────────────────────────────────────────────

export class LiveLocationProvider implements LocationProvider {
  /** Last accuracy seen — stored so searchRestaurants can expand radius if needed. */
  private _lastAccuracy?: number;

  async getUserLocation(): Promise<Coordinates | null> {
    const loc = await getRealLocation();
    if (loc) this._lastAccuracy = loc.accuracy;
    return loc;
  }

  async searchRestaurants(lat: number, lng: number, radiusMiles: number, accuracy?: number): Promise<Restaurant[]> {
    // Explicit accuracy param takes precedence; fall back to last-seen from getUserLocation()
    const radius   = effectiveRadiusMiles(radiusMiles, accuracy ?? this._lastAccuracy);
    const cacheKey = overpassCacheKey(lat, lng, radius);

    const cached = readOverpassCache(cacheKey);
    if (cached) return cached;

    const existing = inFlight.get(cacheKey);
    if (existing) return existing;

    const promise = this._fetchFromOverpass(lat, lng, radius);
    inFlight.set(cacheKey, promise);
    // Remove from map on completion — on rejection, remove immediately so the
    // next caller retries rather than receiving a cached rejected promise.
    promise.then(
      () => inFlight.delete(cacheKey),
      () => inFlight.delete(cacheKey),
    );
    return promise;
  }

  private async _fetchFromOverpass(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]> {
    const cacheKey    = overpassCacheKey(lat, lng, radiusMiles);
    const radiusMeters = Math.round(radiusMiles * 1609.34);

    const query = `[out:json][timeout:30];
(
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
  node["amenity"="fast_food"](around:${radiusMeters},${lat},${lng});
  node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
  way["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
  way["amenity"="fast_food"](around:${radiusMeters},${lat},${lng});
  way["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
);
out body center;`;

    const data     = await fetchOverpass(query);
    const elements: OverpassElement[] = data.elements ?? [];

    const seen    = new Set<string>();
    const results: Restaurant[] = [];

    for (const el of elements) {
      const name = el.tags?.name;
      if (!name) continue;

      const elLat = el.center?.lat ?? el.lat;
      const elLng = el.center?.lon ?? el.lon ?? 0;
      if (!elLat) continue;

      const distance = Math.round(haversineDistance(lat, lng, elLat, elLng) * 10) / 10;

      const key = dedupKey(name);
      if (seen.has(key)) continue;
      seen.add(key);

      const mock    = findMockMatch(name);
      const address = buildAddress(el.tags);
      const cuisine = formatCuisine(el.tags.cuisine);
      const osmId   = `${el.type}/${el.id}`;
      const website = el.tags?.website || el.tags?.["contact:website"];
      const phone   = el.tags?.phone   || el.tags?.["contact:phone"];

      const canonical = upsertRestaurant({
        displayName: name,
        address:     address || undefined,
        lat:         elLat,
        lng:         elLng,
        phone:       phone   || undefined,
        website:     website || undefined,
        cuisine:     el.tags.cuisine,
        osmId,
        sourceType:  "osm",
        confidence:  "medium",
      });

      if (mock) {
        results.push({
          ...mock,
          id:       canonical.registryId,
          address:  address || mock.address,
          lat:      elLat,
          lng:      elLng,
          distance,
          // Flag: menu items are from a generic chain template, not this specific store.
          // The UI uses this to show a "Menu may vary by location" disclaimer.
          menuIsGenericChainTemplate: true,
        });
      } else {
        results.push({
          id:         canonical.registryId,
          name,
          cuisine,
          tags:       deriveTags(el.tags.cuisine),
          address,
          lat:        elLat,
          lng:        elLng,
          distance,
          phone:      phone   || undefined,
          website:    website || undefined,
          sourceType: "scraped" as SourceType,
          menuItems:  [],
        });
      }
    }

    const sorted = results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    writeOverpassCache(cacheKey, sorted);
    return sorted;
  }
}

// ─── Mock provider (fallback) ─────────────────────────────────────────────────

export class MockLocationProvider implements LocationProvider {
  async getUserLocation(): Promise<Coordinates | null> {
    return getRealLocation();
  }

  async searchRestaurants(lat: number, lng: number, radiusMiles: number, _accuracy?: number): Promise<Restaurant[]> {
    return MOCK_RESTAURANTS.map((r) => ({
      ...r,
      distance:
        r.lat != null && r.lng != null
          ? Math.round(haversineDistance(lat, lng, r.lat, r.lng) * 10) / 10
          : r.distance ?? 0,
    }))
      .filter((r) => (r.distance ?? 0) <= radiusMiles)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }
}

// ─── Default export ───────────────────────────────────────────────────────────
// GooglePlacesLocationProvider is the production-grade provider.
// It self-degrades to Overpass/OSM when GOOGLE_PLACES_API_KEY is not configured.

import { GooglePlacesLocationProvider } from "./googlePlacesProvider";
export const locationProvider: LocationProvider = new GooglePlacesLocationProvider();
