/**
 * lib/menu-crawl/types.ts
 *
 * Types for the menu crawl queue and change-detection layer.
 *
 * Architecture:
 *   - Every restaurant in the registry gets a CrawlRecord tracking when
 *     its menu was last fetched, which source was used, and whether the
 *     content changed.
 *   - CrawlQueue assigns priorities so high-traffic and recently-changed
 *     restaurants are refreshed more frequently.
 *   - Change detection uses content hashes: if the raw snapshot hash is
 *     unchanged we skip re-parsing; if the normalized menu hash changes
 *     we know the usable menu actually changed.
 */

// ─── Source priority ──────────────────────────────────────────────────────────

/**
 * Priority order for menu sources. Lower number = preferred.
 *
 * A: Official POS API  — structured, authoritative, real-time
 * B: Own website menu  — restaurant-controlled, semi-structured
 * C: PDF               — often official but requires parsing
 * D: Image / OCR       — fallback when no text source exists
 * E: Aggregator API    — third-party (Nutritionix, etc.)
 * F: User upload       — pasted text, lowest trust
 */
export type CrawlSourcePriority = "A" | "B" | "C" | "D" | "E" | "F";

export const SOURCE_PRIORITY: Record<string, CrawlSourcePriority> = {
  // Priority A — POS APIs
  toast:        "A",
  square:       "A",
  official_api: "A",
  // Priority B — Own website
  website_html: "B",
  // Priority C — PDF
  pdf:          "C",
  // Priority D — Image / OCR
  image:        "D",
  // Priority E — Aggregator
  aggregator_api: "E",
  // Priority F — User upload
  user_upload:  "F",
};

// ─── Refresh intervals ────────────────────────────────────────────────────────

/** How often (ms) each restaurant tier should be re-crawled. */
export type RefreshTier =
  | "high"    // chains + frequently interacted restaurants → 24h
  | "medium"  // active long-tail restaurants              → 7 days
  | "low"     // stable / rarely visited                   → 30 days
  | "stale";  // never seen a menu / totally unknown       → crawl ASAP

export const REFRESH_INTERVAL_MS: Record<RefreshTier, number> = {
  high:   24 * 60 * 60 * 1000,         //  1 day
  medium:  7 * 24 * 60 * 60 * 1000,    //  7 days
  low:    30 * 24 * 60 * 60 * 1000,    // 30 days
  stale:  0,                            // always overdue
};

// ─── Change detection ─────────────────────────────────────────────────────────

/**
 * Stored hashes for change detection.
 *
 * rawSnapshotHash:      Hash of the raw bytes/text before any parsing.
 *                       If this matches, skip re-parsing entirely.
 *
 * normalizedMenuHash:   Hash of the normalized NormalizedMenu JSON
 *                       (sections + items, no timestamps).
 *                       If this changes, the user-facing menu actually changed
 *                       and downstream analysis must be invalidated.
 */
export type MenuHashes = {
  rawSnapshotHash:    string;
  normalizedMenuHash: string;
};

// ─── Crawl record (one per restaurant) ───────────────────────────────────────

/**
 * Crawl state for one restaurant. Persisted in localStorage.
 * Keyed by registryId.
 */
export type CrawlRecord = {
  registryId: string;

  // Current best source
  bestSourcePriority: CrawlSourcePriority;
  /** URL or identifier for the source being crawled. */
  sourceUrl?: string;

  // Timing
  lastCrawledAt?: string;           // ISO-8601
  lastChangedAt?: string;           // ISO-8601 — when normalized menu last changed
  nextCrawlDue:   string;           // ISO-8601 — computed refresh deadline

  // Hashes
  hashes?: MenuHashes;

  // Refresh tier
  refreshTier: RefreshTier;

  /** How many times this restaurant has been interacted with (viewed, feedback submitted). */
  interactionCount: number;

  /** True when a live POS integration (Toast/Square) is active — skips HTML crawling. */
  hasPosIntegration: boolean;

  /** Crawl failure streak — increment on failure, reset on success. */
  consecutiveFailures: number;
};

// ─── Crawl queue entry ────────────────────────────────────────────────────────

/**
 * A prioritized entry in the crawl queue.
 * Sorted by: tier (stale first) → interactionCount desc → nextCrawlDue asc.
 */
export type CrawlQueueEntry = {
  registryId: string;
  displayName: string;
  refreshTier: RefreshTier;
  interactionCount: number;
  nextCrawlDue: string;
  sourceUrl?: string;
  bestSourcePriority: CrawlSourcePriority;
};

// ─── Crawl result ─────────────────────────────────────────────────────────────

export type CrawlOutcome =
  | "unchanged"   // raw hash matched — no re-parse needed
  | "updated"     // normalized menu changed
  | "refreshed"   // raw hash changed but normalized menu is identical
  | "failed"      // fetch or parse error
  | "skipped";    // not yet due for refresh

export type CrawlResult = {
  registryId: string;
  outcome:    CrawlOutcome;
  error?:     string;
  /** Set when outcome is "updated" — the new normalized menu hash. */
  newHash?:   string;
};
