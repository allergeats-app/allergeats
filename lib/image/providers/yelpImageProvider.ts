// lib/image/providers/yelpImageProvider.ts
// Fetches a restaurant image using the Yelp Fusion API.
//
// Two-step process:
//   1. Business Search → find matching business, score against query
//   2. Business Details → get image_url and photos[]
//
// Env var required: YELP_API_KEY
// Docs: https://docs.developer.yelp.com/reference/v3_business_search

import type { RestaurantImageInput, ProviderCandidate } from "../types";
import { scoreMatch, MATCH_THRESHOLD, normalizePhone } from "../imageMatcher";

const YELP_BASE = "https://api.yelp.com/v3";
const FETCH_TIMEOUT_MS = 10_000;

async function yelpFetch(path: string, apiKey: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`${YELP_BASE}${path}`, {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });
    if (res.status === 429) throw new Error("Yelp rate limit reached");
    if (!res.ok) throw new Error(`Yelp API ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

type YelpBusiness = {
  id: string;
  name: string;
  image_url: string;
  url: string;
  phone: string;
  display_phone: string;
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
    display_address: string[];
  };
};

type YelpBusinessDetails = YelpBusiness & {
  photos: string[];
};

type YelpSearchResponse = {
  businesses: YelpBusiness[];
  total: number;
};

/** Yelp photo URLs use /ls/ or /348s/ suffix for resizing */
function yelpThumbnail(imageUrl: string): string {
  // Yelp images: https://s3-media3.fl.yelpcdn.com/bphoto/XXX/o.jpg
  // Thumbnail:   https://s3-media3.fl.yelpcdn.com/bphoto/XXX/l.jpg (large)
  // or           https://s3-media3.fl.yelpcdn.com/bphoto/XXX/300s.jpg (300px)
  return imageUrl.replace(/\/o\./, "/ls.").replace(/\/ls\./, "/ls.");
}

/**
 * Provider: fetch a restaurant image from Yelp Fusion API.
 * Disabled by default if YELP_API_KEY is not set — fails gracefully.
 */
export async function yelpImageProvider(
  input: RestaurantImageInput
): Promise<ProviderCandidate | null> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    // Not a warning — Yelp is optional
    return null;
  }

  // Build search params
  const params = new URLSearchParams({
    term:  input.name,
    limit: "3", // check top 3 to find the best match
  });
  if (input.lat != null && input.lng != null) {
    params.set("latitude",  String(input.lat));
    params.set("longitude", String(input.lng));
  } else if (input.city) {
    params.set("location", [input.city, input.state, input.zip].filter(Boolean).join(", "));
  } else {
    console.log(`[yelpImageProvider] ${input.name}: no location info, skipping`);
    return null;
  }

  let businesses: YelpBusiness[] = [];
  try {
    const data = await yelpFetch(`/businesses/search?${params}`, apiKey) as YelpSearchResponse;
    businesses = data.businesses ?? [];
  } catch (err) {
    console.warn(`[yelpImageProvider] ${input.name}: search failed:`, err);
    return null;
  }

  if (!businesses.length) {
    console.log(`[yelpImageProvider] ${input.name}: no results`);
    return null;
  }

  // Score each candidate against the query
  let bestBusiness: YelpBusiness | null = null;
  let bestScore = 0;

  for (const biz of businesses) {
    const { score, reasons } = scoreMatch(input, {
      name:    biz.name,
      address: biz.location.address1,
      phone:   biz.phone,
      city:    biz.location.city,
      state:   biz.location.state,
    });

    console.log(
      `[yelpImageProvider] ${input.name} ↔ "${biz.name}": score=${score} (${reasons.join(", ")})`
    );

    if (score > bestScore) {
      bestScore = score;
      bestBusiness = biz;
    }
  }

  if (!bestBusiness || bestScore < MATCH_THRESHOLD) {
    console.log(
      `[yelpImageProvider] ${input.name}: best score ${bestScore} below threshold ${MATCH_THRESHOLD}`
    );
    return null;
  }

  // Fetch business details for additional photos
  let photos: string[] = [];
  let imageUrl = bestBusiness.image_url;

  try {
    const details = await yelpFetch(`/businesses/${bestBusiness.id}`, apiKey) as YelpBusinessDetails;
    photos = details.photos ?? [];
    if (photos.length) imageUrl = photos[0]; // first photo is usually the best
  } catch {
    // Details call is optional — use search result image_url
    if (imageUrl) photos = [imageUrl];
  }

  if (!imageUrl) {
    console.log(`[yelpImageProvider] ${input.name}: matched "${bestBusiness.name}" but no image`);
    return null;
  }

  const confidence =
    bestScore >= 70 ? "high" :
    bestScore >= 45 ? "medium" :
    "low";

  console.log(
    `[yelpImageProvider] ${input.name}: selected "${bestBusiness.name}" ` +
    `(score=${bestScore}, confidence=${confidence}, photos=${photos.length})`
  );

  return {
    imageUrl,
    thumbnailUrl:  photos.length > 1 ? yelpThumbnail(photos[0]) : null,
    source:        "yelp",
    sourcePageUrl: bestBusiness.url,
    attribution:   "Photo from Yelp",
    confidence,
    matchedName:    bestBusiness.name,
    matchedAddress: bestBusiness.location.display_address?.join(", ") ?? null,
    width:          null,
    height:         null,
    score:          bestScore,
  };
}
