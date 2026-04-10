/**
 * lib/learning/feedbackStore.ts
 *
 * Persists user feedback entries to localStorage.
 * Feedback is the raw input; restaurant memory and rules are derived from it.
 */

import type { FeedbackEntry } from "./types";

const KEY = "allegeats_feedback";
const MAX = 300;

function load(): FeedbackEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function save(entries: FeedbackEntry[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { }
}

export function storeFeedback(entry: FeedbackEntry): void {
  const entries = load();
  entries.unshift(entry);
  if (entries.length > MAX) entries.length = MAX;
  save(entries);
}

export function getFeedbackFor(
  restaurantId: string,
  dishNormalized?: string,
): FeedbackEntry[] {
  return load().filter(
    (e) =>
      e.restaurantId === restaurantId &&
      (dishNormalized == null || e.dishNormalized === dishNormalized),
  );
}

export function getAllFeedback(): FeedbackEntry[] {
  return load();
}
