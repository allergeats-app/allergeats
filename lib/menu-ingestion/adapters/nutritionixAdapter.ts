/**
 * lib/menu-ingestion/adapters/nutritionixAdapter.ts
 *
 * STUB — Nutritionix API adapter.
 *
 * Nutritionix provides structured menu and nutrition data for restaurant chains.
 * Confidence: HIGH — aggregator with structured data, includes allergen fields.
 *
 * Existing integration: /api/fetch-menu/ingest/nutritionix/route.ts
 * That route wraps the Nutritionix instant search API.
 *
 * TODO when implementing:
 *   1. Call Nutritionix branded food search:
 *      GET /v2/search/instant?query={restaurantName}&branded=true
 *   2. Call item nutrition endpoint for allergen details:
 *      POST /v2/nutrients with nix_item_id
 *   3. Map allergen fields:
 *      nf_ingredient_statement, alt_measures, full_nutrients
 *   4. Group items by brand/restaurant into sections
 *   5. Rate-limit: 200 requests/day on free tier
 *
 * Required env vars:
 *   NUTRITIONIX_APP_ID
 *   NUTRITIONIX_APP_KEY
 */

import type { MenuIngestionAdapter, NormalizedMenu, IngestionMeta } from "../types";
import { buildMenuShell, buildSection } from "./base";

// Shape of Nutritionix instant search result — extend as needed
type NutritionixResponse = {
  branded?: Array<{
    nix_item_id: string;
    food_name: string;
    brand_name: string;
    nf_ingredient_statement?: string;
    photo?: { thumb?: string };
  }>;
};

export class NutritionixAdapter implements MenuIngestionAdapter<NutritionixResponse> {
  readonly sourceType = "aggregator_api" as const;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async ingest(_input: NutritionixResponse, meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("aggregator_api", meta);

    // TODO: implement
    // for (const item of input.branded ?? []) {
    //   if (item.brand_name !== meta.restaurantName) continue;
    //   const section = getOrCreateSection(menu, "Menu");
    //   section.items.push(buildItem("nix", item.food_name, {
    //     description: item.nf_ingredient_statement,
    //   }));
    // }

    menu.sections = [buildSection("Menu")];
    return menu;
  }
}
