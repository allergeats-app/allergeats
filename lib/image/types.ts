// lib/image/types.ts

export type ImageSource = "website" | "google_places" | "yelp" | "placeholder";
export type ImageConfidence = "high" | "medium" | "low";

export type RestaurantImageInput = {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
};

export type RestaurantImageResult = {
  imageUrl: string | null;
  thumbnailUrl?: string | null;
  source: ImageSource;
  sourcePageUrl?: string | null;
  attribution?: string | null;
  confidence: ImageConfidence;
  matchedName?: string | null;
  matchedAddress?: string | null;
  width?: number | null;
  height?: number | null;
  cached: boolean;
  fetchedAt: string;
};

/** What each provider returns before result selection */
export type ProviderCandidate = {
  imageUrl: string;
  thumbnailUrl?: string | null;
  source: ImageSource;
  sourcePageUrl?: string | null;
  attribution?: string | null;
  confidence: ImageConfidence;
  matchedName?: string | null;
  matchedAddress?: string | null;
  width?: number | null;
  height?: number | null;
  /** Provider-specific score for ranking candidates from the same provider */
  score: number;
};

/** Supabase row shape for restaurant_images table */
export type CachedImageRow = {
  id?: string;
  cache_key: string;
  restaurant_name: string;
  image_url: string | null;
  thumbnail_url: string | null;
  source: ImageSource;
  source_page_url: string | null;
  attribution: string | null;
  confidence: ImageConfidence;
  matched_name: string | null;
  matched_address: string | null;
  width: number | null;
  height: number | null;
  fetched_at: string;
  expires_at: string;
  is_negative: boolean;
};
