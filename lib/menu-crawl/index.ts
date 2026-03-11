/**
 * lib/menu-crawl/index.ts
 *
 * Public API for the menu crawl system.
 *
 * Usage:
 *   import { registerForCrawl, bumpInteraction, runCrawlBatch } from "@/lib/menu-crawl";
 */

// Types
export type {
  CrawlRecord,
  CrawlQueueEntry,
  CrawlResult,
  CrawlOutcome,
  MenuHashes,
  RefreshTier,
  CrawlSourcePriority,
} from "./types";
export { SOURCE_PRIORITY, REFRESH_INTERVAL_MS } from "./types";

// Queue management
export {
  registerForCrawl,
  getCrawlRecord,
  markCrawled,
  bumpInteraction,
  upgradePriority,
  getNextCrawlBatch,
  getQueueStats,
  sourceToPriority,
} from "./crawlQueue";

// Crawl execution
export { crawlRestaurant, runCrawlBatch } from "./crawlEngine";
export type { CrawlOpts, BatchCrawlOpts } from "./crawlEngine";
