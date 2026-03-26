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
  // Memory-confirmed overrides other labels
  const staffMemory = item.memorySignals?.find(
    (s) => s.hasStaffConfirmation && (s.verdict === "safe" || s.memoryChanged),
  );
  if (staffMemory) return "Restaurant-confirmed safe";

  const communityMemory = item.memorySignals?.find(
    (s) => s.verdict === "safe" && !s.hasStaffConfirmation && s.sourceCount >= 3,
  );
  if (communityMemory) return "Community-confirmed safe";

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
  // If memory changed the risk, lead with the memory explanation
  const impactfulSignal = item.memorySignals?.find((s) => s.memoryChanged);
  if (impactfulSignal) return impactfulSignal.note;

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

  // Append informational memory note even when risk didn't change
  const memoryNote = item.memorySignals?.[0]?.note;
  if (memoryNote) {
    parts.push(memoryNote);
  } else if (item.confidence === "High" && item.ingestionConfidence !== "high") {
    parts.push("High-confidence analysis.");
  } else if (item.confidence === "Low") {
    parts.push("Limited ingredient data — always mention your allergy.");
  }

  return parts.join(" ");
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Fisher-Yates in-place shuffle. */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate 3 randomized recommended dishes for a user's allergen profile.
 *
 * Picks from the top-quality candidates (up to 8 by score) and shuffles them
 * so the selection varies on each page load while still pulling from
 * the best safe options available.
 *
 * @param analysis     Output of analyzeNormalizedMenu() or analyzeRestaurant()
 * @param maxResults   Number of recommendations to return (default 3)
 */
export function generateSafeOrderRecommendations(
  analysis: RestaurantMenuAnalysis,
  maxResults = 3,
): SafeOrderRecommendation[] {
  const scored = analysis.allItems
    .filter((item) => {
      if (item.risk !== "likely-safe")                           return false;
      if (item.staffQuestions.length >= 3)                      return false;
      if (item.explanation.startsWith("No allergens configured")) return false;
      return true;
    })
    .map((item) => ({ item, score: rankItem(item) }))
    .sort((a, b) => b.score - a.score);

  // Pool the top candidates, then shuffle for variety on each page load
  const candidatePool = scored.slice(0, Math.max(maxResults * 3, 8));
  shuffle(candidatePool);

  return candidatePool
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
