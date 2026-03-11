/**
 * lib/learning/types.ts
 *
 * Data model for AllergEats' structured feedback and memory system.
 *
 * Trust hierarchy (highest → lowest):
 *   5 — official ingredient list / allergen statement
 *   4 — staff-confirmed (safe or unsafe)
 *   3 — user-reported unsafe / ingredient correction
 *   2 — user-reported safe (single)
 *   1 — menu text inference / ambiguous
 *
 * Memory lifecycle:
 *   FeedbackEntry (raw input)
 *     → RestaurantMemoryFact (aggregated per restaurant × dish × allergen)
 *     → CandidateRule (cross-restaurant pattern candidate)
 *       → status: candidate → supported → validated (or rejected/conflicted)
 */

import type { Risk } from "@/lib/types";

// ─── Feedback types ───────────────────────────────────────────────────────────

export type FeedbackType =
  | "confirmed-safe"           // user says: this was fine for me
  | "found-unsafe"             // user says: this actually had my allergen
  | "staff-confirmed-safe"     // staff verified: no allergen in this dish
  | "staff-confirmed-unsafe"   // staff verified: dish does contain allergen
  | "ingredient-correction"    // user provides specific info ("uses egg-free aioli")
  | "shared-fryer"             // cross-contact warning from fryer or surface
  | "false-positive"           // app flagged it but user says it was wrong
  | "false-negative"           // app said safe but it contained the allergen
  | "needs-staff-confirmation" // user is unsure — recommends asking staff
  | "menu-outdated"            // user reports the menu has changed
  | "custom-note";             // free-form note with no specific outcome

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
  "needs-staff-confirmation": 1,
  "menu-outdated":           1,
  "custom-note":             1,
};

// ─── Feedback entry ───────────────────────────────────────────────────────────

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
  // Traceability fields — optional context preserved with each feedback
  menuVersionId?: string;       // DB menu version this feedback applies to
  menuItemId?: string;          // stable item ID from the ingestion layer
  sessionId?: string;           // anonymous session context for deduplication
}

// ─── Analysis log ─────────────────────────────────────────────────────────────

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

// ─── Restaurant memory ────────────────────────────────────────────────────────

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
 * All memory facts for one dish at one restaurant, across all allergens.
 * A convenience wrapper used by the integration layer.
 */
export interface MenuItemMemory {
  restaurantId: string;
  dishNormalized: string;
  facts: RestaurantMemoryFact[];  // one per allergen with any evidence
  lastUpdated: number;
}

/**
 * A restaurant-level risk warning — not tied to a specific dish.
 * Examples: shared fryer, cross-contact from prep surfaces, rotating menus.
 */
export interface RestaurantWarning {
  id: string;
  restaurantId: string;
  warningType:
    | "shared-fryer"         // fry oil shared across allergen groups
    | "cross-contact"        // general cross-contact risk
    | "rotating-menu"        // menu changes frequently
    | "staff-uncertainty"    // staff gave inconsistent answers
    | "custom";              // free-form warning
  allergen?: string;         // if allergen-specific
  description: string;       // "Fries share oil with breaded items"
  confidence: "high" | "medium" | "low";
  evidenceCount: number;
  lastReportedAt: number;
  sources: FeedbackType[];
}

// ─── Memory signal (analysis layer) ──────────────────────────────────────────

/**
 * How restaurant memory influenced the analysis of a specific menu item.
 * Attached to AnalyzedMenuItem.memorySignals[] after applyMemoryToAnalysis().
 *
 * IMPORTANT: memory signals are additional signals, not replacements.
 * Official allergen data (ingestionConfidence: "high") is never overridden.
 */
export interface MemorySignal {
  allergen: string;
  verdict: RestaurantMemoryFact["verdict"];
  confidence: RestaurantMemoryFact["confidence"];
  /** Risk as computed by text analysis — before memory was applied. */
  originalRisk: Risk;
  /** Effective risk after memory overlay (may equal originalRisk if unchanged). */
  effectiveRisk: Risk;
  /** Human-readable explanation suitable for display in the UI. */
  note: string;
  /** Total number of feedback reports that built this memory fact. */
  sourceCount: number;
  hasStaffConfirmation: boolean;
  /** True if effectiveRisk differs from originalRisk. */
  memoryChanged: boolean;
}

// ─── Candidate rules (cross-restaurant) ──────────────────────────────────────

/**
 * A pattern observed across restaurants that may deserve a global rule.
 *
 * Promotion path:
 *   candidate (new/weak)
 *     → supported (trustWeightTotal >= 4, no conflict)
 *     → validated (trustWeightTotal >= 8, no conflict)
 *   Any state → conflicted when opposing evidence accumulates.
 *   conflicted → candidate after conflict is flagged (requires manual review).
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
  status: "candidate" | "supported" | "validated" | "rejected";
  conflicted?: boolean;         // true if opposing evidence exists
}

// ─── UI-ready memory insights ─────────────────────────────────────────────────

/**
 * A distilled, display-ready insight surfaced on the restaurant detail page.
 * Produced by getRestaurantInsights() in memoryInsights.ts.
 */
export interface MemoryInsight {
  type:
    | "restaurant-warning"     // cross-contact / shared equipment
    | "item-confirmed-safe"    // staff-confirmed safe items
    | "item-confirmed-unsafe"  // staff-confirmed unsafe items
    | "conflicting-reports"    // inconsistent reports — ask staff
    | "community-note";        // community safety confirmations
  title: string;               // e.g. "Shared fry oil"
  description: string;         // e.g. "Fries share oil with breaded items"
  allergen?: string;
  confidence: "high" | "medium" | "low";
  badgeLabel: string;          // e.g. "Staff confirmed" | "Community reports"
  badgeColor: string;          // hex color for badge background
  itemCount?: number;          // # of items this insight applies to
}