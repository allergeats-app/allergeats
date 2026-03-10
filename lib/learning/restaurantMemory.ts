/**
 * lib/learning/restaurantMemory.ts
 *
 * Restaurant-specific memory: learned facts per restaurant × dish × allergen.
 *
 * Trust rules:
 *   - Any staff confirmation immediately overrides inference
 *   - Multiple consistent user reports accumulate trust weight
 *   - Conflicting reports (some say safe, some say unsafe) → "conflicted" verdict
 *   - A single low-trust report never overrides without support
 */

import type { FeedbackEntry, RestaurantMemoryFact } from "./types";

const KEY = "allegeats_restaurant_memory";

function load(): RestaurantMemoryFact[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch { return []; }
}

function save(facts: RestaurantMemoryFact[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(facts)); } catch { }
}

const SAFE_TYPES = new Set([
  "confirmed-safe",
  "staff-confirmed-safe",
  "false-positive",
]);

const UNSAFE_TYPES = new Set([
  "found-unsafe",
  "staff-confirmed-unsafe",
  "false-negative",
  "shared-fryer",
]);

function deriveVerdict(
  fact: RestaurantMemoryFact,
): RestaurantMemoryFact["verdict"] {
  // Staff confirmation is highest authority
  if (fact.staffConfirmedUnsafe) return "unsafe";
  if (fact.staffConfirmedSafe && fact.unsafeCount === 0) return "safe";
  // Conflicting user reports
  if (fact.safeCount > 0 && fact.unsafeCount > 0) return "conflicted";
  // Majority vote
  if (fact.unsafeCount > fact.safeCount) return "unsafe";
  if (fact.safeCount > 0) return "safe";
  return "unknown";
}

function deriveConfidence(
  fact: RestaurantMemoryFact,
): RestaurantMemoryFact["confidence"] {
  if (fact.staffConfirmedSafe || fact.staffConfirmedUnsafe) return "high";
  if (fact.totalTrustWeight >= 8) return "high";
  if (fact.totalTrustWeight >= 4) return "medium";
  return "low";
}

/**
 * Update restaurant memory from a feedback entry.
 * Only meaningful when an allergen is specified.
 */
export function updateMemoryFromFeedback(feedback: FeedbackEntry): void {
  if (!feedback.allergen) return;

  const facts = load();
  let fact = facts.find(
    (f) =>
      f.restaurantId === feedback.restaurantId &&
      f.dishNormalized === feedback.dishNormalized &&
      f.allergen === feedback.allergen,
  );

  if (!fact) {
    fact = {
      restaurantId:         feedback.restaurantId,
      dishNormalized:       feedback.dishNormalized,
      allergen:             feedback.allergen,
      safeCount:            0,
      unsafeCount:          0,
      totalTrustWeight:     0,
      staffConfirmedSafe:   false,
      staffConfirmedUnsafe: false,
      lastUpdated:          Date.now(),
      verdict:              "unknown",
      confidence:           "low",
    };
    facts.push(fact);
  }

  if (SAFE_TYPES.has(feedback.type)) {
    fact.safeCount += 1;
    fact.totalTrustWeight += feedback.trust;
    if (feedback.type === "staff-confirmed-safe") fact.staffConfirmedSafe = true;
  } else if (UNSAFE_TYPES.has(feedback.type)) {
    fact.unsafeCount += 1;
    fact.totalTrustWeight += feedback.trust;
    if (feedback.type === "staff-confirmed-unsafe") fact.staffConfirmedUnsafe = true;
  }

  fact.lastUpdated  = Date.now();
  fact.verdict      = deriveVerdict(fact);
  fact.confidence   = deriveConfidence(fact);

  save(facts);
}

/**
 * Look up the memory fact for a specific restaurant + dish + allergen.
 * Returns null if no memory exists yet.
 */
export function checkMemory(
  restaurantId: string,
  dishNormalized: string,
  allergen: string,
): RestaurantMemoryFact | null {
  return (
    load().find(
      (f) =>
        f.restaurantId === restaurantId &&
        f.dishNormalized === dishNormalized &&
        f.allergen === allergen,
    ) ?? null
  );
}

/**
 * All memory facts for a restaurant.
 * Used to show a "community knowledge" summary on the detail page.
 */
export function getRestaurantMemory(restaurantId: string): RestaurantMemoryFact[] {
  return load().filter((f) => f.restaurantId === restaurantId);
}
