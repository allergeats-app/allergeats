/**
 * lib/db/hash.ts
 *
 * Lightweight hashing utilities for dedup and change detection.
 * Server-only — uses Node's built-in crypto module.
 *
 * Usage:
 *   hashText(rawSnapshot)        → raw_snapshot_hash on menu_sources
 *   hashMenuVersion(menu)        → checksum on menu_versions
 *   hashMenuItem(name, desc)     → checksum on menu_items
 */

import { createHash } from "crypto";
import type { NormalizedMenu } from "@/lib/menu-ingestion/types";

/** MD5 hex digest of any string. Fast and sufficient for dedup (not security). */
export function hashText(text: string): string {
  return createHash("md5").update(text).digest("hex");
}

/**
 * Compute a checksum for a NormalizedMenu version.
 * Based on sorted normalizedText values — order-independent so minor
 * section reordering doesn't trigger a new version.
 */
export function hashMenuVersion(menu: NormalizedMenu): string {
  const corpus = menu.sections
    .flatMap((s) => s.items.map((i) => i.normalizedText))
    .filter(Boolean)
    .sort()
    .join("\x00");
  return hashText(corpus || "empty");
}

/**
 * Compute a checksum for a single menu item.
 * Used to detect whether an item has changed across versions.
 */
export function hashMenuItem(itemName: string, description?: string | null): string {
  return hashText(`${itemName.toLowerCase()}\x00${(description ?? "").toLowerCase()}`);
}
