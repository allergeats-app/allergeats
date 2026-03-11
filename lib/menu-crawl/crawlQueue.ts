/**
 * lib/menu-crawl/crawlQueue.ts
 *
 * Crawl queue — manages per-restaurant crawl state and scheduling.
 *
 * Every restaurant known to the registry gets a CrawlRecord.
 * The queue ranks restaurants by urgency so the most overdue, most
 * interacted-with restaurants are crawled first.
 *
 * Storage: localStorage key `allegeats_crawl_queue` (JSON object keyed by registryId).
 *
 * Usage:
 *   import { getNextCrawlBatch, markCrawled, bumpInteraction } from "@/lib/menu-crawl/crawlQueue";
 *
 *   // Get the next N restaurants that need refreshing:
 *   const batch = getNextCrawlBatch(3);
 *
 *   // After a successful crawl:
 *   markCrawled(registryId, "updated", { rawSnapshotHash, normalizedMenuHash });
 *
 *   // When a user views or gives feedback on a restaurant:
 *   bumpInteraction(registryId);
 */

import type {
  CrawlRecord,
  CrawlQueueEntry,
  CrawlOutcome,
  MenuHashes,
  RefreshTier,
  CrawlSourcePriority,
} from "./types";
import { REFRESH_INTERVAL_MS, SOURCE_PRIORITY } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const QUEUE_KEY = "allegeats_crawl_queue";

/**
 * After this many consecutive failures the exponential backoff caps at 7 days
 * (2^n hours, capped). Restaurants are NOT permanently excluded — they continue
 * to be re-tried once the backoff window expires.
 */
const MAX_FAILURES_FOR_WEEKLY_BACKOFF = 7; // 2^7 h = 128h > 7-day cap → weekly retries

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadQueue(): Record<string, CrawlRecord> {
  if (typeof localStorage === "undefined") return {};
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CrawlRecord>) : {};
  } catch {
    return {};
  }
}

function saveQueue(queue: Record<string, CrawlRecord>): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Quota exceeded — skip persist (in-memory state correct for this session)
  }
}

// ─── Tier assignment ──────────────────────────────────────────────────────────

/**
 * Assign a refresh tier based on interaction count and source quality.
 *
 * - stale:  no menu ever crawled
 * - high:   frequently interacted OR has a live POS integration
 * - medium: occasionally interacted (3–9 times)
 * - low:    rarely interacted (< 3 times)
 */
function assignTier(record: CrawlRecord): RefreshTier {
  if (!record.lastCrawledAt) return "stale";
  if (record.hasPosIntegration || record.interactionCount >= 10) return "high";
  if (record.interactionCount >= 3) return "medium";
  return "low";
}

/**
 * Compute the ISO-8601 deadline for the next crawl based on refresh tier.
 * Applies exponential backoff for repeated failures.
 */
function computeNextCrawlDue(tier: RefreshTier, failureStreak: number): string {
  let intervalMs = REFRESH_INTERVAL_MS[tier];

  // Exponential backoff: 2^streak multiplier, capped at 7 days
  if (failureStreak > 0) {
    const backoffMs = Math.min(2 ** failureStreak * 60 * 60 * 1000, 7 * 24 * 60 * 60 * 1000);
    intervalMs = Math.max(intervalMs, backoffMs);
  }

  return new Date(Date.now() + intervalMs).toISOString();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a restaurant in the crawl queue (idempotent).
 *
 * Call this when a restaurant is first discovered so it gets scheduled
 * for its first menu crawl.
 *
 * @param registryId  Canonical registry ID
 * @param opts        Optional overrides for source URL and POS integration flag
 */
export function registerForCrawl(
  registryId: string,
  opts: {
    sourceUrl?: string;
    hasPosIntegration?: boolean;
    bestSourcePriority?: CrawlSourcePriority;
  } = {},
): CrawlRecord {
  const queue = loadQueue();

  if (queue[registryId]) {
    // Already registered — update source info if provided
    const existing = queue[registryId];
    if (opts.sourceUrl)           existing.sourceUrl           = opts.sourceUrl;
    if (opts.hasPosIntegration)   existing.hasPosIntegration   = true;
    if (opts.bestSourcePriority &&
        (opts.bestSourcePriority < existing.bestSourcePriority)) {
      existing.bestSourcePriority = opts.bestSourcePriority;
    }
    saveQueue(queue);
    return existing;
  }

  const record: CrawlRecord = {
    registryId,
    bestSourcePriority: opts.bestSourcePriority ?? "F",
    sourceUrl:          opts.sourceUrl,
    nextCrawlDue:       new Date().toISOString(), // overdue immediately — crawl ASAP
    refreshTier:        "stale",
    interactionCount:   0,
    hasPosIntegration:  opts.hasPosIntegration ?? false,
    consecutiveFailures: 0,
  };

  queue[registryId] = record;
  saveQueue(queue);
  return record;
}

/**
 * Get the crawl record for one restaurant.
 * Returns null if the restaurant has never been registered.
 */
export function getCrawlRecord(registryId: string): CrawlRecord | null {
  const queue = loadQueue();
  return queue[registryId] ?? null;
}

/**
 * Record the result of a crawl attempt and update scheduling.
 *
 * @param registryId  The restaurant that was crawled
 * @param outcome     What happened during the crawl
 * @param hashes      New content hashes (provide on "updated" or "refreshed")
 */
export function markCrawled(
  registryId: string,
  outcome: CrawlOutcome,
  hashes?: MenuHashes,
): void {
  const queue  = loadQueue();
  const record = queue[registryId];
  if (!record) return;

  const now  = new Date().toISOString();
  const fail = outcome === "failed";

  record.lastCrawledAt       = now;
  record.consecutiveFailures = fail ? record.consecutiveFailures + 1 : 0;

  if (outcome === "updated") {
    record.lastChangedAt = now;
    if (hashes) record.hashes = hashes;
  } else if (outcome === "refreshed" && hashes) {
    record.hashes = hashes;
  }

  record.refreshTier  = assignTier(record);
  record.nextCrawlDue = computeNextCrawlDue(record.refreshTier, record.consecutiveFailures);

  queue[registryId] = record;
  saveQueue(queue);
}

/**
 * Increment the interaction count for a restaurant and re-tier if needed.
 *
 * Call this whenever a user views the restaurant detail page or submits feedback.
 * High-interaction restaurants are promoted to the "high" refresh tier.
 */
export function bumpInteraction(registryId: string): void {
  const queue  = loadQueue();
  const record = queue[registryId];
  if (!record) return;

  record.interactionCount += 1;
  const newTier = assignTier(record);

  // If the tier improved, bring forward the next crawl deadline
  const tierOrder: RefreshTier[] = ["stale", "low", "medium", "high"];
  if (tierOrder.indexOf(newTier) > tierOrder.indexOf(record.refreshTier)) {
    record.refreshTier  = newTier;
    record.nextCrawlDue = computeNextCrawlDue(newTier, record.consecutiveFailures);
  }

  queue[registryId] = record;
  saveQueue(queue);
}

/**
 * Upgrade the best source priority for a restaurant.
 *
 * Call this when a higher-priority source (e.g. a Toast integration) becomes
 * available so the next crawl uses the better source.
 */
export function upgradePriority(registryId: string, priority: CrawlSourcePriority, sourceUrl?: string): void {
  const queue  = loadQueue();
  const record = queue[registryId];
  if (!record) return;
  if (priority < record.bestSourcePriority) {
    record.bestSourcePriority = priority;
    if (sourceUrl) record.sourceUrl = sourceUrl;
    queue[registryId] = record;
    saveQueue(queue);
  }
}

/**
 * Return the next batch of restaurants due for a crawl, sorted by urgency.
 *
 * Sort order:
 *   1. Tier: stale first, then high, medium, low
 *   2. Overdue longest (earliest nextCrawlDue)
 *   3. Most interactions (most popular first, for tie-breaking)
 *
 * @param limit  Maximum number of entries to return (default 5)
 */
export function getNextCrawlBatch(limit = 5): CrawlQueueEntry[] {
  const queue = loadQueue();
  const now   = Date.now();

  const tierOrder: Record<RefreshTier, number> = {
    stale: 0, high: 1, medium: 2, low: 3,
  };

  return Object.values(queue)
    // Only return restaurants that are actually overdue (backoff handles failure pacing)
    .filter((r) => new Date(r.nextCrawlDue).getTime() <= now)
    .sort((a, b) => {
      const tierDiff = tierOrder[a.refreshTier] - tierOrder[b.refreshTier];
      if (tierDiff !== 0) return tierDiff;
      const dateDiff = new Date(a.nextCrawlDue).getTime() - new Date(b.nextCrawlDue).getTime();
      if (dateDiff !== 0) return dateDiff;
      return b.interactionCount - a.interactionCount;
    })
    .slice(0, limit)
    .map((r) => ({
      registryId:         r.registryId,
      displayName:        r.registryId, // caller enriches from registry if needed
      refreshTier:        r.refreshTier,
      interactionCount:   r.interactionCount,
      nextCrawlDue:       r.nextCrawlDue,
      sourceUrl:          r.sourceUrl,
      bestSourcePriority: r.bestSourcePriority,
    }));
}

/**
 * Return summary stats for the queue (useful for a debug panel).
 */
export function getQueueStats(): {
  total: number;
  overdue: number;
  byTier: Record<RefreshTier, number>;
} {
  const queue   = loadQueue();
  const records = Object.values(queue);
  const now     = Date.now();

  const byTier: Record<RefreshTier, number> = { stale: 0, high: 0, medium: 0, low: 0 };
  let overdue = 0;

  for (const r of records) {
    byTier[r.refreshTier]++;
    if (new Date(r.nextCrawlDue).getTime() <= now) overdue++;
  }

  return { total: records.length, overdue, byTier };
}

/**
 * Resolve source priority from a MenuIngestionSourceType string.
 * Convenience wrapper around SOURCE_PRIORITY map.
 */
export function sourceToPriority(sourceType: string): CrawlSourcePriority {
  return SOURCE_PRIORITY[sourceType] ?? "F";
}
