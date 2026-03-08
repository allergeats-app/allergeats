import type { AllergenId } from "./types";

export type AllergenMeta = {
  id: AllergenId;
  label: string;
};

/** All supported allergens with display metadata — top 5 most common first */
export const ALLERGEN_LIST: AllergenMeta[] = [
  { id: "peanut",    label: "Peanut"    },
  { id: "dairy",     label: "Dairy"     },
  { id: "egg",       label: "Egg"       },
  { id: "gluten",    label: "Gluten"    },
  { id: "tree-nut",  label: "Tree Nuts" },
  { id: "wheat",     label: "Wheat"     },
  { id: "soy",       label: "Soy"       },
  { id: "sesame",    label: "Sesame"    },
  { id: "fish",      label: "Fish"      },
  { id: "shellfish", label: "Shellfish" },
  { id: "mustard",   label: "Mustard"   },
  { id: "corn",      label: "Corn"      },
  { id: "legumes",   label: "Legumes"   },
  { id: "oats",      label: "Oats"      },
];

/**
 * Maps profile allergen IDs to the detection strings used by allergenDB / detectAllergens.
 * Bridges the user-facing profile vocabulary to the internal detection vocabulary.
 */
const PROFILE_TO_DETECTOR: Record<AllergenId, string[]> = {
  dairy:       ["dairy"],
  egg:         ["egg"],
  wheat:       ["wheat", "gluten"],
  gluten:      ["wheat", "gluten"],
  soy:         ["soy"],
  // "peanut" matches official allergen arrays; "nuts" matches text-detection in allergenDB
  peanut:      ["peanut", "nuts"],
  "tree-nut":  ["tree-nut", "nuts"],
  sesame:      ["sesame"],
  fish:        ["fish"],
  shellfish:   ["shellfish"],
  mustard:     ["mustard"],
  corn:        ["corn"],
  legumes:     ["legumes"],
  oats:        ["oats"],
};

/**
 * Converts a list of profile allergen IDs into the normalized detector strings
 * used by detectAllergensFromLine and scoreRisk.
 */
export function profileToDetectorAllergens(profileAllergens: AllergenId[]): string[] {
  return [...new Set(profileAllergens.flatMap((a) => PROFILE_TO_DETECTOR[a] ?? [a]))];
}

const STORAGE_KEY = "allegeats_profile_allergens";

export function loadProfileAllergens(): AllergenId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AllergenId[]) : [];
  } catch {
    return [];
  }
}

export function saveProfileAllergens(allergens: AllergenId[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allergens));
}
