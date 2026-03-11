/**
 * lib/menu-ingestion/adapters/squareAdapter.ts
 *
 * Adapter for Square's Catalog API.
 *
 * Square stores menu items as "catalog objects" of type ITEM, grouped by
 * CATEGORY objects. This adapter:
 *   1. Fetches all catalog objects in a single paginated request
 *   2. Builds a category name lookup from CATEGORY objects
 *   3. Maps ITEM objects → NormalizedMenuSection / NormalizedMenuItem
 *   4. Picks the lowest-price variation as the display price
 *
 * Authentication:
 *   Set this env var:
 *     SQUARE_ACCESS_TOKEN — from Square Developer portal
 *   Use a production token for live data, or a sandbox token for testing.
 *
 * Usage:
 *   import { SquareAdapter } from "@/lib/menu-ingestion/adapters/squareAdapter";
 *   const adapter = new SquareAdapter({ locationId: "..." });
 *   const menu = await adapter.ingest(undefined, meta);
 *
 * Refresh:
 *   Square webhooks fire `catalog.version.updated` when the merchant updates
 *   their menu. Wire that webhook to call adapter.ingest() to re-normalize.
 *   The `updated_at` field on each catalog object is preserved as a sourceSignal
 *   to track staleness.
 */

import type {
  MenuIngestionAdapter,
  NormalizedMenu,
  NormalizedMenuSection,
  IngestionMeta,
} from "../types";
import { buildMenuShell, generateItemId } from "./base";

// ─── Square Catalog API types ─────────────────────────────────────────────────

export type SquareAdapterConfig = {
  /**
   * The Square location ID to scope catalog queries.
   * If omitted, catalog objects for all locations are returned.
   */
  locationId?: string;
  /**
   * Override the access token.
   * Defaults to process.env.SQUARE_ACCESS_TOKEN.
   */
  accessToken?: string;
  /** "production" (default) or "sandbox". */
  environment?: "production" | "sandbox";
};

type SquareMoney = {
  amount: number;   // in smallest currency unit (cents for USD)
  currency: string; // e.g. "USD"
};

type SquareItemVariationData = {
  name?: string;
  price_money?: SquareMoney;
};

type SquareItemVariation = {
  type: "ITEM_VARIATION";
  id: string;
  updated_at?: string;
  item_variation_data?: SquareItemVariationData;
};

type SquareItemData = {
  name: string;
  description?: string;
  /** Array of CATEGORY IDs (Square supports multi-category as of 2023). */
  category_id?: string;
  /** Embedded variations (price points). */
  variations?: SquareItemVariation[];
  /** True when item is archived / hidden from the POS. */
  is_archived?: boolean;
};

type SquareCategoryData = {
  name: string;
};

type SquareCatalogObject =
  | {
      type: "ITEM";
      id: string;
      updated_at?: string;
      is_deleted?: boolean;
      item_data: SquareItemData;
    }
  | {
      type: "CATEGORY";
      id: string;
      updated_at?: string;
      is_deleted?: boolean;
      category_data: SquareCategoryData;
    }
  | {
      type: "ITEM_VARIATION" | "MODIFIER_LIST" | "MODIFIER" | "TAX" | "DISCOUNT" | "IMAGE" | string;
      id: string;
      updated_at?: string;
      is_deleted?: boolean;
    };

export type SquareCatalogResponse = {
  objects?: SquareCatalogObject[];
  /** Pagination cursor — present when there are more pages. */
  cursor?: string;
};

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class SquareAdapter implements MenuIngestionAdapter<SquareCatalogResponse | undefined> {
  readonly sourceType = "official_api" as const;

  private readonly locationId?: string;
  private readonly accessToken: string;
  private readonly baseUrl: string;

  constructor(config: SquareAdapterConfig = {}) {
    this.locationId  = config.locationId;
    this.accessToken = config.accessToken ?? process.env.SQUARE_ACCESS_TOKEN ?? "";
    this.baseUrl =
      config.environment === "sandbox"
        ? "https://connect.squareupsandbox.com"
        : "https://connect.squareup.com";
  }

  // ─── Public entry point ─────────────────────────────────────────────────────

  /**
   * Fetch and normalize the restaurant's catalog from Square.
   *
   * @param input  Pass `undefined` to trigger a live fetch, or pass a pre-fetched
   *               `SquareCatalogResponse` (e.g. from a webhook payload or test fixture)
   *               to skip the HTTP call and map directly.
   * @param meta   Standard ingestion metadata.
   */
  async ingest(
    input: SquareCatalogResponse | undefined,
    meta: IngestionMeta,
  ): Promise<NormalizedMenu> {
    const allObjects = input != null
      ? (input.objects ?? [])
      : await this.fetchAllObjects();

    const menu     = buildMenuShell("official_api", meta);
    menu.sourceUrl = meta.sourceUrl ?? `${this.baseUrl}/v2/catalog/list`;

    // ── 1. Build category ID → name lookup ──────────────────────────────────
    const categoryNames = new Map<string, string>();
    for (const obj of allObjects) {
      if (obj.type === "CATEGORY" && !obj.is_deleted) {
        const cat = obj as Extract<SquareCatalogObject, { type: "CATEGORY" }>;
        categoryNames.set(cat.id, cat.category_data.name.trim() || "Menu");
      }
    }

    // ── 2. Map ITEM objects into sections ────────────────────────────────────
    const sectionMap = new Map<string, NormalizedMenuSection>();
    let itemCount    = 0;

    for (const obj of allObjects) {
      if (obj.type !== "ITEM" || obj.is_deleted) continue;

      const catalogItem = obj as Extract<SquareCatalogObject, { type: "ITEM" }>;
      const itemData    = catalogItem.item_data;

      // Skip archived items (removed from POS menu)
      if (itemData.is_archived) continue;

      const categoryId   = itemData.category_id;
      const sectionName  = (categoryId && categoryNames.get(categoryId)) ?? "Menu";

      let section = sectionMap.get(sectionName);
      if (!section) {
        section = { sectionName, items: [] };
        sectionMap.set(sectionName, section);
      }

      const price   = pickLowestPrice(itemData.variations);
      const rawText = [itemData.name, itemData.description].filter(Boolean).join(" — ");

      const signals: string[] = ["Square Catalog — restaurant-controlled POS data"];
      if (catalogItem.updated_at) {
        signals.push(`last updated ${catalogItem.updated_at.slice(0, 10)}`);
      }

      section.items.push({
        itemId:           catalogItem.id || generateItemId("square"),
        itemName:         itemData.name.trim(),
        description:      itemData.description?.trim(),
        price,
        rawText,
        normalizedText:   "", // filled by pipeline
        sourceConfidence: "high",
        sourceSignals:    signals,
      });

      itemCount++;
    }

    menu.sections    = Array.from(sectionMap.values());
    menu.confidence  = "high";
    menu.sourceLabel =
      meta.sourceLabel ??
      `${meta.restaurantName} — Square Catalog (${itemCount} item(s))`;

    return menu;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /** Fetch all catalog objects, following pagination cursors automatically. */
  private async fetchAllObjects(): Promise<SquareCatalogObject[]> {
    if (!this.accessToken) {
      throw new Error(
        "SquareAdapter: missing credentials. " +
        "Set the SQUARE_ACCESS_TOKEN environment variable.",
      );
    }

    const results: SquareCatalogObject[] = [];
    let cursor: string | undefined;

    do {
      const url = new URL(`${this.baseUrl}/v2/catalog/list`);
      url.searchParams.set("types", "ITEM,CATEGORY");
      if (this.locationId) url.searchParams.set("location_id", this.locationId);
      if (cursor)          url.searchParams.set("cursor", cursor);

      const controller = new AbortController();
      const timeoutId  = setTimeout(() => controller.abort(), 30_000);

      try {
        const res = await fetch(url.toString(), {
          headers: {
            Authorization:  `Bearer ${this.accessToken}`,
            "Square-Version": "2024-01-17",
            Accept:         "application/json",
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`SquareAdapter: catalog fetch failed (${res.status} ${res.statusText})`);
        }

        const page = (await res.json()) as SquareCatalogResponse;
        if (page.objects) results.push(...page.objects);
        cursor = page.cursor;
      } finally {
        clearTimeout(timeoutId);
      }
    } while (cursor);

    return results;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find the lowest-priced variation and format it as "$X.XX".
 * Returns undefined if no variations have price data.
 */
function pickLowestPrice(variations?: SquareItemVariation[]): string | undefined {
  if (!variations?.length) return undefined;

  let lowestCents: number | undefined;

  for (const v of variations) {
    const amount = v.item_variation_data?.price_money?.amount;
    if (amount != null && (lowestCents === undefined || amount < lowestCents)) {
      lowestCents = amount;
    }
  }

  return lowestCents != null ? `$${(lowestCents / 100).toFixed(2)}` : undefined;
}
