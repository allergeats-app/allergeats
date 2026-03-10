/**
 * lib/menu-ingestion/adapters/base.ts
 *
 * Shared utilities for all ingestion adapters.
 *
 * Adapters extend these helpers rather than reimplementing them.
 */

import type { NormalizedMenuItem, NormalizedMenuSection, NormalizedMenu, IngestionMeta, MenuIngestionSourceType } from "../types";

let _counter = 0;

/** Generate a stable-looking item ID scoped to one adapter run. */
export function generateItemId(prefix: string): string {
  return `${prefix}-${++_counter}-${Date.now().toString(36)}`;
}

/** Reset counter (useful for testing). */
export function resetIdCounter(): void {
  _counter = 0;
}

/** Build a minimal NormalizedMenu shell to be populated by the adapter. */
export function buildMenuShell(
  sourceType: MenuIngestionSourceType,
  meta: IngestionMeta,
  rawSnapshot?: string,
): NormalizedMenu {
  const now = new Date().toISOString();
  return {
    restaurantId:   meta.restaurantId,
    restaurantName: meta.restaurantName,
    sourceType,
    sourceUrl:      meta.sourceUrl,
    sourceLabel:    meta.sourceLabel,
    importedAt:     now,
    lastSeenAt:     now,
    confidence:     "medium", // overwritten by pipeline
    sections:       [],
    rawSnapshot,
  };
}

/** Build a section with an initial empty items array. */
export function buildSection(name: string): NormalizedMenuSection {
  return { sectionName: name, items: [] };
}

/** Build a menu item from a raw text line. */
export function buildItem(
  idPrefix: string,
  itemName: string,
  opts: {
    description?: string;
    price?: string;
    rawText?: string;
  } = {},
): NormalizedMenuItem {
  const rawText = opts.rawText ?? [itemName, opts.description].filter(Boolean).join(" — ");
  return {
    itemId:           generateItemId(idPrefix),
    itemName:         itemName.trim(),
    description:      opts.description?.trim(),
    price:            opts.price?.trim(),
    rawText,
    normalizedText:   "", // filled by pipeline
    sourceConfidence: "medium", // overwritten by pipeline
    sourceSignals:    [],
  };
}

/** Price extraction regex */
export const PRICE_RE = /\$?\d+\.\d{2}|\$\d+/;

/** Extract price string from a text line if present. */
export function extractPrice(line: string): string | undefined {
  const m = line.match(PRICE_RE);
  return m ? m[0] : undefined;
}

/** Remove the price token from a line. */
export function stripPrice(line: string): string {
  return line.replace(PRICE_RE, "").replace(/\s{2,}/g, " ").trim();
}
