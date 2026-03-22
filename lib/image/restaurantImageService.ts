// lib/image/restaurantImageService.ts
// Main orchestrator for restaurant image enrichment.
//
// Provider priority:
//   1. Official website (og:image, JSON-LD, scored img tags)
//   2. Google Places (API match → photo reference)
//   3. Yelp (API search → business photo)
//   4. Placeholder (always succeeds)
//
// Results are cached in Supabase with TTL (30 days positive, 7 days negative).
// Logs explain which provider won and why.

import type { RestaurantImageInput, RestaurantImageResult, ProviderCandidate } from "./types";
import { websiteImageProvider } from "./providers/websiteImageProvider";
import { googlePlacesImageProvider } from "./providers/googlePlacesImageProvider";
import { yelpImageProvider } from "./providers/yelpImageProvider";
import { getCachedImage, setCachedImage } from "./imageCache";

const PLACEHOLDER_IMAGE: RestaurantImageResult = {
  imageUrl:   null,
  source:     "placeholder",
  confidence: "low",
  cached:     false,
  fetchedAt:  new Date().toISOString(),
};

/** Convert a ProviderCandidate to the public RestaurantImageResult shape */
function toResult(candidate: ProviderCandidate, cached = false): RestaurantImageResult {
  return {
    imageUrl:       candidate.imageUrl,
    thumbnailUrl:   candidate.thumbnailUrl,
    source:         candidate.source,
    sourcePageUrl:  candidate.sourcePageUrl,
    attribution:    candidate.attribution,
    confidence:     candidate.confidence,
    matchedName:    candidate.matchedName,
    matchedAddress: candidate.matchedAddress,
    width:          candidate.width,
    height:         candidate.height,
    cached,
    fetchedAt:      new Date().toISOString(),
  };
}

/**
 * Fetch the best available image for a restaurant.
 * Results are cached in Supabase — repeated calls for the same restaurant
 * will return the cached result without hitting external APIs.
 *
 * @param input  Identifying info for the restaurant
 * @param opts   Options (skipCache for force-refresh)
 */
export async function getRestaurantImage(
  input: RestaurantImageInput,
  opts: { skipCache?: boolean } = {}
): Promise<RestaurantImageResult> {
  const label = `[restaurantImageService] ${input.name}`;

  // ── Check cache first ─────────────────────────────────────────────────────
  if (!opts.skipCache) {
    const cached = await getCachedImage(input);
    if (cached) {
      console.log(`${label}: cache hit (source=${cached.source}, confidence=${cached.confidence})`);
      return cached;
    }
  }

  console.log(`${label}: cache miss — running providers`);

  // ── Run providers in priority order, stop at first success ────────────────
  const providers: Array<{
    name: string;
    fn: (input: RestaurantImageInput) => Promise<ProviderCandidate | null>;
    minConfidence?: ProviderCandidate["confidence"];
  }> = [
    { name: "website",       fn: websiteImageProvider,      minConfidence: "low" },
    { name: "google_places", fn: googlePlacesImageProvider,  minConfidence: "low" },
    { name: "yelp",          fn: yelpImageProvider,          minConfidence: "low" },
  ];

  let winner: ProviderCandidate | null = null;

  for (const provider of providers) {
    try {
      const candidate = await provider.fn(input);
      if (candidate?.imageUrl) {
        winner = candidate;
        console.log(
          `${label}: ✓ ${provider.name} won ` +
          `(confidence=${candidate.confidence}, score=${candidate.score})`
        );
        break;
      } else {
        console.log(`${label}: ✗ ${provider.name} returned no result`);
      }
    } catch (err) {
      console.warn(`${label}: ✗ ${provider.name} threw:`, err);
    }
  }

  const result = winner
    ? toResult(winner)
    : { ...PLACEHOLDER_IMAGE, fetchedAt: new Date().toISOString() };

  if (!winner) {
    console.log(`${label}: all providers failed — using placeholder`);
  }

  // ── Cache the result ──────────────────────────────────────────────────────
  await setCachedImage(input, result).catch((err) =>
    console.warn(`${label}: failed to cache result:`, err)
  );

  return result;
}

/**
 * Batch-enrich a list of restaurants.
 * Runs up to `concurrency` providers in parallel to respect rate limits.
 */
export async function batchGetRestaurantImages(
  inputs: RestaurantImageInput[],
  opts: { skipCache?: boolean; concurrency?: number } = {}
): Promise<Map<string, RestaurantImageResult>> {
  const { concurrency = 3 } = opts;
  const results = new Map<string, RestaurantImageResult>();

  for (let i = 0; i < inputs.length; i += concurrency) {
    const batch = inputs.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((input) =>
        getRestaurantImage(input, opts).then((r) => ({ input, result: r }))
      )
    );
    for (const { input, result } of batchResults) {
      results.set(input.name, result);
    }
  }

  return results;
}
