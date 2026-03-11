/**
 * lib/analysis/buildDetailViewModel.ts
 *
 * Transforms a RestaurantMenuAnalysis into a page-ready RestaurantDetailViewModel.
 *
 * The React page should be purely presentational — all logic lives here:
 *   - Hero block (fit level, badge, explanation, coverage line)
 *   - Quick stats (safe / ask / avoid counts)
 *   - Best options (top safe-order recommendations)
 *   - Why this works (2–3 reasoning bullets)
 *   - Full menu (sections pre-sorted: safest first)
 *   - Coverage / trust signals (Phase 5)
 *   - Aggregated staff questions
 */

import type {
  RestaurantMenuAnalysis,
  RestaurantDetailViewModel,
  RestaurantDetailHero,
} from "./types";
import { generateSafeOrderRecommendations } from "./safeOrderEngine";
import { fitLevel, fitBadge, fitExplanation, fitReasoningBullets } from "@/lib/fitLevel";

// ─── Phase 5: coverage + trust signal builders ────────────────────────────────

/**
 * Derive a coverage trust signal appropriate for the detail page header.
 * Accounts for item count, source type, and source confidence.
 */
function buildCoverageTrustDetail(
  totalItems: number,
  sourceType: string,
  sourceConfidence: string,
): string {
  if (totalItems === 0) return "No menu data — scan the physical menu for results.";

  const isOfficial = sourceType === "official_api" || sourceType === "verified_dataset";
  const isAggregator = sourceType === "aggregator_api";
  const isImage = sourceType === "image";

  if (isOfficial)    return "Restaurant-verified allergen data";
  if (isAggregator)  return "Third-party structured data";
  if (isImage)       return "Extracted from a photo — confirm key items with staff";
  if (sourceConfidence === "high") return "High-confidence menu source";
  if (sourceConfidence === "low")  return "Lower-confidence source — use as a guide only";

  const tierLabel = totalItems >= 20 ? "Full menu" : totalItems >= 5 ? "Partial menu" : "Limited menu data";
  return `${tierLabel} from website`;
}

// ─── "Why this restaurant works for you" ─────────────────────────────────────

function buildWhyThisWorks(analysis: RestaurantMenuAnalysis): string[] {
  const { summary, coverage } = analysis;

  // Delegate to fitReasoningBullets for consistent messaging
  const level   = fitLevel(
    summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0,
    summary.avoid,
    summary.ask,
    summary.total,
  );
  const bullets = fitReasoningBullets(level, summary);

  // Append a source trust signal if official/aggregator
  if (
    coverage.sourceType === "official_api" ||
    coverage.sourceType === "verified_dataset" ||
    coverage.sourceType === "aggregator_api"
  ) {
    bullets.push(coverage.trustSignal + ".");
  }

  return bullets.slice(0, 3);
}

// ─── Section sort ─────────────────────────────────────────────────────────────

/**
 * Sort sections so the safest ones appear first.
 * Tie-break by lowest avoidCount, then by section name for stability.
 */
function sortSections(
  sections: RestaurantMenuAnalysis["sections"],
): RestaurantMenuAnalysis["sections"] {
  return [...sections].sort((a, b) => {
    if (b.safeCount !== a.safeCount) return b.safeCount - a.safeCount;
    if (a.avoidCount !== b.avoidCount) return a.avoidCount - b.avoidCount;
    return a.sectionName.localeCompare(b.sectionName);
  });
}

// ─── Main builder ─────────────────────────────────────────────────────────────

/**
 * Build the page-ready view model for the restaurant detail page.
 *
 * @param analysis   Output of analyzeNormalizedMenu() or analyzeRestaurant()
 * @param opts.distance  Distance in miles from user (optional)
 * @param opts.isSaved   Whether the user has favorited this restaurant
 */
export function buildDetailViewModel(
  analysis: RestaurantMenuAnalysis,
  opts: { distance?: number; isSaved?: boolean } = {},
): RestaurantDetailViewModel {
  const { summary, coverage } = analysis;
  const safePercent = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;

  const level  = fitLevel(safePercent, summary.avoid, summary.ask, summary.total);
  const badge  = fitBadge(level);

  const hero: RestaurantDetailHero = {
    restaurantId:   analysis.restaurantId,
    restaurantName: analysis.restaurantName,
    cuisine:        analysis.cuisine,
    distance:       opts.distance,
    isSaved:        opts.isSaved ?? false,
    fitLevel:       level,
    fitLabel:       level,
    fitBadgeBg:     badge.bg,
    fitBadgeColor:  badge.color,
    fitExplanation: fitExplanation(level, summary.avoid, summary.ask, summary.likelySafe),
    coverageLine:   coverage.coverageLine,
  };

  // Aggregate unique staff questions from ask-risk items (exit early at cap)
  const seen = new Set<string>();
  const aggregatedStaffQuestions: string[] = [];
  outer: for (const item of analysis.allItems) {
    if (item.risk !== "ask") continue;
    for (const q of item.staffQuestions) {
      const key = q.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        aggregatedStaffQuestions.push(q);
        if (aggregatedStaffQuestions.length >= 8) break outer;
      }
    }
  }

  return {
    hero,
    summary,
    bestOptions:              generateSafeOrderRecommendations(analysis),
    whyThisWorks:             buildWhyThisWorks(analysis),
    sections:                 sortSections(analysis.sections),
    coverage: {
      ...coverage,
      trustSignal: buildCoverageTrustDetail(
        coverage.totalItems,
        coverage.sourceType,
        coverage.sourceConfidence,
      ),
    },
    aggregatedStaffQuestions,
  };
}
