/**
 * lib/db/seedOfficialMenus.ts
 *
 * Seeds the database with official allergen data from MOCK_RESTAURANTS.
 *
 * Run once (or on deploy) to populate the menu tables with the verified
 * per-item allergen arrays for McDonald's, Chipotle, Chick-fil-A,
 * Starbucks, and Shake Shack.
 *
 * Usage (server-only):
 *   import { seedOfficialMenus } from "@/lib/db/seedOfficialMenus";
 *   await seedOfficialMenus();
 *
 * Or from a script:
 *   npx ts-node -e "require('./lib/db/seedOfficialMenus').seedOfficialMenus()"
 */

import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { OfficialApiAdapter } from "@/lib/menu-ingestion/adapters/officialApiAdapter";
import { ingestMenu } from "@/lib/menu-ingestion/pipeline/ingestMenu";
import { persistMenu } from "./persistMenu";
import type { PersistResult } from "./types";

const adapter = new OfficialApiAdapter();

export type SeedResult = {
  restaurantId:   string;
  restaurantName: string;
  result:         PersistResult;
};

/**
 * Seed all MOCK_RESTAURANTS into the database using official allergen data.
 * Returns one SeedResult per restaurant.
 */
export async function seedOfficialMenus(): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  for (const restaurant of MOCK_RESTAURANTS) {
    const meta = {
      restaurantId:   restaurant.id,
      restaurantName: restaurant.name,
      sourceLabel:    `${restaurant.name} official allergen data`,
    };

    const menu = await ingestMenu(adapter, restaurant, meta);

    const result = await persistMenu(menu, {
      id:      restaurant.id,
      name:    restaurant.name,
      cuisine: restaurant.cuisine,
      address: restaurant.address,
      lat:     restaurant.lat,
      lng:     restaurant.lng,
    });

    results.push({ restaurantId: restaurant.id, restaurantName: restaurant.name, result });
  }

  return results;
}
