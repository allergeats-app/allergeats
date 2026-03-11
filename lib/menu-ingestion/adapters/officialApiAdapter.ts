/**
 * lib/menu-ingestion/adapters/officialApiAdapter.ts
 *
 * Adapter for restaurant-controlled structured allergen data.
 *
 * Accepts a `Restaurant` object (as defined in lib/types.ts) — specifically
 * the MOCK_RESTAURANTS data which carries official per-item allergen arrays.
 *
 * All items are set to HIGH confidence because the allergen arrays come
 * directly from the chain's published allergen guide (no text inference needed).
 *
 * Usage:
 *   import { OfficialApiAdapter } from "@/lib/menu-ingestion/adapters/officialApiAdapter";
 *   const adapter = new OfficialApiAdapter();
 *   const menu = await adapter.ingest(restaurant, meta);
 */

import type { MenuIngestionAdapter, NormalizedMenu, NormalizedMenuSection, IngestionMeta } from "../types";
import type { Restaurant } from "@/lib/types";
import { buildMenuShell, generateItemId } from "./base";

export class OfficialApiAdapter implements MenuIngestionAdapter<Restaurant> {
  readonly sourceType = "official_api" as const;

  async ingest(restaurant: Restaurant, meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("official_api", meta);

    // Group items by category preserving insertion order
    const categoryMap = new Map<string, NormalizedMenuSection>();

    for (const item of restaurant.menuItems) {
      const categoryName = item.category ?? "Menu";

      let section = categoryMap.get(categoryName);
      if (!section) {
        section = { sectionName: categoryName, items: [] };
        categoryMap.set(categoryName, section);
      }
      const rawText = item.name + (item.description ? ` — ${item.description}` : "");

      section.items.push({
        itemId:           item.id ?? generateItemId("official"),
        itemName:         item.name,
        description:      item.description,
        allergens:        item.allergens,
        rawText,
        normalizedText:   "", // filled by pipeline
        sourceConfidence: "high",
        sourceSignals:    ["official_api — restaurant-verified allergen data"],
      });
    }

    menu.sections   = Array.from(categoryMap.values());
    menu.confidence = "high";
    menu.sourceLabel = meta.sourceLabel ?? `${restaurant.name} official allergen data`;

    return menu;
  }
}
