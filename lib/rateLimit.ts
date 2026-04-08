/**
 * lib/rateLimit.ts
 *
 * Sliding-window rate limiter with two tiers:
 *
 *   1. Vercel KV (Redis) — used when KV_REST_API_URL + KV_REST_API_TOKEN are set.
 *      Limits are global across all serverless instances. Atomic INCR + EXPIRE
 *      via a single pipeline prevents race conditions.
 *
 *   2. In-memory Map — automatic fallback when KV is not configured (local dev,
 *      preview deploys without KV attached). Per-instance only, but still provides
 *      meaningful protection against naive abuse.
 *
 * Usage:
 *   const limited = await isRateLimited(ip, 60_000, 30);
 *   if (limited) return new Response("Too Many Requests", { status: 429 });
 */

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface Entry { count: number; windowStart: number }
const memMap = new Map<string, Entry>();
let lastPrune = Date.now();
const PRUNE_EVERY_MS = 5 * 60_000;

function maybePrune(): void {
  const now = Date.now();
  if (now - lastPrune < PRUNE_EVERY_MS) return;
  lastPrune = now;
  for (const [key, entry] of memMap) {
    if (now - entry.windowStart > PRUNE_EVERY_MS) memMap.delete(key);
  }
}

function memIsRateLimited(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  maybePrune();
  const entry = memMap.get(key);
  if (!entry || now - entry.windowStart > windowMs) {
    memMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  entry.count++;
  return entry.count > maxRequests;
}

// ─── KV (Redis) implementation ────────────────────────────────────────────────

const kvAvailable =
  typeof process !== "undefined" &&
  Boolean(process.env.KV_REST_API_URL) &&
  Boolean(process.env.KV_REST_API_TOKEN);

async function kvIsRateLimited(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<boolean> {
  try {
    const { kv } = await import("@vercel/kv");
    const windowSec = Math.ceil(windowMs / 1000);
    const redisKey = `rl:${key}:${Math.floor(Date.now() / windowMs)}`;

    // Pipeline: INCR then SET expiry only if key is new (atomic)
    const [[, count]] = await kv.pipeline()
      .incr(redisKey)
      .expire(redisKey, windowSec * 2) // 2× window so key outlasts the window
      .exec() as [[null, number], [null, number]];

    return count > maxRequests;
  } catch {
    // KV call failed — fall back to in-memory so the request isn't blocked
    return memIsRateLimited(key, windowMs, maxRequests);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns true if the caller has exceeded their rate limit.
 * Increments the counter as a side effect.
 *
 * @param key         Unique caller identifier (IP address recommended)
 * @param windowMs    Rolling window length in milliseconds
 * @param maxRequests Maximum allowed requests within the window
 */
export async function isRateLimited(
  key: string,
  windowMs: number,
  maxRequests: number,
): Promise<boolean> {
  if (kvAvailable) return kvIsRateLimited(key, windowMs, maxRequests);
  return memIsRateLimited(key, windowMs, maxRequests);
}

/** Convenience: extract the best available IP from a Request header. */
export function getClientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}