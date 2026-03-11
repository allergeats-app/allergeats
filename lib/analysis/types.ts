/**
 * lib/analysis/types.ts
 *
 * Shared contract for the analyzed-menu layer.
 *
 * Design principles:
 *   - AnalyzedMenuItem extends ScoredMenuItem so no scoring logic is duplicated.
 *   - RestaurantMenuAnalysis is the single source of truth consumed by the UI.
 *   - All shapes are future-ready for DB persistence (menuVersionId carried through).
 *   - The view model (RestaurantDetailViewModel) does the heavy lifting so
 *     the React page is purely presentational.
 */

import type { ScoredMenuItem, RestaurantSafetySummary } from "@/lib/types";
import type { SourceConfidence, MenuIngestionSourceType } from "@/lib/menu-ingestion/types";
import type { CoverageTier } from "@/lib/scoring";
import type { FitLevel } from "@/lib/fitLevel";
import type { MemorySignal, MemoryInsight, RestaurantWarning } from "@/lib/learning/types";

// ─── Item-level analysis ──────────────────────────────────────────────────────

/**
 * A fully analyzed menu item.
 * Extends ScoredMenuItem with ingestion-layer metadata (section, stable ID, source confidence).
 */
export type AnalyzedMenuItem = ScoredMenuItem & {
  /** Which menu section this item belongs to (e.g. "Burgers", "Desserts"). */
  sectionName: string;
  /** Stable ID from the ingestion layer (used for DB cross-referencing). */
  itemId: string;
  /**
   * Per-item confidence from the ingestion layer.
   * Independent of analysis confidence — measures data quality at source.
   * e.g. "high" for official API items, "low" for image OCR items.
   */
  ingestionConfidence: SourceConfidence;
  /**
   * Memory signals from the restaurant learning layer.
   * Populated by applyMemoryToAnalysis() — absent when no memory exists.
   * When present, `risk` on this item reflects the memory-adjusted value.
   */
  memorySignals?: MemorySignal[];
};

// Re-export learning types used by analysis layer consumers
export type { MemorySignal, MemoryInsight, RestaurantWarning };

// ─── Section-level analysis ───────────────────────────────────────────────────

export type AnalyzedMenuSection = {
  sectionName: string;
  items: AnalyzedMenuItem[];
  /** Quick counts for section-level display. */
  safeCount: number;
  askCount: number;
  avoidCount: number;
};

// ─── Coverage / trust signals ─────────────────────────────────────────────────

/**
 * How much of the menu we analyzed and how trustworthy the data is.
 * Shown in the restaurant hero and detail page to set user expectations.
 */
export type MenuCoverageInfo = {
  totalItems: number;
  tier: CoverageTier;
  /** Short human-readable label, e.g. "24 items analyzed". */
  label: string;
  sourceType: MenuIngestionSourceType;
  sourceConfidence: SourceConfidence;
  /**
   * Trust statement derived from source type + confidence.
   * e.g. "Official source, high confidence" / "Image-derived menu, lower confidence"
   */
  trustSignal: string;
  /**
   * One-line summary for the hero / restaurant card.
   * e.g. "24 items · Official source"
   */
  coverageLine: string;
};

// ─── Restaurant-level analysis ────────────────────────────────────────────────

/**
 * Full analysis result for one restaurant × one user allergen profile.
 * This is the output of analyzeNormalizedMenu() and analyzeRestaurant().
 */
export type RestaurantMenuAnalysis = {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  /** ISO-8601 timestamp of when this analysis was computed. */
  analyzedAt: string;
  /** Links to the DB menu version, if available. */
  menuVersionId?: string;
  sections: AnalyzedMenuSection[];
  /** All items flat — for easy filtering, ranking, and searching. */
  allItems: AnalyzedMenuItem[];
  summary: RestaurantSafetySummary;
  coverage: MenuCoverageInfo;
};

// ─── Safe-order recommendations ───────────────────────────────────────────────

/**
 * A curated recommendation to show in the "Best options for you" block.
 */
export type SafeOrderRecommendation = {
  item: AnalyzedMenuItem;
  sectionName: string;
  /** Short badge label, e.g. "Verified safe", "Low-risk option". */
  reasonLabel: string;
  /** 1–2 sentence explanation shown under the item name. */
  explanation: string;
  /** Non-empty if the user still needs to check something with staff. */
  askNotes: string[];
  /** Internal ranking score — higher is better. Not shown in UI. */
  score: number;
};

// ─── View model ───────────────────────────────────────────────────────────────

/** Hero block at the top of the detail page. */
export type RestaurantDetailHero = {
  restaurantId: string;
  restaurantName: string;
  cuisine: string;
  distance?: number;
  isSaved: boolean;
  fitLevel: FitLevel;
  fitLabel: string;          // plain text, e.g. "Great Match"
  fitBadgeBg: string;        // e.g. "#dcfce7"
  fitBadgeColor: string;     // e.g. "#15803d"
  fitExplanation: string;    // e.g. "Strong match for your allergies"
  coverageLine: string;      // e.g. "24 items · Official source"
};

/**
 * Page-ready view model for the restaurant detail page.
 * The page should be purely presentational — all logic lives here.
 */
export type RestaurantDetailViewModel = {
  hero: RestaurantDetailHero;
  summary: RestaurantSafetySummary;
  /** Top recommended dishes for this user's allergen profile. */
  bestOptions: SafeOrderRecommendation[];
  /** 2–3 reasoning bullets for "Why this restaurant works for you". */
  whyThisWorks: string[];
  /** Full menu grouped by section (already sorted: safest sections first). */
  sections: AnalyzedMenuSection[];
  coverage: MenuCoverageInfo;
  /** Deduplicated staff questions from all ask-risk items (max 8). */
  aggregatedStaffQuestions: string[];
  /**
   * Restaurant-level warnings from the memory layer (shared fryer, cross-contact, etc.).
   * Empty array when no warnings have been reported.
   */
  restaurantWarnings: RestaurantWarning[];
  /**
   * Distilled memory insights ready for display on the detail page.
   * Empty array when no memory exists for this restaurant.
   */
  memoryInsights: MemoryInsight[];
};
