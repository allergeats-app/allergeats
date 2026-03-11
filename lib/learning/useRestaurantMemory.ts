"use client";

/**
 * lib/learning/useRestaurantMemory.ts
 *
 * Phase 6: React hook that loads restaurant memory and exposes a clean
 * interface for the UI to read insights and submit feedback.
 *
 * Usage:
 *   const { insights, warnings, submitFeedback } = useRestaurantMemory(
 *     restaurantId,
 *     restaurantName,
 *     analysis.allItems,
 *   );
 */

import { useState, useEffect, useCallback } from "react";
import type { RestaurantMemoryFact, MemoryInsight, RestaurantWarning, FeedbackType } from "./types";
import type { AnalyzedMenuItem } from "@/lib/analysis/types";
import { getRestaurantMemory, getRestaurantWarnings } from "./restaurantMemory";
import { getRestaurantInsights } from "./memoryInsights";
import { submitFeedback as submitFeedbackEntry } from "./learningEngine";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FeedbackParams = {
  dishName: string;
  type: FeedbackType;
  allergen?: string;
  note?: string;
  originalRisk?: string;
  originalConfidence?: string;
  menuItemId?: string;
  menuVersionId?: string;
};

export type UseRestaurantMemoryResult = {
  /** All memory facts for this restaurant (raw, for detailed display). */
  facts: RestaurantMemoryFact[];
  /** Restaurant-level warnings (shared fryer, cross-contact, etc.). */
  warnings: RestaurantWarning[];
  /** Distilled insights ready for display in the detail page. */
  insights: MemoryInsight[];
  /** Submit a feedback entry and refresh memory state. */
  submitFeedback: (params: FeedbackParams) => void;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * @param restaurantId   Stable restaurant ID (used as memory key)
 * @param restaurantName Display name — stored with each feedback entry
 * @param allItems       All analyzed items for the current restaurant visit
 *                       (needed to compute insights — pass analysis.allItems)
 */
export function useRestaurantMemory(
  restaurantId: string,
  restaurantName: string,
  allItems: AnalyzedMenuItem[] = [],
): UseRestaurantMemoryResult {
  const [facts,    setFacts]    = useState<RestaurantMemoryFact[]>([]);
  const [warnings, setWarnings] = useState<RestaurantWarning[]>([]);
  const [insights, setInsights] = useState<MemoryInsight[]>([]);

  // Refresh all derived state from localStorage
  const refresh = useCallback(() => {
    const loadedFacts    = getRestaurantMemory(restaurantId);
    const loadedWarnings = getRestaurantWarnings(restaurantId);
    setFacts(loadedFacts);
    setWarnings(loadedWarnings);
    setInsights(getRestaurantInsights(allItems, loadedWarnings));
  }, [restaurantId, allItems]);

  // Load on mount and whenever restaurantId or items change
  useEffect(() => { refresh(); }, [refresh]);

  const submitFeedback = useCallback(
    (params: FeedbackParams) => {
      submitFeedbackEntry({ ...params, restaurantId, restaurantName });
      refresh();
    },
    [restaurantId, restaurantName, refresh],
  );

  return { facts, warnings, insights, submitFeedback };
}
