// lib/image/providers/websiteImageProvider.ts
// Extracts the best image from a restaurant's official website.
//
// Priority order:
//   1. og:image meta tag
//   2. twitter:image meta tag
//   3. JSON-LD structured data (image, logo, thumbnailUrl)
//   4. High-scoring <img> tags (scored by size, position, filename)

import type { RestaurantImageInput, ProviderCandidate } from "../types";
import { resolveUrl, scoreImageUrl, rankCandidates } from "../imageScorer";
import type { ImageCandidate } from "../imageScorer";

const FETCH_TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 500_000; // 500 KB — enough for <head> + above-fold content

/** Simple in-memory rate limiter: min gap between requests per domain */
const domainLastFetch = new Map<string, number>();
const DOMAIN_RATE_MS = 2_000;

async function rateLimitedFetch(url: string): Promise<Response> {
  let domain = "";
  try { domain = new URL(url).hostname; } catch { /* ignore */ }

  if (domain) {
    const last = domainLastFetch.get(domain) ?? 0;
    const wait = DOMAIN_RATE_MS - (Date.now() - last);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    domainLastFetch.set(domain, Date.now());
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AllergEats-ImageBot/1.0; +https://allegeats.app/bot)",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Extract a meta tag content by property or name attribute */
function extractMeta(html: string, attr: string, value: string): string | null {
  // Match: <meta property="og:image" content="..."> or <meta name="..." content="...">
  const patterns = [
    new RegExp(`<meta[^>]+${attr}="${value}"[^>]+content="([^"]+)"`, "i"),
    new RegExp(`<meta[^>]+content="([^"]+)"[^>]+${attr}="${value}"`, "i"),
    new RegExp(`<meta[^>]+${attr}='${value}'[^>]+content='([^']+)'`, "i"),
    new RegExp(`<meta[^>]+content='([^']+)'[^>]+${attr}='${value}'`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** Extract JSON-LD image fields */
function extractJsonLd(html: string, base: string): string[] {
  const results: string[] = [];
  const scriptPattern = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const candidates = Array.isArray(data) ? data : [data];
      for (const item of candidates) {
        // Common JSON-LD image fields
        for (const key of ["image", "logo", "thumbnailUrl", "primaryImageOfPage"]) {
          const val = item[key];
          if (typeof val === "string" && val.startsWith("http")) results.push(val);
          else if (typeof val === "object" && val?.url) results.push(String(val.url));
          else if (Array.isArray(val)) {
            for (const v of val) {
              if (typeof v === "string") results.push(v);
              else if (v?.url) results.push(String(v.url));
            }
          }
        }
      }
    } catch { /* malformed JSON */ }
  }

  return results
    .map((u) => resolveUrl(u, base))
    .filter((u): u is string => u !== null);
}

/** Extract <img> tags with src, width, height attributes */
function extractImgTags(html: string, base: string): ImageCandidate[] {
  const candidates: ImageCandidate[] = [];
  const imgPattern = /<img[^>]+>/gi;
  let match: RegExpExecArray | null;

  while ((match = imgPattern.exec(html)) !== null) {
    const tag = match[0];

    // Extract src (and data-src for lazy-loaded images)
    const srcMatch = tag.match(/\bsrc="([^"]+)"/i) ?? tag.match(/\bdata-src="([^"]+)"/i);
    if (!srcMatch?.[1]) continue;

    const resolved = resolveUrl(srcMatch[1], base);
    if (!resolved) continue;

    const widthMatch  = tag.match(/\bwidth="(\d+)"/i);
    const heightMatch = tag.match(/\bheight="(\d+)"/i);
    const w = widthMatch  ? parseInt(widthMatch[1], 10)  : null;
    const h = heightMatch ? parseInt(heightMatch[1], 10) : null;

    const { score, reasons } = scoreImageUrl(resolved, base, w, h);
    if (score < 0) continue;

    // Boost if img appears in a prominent position (near top of HTML)
    const position = match.index / html.length;
    const positionScore = position < 0.15 ? 15 : position < 0.35 ? 8 : 0;

    candidates.push({
      url:    resolved,
      score:  score + positionScore,
      reason: reasons.join(", "),
    });
  }

  return candidates;
}

/** Partial HTML fetch — stop reading after MAX_HTML_BYTES */
async function fetchPartialHtml(url: string): Promise<string> {
  const res = await rateLimitedFetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);

  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Non-HTML content type: ${contentType}`);
  }

  if (!res.body) return await res.text();

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      total += value.byteLength;
      if (total >= MAX_HTML_BYTES) break;
    }
  } finally {
    reader.cancel().catch(() => {});
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { merged.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(merged);
}

/**
 * Provider: extract the best image from a restaurant's official website.
 * Returns null if no suitable image is found.
 */
export async function websiteImageProvider(
  input: RestaurantImageInput
): Promise<ProviderCandidate | null> {
  const url = input.website;
  if (!url) return null;

  let html: string;
  try {
    html = await fetchPartialHtml(url);
  } catch (err) {
    console.warn(`[websiteImageProvider] Failed to fetch ${url}:`, err);
    return null;
  }

  const log: string[] = [];

  // ── Priority 1: og:image ──────────────────────────────────────────────────
  const ogImage = extractMeta(html, "property", "og:image");
  if (ogImage) {
    const resolved = resolveUrl(ogImage, url);
    if (resolved) {
      const { score } = scoreImageUrl(resolved, url);
      if (score >= 0) {
        log.push(`og:image selected (score ${score})`);
        console.log(`[websiteImageProvider] ${input.name}: ${log.join(" → ")}`);
        return {
          imageUrl:      resolved,
          thumbnailUrl:  null,
          source:        "website",
          sourcePageUrl: url,
          attribution:   null,
          confidence:    "high",
          matchedName:   input.name,
          matchedAddress: input.address ?? null,
          width:         null,
          height:        null,
          score:         80 + score / 10,
        };
      }
    }
    log.push("og:image rejected by scorer");
  }

  // ── Priority 2: twitter:image ─────────────────────────────────────────────
  const twitterImage =
    extractMeta(html, "name", "twitter:image") ??
    extractMeta(html, "property", "twitter:image");
  if (twitterImage) {
    const resolved = resolveUrl(twitterImage, url);
    if (resolved) {
      const { score } = scoreImageUrl(resolved, url);
      if (score >= 0) {
        log.push(`twitter:image selected (score ${score})`);
        console.log(`[websiteImageProvider] ${input.name}: ${log.join(" → ")}`);
        return {
          imageUrl:      resolved,
          thumbnailUrl:  null,
          source:        "website",
          sourcePageUrl: url,
          attribution:   null,
          confidence:    "high",
          matchedName:   input.name,
          matchedAddress: input.address ?? null,
          width:         null,
          height:        null,
          score:         75,
        };
      }
    }
    log.push("twitter:image rejected");
  }

  // ── Priority 3: JSON-LD structured data ───────────────────────────────────
  const jsonLdUrls = extractJsonLd(html, url);
  for (const imgUrl of jsonLdUrls) {
    const { score } = scoreImageUrl(imgUrl, url);
    if (score >= 0) {
      log.push(`json-ld image selected (score ${score})`);
      console.log(`[websiteImageProvider] ${input.name}: ${log.join(" → ")}`);
      return {
        imageUrl:      imgUrl,
        thumbnailUrl:  null,
        source:        "website",
        sourcePageUrl: url,
        attribution:   null,
        confidence:    "medium",
        matchedName:   input.name,
        matchedAddress: input.address ?? null,
        width:         null,
        height:        null,
        score:         65,
      };
    }
  }

  // ── Priority 4: scored img tags ───────────────────────────────────────────
  const imgCandidates = extractImgTags(html, url);
  const best = rankCandidates(imgCandidates, 1)[0];
  if (best && best.score >= 50) {
    log.push(`img tag selected (score ${best.score}, reason: ${best.reason})`);
    console.log(`[websiteImageProvider] ${input.name}: ${log.join(" → ")}`);
    return {
      imageUrl:      best.url,
      thumbnailUrl:  null,
      source:        "website",
      sourcePageUrl: url,
      attribution:   null,
      confidence:    best.score >= 70 ? "medium" : "low",
      matchedName:   input.name,
      matchedAddress: input.address ?? null,
      width:         null,
      height:        null,
      score:         best.score,
    };
  }

  log.push("no suitable image found");
  console.log(`[websiteImageProvider] ${input.name}: ${log.join(" → ")}`);
  return null;
}
