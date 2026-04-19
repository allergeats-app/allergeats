/**
 * Admin corrections store — localStorage-based override layer for menu allergen data.
 *
 * When an admin audits an item and finds the official allergen array is wrong or
 * incomplete, they save a correction here. The scoring pipeline applies corrections
 * before scoring, so fixes take effect immediately without a code deploy.
 *
 * Storage key: "allegeats_admin_corrections"
 * Format: Record<"restaurantId::itemId", AdminCorrection>
 */

import type { AllergenId } from "./types";

export type AdminCorrection = {
  restaurantId: string;
  itemId: string;
  /** Corrected allergen array — replaces the item's original allergens field */
  allergens: AllergenId[];
  /** Optional auditor notes explaining the change */
  auditNotes?: string;
  /** ISO date string when this correction was saved */
  verifiedAt: string;
};

const STORAGE_KEY = "allegeats_admin_corrections";

function correctionKey(restaurantId: string, itemId: string): string {
  return `${restaurantId}::${itemId}`;
}

export function getAllCorrections(): Record<string, AdminCorrection> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getCorrectionForItem(
  restaurantId: string,
  itemId: string
): AdminCorrection | null {
  return getAllCorrections()[correctionKey(restaurantId, itemId)] ?? null;
}

export function saveCorrection(correction: AdminCorrection): void {
  const all = getAllCorrections();
  all[correctionKey(correction.restaurantId, correction.itemId)] = correction;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function removeCorrection(restaurantId: string, itemId: string): void {
  const all = getAllCorrections();
  delete all[correctionKey(restaurantId, itemId)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearAllCorrections(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/** Returns corrections as a pretty-printed JSON string for export/download */
export function exportCorrections(): string {
  return JSON.stringify(getAllCorrections(), null, 2);
}

/** Total number of corrections saved */
export function correctionCount(): number {
  return Object.keys(getAllCorrections()).length;
}
