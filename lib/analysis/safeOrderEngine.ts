/**
 * lib/analysis/safeOrderEngine.ts
 *
 * Safe-order recommendation engine.
 *
 * Answers "What should I order?" for a given RestaurantMenuAnalysis.
 *
 * Ranking criteria (in descending priority):
 *   1. Risk must be "likely-safe" — avoids and asks are never recommended.
 *   2. Ingestion confidence — official data beats scraped/user-uploaded.
 *   3. Analysis confidence — High > Medium > Low.
 *   4. Zero staff questions — uncertain-safe items are penalized.
 *   5. Shorter question lists are ranked above longer ones.
 *
 * Exclusion rules:
 *   - Items with risk != "likely-safe" are excluded entirely.
 *   - Items with 3+ staff questions are excluded (too uncertain to confidently recommend).
 *   - Items whose explanation starts with "No allergens configured" are excluded.
 */

import type { AnalyzedMenuItem, RestaurantMenuAnalysis, SafeOrderRecommendation } from "./types";

// ─── Ranking weights ──────────────────────────────────────────────────────────

const ANALYSIS_CONF_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
const INGESTION_CONF_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

function rankItem(item: AnalyzedMenuItem): number {
  const analysisConf  = ANALYSIS_CONF_RANK[item.confidence]  ?? 1;
  const ingestionConf = INGESTION_CONF_RANK[item.ingestionConfidence] ?? 1;
  const qPenalty      = item.staffQuestions.length * 0.4;

  // Base score: blend of both confidence dimensions
  return (analysisConf * 0.5) + (ingestionConf * 0.5) - qPenalty;
}

// ─── Label + explanation builders ────────────────────────────────────────────

function buildReasonLabel(item: AnalyzedMenuItem): string {
  if (item.ingestionConfidence === "high" && item.staffQuestions.length === 0) {
    return "Verified safe";
  }
  if (item.staffQuestions.length === 0) {
    if (item.confidence === "High")   return "Low-risk option";
    if (item.confidence === "Medium") return "No allergens detected";
    return "No allergens detected";
  }
  return "Good option — one question";
}

function buildExplanation(item: AnalyzedMenuItem): string {
  const parts: string[] = [];

  if (item.ingestionConfidence === "high") {
    if (item.staffQuestions.length === 0) {
      parts.push("Verified safe from official allergen data.");
    } else {
      parts.push("Based on official allergen data — one thing to confirm.");
    }
  } else if (item.detectedAllergens.length === 0 && item.staffQuestions.length === 0) {
    parts.push("No allergens detected for your profile.");
  } else if (item.staffQuestions.length === 0) {
    parts.push("No ingredients from your allergy list detected.");
  } else {
    parts.push("Looks safe — but one ingredient is worth confirming.");
  }

  if (item.confidence === "High" && item.ingestionConfidence !== "high") {
    parts.push("High-confidence analysis.");
  } else if (item.confidence === "Low") {
    parts.push("Limited ingredient data — always mention your allergy.");
  }

  return parts.join(" ");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate the top recommended dishes for a user's allergen profile.
 *
 * @param analysis     Output of analyzeNormalizedMenu() or analyzeRestaurant()
 * @param maxResults   Maximum number of recommendations to return (default 5)
 */
export function generateSafeOrderRecommendations(
  analysis: RestaurantMenuAnalysis,
  maxResults = 5,
): SafeOrderRecommendation[] {
  return analysis.allItems
    .filter((item) => {
      if (item.risk !== "likely-safe")                           return false;
      if (item.staffQuestions.length >= 3)                      return false;
      if (item.explanation.startsWith("No allergens configured")) return false;
      return true;
    })
    .map((item) => ({ item, score: rankItem(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(({ item, score }) => ({
      item,
      sectionName:  item.sectionName,
      reasonLabel:  buildReasonLabel(item),
      explanation:  buildExplanation(item),
      askNotes:     item.staffQuestions,
      score,
    }));
}
