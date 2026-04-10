/**
 * lib/learning/analysisLog.ts
 *
 * Logs restaurant analysis summaries on each visit.
 * Used for outcome tracking and to identify where the model is weakest.
 */

import type { RestaurantAnalysisLog } from "./types";

const KEY = "allegeats_analysis_log";
const MAX = 100;

function load(): RestaurantAnalysisLog[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(entries: RestaurantAnalysisLog[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { }
}

export function logRestaurantAnalysis(entry: RestaurantAnalysisLog): void {
  const entries = load();
  entries.unshift(entry);
  if (entries.length > MAX) entries.length = MAX;
  save(entries);
}

export function getAnalysisLogs(restaurantId?: string): RestaurantAnalysisLog[] {
  const all = load();
  return restaurantId ? all.filter((e) => e.restaurantId === restaurantId) : all;
}
