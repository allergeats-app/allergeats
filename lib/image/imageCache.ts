// lib/image/imageCache.ts
// Supabase-backed cache for restaurant image results.
// Caches positive results for 30 days, negative results for 7 days.
// Table: restaurant_images (see supabase/migrations/001_restaurant_images.sql)
//
// Degrades gracefully when SUPABASE_SERVICE_ROLE_KEY is not set — caching
// simply becomes a no-op and providers always run.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RestaurantImageInput, RestaurantImageResult, CachedImageRow } from "./types";
import { normalizeName, normalizePhone, normalizeAddress } from "./imageMatcher";
import crypto from "crypto";

const TTL_POSITIVE_DAYS = 30;
const TTL_NEGATIVE_DAYS = 7;

/** Lazily create the server Supabase client — returns null if not configured */
function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Derive a stable cache key from the restaurant's identifying info.
 * Normalized so that minor formatting differences don't create cache misses.
 */
export function buildCacheKey(input: RestaurantImageInput): string {
  const parts: string[] = [normalizeName(input.name)];
  if (input.address) parts.push(normalizeAddress(input.address));
  if (input.city)    parts.push(input.city.toLowerCase().trim());
  if (input.state)   parts.push(input.state.toLowerCase().trim());
  if (input.phone)   parts.push(normalizePhone(input.phone));
  return crypto.createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
}

/** Read a cached result. Returns null if not found, expired, or cache not configured. */
export async function getCachedImage(
  input: RestaurantImageInput
): Promise<RestaurantImageResult | null> {
  const db = getSupabase();
  if (!db) return null;

  const key = buildCacheKey(input);
  let data: CachedImageRow | null = null;

  try {
    const { data: row, error } = await db
      .from("restaurant_images")
      .select("*")
      .eq("cache_key", key)
      .single();
    if (error || !row) return null;
    data = row as CachedImageRow;
  } catch {
    return null;
  }

  if (new Date(data.expires_at) < new Date()) {
    // Expired — evict and let caller re-fetch
    db.from("restaurant_images").delete().eq("cache_key", key).then(() => {});
    return null;
  }

  return {
    imageUrl:       data.image_url,
    thumbnailUrl:   data.thumbnail_url,
    source:         data.source,
    sourcePageUrl:  data.source_page_url,
    attribution:    data.attribution,
    confidence:     data.confidence,
    matchedName:    data.matched_name,
    matchedAddress: data.matched_address,
    width:          data.width,
    height:         data.height,
    cached:         true,
    fetchedAt:      data.fetched_at,
  };
}

/** Write a result to the cache. No-op if cache is not configured. */
export async function setCachedImage(
  input: RestaurantImageInput,
  result: Omit<RestaurantImageResult, "cached">
): Promise<void> {
  const db = getSupabase();
  if (!db) return;

  const key = buildCacheKey(input);
  const now = new Date();
  const ttlDays = result.imageUrl ? TTL_POSITIVE_DAYS : TTL_NEGATIVE_DAYS;
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  const row: CachedImageRow = {
    cache_key:       key,
    restaurant_name: input.name,
    image_url:       result.imageUrl,
    thumbnail_url:   result.thumbnailUrl ?? null,
    source:          result.source,
    source_page_url: result.sourcePageUrl ?? null,
    attribution:     result.attribution ?? null,
    confidence:      result.confidence,
    matched_name:    result.matchedName ?? null,
    matched_address: result.matchedAddress ?? null,
    width:           result.width ?? null,
    height:          result.height ?? null,
    fetched_at:      now.toISOString(),
    expires_at:      expiresAt.toISOString(),
    is_negative:     !result.imageUrl,
  };

  try {
    await db.from("restaurant_images").upsert(row, { onConflict: "cache_key" });
  } catch (err) {
    console.warn("[imageCache] Failed to write cache:", err);
  }
}

/** Invalidate a single cached entry (forces re-fetch on next request). */
export async function invalidateCachedImage(input: RestaurantImageInput): Promise<void> {
  const db = getSupabase();
  if (!db) return;
  const key = buildCacheKey(input);
  try { await db.from("restaurant_images").delete().eq("cache_key", key); } catch { /* ignore */ }
}

/** List all expired rows — useful for backfill scripts. */
export async function listExpiredCacheKeys(): Promise<string[]> {
  const db = getSupabase();
  if (!db) return [];
  try {
    const { data } = await db
      .from("restaurant_images")
      .select("cache_key")
      .lt("expires_at", new Date().toISOString());
    return (data ?? []).map((r: { cache_key: string }) => r.cache_key);
  } catch {
    return [];
  }
}
