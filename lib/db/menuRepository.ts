/**
 * lib/db/menuRepository.ts
 *
 * Server-side repository functions for the menu ingestion persistence layer.
 *
 * All functions use the service-role Supabase client (lib/supabase.ts).
 * Never import this in client components — these are server-only utilities.
 *
 * Error handling: functions throw on unexpected DB errors. Callers (typically
 * API routes or server actions) should catch and return appropriate responses.
 */

import { supabase } from "@/lib/supabase";
import type {
  DbRestaurant,
  DbRestaurantInsert,
  DbMenuSource,
  DbMenuSourceInsert,
  DbMenuVersion,
  DbMenuVersionInsert,
  DbMenuSection,
  DbMenuSectionInsert,
  DbMenuItem,
  DbMenuItemInsert,
  ActiveMenuResult,
} from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function throwOnError<T>(
  result: { data: T | null; error: { message: string } | null },
  context: string,
): T {
  if (result.error) throw new Error(`[menuRepository:${context}] ${result.error.message}`);
  if (result.data === null) throw new Error(`[menuRepository:${context}] returned null`);
  return result.data;
}

// ─── restaurants ──────────────────────────────────────────────────────────────

/**
 * Insert or update a restaurant record.
 * Safe to call multiple times — upserts on the primary key.
 */
export async function upsertRestaurant(data: DbRestaurantInsert): Promise<DbRestaurant> {
  const result = await supabase
    .from("restaurants")
    .upsert(data, { onConflict: "id" })
    .select()
    .single();
  return throwOnError(result, "upsertRestaurant");
}

/**
 * Look up a restaurant by id.
 * Returns null if not found.
 */
export async function getRestaurant(id: string): Promise<DbRestaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select()
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`[menuRepository:getRestaurant] ${error.message}`);
  return data;
}

// ─── menu_sources ─────────────────────────────────────────────────────────────

/**
 * Create a new menu source record.
 * Call this once per ingestion attempt, before creating the version.
 */
export async function createMenuSource(
  data: DbMenuSourceInsert,
): Promise<DbMenuSource> {
  const result = await supabase
    .from("menu_sources")
    .insert(data)
    .select()
    .single();
  return throwOnError(result, "createMenuSource");
}

/**
 * Check if a raw source with this exact content hash was already imported
 * for this restaurant. Used to skip redundant full re-imports.
 *
 * Returns the existing source if found, null otherwise.
 */
export async function detectExistingImportByHash(
  restaurantId: string,
  hash: string,
): Promise<DbMenuSource | null> {
  const { data, error } = await supabase
    .from("menu_sources")
    .select()
    .eq("restaurant_id", restaurantId)
    .eq("raw_snapshot_hash", hash)
    .order("imported_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[menuRepository:detectExistingImportByHash] ${error.message}`);
  return data;
}

/**
 * Update the last_seen_at timestamp on an existing source record.
 * Call when a repeated import produces the same content hash.
 */
export async function touchMenuSource(sourceId: string): Promise<void> {
  const { error } = await supabase
    .from("menu_sources")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", sourceId);
  if (error) throw new Error(`[menuRepository:touchMenuSource] ${error.message}`);
}

// ─── menu_versions ────────────────────────────────────────────────────────────

/**
 * Get the next available version number for a restaurant.
 * Returns 1 for the first version.
 */
export async function nextVersionNumber(restaurantId: string): Promise<number> {
  const { data, error } = await supabase
    .from("menu_versions")
    .select("version_number")
    .eq("restaurant_id", restaurantId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[menuRepository:nextVersionNumber] ${error.message}`);
  return data ? data.version_number + 1 : 1;
}

/**
 * Create a new menu version record.
 * Does NOT automatically set it as active — call setActiveMenuVersion separately.
 */
export async function createMenuVersion(
  data: DbMenuVersionInsert,
): Promise<DbMenuVersion> {
  const result = await supabase
    .from("menu_versions")
    .insert(data)
    .select()
    .single();
  return throwOnError(result, "createMenuVersion");
}

/**
 * Check whether any existing version for this restaurant already has
 * this checksum (i.e. normalized content hasn't changed).
 */
export async function detectExistingVersionByChecksum(
  restaurantId: string,
  checksum: string,
): Promise<DbMenuVersion | null> {
  const { data, error } = await supabase
    .from("menu_versions")
    .select()
    .eq("restaurant_id", restaurantId)
    .eq("checksum", checksum)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`[menuRepository:detectExistingVersionByChecksum] ${error.message}`);
  return data;
}

/**
 * Mark a specific version as active and deactivate all others for that restaurant.
 * Runs as two sequential updates (deactivate old, activate new).
 *
 * The unique partial index on (restaurant_id) WHERE is_active = true
 * enforces that only one version can be active at a time.
 */
export async function setActiveMenuVersion(
  restaurantId: string,
  versionId: string,
): Promise<void> {
  // Step 1: deactivate all current versions for this restaurant
  const { error: deactivateError } = await supabase
    .from("menu_versions")
    .update({ is_active: false })
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true);
  if (deactivateError) {
    throw new Error(`[menuRepository:setActiveMenuVersion:deactivate] ${deactivateError.message}`);
  }

  // Step 2: activate the new version
  const { error: activateError } = await supabase
    .from("menu_versions")
    .update({ is_active: true })
    .eq("id", versionId);
  if (activateError) {
    throw new Error(`[menuRepository:setActiveMenuVersion:activate] ${activateError.message}`);
  }
}

/**
 * All menu versions for a restaurant, newest first.
 */
export async function getMenuVersionsForRestaurant(
  restaurantId: string,
): Promise<DbMenuVersion[]> {
  const { data, error } = await supabase
    .from("menu_versions")
    .select()
    .eq("restaurant_id", restaurantId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(`[menuRepository:getMenuVersionsForRestaurant] ${error.message}`);
  return data ?? [];
}

// ─── menu_sections ────────────────────────────────────────────────────────────

/**
 * Insert all sections for a menu version in one batch.
 * Returns the inserted sections (with their generated IDs).
 */
export async function createMenuSections(
  sections: DbMenuSectionInsert[],
): Promise<DbMenuSection[]> {
  if (sections.length === 0) return [];
  const result = await supabase
    .from("menu_sections")
    .insert(sections)
    .select();
  return throwOnError(result, "createMenuSections");
}

// ─── menu_items ───────────────────────────────────────────────────────────────

/**
 * Insert all items for a menu version in batches of 500.
 * (Supabase has a default payload limit; batching keeps requests manageable.)
 */
export async function createMenuItems(items: DbMenuItemInsert[]): Promise<void> {
  if (items.length === 0) return;
  const BATCH = 500;
  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH);
    const { error } = await supabase.from("menu_items").insert(batch);
    if (error) throw new Error(`[menuRepository:createMenuItems] ${error.message}`);
  }
}

// ─── Retrieval ────────────────────────────────────────────────────────────────

/**
 * Retrieve the full active menu for a restaurant, including sections and items.
 * Returns null if no active version exists.
 */
export async function getActiveMenuForRestaurant(
  restaurantId: string,
): Promise<ActiveMenuResult | null> {
  // Fetch the active version
  const { data: version, error: vErr } = await supabase
    .from("menu_versions")
    .select()
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .maybeSingle();
  if (vErr) throw new Error(`[menuRepository:getActiveMenuForRestaurant:version] ${vErr.message}`);
  if (!version) return null;

  // Fetch the source (optional)
  let source: DbMenuSource | null = null;
  if (version.menu_source_id) {
    const { data, error } = await supabase
      .from("menu_sources")
      .select()
      .eq("id", version.menu_source_id)
      .maybeSingle();
    if (error) throw new Error(`[menuRepository:getActiveMenuForRestaurant:source] ${error.message}`);
    source = data;
  }

  // Fetch sections
  const { data: sections, error: sErr } = await supabase
    .from("menu_sections")
    .select()
    .eq("menu_version_id", version.id)
    .order("sort_order");
  if (sErr) throw new Error(`[menuRepository:getActiveMenuForRestaurant:sections] ${sErr.message}`);

  // Fetch all items for this version
  const { data: items, error: iErr } = await supabase
    .from("menu_items")
    .select()
    .eq("menu_version_id", version.id)
    .order("sort_order");
  if (iErr) throw new Error(`[menuRepository:getActiveMenuForRestaurant:items] ${iErr.message}`);

  // Group items under their sections
  const itemsBySection = new Map<string, DbMenuItem[]>();
  for (const item of items ?? []) {
    const key = item.menu_section_id ?? "__none__";
    if (!itemsBySection.has(key)) itemsBySection.set(key, []);
    itemsBySection.get(key)!.push(item as DbMenuItem);
  }

  const sectionsWithItems = (sections ?? []).map((s) => ({
    ...(s as DbMenuSection),
    items: itemsBySection.get(s.id) ?? [],
  }));

  return { version: version as DbMenuVersion, source, sections: sectionsWithItems };
}
