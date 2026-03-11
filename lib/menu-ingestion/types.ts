/**
 * lib/menu-ingestion/types.ts
 *
 * Normalized menu schema for the ingestion layer.
 *
 * Design intent:
 *   Every ingested menu is stored in this format before being fed to the
 *   allergy analysis pipeline. The schema preserves source traceability
 *   and confidence so results can be reprocessed as the analyzer improves.
 *
 * Pipeline flow:
 *   external source → MenuIngestionAdapter.ingest()
 *     → NormalizedMenu (raw)
 *     → normalizeMenuText()
 *     → dedupeMenuItems()
 *     → scoreSourceConfidence()
 *     → NormalizedMenu (final)
 *     → toRawMenuItems()           ← feeds existing scoring pipeline
 */

// ─── Source types ─────────────────────────────────────────────────────────────

/**
 * Where the menu data originated.
 * Maps to the existing SourceType in lib/types.ts via sourceTypeToLegacy().
 */
export type MenuIngestionSourceType =
  | "official_api"        // restaurant-controlled API or allergen page
  | "aggregator_api"      // third-party structured source (Nutritionix, etc.)
  | "verified_dataset"    // manually curated / seeded data we trust
  | "website_html"        // scraped from a public restaurant menu page
  | "pdf"                 // extracted from a PDF menu
  | "image"               // OCR from a photo or scanned menu
  | "user_upload";        // pasted raw text / manual input

export type SourceConfidence = "high" | "medium" | "low";

// ─── Per-item schema ──────────────────────────────────────────────────────────

export type NormalizedMenuItem = {
  /** Stable ID for deduplication and cross-referencing. */
  itemId: string;
  itemName: string;
  description?: string;
  price?: string;
  /**
   * Official allergen IDs from a trusted source (e.g. official_api or aggregator_api).
   * When present, these bypass text inference and are scored with high confidence.
   */
  allergens?: string[];
  /** The original unmodified text as extracted from the source. */
  rawText: string;
  /** Lowercased, cleaned text used by the analysis pipeline. */
  normalizedText: string;
  /** Confidence for this specific item (may differ from parent menu). */
  sourceConfidence: SourceConfidence;
  /**
   * Human-readable notes about what produced this item's confidence level.
   * E.g. ["has price — likely real menu item", "matched known food term"]
   */
  sourceSignals?: string[];
};

// ─── Section schema ───────────────────────────────────────────────────────────

export type NormalizedMenuSection = {
  /** The section name (e.g. "Burgers", "Desserts", "Unknown"). */
  sectionName: string;
  items: NormalizedMenuItem[];
};

// ─── Full menu schema ─────────────────────────────────────────────────────────

export type NormalizedMenu = {
  restaurantId: string;
  restaurantName: string;
  sourceType: MenuIngestionSourceType;
  /** The URL or path the data was fetched from, if applicable. */
  sourceUrl?: string;
  /** Human-readable label for the source (e.g. "Chipotle official allergen page"). */
  sourceLabel?: string;
  /** ISO-8601 timestamp when this menu was first imported. */
  importedAt: string;
  /** ISO-8601 timestamp of the most recent successful fetch. */
  lastSeenAt: string;
  /** Overall confidence for this menu import. */
  confidence: SourceConfidence;
  sections: NormalizedMenuSection[];
  /**
   * Raw snapshot of original content (truncated at 20 KB).
   * Stored for future re-parsing as the analyzer improves.
   */
  rawSnapshot?: string;
};

// ─── Adapter interface ────────────────────────────────────────────────────────

/**
 * Every ingestion source implements this contract.
 * The adapter's job: take source-specific input → return a pre-normalized
 * NormalizedMenu with rawText preserved on every item.
 *
 * The pipeline (ingestMenu.ts) handles normalization, deduplication,
 * and confidence scoring — adapters don't need to do those.
 */
export interface MenuIngestionAdapter<TInput = string> {
  readonly sourceType: MenuIngestionSourceType;

  /**
   * Ingest raw source content into a NormalizedMenu.
   * Should NOT normalize text or score confidence — the pipeline does that.
   */
  ingest(input: TInput, meta: IngestionMeta): Promise<NormalizedMenu>;
}

/** Metadata passed to every adapter from the pipeline. */
export type IngestionMeta = {
  restaurantId: string;
  restaurantName: string;
  sourceUrl?: string;
  sourceLabel?: string;
};

// ─── Bridge types (for connecting to existing pipeline) ───────────────────────

import type { RawMenuItem, SourceType } from "@/lib/types";

/** Maps MenuIngestionSourceType → legacy SourceType for the scoring pipeline. */
export const INGESTION_SOURCE_TO_LEGACY: Record<MenuIngestionSourceType, SourceType> = {
  official_api:     "official",
  aggregator_api:   "aggregator",
  verified_dataset: "verified-dataset",
  website_html:     "scraped",
  pdf:              "scraped",
  image:            "user-input",
  user_upload:      "user-input",
};

/**
 * Flatten a NormalizedMenu into RawMenuItem[] for the scoring pipeline.
 * Category is set to the section name.
 */
export function toRawMenuItems(menu: NormalizedMenu): RawMenuItem[] {
  const legacySource = INGESTION_SOURCE_TO_LEGACY[menu.sourceType];
  const items: RawMenuItem[] = [];
  for (const section of menu.sections) {
    for (const item of section.items) {
      items.push({
        id:          item.itemId,
        name:        item.itemName,
        description: item.description,
        category:    section.sectionName === "Menu" ? undefined : section.sectionName,
        sourceType:  legacySource,
        allergens:   item.allergens,   // preserve official allergen arrays through the bridge
      });
    }
  }
  return items;
}
