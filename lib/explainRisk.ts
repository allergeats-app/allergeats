import type { Confidence, Risk, SourceType } from "./types";
import { sourceLabel } from "./sourceConfidence";

/**
 * Generates a human-readable explanation for a menu item's risk assessment.
 * Every scored item gets an explanation — no silent results.
 */
export function explainRisk(params: {
  risk: Risk;
  confidence: Confidence;
  detectedAllergens: string[];
  inferredAllergens: string[];
  inferredReasons: string[];
  sourceType: SourceType;
  isVague: boolean;
}): string {
  const { risk, confidence, detectedAllergens, inferredAllergens, inferredReasons, sourceType, isVague } = params;
  const src = sourceLabel(sourceType);

  switch (risk) {
    case "avoid": {
      return detectedAllergens.length
        ? `Contains ${detectedAllergens.join(", ")}.`
        : "Contains an allergen that matches your profile.";
    }

    case "ask": {
      const parts: string[] = [];
      if (inferredAllergens.length) {
        parts.push(`Possibly contains ${inferredAllergens.join(", ")} based on typical dish ingredients.`);
      }
      if (inferredReasons.length) {
        parts.push(inferredReasons[0]);
      }
      if (isVague) {
        parts.push("Vague ingredients (sauce, seasoning, blend) — full contents unverified.");
      }
      if (!parts.length) {
        parts.push("Allergen information is incomplete or ambiguous.");
      }
      parts.push("Confirm with staff.");
      return parts.join(" ");
    }

    case "likely-safe": {
      const noAllergens = detectedAllergens.length === 0 && inferredAllergens.length === 0;
      return noAllergens
        ? "No allergens matching your profile detected."
        : "No allergens matching your profile found in detected ingredients.";
    }

    case "unknown": {
      return "Not enough verified ingredient data to assess this item. Ask staff before ordering.";
    }
  }
}

/**
 * Generates contextual questions to ask restaurant staff.
 */
export function buildStaffQuestions(params: {
  userAllergens: string[];
  detectedAllergens: string[];
  inferredAllergens: string[];
  triggerTerms: string[];
  isVague: boolean;
}): string[] {
  const { userAllergens, detectedAllergens, inferredAllergens, triggerTerms, isVague } = params;

  const relevant = [...new Set([...detectedAllergens, ...inferredAllergens].filter(Boolean))];
  const list = relevant.length ? relevant : userAllergens;
  const qs: string[] = [];

  qs.push(`Can you confirm whether this contains any of: ${list.join(", ")}?`);

  if (triggerTerms.length) {
    qs.push(`The menu mentions ${triggerTerms.join(", ")} — can you confirm what's in those?`);
  }
  if (isVague) {
    qs.push("There's a sauce or seasoning listed — can the kitchen confirm what's in it?");
  }

  qs.push("Is there any risk of cross-contact (shared fryer, grill, or utensils)?");
  qs.push("If unsure, can the kitchen check the ingredient list or recipe card?");

  return qs;
}
