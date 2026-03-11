/**
 * lib/learning/index.ts
 *
 * Public barrel for the learning system.
 * Import from "@/lib/learning" instead of reaching into individual files.
 */

// Types
export type {
  FeedbackType,
  TrustScore,
  FeedbackEntry,
  RestaurantAnalysisLog,
  RestaurantMemoryFact,
  MenuItemMemory,
  RestaurantWarning,
  MemorySignal,
  CandidateRule,
  MemoryInsight,
} from "./types";
export { FEEDBACK_TRUST } from "./types";

// Feedback store
export { storeFeedback, getFeedbackFor, getAllFeedback } from "./feedbackStore";

// Restaurant memory
export {
  updateMemoryFromFeedback,
  checkMemory,
  getRestaurantMemory,
  getMenuItemMemory,
  getRestaurantWarnings,
  addRestaurantWarning,
} from "./restaurantMemory";

// Rule engine (cross-restaurant pattern learning)
export {
  recordCandidateRule,
  getValidatedRules,
  getSupportedRules,
  getCandidateRules,
  getConflictedRules,
} from "./ruleEngine";

// Learning engine (single entry point for feedback submission)
export { submitFeedback, getMemoryOverrides, normalizeDishName } from "./learningEngine";

// Analysis log
export { logRestaurantAnalysis, getAnalysisLogs } from "./analysisLog";

// Memory integration (Phase 4 — connects memory to analysis pipeline)
export { applyMemoryToAnalysis } from "./memoryIntegration";

// Memory insights (Phase 6 — UI-ready outputs)
export { getItemMemoryNote, formatMemoryNote, getRestaurantInsights } from "./memoryInsights";

// React hook (Phase 6 — UI consumption)
export { useRestaurantMemory } from "./useRestaurantMemory";
export type { FeedbackParams, UseRestaurantMemoryResult } from "./useRestaurantMemory";
