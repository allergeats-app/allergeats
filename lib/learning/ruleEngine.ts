/**
 * lib/learning/ruleEngine.ts
 *
 * Tracks candidate global rules (restaurant-agnostic patterns).
 *
 * A "candidate rule" is a pattern observed in user feedback that might
 * be true globally, not just for one restaurant.
 *
 * Example: if 10 users across different restaurants flag "mac and cheese"
 *   as containing dairy (true globally), that pattern deserves a validated
 *   global rule — even if the dish ontology already covers it.
 *
 * Promotion: candidate → validated when trustWeightTotal >= THRESHOLD.
 * Conflict: if opposing evidence accumulates, mark both sides "conflicted"
 *   and hold in queue for manual review.
 */

import type { CandidateRule, FeedbackEntry } from "./types";

const KEY = "allegeats_candidate_rules";
const PROMOTION_THRESHOLD = 8;

const SAFE_TYPES = new Set([
  "confirmed-safe",
  "staff-confirmed-safe",
  "false-positive",
]);

function load(): CandidateRule[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch { return []; }
}

function save(rules: CandidateRule[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(rules)); } catch { }
}

/** Add or update a candidate rule from a feedback entry */
export function recordCandidateRule(feedback: FeedbackEntry): void {
  if (!feedback.allergen) return;

  const outcome = SAFE_TYPES.has(feedback.type) ? "safe" : "unsafe";
  const oppositeOutcome = outcome === "safe" ? "unsafe" : "safe";
  const rules = load();

  // Check for opposing rule (same pattern + allergen, opposite outcome)
  const opposite = rules.find(
    (r) =>
      r.pattern === feedback.dishNormalized &&
      r.allergen === feedback.allergen &&
      r.outcome === oppositeOutcome,
  );

  const existing = rules.find(
    (r) =>
      r.pattern === feedback.dishNormalized &&
      r.allergen === feedback.allergen &&
      r.outcome === outcome,
  );

  if (existing) {
    existing.evidenceCount    += 1;
    existing.trustWeightTotal += feedback.trust;
    existing.lastSeen          = Date.now();
    if (!existing.sources.includes(feedback.type))
      existing.sources.push(feedback.type);

    // Promote if threshold met and no conflict
    if (
      existing.trustWeightTotal >= PROMOTION_THRESHOLD &&
      existing.status === "candidate" &&
      !existing.conflicted
    ) {
      existing.status = "validated";
    }

    // Mark both sides conflicted if opposing evidence exists
    if (opposite) {
      existing.conflicted = true;
      opposite.conflicted  = true;
      // Demote validated rules back to candidate when conflict arises
      if (existing.status === "validated") existing.status = "candidate";
      if (opposite.status === "validated") opposite.status = "candidate";
    }
  } else {
    const newRule: CandidateRule = {
      id:               `cr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt:        Date.now(),
      lastSeen:         Date.now(),
      pattern:          feedback.dishNormalized,
      allergen:         feedback.allergen,
      outcome,
      evidenceCount:    1,
      trustWeightTotal: feedback.trust,
      sources:          [feedback.type],
      status:           "candidate",
      conflicted:       !!opposite,
    };

    if (opposite) opposite.conflicted = true;
    rules.push(newRule);
  }

  save(rules);
}

export function getValidatedRules(): CandidateRule[] {
  return load().filter((r) => r.status === "validated" && !r.conflicted);
}

export function getCandidateRules(): CandidateRule[] {
  return load().filter((r) => r.status === "candidate");
}

export function getConflictedRules(): CandidateRule[] {
  return load().filter((r) => r.conflicted === true);
}
