/**
 * lib/learning/memoryInsights.ts
 *
 * Phase 6: UI-ready memory summaries for the restaurant detail page.
 *
 * Converts raw RestaurantMemoryFacts and RestaurantWarnings into
 * MemoryInsight[] — distilled, display-ready cards that the UI can render
 * without any knowledge of the underlying memory data structures.
 *
 * Also provides per-item note formatters for inline display in menu lists.
 */

import type { MemoryInsight, RestaurantWarning } from "./types";
import type { AnalyzedMenuItem } from "@/lib/analysis/types";

// ─── Per-item note formatters ─────────────────────────────────────────────────

/**
 * Returns a one-line display note for an item that has memory signals.
 * Returns null if the item has no memory.
 *
 * Prefers signals that actually changed the risk; falls back to the first signal.
 */
export function getItemMemoryNote(item: AnalyzedMenuItem): string | null {
  if (!item.memorySignals?.length) return null;
  const impactful = item.memorySignals.find((s) => s.memoryChanged);
  return (impactful ?? item.memorySignals[0]).note;
}

/**
 * Format a memory note from raw components — useful when rendering
 * per-item notes outside of the full analysis pipeline.
 */
export function formatMemoryNote(
  verdict: "safe" | "unsafe" | "conflicted",
  sourceCount: number,
  hasStaffConfirmation: boolean,
): string {
  if (hasStaffConfirmation) {
    if (verdict === "safe")     return "Staff confirmed safe at this restaurant";
    if (verdict === "unsafe")   return "Staff confirmed allergen present";
    return "Conflicting staff and user reports — ask again";
  }
  const src = sourceCount === 1 ? "1 report" : `${sourceCount} reports`;
  if (verdict === "safe")   return `${src} confirm this was safe here`;
  if (verdict === "unsafe") return `${src} indicate this contained the allergen`;
  return `Conflicting ${src} — verify with staff`;
}

// ─── Restaurant-level insight aggregation ────────────────────────────────────

/**
 * Produce a list of MemoryInsight[] for the restaurant detail page.
 *
 * Covers four insight categories:
 *   1. Restaurant-level warnings (shared fryer, cross-contact, etc.)
 *   2. Items staff-confirmed safe
 *   3. Items staff-confirmed unsafe
 *   4. Items with conflicting reports
 *   5. Items with community safety reports (3+ non-staff reports)
 *
 * Returns an empty array when there is no memory for the restaurant.
 */
export function getRestaurantInsights(
  allItems: AnalyzedMenuItem[],
  warnings: RestaurantWarning[],
): MemoryInsight[] {
  const insights: MemoryInsight[] = [];

  // ── 1. Restaurant-level warnings ──────────────────────────────────────────
  for (const w of warnings) {
    const title =
      w.warningType === "shared-fryer"   ? "Shared fry oil" :
      w.warningType === "cross-contact"  ? "Cross-contact risk" :
      w.warningType === "rotating-menu"  ? "Menu changes frequently" :
      w.warningType === "staff-uncertainty" ? "Staff gave inconsistent answers" :
      "Restaurant warning";

    insights.push({
      type:        "restaurant-warning",
      title,
      description: w.description,
      allergen:    w.allergen,
      confidence:  w.confidence,
      badgeLabel:  w.confidence === "high" ? "Confirmed" : w.confidence === "medium" ? "Reported" : "Single report",
      badgeColor:  w.confidence === "high" ? "#dc2626" : "#d97706",
    });
  }

  // ── 2. Staff-confirmed safe items ─────────────────────────────────────────
  const confirmedSafe = allItems.filter((i) =>
    i.memorySignals?.some((s) => s.verdict === "safe" && s.hasStaffConfirmation),
  );
  if (confirmedSafe.length > 0) {
    const preview = confirmedSafe.slice(0, 3).map((i) => i.name).join(", ");
    insights.push({
      type:        "item-confirmed-safe",
      title:       `${confirmedSafe.length} item${confirmedSafe.length !== 1 ? "s" : ""} staff-confirmed safe`,
      description: preview + (confirmedSafe.length > 3 ? " and more" : ""),
      confidence:  "high",
      badgeLabel:  "Staff confirmed",
      badgeColor:  "#15803d",
      itemCount:   confirmedSafe.length,
    });
  }

  // ── 3. Staff-confirmed unsafe items ───────────────────────────────────────
  const confirmedUnsafe = allItems.filter((i) =>
    i.memorySignals?.some((s) => s.verdict === "unsafe" && s.hasStaffConfirmation),
  );
  if (confirmedUnsafe.length > 0) {
    const preview = confirmedUnsafe.slice(0, 3).map((i) => i.name).join(", ");
    insights.push({
      type:        "item-confirmed-unsafe",
      title:       `${confirmedUnsafe.length} item${confirmedUnsafe.length !== 1 ? "s" : ""} confirmed to contain allergens`,
      description: preview + (confirmedUnsafe.length > 3 ? " and more" : ""),
      confidence:  "high",
      badgeLabel:  "Staff confirmed",
      badgeColor:  "#dc2626",
      itemCount:   confirmedUnsafe.length,
    });
  }

  // ── 4. Conflicting reports ─────────────────────────────────────────────────
  const conflicted = allItems.filter((i) =>
    i.memorySignals?.some((s) => s.verdict === "conflicted"),
  );
  if (conflicted.length > 0) {
    insights.push({
      type:        "conflicting-reports",
      title:       `${conflicted.length} item${conflicted.length !== 1 ? "s" : ""} with conflicting reports`,
      description: "Some items have inconsistent reports — always ask staff to confirm.",
      confidence:  "low",
      badgeLabel:  "Conflicting",
      badgeColor:  "#d97706",
      itemCount:   conflicted.length,
    });
  }

  // ── 5. Community safety confirmations (3+ non-staff reports) ──────────────
  const communityConfirmed = allItems.filter((i) =>
    i.memorySignals?.some(
      (s) => s.verdict === "safe" && !s.hasStaffConfirmation && s.sourceCount >= 3,
    ),
  );
  if (communityConfirmed.length > 0) {
    insights.push({
      type:        "community-note",
      title:       `${communityConfirmed.length} item${communityConfirmed.length !== 1 ? "s" : ""} with community safety reports`,
      description: "Multiple users confirmed these items safe for your allergens at this location.",
      confidence:  "medium",
      badgeLabel:  "Community reports",
      badgeColor:  "#2563eb",
      itemCount:   communityConfirmed.length,
    });
  }

  return insights;
}
