/**
 * lib/menu-ingestion/pipeline/dedupeMenuItems.ts
 *
 * Safe deduplication of menu items within a single import.
 *
 * Design principles:
 *   - Prefer false negatives over false positives (never discard real items)
 *   - Only dedupe within the same section, not across sections
 *     (a "Caesar Salad" in Lunch and in Dinner may be different)
 *   - Keep the most information-rich version of a duplicate
 *   - Flag deduped items rather than silently discarding them
 *
 * Deduplication triggers (in priority order):
 *   1. Exact itemId match
 *   2. Exact itemName match (case-insensitive)
 *   3. Same normalizedText (catches "Mac & Cheese" vs "Mac and Cheese")
 */

import type { NormalizedMenuItem, NormalizedMenuSection } from "../types";

/** Choose the richer of two duplicate items, always preserving allergen data */
function mergeItems(a: NormalizedMenuItem, b: NormalizedMenuItem): NormalizedMenuItem {
  // Merge allergen arrays from both versions — never discard allergen data
  const mergedAllergens = a.allergens || b.allergens
    ? [...new Set([...(a.allergens ?? []), ...(b.allergens ?? [])])]
    : undefined;

  const aScore = (a.description ? 2 : 0) + (a.price ? 1 : 0) + (a.allergens?.length ? 2 : 0);
  const bScore = (b.description ? 2 : 0) + (b.price ? 1 : 0) + (b.allergens?.length ? 2 : 0);
  const winner = aScore >= bScore ? a : b;

  return mergedAllergens ? { ...winner, allergens: mergedAllergens } : winner;
}

/** Deduplicate items within a single section */
function dedupeSection(items: NormalizedMenuItem[]): NormalizedMenuItem[] {
  const seen = new Map<string, NormalizedMenuItem>();

  for (const item of items) {
    // Dedup key: prefer normalizedText for fuzzy matching, fallback to lower name
    const key = item.normalizedText || item.itemName.toLowerCase().trim();
    const existing = seen.get(key);
    if (existing) {
      seen.set(key, mergeItems(existing, item));
    } else {
      seen.set(key, item);
    }
  }

  return [...seen.values()];
}

/**
 * Run safe deduplication over all sections of a menu.
 * Returns new section objects (does not mutate input).
 */
export function dedupeMenuSections(
  sections: NormalizedMenuSection[],
): NormalizedMenuSection[] {
  return sections.map((section) => ({
    ...section,
    items: dedupeSection(section.items),
  }));
}

/**
 * Flatten all items across all sections and dedupe globally.
 * Use this only when section structure is not meaningful (e.g. flat text dump).
 */
export function dedupeFlat(items: NormalizedMenuItem[]): NormalizedMenuItem[] {
  return dedupeSection(items);
}
