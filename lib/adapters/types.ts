/**
 * Menu adapter interface.
 *
 * Each adapter ingests menu data from a specific source type and normalizes
 * it into RawMenuItem[]. The sourceType it returns drives confidence scoring.
 *
 * Existing adapters:
 *   - VerifiedDatasetAdapter  (verified-dataset)  — loads from MOCK_RESTAURANTS seed data
 *   - UserInputAdapter        (user-input)         — parses raw pasted text
 *
 * TODO — future adapters to implement when credentials are available:
 *   - OfficialApiAdapter      (official)           — restaurant-controlled API/allergen page
 *   - AggregatorAdapter       (aggregator)         — Nutritionix / Spoonacular / Edamam
 *   - ScrapedAdapter          (scraped)            — extends the existing /api/fetch-menu route
 */

import type { RawMenuItem, SourceType } from "@/lib/types";

export interface MenuAdapter {
  /** The source type this adapter produces. Used for confidence scoring. */
  readonly sourceType: SourceType;

  /**
   * Ingest menu data and return normalized menu items.
   * @param input - adapter-specific input (URL, text, restaurant ID, etc.)
   */
  ingest(input: string): Promise<RawMenuItem[]>;
}
