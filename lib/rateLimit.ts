/**
 * lib/rateLimit.ts
 * Shared in-memory sliding-window rate limiter for API routes.
 *
 * Note: on multi-instance deployments (Vercel) each instance has its own map,
 * so limits are per-instance rather than global. Still provides meaningful
 * protection — a single abuser hits the same instance repeatedly.
 */

interface Entry { count: number; windowStart: number }

const map = new Map<string, Entry>();

// Prune entries older than their window to prevent unbounded memory growth.
// Called lazily on each isRateLimited() check — no setInterval needed.
let lastPrune = Date.now();
const PRUNE_EVERY_MS = 5 * 60_000;

function maybePrune(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_EVERY_MS) return;
  lastPrune = now;
  // Use PRUNE_EVERY_MS as the prune threshold so entries from long windows
  // (e.g. 300s) aren't prematurely evicted by a call from a short window (e.g. 60s).
  for (const [key, entry] of map) {
    if (now - entry.windowStart > PRUNE_EVERY_MS) map.delete(key);
  }
}

/**
 * Returns true if the caller has exceeded their rate limit.
 * Call once per request — it increments the counter as a side effect.
 *
 * @param key        Unique identifier for the caller (IP address recommended)
 * @param windowMs   Rolling window length in milliseconds
 * @param maxRequests Maximum allowed requests within the window
 */
export function isRateLimited(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  maybePrune();
  const entry = map.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    map.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > maxRequests;
}

/** Convenience: extract the best available IP from a Request header. */
export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
