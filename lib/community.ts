// lib/community.ts
// Client-side helpers for crowdsourced dish safety data.

export type CommunityScore = {
  dishNormalized: string;
  allergen: string;
  total: number;
  safeCount: number;
  reactionCount: number;
  uncertainCount: number;
};

export type CommunityScoreMap = Map<string, CommunityScore>;

/** Normalize a dish name the same way the server does (strip OCR description suffix) */
export function normalizeDish(name: string): string {
  return name.split("—")[0].split("|")[0]
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fetch community scores for a batch of dishes + allergens */
export async function fetchCommunityScores(
  dishes: string[],
  allergens: string[],
  restaurantName?: string
): Promise<CommunityScoreMap> {
  if (!dishes.length || !allergens.length) return new Map();
  try {
    const res = await fetch("/api/community/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dishes, allergens, restaurantName }),
    });
    if (!res.ok) return new Map();
    const data = await res.json();
    const map: CommunityScoreMap = new Map();
    for (const score of (data.scores ?? []) as CommunityScore[]) {
      map.set(`${score.dishNormalized}::${score.allergen}`, score);
    }
    return map;
  } catch {
    return new Map();
  }
}

/** Get the combined community signal across all of a user's allergens for one dish */
export function getCommunitySignal(
  dishName: string,
  allergens: string[],
  scores: CommunityScoreMap
): { safeTotal: number; reactionTotal: number; total: number } {
  const norm = normalizeDish(dishName);
  let safeTotal = 0, reactionTotal = 0, total = 0;
  for (const allergen of allergens) {
    const score = scores.get(`${norm}::${allergen}`);
    if (score) {
      safeTotal += score.safeCount;
      reactionTotal += score.reactionCount;
      total += score.total;
    }
  }
  return { safeTotal, reactionTotal, total };
}

/** Submit a safety report for a dish */
export async function submitDishReport(opts: {
  dishName: string;
  restaurantName?: string;
  allergen: string;
  outcome: "safe" | "reaction" | "uncertain";
  userId?: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/community/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    return res.ok;
  } catch {
    return false;
  }
}
