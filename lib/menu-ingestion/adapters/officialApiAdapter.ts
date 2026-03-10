/**
 * lib/menu-ingestion/adapters/officialApiAdapter.ts
 *
 * STUB — Official Restaurant API adapter.
 *
 * Intended use:
 *   When a restaurant chain provides an official API or structured allergen
 *   data page (e.g. McDonald's Nutrition Calculator, Chipotle allergen guide),
 *   this adapter maps that structured response into NormalizedMenu.
 *
 * Confidence: HIGH — restaurant-controlled, structured data.
 *
 * TODO when implementing:
 *   1. Define the expected API response shape in OfficialApiResponse
 *   2. Map response.menuCategories → NormalizedMenuSection[]
 *   3. Map response.items → NormalizedMenuItem[]
 *   4. Preserve allergen arrays directly on NormalizedMenuItem
 *      (add allergens?: string[] to NormalizedMenuItem type)
 *   5. Add retry + rate-limit handling
 *   6. Cache responses to avoid redundant API calls
 *
 * Example chains with official data:
 *   - McDonald's:  nutrition JSON at mcdonalds.com/us/en-us/...
 *   - Chipotle:    allergen REST API
 *   - Starbucks:   starbucks.com/menu API
 *   - Chick-fil-A: menu API with allergen filter
 */

import type { MenuIngestionAdapter, NormalizedMenu, IngestionMeta } from "../types";
import { buildMenuShell, buildSection } from "./base";

// Shape of the official API response — extend when implementing
type OfficialApiResponse = {
  categories?: Array<{
    name: string;
    items: Array<{
      id: string;
      name: string;
      description?: string;
      allergens?: string[];
    }>;
  }>;
};

export class OfficialApiAdapter implements MenuIngestionAdapter<OfficialApiResponse> {
  readonly sourceType = "official_api" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ingest(_input: OfficialApiResponse, meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("official_api", meta);

    // TODO: implement mapping from OfficialApiResponse → NormalizedMenu
    // Example shape:
    // for (const category of input.categories ?? []) {
    //   const section = buildSection(category.name);
    //   for (const item of category.items) {
    //     section.items.push(buildItem("api", item.name, { description: item.description }));
    //   }
    //   menu.sections.push(section);
    // }

    menu.sections = [buildSection("Menu")];
    return menu;
  }
}
