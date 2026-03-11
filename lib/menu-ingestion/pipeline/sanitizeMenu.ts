/**
 * lib/menu-ingestion/pipeline/sanitizeMenu.ts
 *
 * Validation and sanitization stage — runs immediately after adapter.ingest()
 * and before any normalization, dedup, or confidence scoring.
 *
 * Guarantees the rest of the pipeline receives a structurally valid NormalizedMenu:
 *   - required string fields are present and trimmed
 *   - every item has a non-empty name and a stable itemId
 *   - empty sections (zero valid items) are removed
 *   - required menu-level fields fall back to safe defaults
 *
 * Sanitization is non-throwing: bad data is fixed or dropped, never propagated.
 * A `SanitizationReport` is returned alongside the clean menu so callers can
 * log or surface the number of items/sections that were dropped.
 */

import type { NormalizedMenu, NormalizedMenuSection, NormalizedMenuItem } from "../types";

// ─── Report ───────────────────────────────────────────────────────────────────

export type SanitizationReport = {
  /** Items dropped because their name was empty after trimming. */
  droppedItems: number;
  /** Items that had a missing/empty itemId and were assigned a fallback. */
  repairedIds: number;
  /** Sections dropped because they had zero valid items after item sanitization. */
  droppedSections: number;
  /** True when any menu-level required field was missing and got a default value. */
  repairedMenuFields: boolean;
};

// ─── ID fallback ──────────────────────────────────────────────────────────────

let _fallbackCounter = 0;

function fallbackId(itemName: string): string {
  const slug = itemName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 24);
  return `sanitized-${slug}-${++_fallbackCounter}`;
}

// ─── Item sanitization ────────────────────────────────────────────────────────

type ItemResult = { item: NormalizedMenuItem | null; repairedId: boolean };

function sanitizeItem(raw: NormalizedMenuItem): ItemResult {
  // Drop items with an empty name — they carry no useful signal
  const name = raw.itemName?.trim() ?? "";
  if (!name) return { item: null, repairedId: false };

  let repairedId = false;
  let itemId = raw.itemId?.trim() ?? "";
  if (!itemId) {
    itemId = fallbackId(name);
    repairedId = true;
  }

  const item: NormalizedMenuItem = {
    ...raw,
    itemId,
    itemName:         name,
    description:      raw.description?.trim()     || undefined,
    price:            raw.price?.trim()            || undefined,
    rawText:          raw.rawText?.trim()          || name,
    normalizedText:   raw.normalizedText?.trim()   || "",
    sourceSignals:    raw.sourceSignals?.map((s) => s.trim()).filter(Boolean),
  };

  return { item, repairedId };
}

// ─── Section sanitization ─────────────────────────────────────────────────────

type SectionResult = {
  section: NormalizedMenuSection | null;
  droppedItems: number;
  repairedIds: number;
};

function sanitizeSection(raw: NormalizedMenuSection): SectionResult {
  const sectionName = raw.sectionName?.trim() || "Menu";
  let droppedItems = 0;
  let repairedIds  = 0;
  const validItems: NormalizedMenuItem[] = [];

  for (const rawItem of raw.items ?? []) {
    const { item, repairedId } = sanitizeItem(rawItem);
    if (!item) {
      droppedItems++;
    } else {
      if (repairedId) repairedIds++;
      validItems.push(item);
    }
  }

  // Drop sections that are now empty
  if (validItems.length === 0) {
    return { section: null, droppedItems, repairedIds };
  }

  return {
    section: { sectionName, items: validItems },
    droppedItems,
    repairedIds,
  };
}

// ─── Menu sanitization ────────────────────────────────────────────────────────

export type SanitizeResult = {
  menu: NormalizedMenu;
  report: SanitizationReport;
};

/**
 * Sanitize a raw NormalizedMenu produced by an adapter.
 *
 * Safe to call with any adapter output — all fixes are non-throwing.
 * The returned menu is guaranteed to be structurally valid for the rest
 * of the pipeline (normalizeMenuText → dedupeMenuSections → scoreItemConfidence).
 */
export function sanitizeMenu(raw: NormalizedMenu): SanitizeResult {
  let droppedItems    = 0;
  let repairedIds     = 0;
  let droppedSections = 0;
  let repairedMenuFields = false;

  // ── Menu-level required fields ───────────────────────────────────────────
  const now = new Date().toISOString();

  let restaurantId   = raw.restaurantId?.trim()   ?? "";
  let restaurantName = raw.restaurantName?.trim()  ?? "";
  let importedAt     = raw.importedAt?.trim()      ?? "";
  let lastSeenAt     = raw.lastSeenAt?.trim()      ?? "";

  if (!restaurantId || !restaurantName || !importedAt || !lastSeenAt) {
    repairedMenuFields = true;
    restaurantId   = restaurantId   || "unknown";
    restaurantName = restaurantName || "Unknown Restaurant";
    importedAt     = importedAt     || now;
    lastSeenAt     = lastSeenAt     || now;
  }

  // ── Sections ─────────────────────────────────────────────────────────────
  const cleanSections: NormalizedMenuSection[] = [];

  for (const rawSection of raw.sections ?? []) {
    const result = sanitizeSection(rawSection);
    droppedItems += result.droppedItems;
    repairedIds  += result.repairedIds;
    if (!result.section) {
      droppedSections++;
    } else {
      cleanSections.push(result.section);
    }
  }

  const menu: NormalizedMenu = {
    ...raw,
    restaurantId,
    restaurantName,
    importedAt,
    lastSeenAt,
    sections: cleanSections,
  };

  return {
    menu,
    report: { droppedItems, repairedIds, droppedSections, repairedMenuFields },
  };
}
