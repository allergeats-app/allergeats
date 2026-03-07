/**
 * Verified dataset adapter.
 * Loads menu items from MOCK_RESTAURANTS seed data.
 * Produces "verified-dataset" source type → High confidence.
 */

import type { MenuAdapter } from "./types";
import type { RawMenuItem } from "@/lib/types";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";

export class VerifiedDatasetAdapter implements MenuAdapter {
  readonly sourceType = "verified-dataset" as const;

  async ingest(restaurantId: string): Promise<RawMenuItem[]> {
    const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);
    if (!restaurant) return [];
    return restaurant.menuItems;
  }
}
