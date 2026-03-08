// lib/engine/types.ts
// Core types for the conservative risk-detection engine

import type { AllergenId } from "@/lib/types";

export type { AllergenId };

/**
 * How a signal was produced — used to determine weight and message framing.
 * Weight mapping (conservative: err toward Avoid):
 *   direct      = 5  → definite allergen mention
 *   synonym     = 4  → known alias/synonym (e.g. "casein" = dairy)
 *   dish        = 3  → inferred from dish name (e.g. Alfredo → dairy)
 *   sauce       = 3  → inferred from sauce/condiment
 *   cuisine     = 2  → elevated risk from cuisine context
 *   prep        = 2  → preparation method implies cross-contact or ingredient
 *   ambiguity   = 1  → vague language (house sauce, seasonal, chef's special)
 */
export type SignalSource =
  | "direct"
  | "synonym"
  | "dish"
  | "sauce"
  | "cuisine"
  | "prep"
  | "ambiguity";

export const SIGNAL_WEIGHT: Record<SignalSource, number> = {
  direct:    5,
  synonym:   4,
  dish:      3,
  sauce:     3,
  cuisine:   2,
  prep:      2,
  ambiguity: 1,
};

/** A single piece of evidence that an allergen may be present */
export type RiskSignal = {
  allergen: AllergenId;
  source: SignalSource;
  weight: number;       // from SIGNAL_WEIGHT
  trigger: string;      // the text that produced this signal
  reason: string;       // human-readable explanation
};

/** Final risk bucket for this item × this user's allergen profile */
export type RiskLevel = "safe" | "ask" | "avoid";

/** How confident we are in the analysis (data quality, not risk level) */
export type ConfidenceLevel = "high" | "medium" | "low";

/** A parsed dish/item ready for analysis */
export type ParsedDish = {
  raw: string;          // original text
  name: string;         // best-guess dish name (first line / bold)
  description: string;  // remaining description text (may be empty)
  normalized: string;   // lowercased, cleaned, OCR-corrected
};

/** Full result for one analyzed menu item */
export type AnalyzedItem = {
  raw: string;
  name: string;
  description: string;
  signals: RiskSignal[];
  risk: RiskLevel;
  confidence: ConfidenceLevel;
  matchedAllergens: AllergenId[];   // allergens that hit user's profile
  allDetectedAllergens: AllergenId[]; // everything found, for display
  staffQuestions: string[];
  explanation: string;
};

/** Full analysis result for a menu (array of lines / items) */
export type MenuAnalysisResult = {
  items: AnalyzedItem[];
  safe:  AnalyzedItem[];
  ask:   AnalyzedItem[];
  avoid: AnalyzedItem[];
};
