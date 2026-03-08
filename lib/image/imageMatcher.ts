// lib/image/imageMatcher.ts
// Fuzzy matching utilities for restaurant name, address, and phone.
// Used to validate that a provider result actually corresponds to the queried restaurant.

import type { RestaurantImageInput } from "./types";

/** Normalize a restaurant name for comparison */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(the|a|an|restaurant|cafe|cafe|grill|bar|kitchen|house|inn|eatery|bistro|tavern|pub|diner|brasserie)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalize a phone number to digits only */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").replace(/^1/, ""); // strip country code
}

/** Normalize an address to its street portion */
export function normalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .replace(/\b(street|st|avenue|ave|boulevard|blvd|road|rd|drive|dr|lane|ln|court|ct|way|wy|place|pl)\b/g, (m) => {
      const map: Record<string, string> = {
        street: "st", avenue: "ave", boulevard: "blvd", road: "rd",
        drive: "dr", lane: "ln", court: "ct", way: "wy", place: "pl",
      };
      return map[m] ?? m;
    })
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extract street number + street name from address */
function streetParts(address: string): { number: string; street: string } {
  const norm = normalizeAddress(address);
  const match = norm.match(/^(\d+)\s+(.*)/);
  return match ? { number: match[1], street: match[2] } : { number: "", street: norm };
}

/**
 * Simple token-overlap similarity: what fraction of query tokens appear in candidate?
 * Returns 0–1.
 */
function tokenSimilarity(a: string, b: string): number {
  const tokA = new Set(normalizeName(a).split(" ").filter(Boolean));
  const tokB = new Set(normalizeName(b).split(" ").filter(Boolean));
  if (tokA.size === 0) return 0;
  let overlap = 0;
  for (const t of tokA) if (tokB.has(t)) overlap++;
  return overlap / tokA.size;
}

export type MatchScore = {
  /** 0–100 overall confidence that the candidate matches the query */
  score: number;
  reasons: string[];
};

/**
 * Score how well a candidate (from a provider) matches the queried restaurant.
 * Higher = more confident match.
 *
 * @param query     Input from the caller
 * @param candidate What the provider returned (name, address, phone)
 */
export function scoreMatch(
  query: RestaurantImageInput,
  candidate: { name?: string; address?: string; phone?: string; city?: string; state?: string }
): MatchScore {
  let score = 0;
  const reasons: string[] = [];

  // ── Phone match (strongest signal) ──────────────────────────────────────────
  if (query.phone && candidate.phone) {
    const qPhone = normalizePhone(query.phone);
    const cPhone = normalizePhone(candidate.phone);
    if (qPhone === cPhone && qPhone.length >= 10) {
      score += 50;
      reasons.push("exact phone match");
    }
  }

  // ── Name similarity ─────────────────────────────────────────────────────────
  if (query.name && candidate.name) {
    const sim = tokenSimilarity(query.name, candidate.name);
    if (sim >= 0.9) {
      score += 30;
      reasons.push(`strong name match (${(sim * 100).toFixed(0)}%)`);
    } else if (sim >= 0.6) {
      score += 15;
      reasons.push(`partial name match (${(sim * 100).toFixed(0)}%)`);
    } else if (sim >= 0.3) {
      score += 5;
      reasons.push(`weak name match (${(sim * 100).toFixed(0)}%)`);
    } else {
      score -= 10;
      reasons.push(`name mismatch`);
    }
  }

  // ── Address match ───────────────────────────────────────────────────────────
  if (query.address && candidate.address) {
    const qParts = streetParts(query.address);
    const cParts = streetParts(candidate.address);
    if (qParts.number && qParts.number === cParts.number) {
      score += 10;
      reasons.push("street number matches");
    }
    const streetSim = tokenSimilarity(qParts.street, cParts.street);
    if (streetSim >= 0.7) {
      score += 10;
      reasons.push(`street name match (${(streetSim * 100).toFixed(0)}%)`);
    }
  }

  // ── City / state agreement ──────────────────────────────────────────────────
  if (query.city && candidate.city) {
    if (query.city.toLowerCase() === candidate.city.toLowerCase()) {
      score += 5;
      reasons.push("city matches");
    } else {
      score -= 15; // different city = likely wrong place
      reasons.push("city mismatch — penalized");
    }
  }
  if (query.state && candidate.state) {
    if (query.state.toLowerCase() === candidate.state.toLowerCase()) {
      score += 3;
    } else {
      score -= 10;
      reasons.push("state mismatch — penalized");
    }
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}

/** Minimum score required to accept a match */
export const MATCH_THRESHOLD = 35;
