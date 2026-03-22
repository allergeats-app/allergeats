/**
 * lib/menu-ingestion/adapters/toastAdapter.ts
 *
 * Adapter for Toast's Menus API.
 *
 * Toast returns a structured menu tree (menus → groups → items) from their
 * Restaurant Management platform. This adapter fetches that tree, maps it to
 * our shared NormalizedMenu schema, and sets high confidence because data
 * comes directly from the restaurant's POS/menu system.
 *
 * Authentication:
 *   Toast uses OAuth 2.0 client-credentials. Set these env vars:
 *     TOAST_CLIENT_ID      — from Toast Developer portal
 *     TOAST_CLIENT_SECRET  — from Toast Developer portal
 *   The adapter fetches a short-lived access token before each menu request.
 *
 * Usage:
 *   import { ToastAdapter } from "@/lib/menu-ingestion/adapters/toastAdapter";
 *   const adapter = new ToastAdapter({ restaurantGuid: "...", environment: "production" });
 *   const menu = await adapter.ingest(undefined, meta);
 *
 * Webhook / polling refresh:
 *   Call adapter.ingest() again to get a fresh menu snapshot.
 *   The importedAt timestamp on the returned NormalizedMenu marks the fetch time.
 *   Wire into a cron or Toast webhook handler (menuUpdated event) to auto-refresh.
 */

import type {
  MenuIngestionAdapter,
  NormalizedMenu,
  NormalizedMenuSection,
  IngestionMeta,
} from "../types";
import { buildMenuShell, generateItemId } from "./base";

// ─── Toast API types ──────────────────────────────────────────────────────────

/** Credentials / config needed to talk to Toast's API. */
export type ToastAdapterConfig = {
  /** The GUID that identifies the restaurant in Toast. */
  restaurantGuid: string;
  /** "production" or "sandbox" — controls the base URL. */
  environment?: "production" | "sandbox";
  /**
   * Override env vars for the client credentials.
   * Defaults to process.env.TOAST_CLIENT_ID / TOAST_CLIENT_SECRET.
   */
  clientId?: string;
  clientSecret?: string;
};

type ToastTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};


type ToastMenuItem = {
  guid: string;
  name: string;
  description?: string;
  /** Price in cents. */
  price?: number;
  /** Optional nested modifier references — not mapped but kept for future use. */
  modifierGroupReferences?: Array<{ guid: string }>;
};

type ToastMenuGroup = {
  guid: string;
  name: string;
  items: ToastMenuItem[];
  subgroups?: ToastMenuGroup[];
};

type ToastMenu = {
  guid: string;
  name: string;
  groups: ToastMenuGroup[];
};

export type ToastMenusResponse = {
  menus: ToastMenu[];
};

// ─── Adapter ─────────────────────────────────────────────────────────────────

export class ToastAdapter implements MenuIngestionAdapter<ToastMenusResponse | undefined> {
  readonly sourceType = "official_api" as const;

  private readonly restaurantGuid: string;
  private readonly baseUrl: string;
  private readonly clientId: string;
  private readonly clientSecret: string;

  constructor(config: ToastAdapterConfig) {
    this.restaurantGuid = config.restaurantGuid;
    this.baseUrl =
      config.environment === "sandbox"
        ? "https://ws-sandbox-api.toasttab.com"
        : "https://ws-api.toasttab.com";

    this.clientId     = config.clientId     ?? process.env.TOAST_CLIENT_ID     ?? "";
    this.clientSecret = config.clientSecret ?? process.env.TOAST_CLIENT_SECRET ?? "";
  }

  // ─── Public entry point ─────────────────────────────────────────────────────

  /**
   * Fetch and normalize the restaurant's menu from Toast.
   *
   * @param input  Pass `undefined` to trigger a live fetch, or pass a pre-fetched
   *               `ToastMenusResponse` (e.g. from a webhook payload) to skip the
   *               HTTP call and map directly.
   * @param meta   Standard ingestion metadata.
   */
  async ingest(
    input: ToastMenusResponse | undefined,
    meta: IngestionMeta,
  ): Promise<NormalizedMenu> {
    const data     = input ?? (await this.fetchMenus());
    const menu     = buildMenuShell("official_api", meta);
    menu.sourceUrl = meta.sourceUrl ?? `${this.baseUrl}/restaurants/v1/menus`;

    const sectionMap = new Map<string, NormalizedMenuSection>();

    for (const toastMenu of data.menus) {
      this.mapGroups(toastMenu.groups, sectionMap);
    }

    menu.sections   = Array.from(sectionMap.values());
    menu.confidence = "high";
    menu.sourceLabel =
      meta.sourceLabel ??
      `${meta.restaurantName} — Toast POS (${data.menus.length} menu(s))`;

    return menu;
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  /** Recursively map Toast menu groups (and any subgroups) into sections. */
  private mapGroups(
    groups: ToastMenuGroup[],
    sectionMap: Map<string, NormalizedMenuSection>,
  ): void {
    for (const group of groups) {
      const sectionName = group.name.trim() || "Menu";

      let section = sectionMap.get(sectionName);
      if (!section) {
        section = { sectionName, items: [] };
        sectionMap.set(sectionName, section);
      }

      for (const item of group.items) {
        const rawText = [item.name, item.description].filter(Boolean).join(" — ");

        section.items.push({
          itemId:           item.guid || generateItemId("toast"),
          itemName:         item.name.trim(),
          description:      item.description?.trim(),
          price:            item.price != null ? formatCents(item.price) : undefined,
          rawText,
          normalizedText:   "", // filled by pipeline
          sourceConfidence: "high",
          sourceSignals:    ["Toast POS — restaurant-controlled menu data"],
        });
      }

      // Recurse into subgroups (Toast supports nested menu groups)
      if (group.subgroups?.length) {
        this.mapGroups(group.subgroups, sectionMap);
      }
    }
  }

  /** Exchange client credentials for a short-lived access token. */
  private async fetchToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error(
        "ToastAdapter: missing credentials. " +
        "Set TOAST_CLIENT_ID and TOAST_CLIENT_SECRET environment variables.",
      );
    }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(`${this.baseUrl}/authentication/v1/authentication/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          clientId:     this.clientId,
          clientSecret: this.clientSecret,
          userAccessType: "TOAST_MACHINE_CLIENT",
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`ToastAdapter: token fetch failed (${res.status} ${res.statusText})`);
      }

      const data = (await res.json()) as ToastTokenResponse;
      return data.access_token;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /** Fetch the full menu tree for this restaurant from Toast. */
  private async fetchMenus(): Promise<ToastMenusResponse> {
    const token = await this.fetchToken();

    const url = `${this.baseUrl}/restaurants/v1/menus`;

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(url, {
        headers: {
          Authorization:             `Bearer ${token}`,
          "Toast-Restaurant-External-ID": this.restaurantGuid,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`ToastAdapter: menus fetch failed (${res.status} ${res.statusText})`);
      }

      return (await res.json()) as ToastMenusResponse;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a cent-integer as a "$X.XX" price string. */
function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
