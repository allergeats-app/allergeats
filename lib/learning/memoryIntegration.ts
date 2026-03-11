/**
 * lib/learning/memoryIntegration.ts
 *
 * Phase 4: Overlay restaurant memory onto the analysis pipeline.
 *
 * applyMemoryToAnalysis():
 *   - Takes a RestaurantMenuAnalysis + the user's allergen list
 *   - Returns a new RestaurantMenuAnalysis where items have MemorySignal[]
 *     attached and risk may be adjusted by memory evidence
 *   - Summary counts are recomputed to reflect memory-adjusted risks
 *
 * Memory authority rules (safety-first):
 *   1. Official ingredient data (ingestionConfidence "high") is NEVER overridden.
 *      Restaurant memory cannot contradict a verified allergen source.
 *   2. Memory can UPGRADE risk (likely-safe → avoid) when staff-confirmed unsafe.
 *   3. Memory can ADD UNCERTAINTY (likely-safe → ask) when medium-confidence
 *      unsafe reports exist.
 *   4. Memory can RELAX a flag (ask → likely-safe) ONLY when staff-confirmed safe
 *      AND ingestion confidence is not "high".
 *   5. Memory can SOFTEN an avoid (avoid → ask) ONLY when staff-confirmed safe
 *      AND ingestion confidence is not "high". We never go avoid → likely-safe
 *      via memory alone — text evidence of an allergen is too significant.
 *   6. Conflicted memory adds an uncertainty note and may downgrade
 *      likely-safe → ask, but never escalates beyond ask.
 *   7. Low-confidence memory with no staff confirmation has no effect on risk.
 */

import type { AllergenId, Risk } from "@/lib/types";
import type { RestaurantMenuAnalysis, AnalyzedMenuItem } from "@/lib/analysis/types";
import type { MemorySignal, RestaurantMemoryFact } from "./types";
import { normalizeDishName } from "./learningEngine";
import { checkMemory, getRestaurantMemory } from "./restaurantMemory";

// ─── Risk derivation ──────────────────────────────────────────────────────────

function deriveEffectiveRisk(
  originalRisk: Risk,
  fact: RestaurantMemoryFact,
  ingestionConfidence: string,
): Risk {
  // Rule 1: Official data is sacrosanct
  if (ingestionConfidence === "high") return originalRisk;

  // Rule 2: Staff-confirmed unsafe → always avoid
  if (fact.staffConfirmedUnsafe) return "avoid";

  // Rule 3: Medium-confidence unsafe signals add uncertainty to safe items
  if (fact.verdict === "unsafe" && fact.confidence === "medium") {
    if (originalRisk === "likely-safe") return "ask";
    return originalRisk;
  }

  // Rule 4–5: Staff-confirmed safe can relax ask → likely-safe or avoid → ask
  if (fact.staffConfirmedSafe) {
    if (originalRisk === "ask")   return "likely-safe";
    if (originalRisk === "avoid") return "ask"; // staff says safe but text saw allergen
    return originalRisk;
  }

  // Rule 6: Conflicted memory adds uncertainty to safe items
  if (fact.verdict === "conflicted") {
    if (originalRisk === "likely-safe") return "ask";
    return originalRisk;
  }

  // Rule 7: Low-confidence, no staff — no change
  return originalRisk;
}

function buildMemoryNote(
  fact: RestaurantMemoryFact,
  effectiveRisk: Risk,
  originalRisk: Risk,
): string {
  const changed = effectiveRisk !== originalRisk;

  let base: string;
  if (fact.staffConfirmedUnsafe) {
    base = "Staff confirmed this item contains the allergen at this restaurant.";
  } else if (fact.staffConfirmedSafe) {
    base = "Staff confirmed this item is safe at this restaurant.";
  } else if (fact.verdict === "safe") {
    const n = fact.safeCount;
    base = `${n} report${n !== 1 ? "s" : ""} confirm this was safe here.`;
  } else if (fact.verdict === "unsafe") {
    const n = fact.unsafeCount;
    base = `${n} report${n !== 1 ? "s" : ""} indicate this contained the allergen.`;
  } else {
    base = "Conflicting reports — results vary at this location. Ask staff to confirm.";
  }

  if (changed) {
    const fromLabel = originalRisk === "ask" ? "flagged for review" : originalRisk;
    base += ` (Risk updated: ${fromLabel} → ${effectiveRisk} based on restaurant memory.)`;
  }
  return base;
}

// ─── Signal builder ───────────────────────────────────────────────────────────

function buildMemorySignalsForItem(
  item: AnalyzedMenuItem,
  restaurantId: string,
  userAllergens: AllergenId[],
): MemorySignal[] {
  const normalized = normalizeDishName(item.name);
  const signals: MemorySignal[] = [];

  for (const allergen of userAllergens) {
    const fact = checkMemory(restaurantId, normalized, allergen);
    if (!fact || fact.verdict === "unknown") continue;

    // Rule 7: skip low-confidence non-staff facts — informational only, no signal
    if (
      fact.confidence === "low" &&
      !fact.staffConfirmedSafe &&
      !fact.staffConfirmedUnsafe
    ) continue;

    const effectiveRisk = deriveEffectiveRisk(item.risk, fact, item.ingestionConfidence);
    const note          = buildMemoryNote(fact, effectiveRisk, item.risk);

    signals.push({
      allergen,
      verdict:              fact.verdict,
      confidence:           fact.confidence,
      originalRisk:         item.risk,
      effectiveRisk,
      note,
      sourceCount:          fact.safeCount + fact.unsafeCount,
      hasStaffConfirmation: fact.staffConfirmedSafe || fact.staffConfirmedUnsafe,
      memoryChanged:        effectiveRisk !== item.risk,
    });
  }

  return signals;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Overlay restaurant memory onto an analysis result.
 *
 * Returns a new RestaurantMenuAnalysis where:
 *  - Items with relevant memory have `memorySignals` populated
 *  - Item `risk` is updated if memory changes the effective risk
 *  - Section counts and top-level summary reflect the adjusted risks
 *  - Items with ingestionConfidence "high" are never modified
 *
 * If no memory exists for this restaurant, the original analysis is returned
 * unchanged (no allocation overhead).
 *
 * @param analysis     Output of analyzeNormalizedMenu() or analyzeRestaurant()
 * @param userAllergens The user's current allergen profile
 */
export function applyMemoryToAnalysis(
  analysis: RestaurantMenuAnalysis,
  userAllergens: AllergenId[],
): RestaurantMenuAnalysis {
  if (userAllergens.length === 0) return analysis;

  const facts = getRestaurantMemory(analysis.restaurantId);
  if (facts.length === 0) return analysis;

  const enhancedSections = analysis.sections.map((section) => {
    const enhancedItems = section.items.map((item): AnalyzedMenuItem => {
      const signals = buildMemorySignalsForItem(item, analysis.restaurantId, userAllergens);
      if (signals.length === 0) return item;

      // Resolve final risk: unsafe signals take absolute priority,
      // then risk level is determined by the most impactful signal.
      let effectiveRisk: Risk = item.risk;
      for (const signal of signals) {
        if (signal.effectiveRisk === "avoid") {
          effectiveRisk = "avoid";
          break; // worst case — stop scanning
        }
        if (signal.effectiveRisk === "ask" && effectiveRisk !== "avoid") {
          effectiveRisk = "ask";
        }
        if (
          signal.effectiveRisk === "likely-safe" &&
          effectiveRisk === "ask" &&
          signals.every((s) => s.effectiveRisk !== "avoid" && s.effectiveRisk !== "ask")
        ) {
          effectiveRisk = "likely-safe";
        }
      }

      return { ...item, risk: effectiveRisk, memorySignals: signals };
    });

    return {
      ...section,
      items:      enhancedItems,
      safeCount:  enhancedItems.filter((i) => i.risk === "likely-safe").length,
      askCount:   enhancedItems.filter((i) => i.risk === "ask").length,
      avoidCount: enhancedItems.filter((i) => i.risk === "avoid").length,
    };
  });

  const allItems = enhancedSections.flatMap((s) => s.items);
  const summary  = {
    likelySafe: allItems.filter((i) => i.risk === "likely-safe").length,
    ask:        allItems.filter((i) => i.risk === "ask").length,
    avoid:      allItems.filter((i) => i.risk === "avoid").length,
    unknown:    allItems.filter((i) => i.risk === "unknown").length,
    total:      allItems.length,
  };

  return { ...analysis, sections: enhancedSections, allItems, summary };
}
