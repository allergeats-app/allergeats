// lib/image/imageScorer.ts
// Scores candidate images extracted from a restaurant website.
// Used by websiteImageProvider.ts to pick the best image from a page.

export type ImageCandidate = {
  url: string;
  score: number;
  reason: string;
};

/** Patterns that indicate a bad image (reject immediately) */
const REJECT_PATTERNS = [
  /favicon/i,
  /sprite/i,
  /icon(?!ic)/i,     // icon but not "iconic"
  /logo(?=.*\.(ico|svg)$)/i, // svg/ico logos
  /pixel\.(gif|png)/i,       // tracking pixels
  /badge/i,
  /banner\/ad/i,
  /advertisement/i,
  /doordash/i,
  /ubereats/i,
  /grubhub/i,
  /delivery/i,
  /app[-_]store/i,
  /google[-_]play/i,
  /social[-_]share/i,
  /twitter\.(com|svg|png)/i,
  /facebook\.(com|svg|png)/i,
  /instagram\.(com|svg|png)/i,
  /apple[-_]touch[-_]icon/i,
  /\.svg$/i,               // SVG logos tend to be icons
  /1x1/i,                  // 1x1 pixel trackers
];

/** Patterns that boost the score (hero/food images) */
const BOOST_PATTERNS = [
  { pattern: /hero/i,        score: 20, reason: "hero image" },
  { pattern: /banner/i,      score: 15, reason: "banner image" },
  { pattern: /featured/i,    score: 15, reason: "featured image" },
  { pattern: /cover/i,       score: 12, reason: "cover image" },
  { pattern: /header/i,      score: 10, reason: "header image" },
  { pattern: /background/i,  score: 8,  reason: "background image" },
  { pattern: /restaurant/i,  score: 10, reason: "restaurant keyword in url" },
  { pattern: /food/i,        score: 8,  reason: "food keyword in url" },
  { pattern: /dish/i,        score: 8,  reason: "dish keyword in url" },
  { pattern: /menu/i,        score: 5,  reason: "menu keyword in url" },
  { pattern: /\.(jpg|jpeg|webp)$/i, score: 5, reason: "JPEG/WebP format" },
];

/** CDN patterns for large hosted images (usually content, not icons) */
const CDN_PATTERNS = [
  /cloudinary\.com/i,
  /cloudfront\.net/i,
  /imgix\.net/i,
  /squarespace-cdn\.com/i,
  /s3\.amazonaws\.com/i,
  /res\.cloudinary/i,
  /images\.squarespace/i,
  /media\.toasttab/i,         // Toast POS CDN
  /cachestore\.bentobox/i,    // BentoBox restaurant CMS CDN
  /static\.wixstatic/i,
];

/**
 * Attempt to resolve a potentially relative URL against a base.
 * Returns null if the URL is clearly bad.
 */
export function resolveUrl(src: string, base: string): string | null {
  try {
    if (src.startsWith("data:")) return null; // data URIs too large
    const url = new URL(src, base);
    return url.href;
  } catch {
    return null;
  }
}

/**
 * Score a single image URL candidate.
 * @param url       Absolute image URL
 * @param base      Base page URL (for context)
 * @param width     Known width (from img tag or meta) — null if unknown
 * @param height    Known height — null if unknown
 * @returns score (higher = better) or -1 if rejected
 */
export function scoreImageUrl(
  url: string,
  base: string,
  width: number | null = null,
  height: number | null = null
): { score: number; reasons: string[] } {
  // Hard rejects
  for (const pattern of REJECT_PATTERNS) {
    if (pattern.test(url)) {
      return { score: -1, reasons: [`rejected: matches ${pattern}`] };
    }
  }

  // Hard reject: very small known dimensions
  if (width !== null && height !== null && (width < 100 || height < 100)) {
    return { score: -1, reasons: [`rejected: too small (${width}×${height})`] };
  }
  if (width !== null && width < 80) {
    return { score: -1, reasons: [`rejected: width too small (${width}px)`] };
  }

  let score = 40; // baseline
  const reasons: string[] = ["baseline"];

  // Boost for known large dimensions
  if (width !== null && height !== null) {
    if (width >= 1200) { score += 25; reasons.push("very large image"); }
    else if (width >= 600) { score += 15; reasons.push("large image"); }
    else if (width >= 300) { score += 5;  reasons.push("medium image"); }
  }

  // Boost for aspect ratios that look like hero images (landscape)
  if (width !== null && height !== null && width > height * 1.4) {
    score += 8;
    reasons.push("landscape aspect ratio");
  }

  // Boost for CDN URLs (usually content images, not icons)
  for (const cdn of CDN_PATTERNS) {
    if (cdn.test(url)) { score += 10; reasons.push("CDN-hosted"); break; }
  }

  // Pattern-based boosts/penalties
  for (const boost of BOOST_PATTERNS) {
    if (boost.pattern.test(url)) {
      score += boost.score;
      reasons.push(boost.reason);
    }
  }

  // Bonus: same domain as base URL (official image)
  try {
    const imgDomain = new URL(url).hostname;
    const baseDomain = new URL(base).hostname;
    if (imgDomain === baseDomain || imgDomain.endsWith("." + baseDomain)) {
      score += 8;
      reasons.push("same-domain image");
    }
  } catch { /* ignore */ }

  return { score, reasons };
}

/**
 * Sort candidates by score descending, return top N.
 */
export function rankCandidates(candidates: ImageCandidate[], top = 1): ImageCandidate[] {
  return [...candidates]
    .filter((c) => c.score >= 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}
