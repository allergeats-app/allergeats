/**
 * lib/db/persistMenu.ts
 *
 * Bridge between the ingestion pipeline and the persistence layer.
 *
 * Takes a NormalizedMenu (output of ingestMenu()) + restaurant metadata
 * and writes it to Supabase, handling:
 *   - Restaurant upsert
 *   - Two-level dedup (source hash → version checksum)
 *   - Section + item batch inserts
 *   - Version activation
 *
 * Two-level dedup logic:
 *   Level 1 — raw source hash:
 *     If the raw snapshot is identical to a previous import, touch
 *     last_seen_at and return skipped (no new version needed).
 *
 *   Level 2 — normalized content checksum:
 *     If the parsed content is identical to an existing version (same
 *     checksum), activate that version and return skipped.
 *     This catches cases where the raw source changed superficially
 *     (e.g. different whitespace) but the menu didn't actually change.
 *
 * Usage:
 *   import { persistMenu } from "@/lib/db/persistMenu";
 *   const result = await persistMenu(normalizedMenu, restaurantMeta);
 *
 * This function is server-only — do not import from client components.
 */

import type { NormalizedMenu } from "@/lib/menu-ingestion/types";
import type { PersistResult, DbRestaurantInsert, DbMenuItemInsert } from "./types";
import { hashText, hashMenuVersion, hashMenuItem } from "./hash";
import {
  upsertRestaurant,
  createMenuSource,
  detectExistingImportByHash,
  touchMenuSource,
  nextVersionNumber,
  createMenuVersion,
  detectExistingVersionByChecksum,
  setActiveMenuVersion,
  createMenuSections,
  createMenuItems,
} from "./menuRepository";

export type RestaurantMeta = {
  id:       string;
  name:     string;
  cuisine?: string;
  address?: string;
  lat?:     number;
  lng?:     number;
  phone?:   string;
  website?: string;
  placesId?: string;
};

/**
 * Persist a NormalizedMenu to the database.
 *
 * Returns a PersistResult indicating whether a new version was created,
 * skipped (duplicate), or an error occurred.
 */
export async function persistMenu(
  menu: NormalizedMenu,
  restaurant: RestaurantMeta,
): Promise<PersistResult> {
  try {
    // ── 1. Ensure the restaurant record exists ──────────────────────────────
    const restaurantRow: DbRestaurantInsert = {
      id:       restaurant.id,
      name:     restaurant.name,
      cuisine:  restaurant.cuisine,
      address:  restaurant.address,
      lat:      restaurant.lat,
      lng:      restaurant.lng,
      phone:    restaurant.phone,
      website:  restaurant.website,
      places_id: restaurant.placesId,
    };
    await upsertRestaurant(restaurantRow);

    // ── 2. Source-level dedup (raw snapshot hash) ───────────────────────────
    const snapshotHash = menu.rawSnapshot ? hashText(menu.rawSnapshot) : null;

    if (snapshotHash) {
      const existing = await detectExistingImportByHash(restaurant.id, snapshotHash);
      if (existing) {
        await touchMenuSource(existing.id);
        // Find the version linked to this source (if any) to return its id
        const activeVersionId = existing.id; // placeholder — see note below
        return {
          status:    "skipped",
          reason:    "duplicate_source",
          versionId: activeVersionId,
        };
      }
    }

    // ── 3. Version-level dedup (normalized content checksum) ────────────────
    const versionChecksum = hashMenuVersion(menu);
    const existingVersion = await detectExistingVersionByChecksum(
      restaurant.id,
      versionChecksum,
    );
    if (existingVersion) {
      // Re-activate this version if it's not already active
      if (!existingVersion.is_active) {
        await setActiveMenuVersion(restaurant.id, existingVersion.id);
      }
      return {
        status:    "skipped",
        reason:    "duplicate_version",
        versionId: existingVersion.id,
      };
    }

    // ── 4. Create menu source record ─────────────────────────────────────────
    const source = await createMenuSource({
      restaurant_id:      restaurant.id,
      source_type:        menu.sourceType,
      source_url:         menu.sourceUrl ?? null,
      source_label:       menu.sourceLabel ?? null,
      source_confidence:  menu.confidence,
      raw_snapshot:       menu.rawSnapshot ?? null,
      raw_snapshot_hash:  snapshotHash,
      import_status:      "success",
    });

    // ── 5. Compute item count and get next version number ────────────────────
    const totalItems   = menu.sections.reduce((n, s) => n + s.items.length, 0);
    const versionNum   = await nextVersionNumber(restaurant.id);

    // ── 6. Create menu version (not yet active) ──────────────────────────────
    const version = await createMenuVersion({
      restaurant_id:  restaurant.id,
      menu_source_id: source.id,
      version_number: versionNum,
      is_active:      false,
      checksum:       versionChecksum,
      section_count:  menu.sections.length,
      item_count:     totalItems,
    });

    // ── 7. Create sections ───────────────────────────────────────────────────
    const sectionRows = menu.sections.map((s, idx) => ({
      menu_version_id: version.id,
      section_name:    s.sectionName,
      sort_order:      idx,
    }));
    const insertedSections = await createMenuSections(sectionRows);

    // Build sectionName → DB id map for item foreign keys
    const sectionIdByName = new Map(
      insertedSections.map((s) => [s.section_name, s.id]),
    );

    // ── 8. Create items ──────────────────────────────────────────────────────
    let itemSortOrder = 0;
    const itemRows: DbMenuItemInsert[] = menu.sections.flatMap((section) =>
      section.items.map((item) => ({
        menu_version_id:   version.id,
        menu_section_id:   sectionIdByName.get(section.sectionName) ?? null,
        restaurant_id:     restaurant.id,
        external_item_id:  item.itemId ?? null,
        item_name:         item.itemName,
        description:       item.description ?? null,
        price:             item.price ?? null,
        raw_text:          item.rawText,
        normalized_text:   item.normalizedText,
        source_confidence: item.sourceConfidence,
        source_signals:    item.sourceSignals ?? null,
        checksum:          hashMenuItem(item.itemName, item.description),
        sort_order:        itemSortOrder++,
      }))
    );
    await createMenuItems(itemRows);

    // ── 9. Activate the new version ──────────────────────────────────────────
    await setActiveMenuVersion(restaurant.id, version.id);

    return {
      status:        "created",
      versionId:     version.id,
      itemCount:     totalItems,
      versionNumber: versionNum,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { status: "error", error: message };
  }
}
