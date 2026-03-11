/**
 * lib/menu-crawl/crawlEngine.ts
 *
 * Crawl engine — executes a single menu crawl for one restaurant.
 *
 * The engine:
 *   1. Looks up the restaurant's crawl record to get its best source URL/type
 *   2. Fetches the menu via the appropriate adapter
 *   3. Hashes the raw + normalized content for change detection
 *   4. Calls the app's /api/fetch-menu endpoint (which persists to localStorage)
 *   5. Updates the CrawlRecord via markCrawled()
 *   6. Returns a CrawlResult describing what happened
 *
 * This file is designed to run in the browser (or in an API route for
 * server-side crawling). It does NOT contain any POS-specific logic —
 * that lives in the individual adapters.
 *
 * Usage:
 *   import { crawlRestaurant, runCrawlBatch } from "@/lib/menu-crawl/crawlEngine";
 *
 *   // Crawl one restaurant by registry ID:
 *   const result = await crawlRestaurant(registryId, { sourceUrl: "https://..." });
 *
 *   // Run the next batch of overdue restaurants:
 *   const results = await runCrawlBatch({ batchSize: 3 });
 */

import type { CrawlResult, MenuHashes } from "./types";
import { getCrawlRecord, markCrawled, getNextCrawlBatch } from "./crawlQueue";
import { getByRegistryId } from "@/lib/registry";

// ─── Content hashing ──────────────────────────────────────────────────────────

/**
 * Produce a lightweight string hash (DJB2) of any string.
 * Not cryptographic — used only for change detection.
 */
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h & h;
  }
  return (h >>> 0).toString(36);
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, opts: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

// ─── Single restaurant crawl ──────────────────────────────────────────────────

export type CrawlOpts = {
  /** Override the source URL stored in the crawl record. */
  sourceUrl?: string;
  /** Milliseconds before the fetch times out. Default 30 000. */
  timeoutMs?: number;
};

/**
 * Crawl one restaurant's menu.
 *
 * Sends the source URL to `/api/fetch-menu` which handles HTML scraping,
 * ingestion, and persistence. Returns a CrawlResult describing whether
 * the menu was updated, unchanged, or failed.
 *
 * For POS-integrated restaurants (Toast / Square), the caller should call
 * the adapter directly and pass the result to `persistNormalizedMenu()` instead,
 * since those flows require credentials and are not routed through fetch-menu.
 */
export async function crawlRestaurant(
  registryId: string,
  opts: CrawlOpts = {},
): Promise<CrawlResult> {
  const record   = getCrawlRecord(registryId);
  const canonical = getByRegistryId(registryId);

  const sourceUrl = opts.sourceUrl ?? record?.sourceUrl ?? canonical?.website;

  if (!sourceUrl) {
    markCrawled(registryId, "failed");
    return { registryId, outcome: "failed", error: "No source URL available" };
  }

  const timeoutMs = opts.timeoutMs ?? 30_000;

  try {
    const res = await fetchWithTimeout(
      "/api/fetch-menu",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url:          sourceUrl,
          restaurantId: registryId,
          restaurantName: canonical?.displayName ?? registryId,
        }),
      },
      timeoutMs,
    );

    if (!res.ok) {
      const err = await res.text().catch(() => res.statusText);
      markCrawled(registryId, "failed");
      return { registryId, outcome: "failed", error: `fetch-menu ${res.status}: ${err}` };
    }

    const data = await res.json() as { rawSnapshot?: string; normalizedMenuJson?: string };

    // ── Change detection ──────────────────────────────────────────────────────
    const rawSnapshotHash    = hashString(data.rawSnapshot    ?? "");
    const normalizedMenuHash = hashString(data.normalizedMenuJson ?? "");

    const existingHashes = record?.hashes;

    let outcome: CrawlResult["outcome"];

    if (existingHashes?.rawSnapshotHash === rawSnapshotHash) {
      // Raw content identical — no re-parsing needed
      outcome = "unchanged";
    } else if (existingHashes?.normalizedMenuHash === normalizedMenuHash) {
      // Raw changed (e.g. whitespace / ads) but normalized menu is identical
      outcome = "refreshed";
    } else {
      // Menu actually changed — downstream analysis should be invalidated
      outcome = "updated";
    }

    const newHashes: MenuHashes = { rawSnapshotHash, normalizedMenuHash };
    markCrawled(registryId, outcome, newHashes);

    return {
      registryId,
      outcome,
      newHash: outcome === "updated" ? normalizedMenuHash : undefined,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    markCrawled(registryId, "failed");
    return { registryId, outcome: "failed", error: message };
  }
}

// ─── Batch crawl ──────────────────────────────────────────────────────────────

export type BatchCrawlOpts = {
  /** How many restaurants to crawl in this batch. Default 3. */
  batchSize?: number;
  /** Delay between crawls to avoid hammering servers. Default 1 500ms. */
  delayBetweenMs?: number;
  /** Timeout per individual crawl. Default 30 000ms. */
  timeoutMs?: number;
  /** Called after each crawl completes (useful for streaming progress). */
  onResult?: (result: CrawlResult) => void;
};

/**
 * Run the next batch of overdue restaurant crawls sequentially.
 *
 * Sequential (not parallel) to be a good citizen: restaurant websites
 * are not our infrastructure and we shouldn't hammer them.
 *
 * @returns Array of CrawlResult, one per crawled restaurant.
 */
export async function runCrawlBatch(opts: BatchCrawlOpts = {}): Promise<CrawlResult[]> {
  const {
    batchSize      = 3,
    delayBetweenMs = 1_500,
    timeoutMs      = 30_000,
    onResult,
  } = opts;

  const entries = getNextCrawlBatch(batchSize);
  const results: CrawlResult[] = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const result = await crawlRestaurant(entry.registryId, {
      sourceUrl: entry.sourceUrl,
      timeoutMs,
    });

    results.push(result);
    onResult?.(result);

    // Delay between crawls (skip after the last one)
    if (i < entries.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  return results;
}
