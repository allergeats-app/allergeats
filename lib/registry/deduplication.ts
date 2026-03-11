/**
 * lib/registry/deduplication.ts
 *
 * Deduplication logic for the canonical restaurant registry.
 *
 * Given a list of existing canonical records and an incoming candidate,
 * findMatch() returns the best existing record that represents the same
 * physical restaurant — or null if none is found.
 *
 * Four signals are checked, in order of specificity:
 *   1. name + address  — most reliable when both are present
 *   2. phone           — globally unique; catches address-format differences
 *   3. website domain  — reliable for chains with unique domains
 *   4. geo + name      — catches records that predate address data
 */

import type { CanonicalRestaurant, DedupeSignal } from "./types";
import { normalizeName, normalizeAddress, normalizePhone, extractDomain, namesAreSimilar } from "./normalize";

/** Within this many miles, two restaurants with similar names are the same. (~50m) */
const GEO_THRESHOLD_MILES = 0.031;

// ─── Haversine (no external dep) ─────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R    = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Candidate pre-computation ────────────────────────────────────────────────

/**
 * Pre-compute all normalized signals from a candidate so they are only
 * computed once even when scanning a large registry.
 */
export type CandidateSignals = {
  normName:    string;
  normAddress: string;
  normPhone:   string | undefined;
  domain:      string | undefined;
  lat:         number | undefined;
  lng:         number | undefined;
};

export function computeSignals(candidate: {
  displayName: string;
  address?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
}): CandidateSignals {
  return {
    normName:    normalizeName(candidate.displayName),
    normAddress: normalizeAddress(candidate.address ?? ""),
    normPhone:   candidate.phone ? normalizePhone(candidate.phone) : undefined,
    domain:      candidate.website ? extractDomain(candidate.website) : undefined,
    lat:         candidate.lat,
    lng:         candidate.lng,
  };
}

// ─── Match result ─────────────────────────────────────────────────────────────

export type DedupeMatch = {
  record: CanonicalRestaurant;
  signal: DedupeSignal;
};

// ─── Main dedup function ──────────────────────────────────────────────────────

/**
 * Find the existing canonical record that matches the candidate, if any.
 *
 * Returns the first match found using the priority order:
 *   name+address > phone > domain > geo+name
 *
 * Returns null if no existing record matches.
 */
export function findMatch(
  candidate: CandidateSignals,
  existing: CanonicalRestaurant[],
): DedupeMatch | null {
  // External-ID fast-paths (skip normalization scans)
  // These are checked before the text signals because they're guaranteed unique.

  // Collect candidates for each signal tier
  let phoneMatch:   DedupeMatch | null = null;
  let domainMatch:  DedupeMatch | null = null;
  let geoMatch:     DedupeMatch | null = null;

  for (const record of existing) {
    // ── Signal 1: name + address ─────────────────────────────────────────────
    // Both must be non-empty and match exactly after normalization.
    if (
      candidate.normName    &&
      candidate.normAddress &&
      record.normalizedName    === candidate.normName &&
      record.normalizedAddress === candidate.normAddress
    ) {
      return { record, signal: "name+address" };
    }

    // ── Signal 2: phone ──────────────────────────────────────────────────────
    if (
      !phoneMatch &&
      candidate.normPhone &&
      record.phone
    ) {
      const recordPhone = normalizePhone(record.phone);
      if (recordPhone && recordPhone === candidate.normPhone) {
        phoneMatch = { record, signal: "phone" };
      }
    }

    // ── Signal 3: website domain ──────────────────────────────────────────────
    // Skip common generic domains that many businesses share (booking sites, etc.)
    if (
      !domainMatch &&
      candidate.domain &&
      record.websiteDomain &&
      !GENERIC_DOMAINS.has(candidate.domain) &&
      record.websiteDomain === candidate.domain
    ) {
      domainMatch = { record, signal: "domain" };
    }

    // ── Signal 4: geo + name similarity ──────────────────────────────────────
    if (
      !geoMatch &&
      candidate.lat != null &&
      candidate.lng != null &&
      record.lat != null &&
      record.lng != null
    ) {
      const dist = haversine(candidate.lat, candidate.lng, record.lat, record.lng);
      if (dist <= GEO_THRESHOLD_MILES && namesAreSimilar(candidate.normName, record.normalizedName)) {
        geoMatch = { record, signal: "geo+name" };
      }
    }
  }

  // Return in priority order
  return phoneMatch ?? domainMatch ?? geoMatch ?? null;
}

// ─── Generic domains blocklist ────────────────────────────────────────────────

/**
 * Website domains that are shared across many businesses and should not be
 * used as a dedup signal (e.g. ordering platforms, social networks).
 */
const GENERIC_DOMAINS = new Set([
  "yelp.com",
  "tripadvisor.com",
  "opentable.com",
  "grubhub.com",
  "doordash.com",
  "ubereats.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "google.com",
  "maps.google.com",
  "squareup.com",
  "toasttab.com",
  "order.toasttab.com",
  "linktr.ee",
]);
