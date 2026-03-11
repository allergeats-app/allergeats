/**
 * Location provider interface + implementations.
 *
 * LiveLocationProvider (default):
 *   - Gets real GPS via browser Geolocation API
 *   - Queries Overpass API (OpenStreetMap) for real nearby restaurants
 *   - Merges with MOCK_RESTAURANTS menu data when a known chain is nearby
 *
 * MockLocationProvider (fallback if Overpass fails):
 *   - Same GPS, but only returns MOCK_RESTAURANTS
 */

import type { Restaurant, RestaurantTag, SourceType } from "@/lib/types";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { upsertRestaurant } from "@/lib/registry";

export type Coordinates = { lat: number; lng: number };

export interface LocationProvider {
  getUserLocation(): Promise<Coordinates | null>;
  searchRestaurants(lat: number, lng: number, radiusMiles: number, query?: string): Promise<Restaurant[]>;
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
  id: number;
  lat: number;
  lng?: number;
  lon?: number;
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
  if (/burger|american/.test(c))                     tags.push("burgers");
  if (/mexican|tex.mex|taco/.test(c))                tags.push("mexican");
  if (/chicken|wings/.test(c))                       tags.push("chicken");
  if (/coffee|cafe|café|bakery|donut|pastry/.test(c)) tags.push("coffee");
  if (/sandwich|sub|pizza|italian/.test(c))          tags.push("sandwiches");
  return tags;
}

function formatCuisine(raw: string | undefined): string {
  if (!raw) return "Restaurant";
  // Overpass cuisine tags are lowercase_underscored, e.g. "american;burgers"
  return raw
    .split(/[;,]/)
    .map((s) => s.trim().replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(" / ");
}

/**
 * Find a MOCK_RESTAURANT whose name appears in (or contains) the live restaurant name.
 * e.g. "McDonald's #1234" → matches "McDonald's"
 */
function findMockMatch(liveName: string): Restaurant | undefined {
  const lower = liveName.toLowerCase();
  return MOCK_RESTAURANTS.find((m) => {
    const mockLower = m.name.toLowerCase();
    return lower.includes(mockLower) || mockLower.includes(lower);
  });
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

function overpassCacheKey(lat: number, lng: number, radiusMiles: number): string {
  return `oa_${lat.toFixed(2)}_${lng.toFixed(2)}_${radiusMiles}`;
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

const FALLBACK: Coordinates = { lat: 37.7749, lng: -122.4194 };

function getRealLocation(): Promise<Coordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);

  return new Promise((resolve) => {
    let resolved = false;
    function done(c: Coordinates | null) { if (!resolved) { resolved = true; resolve(c); } }

    // Try high-accuracy (GPS) with a 10s window (6s was too short indoors)
    navigator.geolocation.getCurrentPosition(
      (pos) => done({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // High-accuracy failed — fall back to network/IP location
        navigator.geolocation.getCurrentPosition(
          (pos) => done({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => done(null),
          { timeout: 10000, enableHighAccuracy: false }
        );
      },
      { timeout: 10000, enableHighAccuracy: true }
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
  async getUserLocation(): Promise<Coordinates | null> {
    return getRealLocation();
  }

  async searchRestaurants(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]> {
    const cacheKey = overpassCacheKey(lat, lng, radiusMiles);

    // Return cached results if still fresh
    const cached = readOverpassCache(cacheKey);
    if (cached) return cached;

    // Deduplicate concurrent requests for the same location+radius
    const existing = inFlight.get(cacheKey);
    if (existing) return existing;

    const promise = this._fetchFromOverpass(lat, lng, radiusMiles);
    inFlight.set(cacheKey, promise);
    promise.finally(() => inFlight.delete(cacheKey));
    return promise;
  }

  private async _fetchFromOverpass(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]> {
    const cacheKey = overpassCacheKey(lat, lng, radiusMiles);
    const radiusMeters = Math.round(radiusMiles * 1609.34);

    // Query both nodes AND ways (restaurants mapped as areas) with center coords for ways
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

    const data = await fetchOverpass(query);
    const elements: OverpassElement[] = data.elements ?? [];

    const seen = new Set<string>();
    const results: Restaurant[] = [];

    for (const el of elements) {
      const name = el.tags?.name;
      if (!name) continue;

      // Ways return lat/lng under `center`; nodes have them directly
      const elLat = (el as { center?: { lat: number; lon: number }; lat?: number }).center?.lat ?? el.lat;
      const elLng = (el as { center?: { lat: number; lon: number }; lng?: number; lon?: number }).center?.lon ?? el.lng ?? (el as { lon?: number }).lon ?? 0;
      if (!elLat) continue;

      const distance = Math.round(haversineDistance(lat, lng, elLat, elLng) * 10) / 10;

      // Deduplicate by normalised name (strips store numbers)
      const key = dedupKey(name);
      if (seen.has(key)) continue;
      seen.add(key);

      const mock = findMockMatch(name);

      const address  = buildAddress(el.tags);
      const cuisine  = formatCuisine(el.tags.cuisine);
      const osmId    = `${el.id > 0 ? "node" : "way"}/${Math.abs(el.id)}`;
      const website  = el.tags?.website || el.tags?.["contact:website"];
      const phone    = el.tags?.phone   || el.tags?.["contact:phone"];

      // Register every discovered restaurant in the canonical registry.
      // This deduplicates across sources and builds the cross-reference table.
      const canonical = upsertRestaurant({
        displayName: name,
        address:     address || undefined,
        lat:         elLat,
        lng:         elLng,
        phone:       phone  || undefined,
        website:     website || undefined,
        cuisine:     el.tags.cuisine,
        osmId,
        sourceType:  "osm",
        confidence:  "medium",
      });

      if (mock) {
        results.push({
          ...mock,
          id: canonical.registryId,
          address: address || mock.address,
          lat: elLat,
          lng: elLng,
          distance,
        });
      } else {
        results.push({
          id: canonical.registryId,
          name,
          cuisine,
          tags: deriveTags(el.tags.cuisine),
          address,
          lat: elLat,
          lng: elLng,
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

  async searchRestaurants(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]> {
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

export const locationProvider: LocationProvider = new LiveLocationProvider();
