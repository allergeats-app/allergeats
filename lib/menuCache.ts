/**
 * lib/menuCache.ts
 *
 * Client-side menu version cache using sessionStorage.
 *
 * Stores up to MAX_CACHED NormalizedMenu objects keyed by cache key
 * (restaurantId or URL hostname). Used when a restaurantId is not available
 * to persist to the DB, so at least the normalized menu survives a page
 * navigation within the same tab session.
 *
 * This is a best-effort cache — data is not durable and will be lost on
 * tab close. Prefer DB persistence (persistMenu) when restaurantId is known.
 */

import type { NormalizedMenu } from "@/lib/menu-ingestion";

const STORAGE_KEY = "allegeats_menu_cache";
const MAX_CACHED  = 10;

type MenuCacheEntry = {
  key:        string;
  menu:       NormalizedMenu;
  cachedAt:   string; // ISO-8601
};

type MenuCache = MenuCacheEntry[];

function readCache(): MenuCache {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as MenuCache) : [];
  } catch {
    return [];
  }
}

function writeCache(entries: MenuCache): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // sessionStorage full — clear and try again
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

/** Store a NormalizedMenu in sessionStorage, evicting oldest entries over MAX_CACHED. */
export function cacheMenu(key: string, menu: NormalizedMenu): void {
  const entries = readCache().filter((e) => e.key !== key);
  entries.push({ key, menu, cachedAt: new Date().toISOString() });
  // Keep most-recent MAX_CACHED entries
  if (entries.length > MAX_CACHED) entries.splice(0, entries.length - MAX_CACHED);
  writeCache(entries);
}

/** Retrieve a cached NormalizedMenu by key, or null if not found. */
export function getCachedMenu(key: string): NormalizedMenu | null {
  const entry = readCache().find((e) => e.key === key);
  return entry?.menu ?? null;
}

/** Remove a specific entry from the cache. */
export function evictCachedMenu(key: string): void {
  writeCache(readCache().filter((e) => e.key !== key));
}

/** Clear the entire menu cache. */
export function clearMenuCache(): void {
  if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
}
