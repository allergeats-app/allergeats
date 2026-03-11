/**
 * lib/registry/types.ts
 *
 * Canonical restaurant registry — types.
 *
 * One CanonicalRestaurant record per physical restaurant location.
 * Multiple external sources (OSM, Google Places, Yelp, official API) all
 * contribute to — and are deduplicated into — a single canonical record.
 *
 * The registry is the authoritative source of internal restaurant IDs.
 * All other layers (scoring, ingestion, learning) reference `registryId`.
 */

import type { SourceConfidence } from "@/lib/menu-ingestion/types";

// ─── Source references ────────────────────────────────────────────────────────

/**
 * Which external system contributed data for this record.
 * Distinct from MenuIngestionSourceType — this is about the *restaurant entity*,
 * not the menu content.
 */
export type RegistrySourceType =
  | "google_places"   // Google Places API
  | "yelp"            // Yelp Fusion API
  | "osm"             // OpenStreetMap / Overpass
  | "toast"           // Toast POS (restaurant is a Toast customer)
  | "square"          // Square POS
  | "official_api"    // restaurant-controlled data feed
  | "user";           // manually added by the user

/**
 * A record of one source contributing to a canonical restaurant entry.
 * Multiple sources can contribute; the registry merges their data.
 */
export type RegistrySourceRef = {
  sourceType: RegistrySourceType;
  /** The ID this source uses for this restaurant (e.g. Google place_id, OSM node ID). */
  externalId?: string;
  /** ISO-8601 timestamp when this source last confirmed the restaurant exists. */
  seenAt: string;
  confidence: SourceConfidence;
};

// ─── Deduplication signals ────────────────────────────────────────────────────

/**
 * Which dedup signal caused two records to be identified as the same restaurant.
 * Stored for auditability.
 */
export type DedupeSignal =
  | "name+address"  // normalized name + normalized address exact match
  | "phone"         // phone number (digits only) exact match
  | "domain"        // website domain exact match
  | "geo+name";     // within GEO_THRESHOLD_MILES AND normalized name is similar

// ─── Canonical record ─────────────────────────────────────────────────────────

/**
 * The single authoritative record for one physical restaurant location.
 *
 * Fields are populated progressively — a first-seen OSM record may only have
 * a name and coordinates; a later Google Places merge adds phone, website, etc.
 * Confidence escalates as higher-quality sources confirm the record.
 */
export type CanonicalRestaurant = {
  // ── Internal identity ────────────────────────────────────────────────────
  /** Stable internal ID — deterministic hash of normalizedName + normalizedAddress. */
  registryId: string;
  /** Lowercase, punctuation-stripped name used for dedup. Never shown in UI. */
  normalizedName: string;
  /** Lowercase, abbreviation-expanded address used for dedup. Never shown in UI. */
  normalizedAddress: string;

  // ── External IDs (cross-reference table) ─────────────────────────────────
  googlePlaceId?: string;
  yelpBusinessId?: string;
  /** e.g. "node/12345678" or "way/87654321" */
  osmId?: string;
  /** Toast restaurant GUID — set when a ToastAdapter record is merged in. */
  toastGuid?: string;
  /** Square location ID — set when a SquareAdapter record is merged in. */
  squareLocationId?: string;

  // ── Display data (best available from all merged sources) ─────────────────
  displayName: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  /** Full website URL. */
  website?: string;
  /** Domain extracted from website (e.g. "chipotle.com"). Used for dedup. */
  websiteDomain?: string;
  cuisine?: string;

  // ── Source tracking ───────────────────────────────────────────────────────
  /** Overall confidence, escalated to the best source that has contributed. */
  sourceConfidence: SourceConfidence;
  /** All sources that have contributed data to this record (newest last). */
  sources: RegistrySourceRef[];
  /** Signal that caused the most recent merge (null for first-seen records). */
  lastDedupeSignal?: DedupeSignal;

  // ── Timestamps ────────────────────────────────────────────────────────────
  /** ISO-8601 timestamp when this record was first created. */
  createdAt: string;
  /**
   * ISO-8601 timestamp of the most recent source confirmation.
   * Used to identify stale records (not seen in >90 days).
   */
  lastSeenAt: string;
};

// ─── Input type ───────────────────────────────────────────────────────────────

/**
 * What a source provides when registering a restaurant.
 * Passed to `upsertRestaurant()` — the registry normalizes and merges it.
 */
export type RestaurantCandidate = {
  displayName: string;
  address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  cuisine?: string;

  // External IDs — provide whichever the source knows
  googlePlaceId?: string;
  yelpBusinessId?: string;
  osmId?: string;
  toastGuid?: string;
  squareLocationId?: string;

  sourceType: RegistrySourceType;
  externalId?: string;
  confidence: SourceConfidence;
};
