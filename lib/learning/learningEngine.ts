/**
 * lib/learning/learningEngine.ts
 *
 * Main interface for the learning system.
 * All UI feedback flows through submitFeedback().
 * All memory lookups use getMemoryOverrides().
 */

import type { FeedbackEntry, FeedbackType, RestaurantMemoryFact } from "./types";
import { FEEDBACK_TRUST } from "./types";
import { storeFeedback } from "./feedbackStore";
import { updateMemoryFromFeedback, getRestaurantMemory } from "./restaurantMemory";
import { recordCandidateRule } from "./ruleEngine";

/** Normalize a dish name for storage/matching: lowercase + collapse whitespace */
export function normalizeDishName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

type FeedbackParams = {
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  type: FeedbackType;
  allergen?: string;
  note?: string;
  originalRisk?: string;
  originalConfidence?: string;
};

/**
 * Record a user correction and update all learning stores atomically.
 * This is the single entry point for all feedback from the UI.
 */
export function submitFeedback(params: FeedbackParams): void {
  const trust = FEEDBACK_TRUST[params.type];
  const entry: FeedbackEntry = {
    ...params,
    dishNormalized: normalizeDishName(params.dishName),
    id:             `fb_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt:      Date.now(),
    trust,
  };

  // 1. Raw log — always stored
  storeFeedback(entry);

  // 2. Restaurant-item memory — only for allergen-specific feedback
  if (entry.allergen) {
    updateMemoryFromFeedback(entry);
    // 3. Global candidate rules — cross-restaurant pattern learning
    recordCandidateRule(entry);
  }
}

/**
 * Get all memory facts for a restaurant that should influence display.
 * Returns only high/medium confidence facts — low confidence is informational only.
 */
export function getMemoryOverrides(
  restaurantId: string,
  minConfidence: "high" | "medium" | "low" = "medium",
): RestaurantMemoryFact[] {
  const CONF_RANK = { high: 3, medium: 2, low: 1 };
  const threshold = CONF_RANK[minConfidence];
  return getRestaurantMemory(restaurantId).filter(
    (f) => CONF_RANK[f.confidence] >= threshold && f.verdict !== "unknown",
  );
}
