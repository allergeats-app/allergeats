"use client";

import { useAllergenProfile } from "@/lib/hooks/useAllergenProfile";
import { useFamilyProfiles } from "@/lib/hooks/useFamilyProfiles";
import type { AllergenId } from "@/lib/types";

export type AllergenSource = "personal" | "family";

export function useEffectiveAllergens(): {
  allergens: AllergenId[];
  source: AllergenSource;
  profileName: string | null;
} {
  const { allergens: personalAllergens } = useAllergenProfile();
  const { activeProfile } = useFamilyProfiles();

  if (activeProfile) {
    return {
      allergens: activeProfile.allergens,
      source: "family",
      profileName: activeProfile.name,
    };
  }

  return {
    allergens: personalAllergens,
    source: "personal",
    profileName: null,
  };
}
