import type { Risk, SourceType } from "./types";
import { confidenceFromSource } from "./sourceConfidence";

/**
 * Scores how risky a menu item is for a given user's allergy profile.
 *
 * Risk and confidence are separate concerns:
 * - Risk = how dangerous the item is for THIS user
 * - Confidence = how certain we are in the underlying data
 *
 * @param detectedAllergens - all allergens found via term matching in the item text
 * @param userAllergens     - the user's list of allergens to avoid (normalized strings)
 * @param sourceType        - how trustworthy the data source is
 * @param isAmbiguous       - true when vague words or inferred allergens (not hard-detected) are present
 */
export function scoreRisk(
  detectedAllergens: string[],
  userAllergens: string[],
  sourceType: SourceType,
  isAmbiguous = false
): Risk {
  // Direct allergen hit → always avoid, regardless of source quality
  const hasHit = detectedAllergens.some((a) => userAllergens.includes(a));
  if (hasHit) return "avoid";

  // Ambiguous item (vague words, inferred allergens matching user's list) → ask
  if (isAmbiguous) return "ask";

  // No hit, no ambiguity → judge by source trust
  const confidence = confidenceFromSource(sourceType);

  if (confidence === "High") {
    // Trustworthy source says nothing detected → likely safe
    return "likely-safe";
  }

  if (detectedAllergens.length === 0) {
    // Low/medium confidence + no data = genuinely unknown
    return "unknown";
  }

  // Allergens detected in the item but none match user's list.
  // Still worth flagging due to cross-contact risk or profile gaps.
  return "ask";
}
