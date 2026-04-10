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
 * Promotion path:
 *   candidate (new, trustWeightTotal < 4)
 *     → supported (trustWeightTotal >= 4, no conflict)
 *     → validated (trustWeightTotal >= 8, no conflict)
 *
 * Conflict: if opposing evidence accumulates, mark both sides "conflicted"
 *   and demote back to candidate for manual review.
 */

import type { CandidateRule, FeedbackEntry } from "./types";

const KEY = "allegeats_candidate_rules";
const SUPPORT_THRESHOLD   = 4;   // candidate → supported
const PROMOTION_THRESHOLD = 8;   // supported → validated

const SAFE_TYPES = new Set<FeedbackEntry["type"]>([
  "confirmed-safe",
  "staff-confirmed-safe",
  "false-positive",
]);

function load(): CandidateRule[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  }
  catch { return []; }
}

function save(rules: CandidateRule[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(rules)); } catch { }
}

function deriveStatus(
  rule: Pick<CandidateRule, "trustWeightTotal" | "conflicted">,
): CandidateRule["status"] {
  if (rule.conflicted)                              return "candidate";
  if (rule.trustWeightTotal >= PROMOTION_THRESHOLD) return "validated";
  if (rule.trustWeightTotal >= SUPPORT_THRESHOLD)   return "supported";
  return "candidate";
}

/** Add or update a candidate rule from a feedback entry */
export function recordCandidateRule(feedback: FeedbackEntry): void {
  if (!feedback.allergen) return;

  const outcome         = SAFE_TYPES.has(feedback.type) ? "safe" : "unsafe";
  const oppositeOutcome = outcome === "safe" ? "unsafe" : "safe";
  const rules           = load();

  const opposite = rules.find(
    (r) =>
      r.pattern === feedback.dishNormalized &&
      r.allergen === feedback.allergen &&
      r.outcome  === oppositeOutcome,
  );

  const existing = rules.find(
    (r) =>
      r.pattern === feedback.dishNormalized &&
      r.allergen === feedback.allergen &&
      r.outcome  === outcome,
  );

  if (existing) {
    existing.evidenceCount    += 1;
    existing.trustWeightTotal += feedback.trust;
    existing.lastSeen          = Date.now();
    if (!existing.sources.includes(feedback.type))
      existing.sources.push(feedback.type);

    if (opposite) {
      existing.conflicted = true;
      opposite.conflicted  = true;
    }

    existing.status = deriveStatus(existing);
    if (opposite) opposite.status = deriveStatus(opposite);
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

    if (opposite) {
      opposite.conflicted = true;
      opposite.status     = deriveStatus(opposite);
    }
    rules.push(newRule);
  }

  save(rules);
}

export function getValidatedRules(): CandidateRule[] {
  return load().filter((r) => r.status === "validated" && !r.conflicted);
}

export function getSupportedRules(): CandidateRule[] {
  return load().filter((r) => r.status === "supported" && !r.conflicted);
}

export function getCandidateRules(): CandidateRule[] {
  return load().filter((r) => r.status === "candidate" && !r.conflicted);
}

export function getConflictedRules(): CandidateRule[] {
  return load().filter((r) => r.conflicted === true);
}
