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

import type { Restaurant, SourceType } from "@/lib/types";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";

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

// ─── Geolocation (shared) ─────────────────────────────────────────────────────

const FALLBACK: Coordinates = { lat: 37.7749, lng: -122.4194 };

function getRealLocation(): Promise<Coordinates | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(FALLBACK);
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(FALLBACK),
      { timeout: 8000, enableHighAccuracy: false }
    );
  });
}

// ─── Live provider (Overpass API) ─────────────────────────────────────────────

export class LiveLocationProvider implements LocationProvider {
  async getUserLocation(): Promise<Coordinates | null> {
    return getRealLocation();
  }

  async searchRestaurants(lat: number, lng: number, radiusMiles: number): Promise<Restaurant[]> {
    const radiusMeters = Math.round(radiusMiles * 1609.34);

    const query = `[out:json][timeout:20];
(
  node["amenity"="restaurant"](around:${radiusMeters},${lat},${lng});
  node["amenity"="fast_food"](around:${radiusMeters},${lat},${lng});
  node["amenity"="cafe"](around:${radiusMeters},${lat},${lng});
);
out body 40;`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: query,
    });

    if (!res.ok) throw new Error("Overpass request failed");

    const data = await res.json();
    const elements: OverpassElement[] = data.elements ?? [];

    const seen = new Set<string>();
    const results: Restaurant[] = [];

    for (const el of elements) {
      const name = el.tags?.name;
      if (!name) continue;

      const elLat = el.lat;
      const elLng = el.lng ?? el.lon ?? 0;
      const distance = Math.round(haversineDistance(lat, lng, elLat, elLng) * 10) / 10;

      // De-duplicate by name (keep nearest)
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());

      const mock = findMockMatch(name);

      if (mock) {
        // Use our full menu data for known chains
        results.push({
          ...mock,
          id: `live-${el.id}`,
          address: buildAddress(el.tags) || mock.address,
          lat: elLat,
          lng: elLng,
          distance,
        });
      } else {
        // Unknown restaurant — show location, no menu data
        results.push({
          id: `osm-${el.id}`,
          name,
          cuisine: formatCuisine(el.tags.cuisine),
          address: buildAddress(el.tags),
          lat: elLat,
          lng: elLng,
          distance,
          sourceType: "scraped" as SourceType,
          menuItems: [],
        });
      }
    }

    return results.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
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
