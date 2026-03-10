/**
 * lib/menu-ingestion/pipeline/ingestMenu.ts
 *
 * Central ingestion pipeline.
 *
 * Flow:
 *   1. Adapter.ingest()      → raw NormalizedMenu (rawText preserved, not yet normalized)
 *   2. normalizeMenuText()   → builds normalizedText on every item
 *   3. dedupeMenuSections()  → removes duplicate items within each section
 *   4. scoreItemConfidence() → annotates per-item confidence + signals
 *
 * The pipeline is adapter-agnostic: any MenuIngestionAdapter plugs in here.
 */

import type { NormalizedMenu, MenuIngestionAdapter, IngestionMeta } from "../types";
import { scoreMenuConfidence, scoreItemConfidence } from "./scoreSourceConfidence";
import { dedupeMenuSections } from "./dedupeMenuItems";
import { normalizeMenuItemText, normalizeSectionName } from "./normalizeMenuText";

/** Max raw snapshot size stored for traceability (20 KB) */
const MAX_SNAPSHOT_BYTES = 20_000;

function truncateSnapshot(raw: string): string {
  if (raw.length <= MAX_SNAPSHOT_BYTES) return raw;
  return raw.slice(0, MAX_SNAPSHOT_BYTES) + "\n… [truncated]";
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

  // Step 2: normalize section names + item text
  const normalized: NormalizedMenu = {
    ...raw,
    confidence: scoreMenuConfidence(adapter.sourceType),
    sections: raw.sections.map((section) => ({
      sectionName: normalizeSectionName(section.sectionName),
      items: section.items.map((item) => {
        const combined = [item.itemName, item.description].filter(Boolean).join(" ");
        return {
          ...item,
          normalizedText: normalizeMenuItemText(combined),
        };
      }),
    })),
    rawSnapshot: raw.rawSnapshot ? truncateSnapshot(raw.rawSnapshot) : undefined,
  };

  // Step 3: dedupe within each section
  normalized.sections = dedupeMenuSections(normalized.sections);

  // Step 4: score per-item confidence
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
