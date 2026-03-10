/**
 * lib/analysis/index.ts
 *
 * Public API for the menu analysis layer.
 *
 * Typical usage for normalized menus (from ingestion pipeline):
 *   import { analyzeNormalizedMenu, buildDetailViewModel } from "@/lib/analysis";
 *   const analysis = analyzeNormalizedMenu(menu, userAllergens, { cuisine });
 *   const vm = buildDetailViewModel(analysis, { distance, isSaved });
 *
 * Typical usage for existing Restaurant objects (MOCK_RESTAURANTS / sessionStorage):
 *   import { analyzeRestaurant, buildDetailViewModel } from "@/lib/analysis";
 *   const analysis = analyzeRestaurant(restaurant, userAllergens);
 *   const vm = buildDetailViewModel(analysis, { distance, isSaved });
 */

// Types
export type {
  AnalyzedMenuItem,
  AnalyzedMenuSection,
  MenuCoverageInfo,
  RestaurantMenuAnalysis,
  SafeOrderRecommendation,
  RestaurantDetailHero,
  RestaurantDetailViewModel,
} from "./types";

// Analysis pipeline
export { analyzeNormalizedMenu, analyzeRestaurant } from "./analyzeNormalizedMenu";

// Safe-order recommendations
export { generateSafeOrderRecommendations } from "./safeOrderEngine";

// View model builder
export { buildDetailViewModel } from "./buildDetailViewModel";
