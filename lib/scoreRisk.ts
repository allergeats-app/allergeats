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

  // No detected allergens means we have no ingredient data at all —
  // the item name didn't match any known allergen terms.
  // We cannot confirm it's safe regardless of source trust.
  if (detectedAllergens.length === 0) {
    return "unknown";
  }

  // Allergens WERE detected in the item but none match the user's list.
  // Judge safety by how trustworthy the data source is.
  const confidence = confidenceFromSource(sourceType);

  if (confidence === "High") {
    // Verified source identified ingredients, none are the user's allergens → safe
    return "likely-safe";
  }

  // Lower-confidence source with allergens detected but no user match —
  // still worth asking due to data quality uncertainty.
  return "ask";
}
