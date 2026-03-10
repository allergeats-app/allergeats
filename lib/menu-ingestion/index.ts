/**
 * lib/menu-ingestion/index.ts
 *
 * Public API for the menu ingestion system.
 *
 * Usage:
 *
 *   // Ingest from website HTML
 *   import { ingestFromHtml, toRawMenuItems } from "@/lib/menu-ingestion";
 *   const menu = await ingestFromHtml(htmlString, { restaurantId, restaurantName });
 *   const rawItems = toRawMenuItems(menu); // → feed into scoreRestaurant()
 *
 *   // Ingest from pasted text
 *   import { ingestFromText } from "@/lib/menu-ingestion";
 *   const menu = await ingestFromText(pastedText, { restaurantId, restaurantName });
 *
 *   // Ingest via any adapter
 *   import { ingestMenu, WebsiteHtmlAdapter } from "@/lib/menu-ingestion";
 *   const adapter = new WebsiteHtmlAdapter();
 *   const menu = await ingestMenu(adapter, html, meta);
 */

// ─── Core types ───────────────────────────────────────────────────────────────
export type {
  NormalizedMenu,
  NormalizedMenuSection,
  NormalizedMenuItem,
  MenuIngestionAdapter,
  MenuIngestionSourceType,
  SourceConfidence,
  IngestionMeta,
} from "./types";
export { toRawMenuItems, INGESTION_SOURCE_TO_LEGACY } from "./types";

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export { ingestMenu, countMenuItems } from "./pipeline/ingestMenu";
export { normalizeMenuItemText, normalizeSectionName } from "./pipeline/normalizeMenuText";
export { scoreMenuConfidence, scoreItemConfidence, SOURCE_CONFIDENCE_BASELINE } from "./pipeline/scoreSourceConfidence";
export { dedupeMenuSections, dedupeFlat } from "./pipeline/dedupeMenuItems";

// ─── Adapters ─────────────────────────────────────────────────────────────────
export { WebsiteHtmlAdapter } from "./adapters/websiteHtmlAdapter";
export { UserUploadAdapter }  from "./adapters/userUploadAdapter";
export { OfficialApiAdapter } from "./adapters/officialApiAdapter";
export { NutritionixAdapter } from "./adapters/nutritionixAdapter";
export type { NutritionixFood } from "./adapters/nutritionixAdapter";
export { PdfAdapter }         from "./adapters/pdfAdapter";
export { ImageAdapter }       from "./adapters/imageAdapter";

// ─── Convenience functions ────────────────────────────────────────────────────

import { ingestMenu } from "./pipeline/ingestMenu";
import { WebsiteHtmlAdapter } from "./adapters/websiteHtmlAdapter";
import { UserUploadAdapter }  from "./adapters/userUploadAdapter";
import type { IngestionMeta, NormalizedMenu } from "./types";

const _htmlAdapter   = new WebsiteHtmlAdapter();
const _uploadAdapter = new UserUploadAdapter();

/**
 * Ingest a restaurant menu from raw HTML or pre-stripped text.
 * Confidence: medium (website_html source).
 */
export async function ingestFromHtml(
  html: string,
  meta: IngestionMeta,
): Promise<NormalizedMenu> {
  return ingestMenu(_htmlAdapter, html, meta);
}

/**
 * Ingest a restaurant menu from pasted plain text.
 * Confidence: medium (user_upload source).
 */
export async function ingestFromText(
  text: string,
  meta: IngestionMeta,
): Promise<NormalizedMenu> {
  return ingestMenu(_uploadAdapter, text, meta);
}
