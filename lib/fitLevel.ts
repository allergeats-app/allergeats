import type { RestaurantSafetySummary } from "./types";

export type FitLevel = "Great Match" | "Good Option" | "Use Caution" | "Limited Data";

export function fitLevel(
  safePercent: number,
  avoidCount: number,
  askCount: number,
  total: number,
): FitLevel {
  if (total < 5) return "Limited Data";
  const avoidPercent = (avoidCount / total) * 100;
  const askPercent   = (askCount   / total) * 100;
  if (total >= 8 && safePercent >= 60 && avoidPercent <= 10 && askPercent <= 35)
    return "Great Match";
  if (safePercent >= 40 && avoidPercent < 20 && avoidCount <= 4)
    return "Good Option";
  return "Use Caution";
}

export function fitBadge(level: FitLevel): { bg: string; color: string } {
  switch (level) {
    case "Great Match":  return { bg: "#dcfce7", color: "#15803d" };
    case "Good Option":  return { bg: "#fef9c3", color: "#a16207" };
    case "Use Caution":  return { bg: "#fee2e2", color: "#b91c1c" };
    case "Limited Data": return { bg: "#f1f5f9", color: "#64748b" };
  }
}

export function fitExplanation(
  level: FitLevel,
  avoidCount: number,
  askCount: number,
  safeCount: number,
): string {
  switch (level) {
    case "Great Match":
      return avoidCount === 0
        ? "Strong match for your allergies"
        : "Mostly safe menu with very low risk";
    case "Good Option":
      if (avoidCount === 0) return `${safeCount} safe picks — ask about ${askCount} item${askCount === 1 ? "" : "s"}`;
      if (avoidCount === 1) return "1 item to avoid — most options are safe";
      return `${safeCount} safe picks, ${avoidCount} items to avoid`;
    case "Use Caution":
      return avoidCount === 0
        ? "Many items need clarification — ask staff before ordering"
        : `${avoidCount} item${avoidCount === 1 ? "" : "s"} to avoid — check before ordering`;
    case "Limited Data":
      return "Scan the menu yourself for a complete picture";
  }
}

export function fitReasoningBullets(
  level: FitLevel,
  summary: RestaurantSafetySummary,
): string[] {
  const { likelySafe, ask, avoid, total } = summary;
  if (total === 0) {
    return [
      "No menu data has been analyzed for this restaurant yet.",
      "Scan the physical menu for personalized results.",
    ];
  }
  switch (level) {
    case "Great Match":
      return [
        avoid === 0
          ? `None of the ${total} analyzed items triggered your allergens.`
          : `Only ${avoid} item${avoid > 1 ? "s" : ""} to avoid across ${total} analyzed items.`,
        ...(ask > 0 ? [`${ask} item${ask > 1 ? "s" : ""} may need a quick staff confirmation.`] : []),
      ];
    case "Good Option":
      return [
        `${likelySafe} out of ${total} analyzed items look safe for your profile.`,
        ...(avoid > 0 ? [`${avoid} item${avoid > 1 ? "s" : ""} contain your allergens — skip those.`] : []),
        ...(ask > 0 ? [`${ask} item${ask > 1 ? "s" : ""} need staff confirmation about preparation.`] : []),
      ];
    case "Use Caution":
      return [
        ...(avoid > 0 ? [`${avoid} item${avoid > 1 ? "s" : ""} contain allergens from your profile.`] : []),
        ...(ask > 0 ? [`${ask} items have uncertain allergen status — confirm with staff.`] : []),
        ...(likelySafe > 0 ? [`${likelySafe} items appear safe, but ask about cross-contact risk.`] : []),
      ];
    case "Limited Data":
      return [
        `Only ${total} item${total > 1 ? "s" : ""} analyzed — not enough for a confident recommendation.`,
        "Scan the physical menu for a complete picture.",
      ];
  }
}
