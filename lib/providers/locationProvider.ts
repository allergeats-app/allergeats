/**
 * Location provider interface + mock implementation.
 *
 * Extension point: swap MockLocationProvider for a real implementation
 * backed by Google Places API, Foursquare, or Yelp Fusion.
 *
 * TODO (live integration):
 *   1. Create a GooglePlacesLocationProvider that implements LocationProvider
 *   2. Add NEXT_PUBLIC_GOOGLE_PLACES_KEY to .env.local
 *   3. Replace mockProvider in page components with the real one
 */

import type { Restaurant } from "@/lib/types";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";

export type Coordinates = {
  lat: number;
  lng: number;
};

export interface LocationProvider {
  /** Returns the user's current coordinates, or null if unavailable. */
  getUserLocation(): Promise<Coordinates | null>;

  /**
   * Returns restaurants near the given point, filtered and sorted.
   * @param lat          - latitude
   * @param lng          - longitude
   * @param radiusMiles  - search radius
   * @param query        - optional name/cuisine filter
   */
  searchRestaurants(
    lat: number,
    lng: number,
    radiusMiles: number,
    query?: string
  ): Promise<Restaurant[]>;
}

/** Haversine formula — great-circle distance in miles */
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
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
 * Mock implementation backed by MOCK_RESTAURANTS seed data.
 * Distances are calculated via Haversine from the user's location.
 * Falls back to a San Francisco center point if geolocation is unavailable.
 */
export class MockLocationProvider implements LocationProvider {
  private readonly fallbackLocation: Coordinates = { lat: 37.7749, lng: -122.4194 };

  async getUserLocation(): Promise<Coordinates | null> {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return this.fallbackLocation;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(this.fallbackLocation),
        { timeout: 5000 }
      );
    });
  }

  async searchRestaurants(
    lat: number,
    lng: number,
    radiusMiles: number,
    query?: string
  ): Promise<Restaurant[]> {
    const q = query?.toLowerCase().trim();

    let results = MOCK_RESTAURANTS.map((r) => ({
      ...r,
      // Recompute distance from actual user location
      distance:
        r.lat != null && r.lng != null
          ? Math.round(haversineDistance(lat, lng, r.lat, r.lng) * 10) / 10
          : r.distance ?? 0,
    }));

    if (q) {
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.address?.toLowerCase().includes(q)
      );
    }

    return results
      .filter((r) => (r.distance ?? 0) <= radiusMiles)
      .sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
  }
}

/** Singleton — use this in page components. Replace with a real provider when ready. */
export const locationProvider: LocationProvider = new MockLocationProvider();
