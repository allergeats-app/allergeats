/**
 * lib/learning/types.ts
 *
 * Data model for AllergEats' structured feedback and learning system.
 *
 * Trust hierarchy (highest → lowest):
 *   5 — official ingredient list / allergen statement
 *   4 — staff-confirmed (safe or unsafe)
 *   3 — user-reported unsafe / ingredient correction
 *   2 — user-reported safe (single)
 *   1 — menu text inference / ambiguous
 *
 * Rules progress through: candidate → validated (or rejected)
 * Memory facts are per-restaurant, per-dish, per-allergen.
 */

export type FeedbackType =
  | "confirmed-safe"           // user says: this was fine for me
  | "found-unsafe"             // user says: this actually had my allergen
  | "staff-confirmed-safe"     // staff verified: no allergen in this dish
  | "staff-confirmed-unsafe"   // staff verified: dish does contain allergen
  | "ingredient-correction"    // user provides specific info ("uses egg-free aioli")
  | "shared-fryer"             // cross-contact warning from fryer or surface
  | "false-positive"           // app flagged it but user says it was wrong
  | "false-negative";          // app said safe but it contained the allergen

export type TrustScore = 1 | 2 | 3 | 4 | 5;

export const FEEDBACK_TRUST: Record<FeedbackType, TrustScore> = {
  "staff-confirmed-safe":    4,
  "staff-confirmed-unsafe":  4,
  "found-unsafe":            3,
  "false-negative":          3,
  "ingredient-correction":   3,
  "shared-fryer":            3,
  "confirmed-safe":          2,
  "false-positive":          2,
};

/** A single piece of user feedback about a menu item prediction */
export interface FeedbackEntry {
  id: string;
  createdAt: number;
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  dishNormalized: string;       // lowercase + trimmed, for matching
  type: FeedbackType;
  allergen?: string;            // which allergen this feedback concerns
  note?: string;                // optional free text
  trust: TrustScore;
  originalRisk?: string;        // what the app predicted (avoid/ask/likely-safe)
  originalConfidence?: string;
}

/** Per-restaurant analysis summary logged on each visit */
export interface RestaurantAnalysisLog {
  id: string;
  createdAt: number;
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  userAllergens: string[];
  totalItems: number;
  safeCount: number;
  askCount: number;
  avoidCount: number;
  fitLevel: string;
}

/**
 * A learned fact about a specific restaurant + dish + allergen combination.
 * Built from accumulated feedback, never from the analysis engine alone.
 */
export interface RestaurantMemoryFact {
  restaurantId: string;
  dishNormalized: string;
  allergen: string;
  safeCount: number;            // # of "safe" type confirmations
  unsafeCount: number;          // # of "unsafe" type confirmations
  totalTrustWeight: number;     // sum of trust scores across all feedback
  staffConfirmedSafe: boolean;
  staffConfirmedUnsafe: boolean;
  lastUpdated: number;
  verdict: "safe" | "unsafe" | "conflicted" | "unknown";
  confidence: "high" | "medium" | "low";
}

/**
 * A pattern that has been observed in feedback and may be promoted to a
 * validated global rule.
 *
 * Promotion threshold: trustWeightTotal >= PROMOTION_THRESHOLD (default 8)
 * Conflicts: if both "safe" and "unsafe" versions exist for the same
 *   pattern+allergen, both are downgraded to "candidate" with a conflict flag.
 */
export interface CandidateRule {
  id: string;
  createdAt: number;
  lastSeen: number;
  pattern: string;              // normalized dish name (restaurant-agnostic)
  allergen: string;
  outcome: "safe" | "unsafe";
  evidenceCount: number;        // # of feedback entries
  trustWeightTotal: number;     // sum of trust scores
  sources: FeedbackType[];      // which feedback types contributed
  status: "candidate" | "validated" | "rejected";
  conflicted?: boolean;         // true if opposing evidence exists
}
