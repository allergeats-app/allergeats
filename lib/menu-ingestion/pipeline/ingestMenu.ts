/**
 * lib/menu-ingestion/pipeline/ingestMenu.ts
 *
 * Central ingestion pipeline.
 *
 * Flow:
 *   1. Adapter.ingest()      → raw NormalizedMenu (rawText preserved, not yet normalized)
 *   2. sanitizeMenu()        → structural validation: trim strings, drop empty items/sections,
 *                              repair missing itemIds, ensure required menu fields exist
 *   3. normalizeMenuText()   → builds normalizedText on every item
 *   4. dedupeMenuSections()  → removes duplicate items within each section
 *   5. scoreItemConfidence() → annotates per-item confidence + signals
 *
 * The pipeline is adapter-agnostic: any MenuIngestionAdapter plugs in here.
 */

import type { NormalizedMenu, MenuIngestionAdapter, IngestionMeta } from "../types";
import { scoreMenuConfidence, scoreItemConfidence } from "./scoreSourceConfidence";
import { dedupeMenuSections } from "./dedupeMenuItems";
import { normalizeMenuItemText, normalizeSectionName } from "./normalizeMenuText";
import { sanitizeMenu } from "./sanitizeMenu";

/** Max raw snapshot size stored for traceability (20 000 chars ≈ 20 KB for ASCII). */
const MAX_SNAPSHOT_CHARS = 20_000;

function truncateSnapshot(raw: string): string {
  if (raw.length <= MAX_SNAPSHOT_CHARS) return raw;
  return raw.slice(0, MAX_SNAPSHOT_CHARS) + "\n… [truncated]";
}

/**
 * Run the full ingestion pipeline for a given adapter and input.
 *
 * @param adapter  The source-specific adapter to use
 * @param input    Raw source content (HTML string, pasted text, API payload, etc.)
 * @param meta     Restaurant identity and source metadata
 * @returns        Fully normalized, deduped, confidence-scored NormalizedMenu
 */
export async function ingestMenu<TInput>(
  adapter: MenuIngestionAdapter<TInput>,
  input: TInput,
  meta: IngestionMeta,
): Promise<NormalizedMenu> {
  // Step 1: adapter produces raw menu
  const raw = await adapter.ingest(input, meta);

  // Step 2: sanitize — trim, drop empties, repair required fields
  const { menu: sanitized } = sanitizeMenu(raw);

  // Step 3: normalize section names + item text
  const normalized: NormalizedMenu = {
    ...sanitized,
    confidence: scoreMenuConfidence(adapter.sourceType, sanitized),
    sections: sanitized.sections.map((section) => ({
      sectionName: normalizeSectionName(section.sectionName),
      items: section.items.map((item) => {
        const combined = [item.itemName, item.description].filter(Boolean).join(" ");
        return {
          ...item,
          normalizedText: normalizeMenuItemText(combined),
        };
      }),
    })),
    rawSnapshot: sanitized.rawSnapshot ? truncateSnapshot(sanitized.rawSnapshot) : undefined,
  };

  // Step 4: dedupe within each section
  normalized.sections = dedupeMenuSections(normalized.sections);

  // Step 5: score per-item confidence
  for (const section of normalized.sections) {
    for (const item of section.items) {
      scoreItemConfidence(item, adapter.sourceType);
    }
  }

  return normalized;
}

/**
 * Convenience: ingest and return a flat item count for logging/monitoring.
 */
export function countMenuItems(menu: NormalizedMenu): number {
  return menu.sections.reduce((n, s) => n + s.items.length, 0);
}
