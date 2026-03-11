/**
 * lib/registry/registry.ts
 *
 * Canonical restaurant registry — upsert and query API.
 *
 * Every discovered restaurant flows through upsertRestaurant():
 *   - First time seen → new canonical record created
 *   - Already known   → record merged: best data preserved, confidence escalated,
 *                        external IDs added, lastSeenAt updated
 *
 * Storage: localStorage key `allegeats_registry` (JSON array).
 * Operates entirely client-side; no network calls.
 *
 * Thread safety: localStorage reads/writes are synchronous in browsers.
 * Concurrent writes from the same tab are safe; cross-tab races are benign
 * (last write wins, which is acceptable for a restaurant directory).
 */

import type { CanonicalRestaurant, RestaurantCandidate, RegistrySourceRef } from "./types";
import type { SourceConfidence } from "@/lib/menu-ingestion/types";
import { normalizeName, normalizeAddress, extractDomain } from "./normalize";
import { computeSignals, findMatch } from "./deduplication";

// ─── Constants ────────────────────────────────────────────────────────────────

const REGISTRY_KEY = "allegeats_registry";

// ─── ID generation ────────────────────────────────────────────────────────────

/**
 * Generate a stable registry ID from normalized name + address.
 * Deterministic: same restaurant always gets the same ID even across sessions.
 * Uses DJB2 hash encoded as base-36.
 */
function generateRegistryId(normalizedName: string, normalizedAddress: string): string {
  const str = `${normalizedName}|${normalizedAddress}`;
  let hash  = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash; // keep as 32-bit signed integer
  }
  return `reg-${(hash >>> 0).toString(36)}`;
}

// ─── Confidence ordering ──────────────────────────────────────────────────────

const CONFIDENCE_RANK: Record<SourceConfidence, number> = {
  low:    1,
  medium: 2,
  high:   3,
};

/** Return whichever confidence level is higher. Never downgrades. */
function escalateConfidence(existing: SourceConfidence, incoming: SourceConfidence): SourceConfidence {
  return CONFIDENCE_RANK[incoming] > CONFIDENCE_RANK[existing] ? incoming : existing;
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function loadRegistry(): CanonicalRestaurant[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    return raw ? (JSON.parse(raw) as CanonicalRestaurant[]) : [];
  } catch {
    return [];
  }
}

function saveRegistry(records: CanonicalRestaurant[]): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(records));
  } catch {
    // Quota exceeded — skip persist (in-memory state still correct for this session)
  }
}

// ─── Merge logic ──────────────────────────────────────────────────────────────

/**
 * Merge candidate data into an existing canonical record.
 *
 * Rules:
 *   - External IDs: add if not already present (never overwrite a known ID)
 *   - Display fields: only replace if the incoming value is non-empty and the
 *     existing record has no value (best-effort enrichment, never downgrades)
 *   - Confidence: only escalates, never decreases
 *   - Sources: append a new RegistrySourceRef entry
 *   - lastSeenAt: always updated to now
 */
function mergeIntoRecord(
  record: CanonicalRestaurant,
  candidate: RestaurantCandidate,
  now: string,
): CanonicalRestaurant {
  const sourceRef: RegistrySourceRef = {
    sourceType:  candidate.sourceType,
    externalId:  candidate.externalId,
    seenAt:      now,
    confidence:  candidate.confidence,
  };

  return {
    ...record,
    // External IDs — add but never overwrite
    googlePlaceId:    record.googlePlaceId    ?? candidate.googlePlaceId,
    yelpBusinessId:   record.yelpBusinessId   ?? candidate.yelpBusinessId,
    osmId:            record.osmId            ?? candidate.osmId,
    toastGuid:        record.toastGuid        ?? candidate.toastGuid,
    squareLocationId: record.squareLocationId ?? candidate.squareLocationId,
    // Display fields — fill gaps only
    address:          record.address    ?? candidate.address,
    lat:              record.lat        ?? candidate.lat,
    lng:              record.lng        ?? candidate.lng,
    phone:            record.phone      ?? candidate.phone,
    website:          record.website    ?? candidate.website,
    websiteDomain:    record.websiteDomain ?? (candidate.website ? extractDomain(candidate.website) : undefined),
    cuisine:          record.cuisine    ?? candidate.cuisine,
    // Confidence escalates
    sourceConfidence: escalateConfidence(record.sourceConfidence, candidate.confidence),
    // Source log
    sources:     [...record.sources, sourceRef],
    lastSeenAt:  now,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Register a restaurant candidate into the canonical registry.
 *
 * If the candidate matches an existing record (by name+address, phone,
 * website domain, or geo proximity + name), that record is updated and returned.
 * Otherwise a new canonical record is created.
 *
 * @returns The canonical record (new or updated) for this restaurant.
 */
export function upsertRestaurant(candidate: RestaurantCandidate): CanonicalRestaurant {
  const now      = new Date().toISOString();
  const records  = loadRegistry();
  const signals  = computeSignals(candidate);

  // Check external ID fast-paths before running the full scan
  const existing = findByExternalId(candidate, records) ?? findMatch(signals, records);

  if (existing) {
    // Update the matched record
    const updated = {
      ...mergeIntoRecord(existing.record, candidate, now),
      lastDedupeSignal: existing.signal,
    };
    const idx = records.findIndex((r) => r.registryId === existing.record.registryId);
    records[idx] = updated;
    saveRegistry(records);
    return updated;
  }

  // Create a new canonical record
  const normalizedName    = signals.normName;
  const normalizedAddress = signals.normAddress;
  const registryId        = generateRegistryId(normalizedName, normalizedAddress);

  const newRecord: CanonicalRestaurant = {
    registryId,
    normalizedName,
    normalizedAddress,
    // External IDs
    googlePlaceId:    candidate.googlePlaceId,
    yelpBusinessId:   candidate.yelpBusinessId,
    osmId:            candidate.osmId,
    toastGuid:        candidate.toastGuid,
    squareLocationId: candidate.squareLocationId,
    // Display
    displayName:      candidate.displayName,
    address:          candidate.address,
    lat:              candidate.lat,
    lng:              candidate.lng,
    phone:            candidate.phone,
    website:          candidate.website,
    websiteDomain:    candidate.website ? extractDomain(candidate.website) : undefined,
    cuisine:          candidate.cuisine,
    // Source
    sourceConfidence: candidate.confidence,
    sources: [{
      sourceType:  candidate.sourceType,
      externalId:  candidate.externalId,
      seenAt:      now,
      confidence:  candidate.confidence,
    }],
    createdAt:   now,
    lastSeenAt:  now,
  };

  records.push(newRecord);
  saveRegistry(records);
  return newRecord;
}

/**
 * Look up a canonical record by any external ID.
 * Returns null when no match is found.
 */
export function getByExternalId(opts: {
  googlePlaceId?: string;
  yelpBusinessId?: string;
  osmId?: string;
  toastGuid?: string;
  squareLocationId?: string;
}): CanonicalRestaurant | null {
  const records = loadRegistry();
  for (const r of records) {
    if (opts.googlePlaceId    && r.googlePlaceId    === opts.googlePlaceId)    return r;
    if (opts.yelpBusinessId   && r.yelpBusinessId   === opts.yelpBusinessId)   return r;
    if (opts.osmId            && r.osmId            === opts.osmId)            return r;
    if (opts.toastGuid        && r.toastGuid        === opts.toastGuid)        return r;
    if (opts.squareLocationId && r.squareLocationId === opts.squareLocationId) return r;
  }
  return null;
}

/**
 * Look up a canonical record by internal registry ID.
 */
export function getByRegistryId(registryId: string): CanonicalRestaurant | null {
  const records = loadRegistry();
  return records.find((r) => r.registryId === registryId) ?? null;
}

/**
 * Return all canonical records, optionally filtered to those seen recently.
 */
export function getAllRecords(opts: { maxAgeDays?: number } = {}): CanonicalRestaurant[] {
  const records = loadRegistry();
  if (!opts.maxAgeDays) return records;
  const cutoff = Date.now() - opts.maxAgeDays * 24 * 60 * 60 * 1000;
  return records.filter((r) => new Date(r.lastSeenAt).getTime() >= cutoff);
}

/**
 * Remove records not seen in the past `maxAgeDays` days.
 * Returns the number of records pruned.
 */
export function pruneStaleRecords(maxAgeDays: number): number {
  const records = loadRegistry();
  const cutoff  = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  const fresh   = records.filter((r) => new Date(r.lastSeenAt).getTime() >= cutoff);
  saveRegistry(fresh);
  return records.length - fresh.length;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Check external ID fields on the candidate for a fast-path match
 * before running the full dedup scan.
 */
function findByExternalId(
  candidate: RestaurantCandidate,
  records: CanonicalRestaurant[],
): { record: CanonicalRestaurant; signal: "name+address" } | null {
  for (const r of records) {
    if (candidate.googlePlaceId    && r.googlePlaceId    === candidate.googlePlaceId)    return { record: r, signal: "name+address" };
    if (candidate.yelpBusinessId   && r.yelpBusinessId   === candidate.yelpBusinessId)   return { record: r, signal: "name+address" };
    if (candidate.osmId            && r.osmId            === candidate.osmId)            return { record: r, signal: "name+address" };
    if (candidate.toastGuid        && r.toastGuid        === candidate.toastGuid)        return { record: r, signal: "name+address" };
    if (candidate.squareLocationId && r.squareLocationId === candidate.squareLocationId) return { record: r, signal: "name+address" };
  }
  return null;
}
