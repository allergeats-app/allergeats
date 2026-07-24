/**
 * Lazy loader for MOCK_RESTAURANTS.
 *
 * The static mockRestaurants.ts (~258KB) is excluded from the main client
 * bundle. It loads asynchronously on first use and is cached in memory for
 * all subsequent synchronous reads.
 *
 * Usage:
 *   getMockRestaurants()       — sync, returns [] until loaded
 *   loadMockRestaurants()      — async, returns Promise<Restaurant[]>
 *   onMockRestaurantsLoaded()  — resolves after first successful load
 */

import type { Restaurant } from "@/lib/types";

let _cache: Restaurant[] | null = null;
let _promise: Promise<Restaurant[]> | null = null;

/** Synchronous read — returns [] until the async load has completed. */
export function getMockRestaurants(): Restaurant[] {
  return _cache ?? [];
}

/** Async loader — idempotent, safe to call multiple times. */
export function loadMockRestaurants(): Promise<Restaurant[]> {
  if (_cache)   return Promise.resolve(_cache);
  if (_promise) return _promise;
  _promise = import("./mockRestaurants").then(({ MOCK_RESTAURANTS }) => {
    _cache = MOCK_RESTAURANTS;
    return _cache;
  });
  return _promise;
}
