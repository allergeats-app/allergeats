/**
 * lib/learning/restaurantMemory.ts
 *
 * Restaurant-specific memory: learned facts per restaurant × dish × allergen,
 * plus restaurant-level warnings (shared fryers, cross-contact risks, etc.).
 *
 * Trust rules:
 *   - Any staff confirmation immediately overrides inference
 *   - Multiple consistent user reports accumulate trust weight
 *   - Conflicting reports (some say safe, some say unsafe) → "conflicted" verdict
 *   - A single low-trust report never overrides without support
 */

import type {
  FeedbackEntry,
  RestaurantMemoryFact,
  MenuItemMemory,
  RestaurantWarning,
} from "./types";

const MEMORY_KEY   = "allegeats_restaurant_memory";
const WARNINGS_KEY = "allegeats_restaurant_warnings";

// ─── Persistence helpers ──────────────────────────────────────────────────────

function loadFacts(): RestaurantMemoryFact[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY) ?? "[]"); }
  catch { return []; }
}

function saveFacts(facts: RestaurantMemoryFact[]): void {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(facts)); } catch { }
}

function loadWarnings(): RestaurantWarning[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(WARNINGS_KEY) ?? "[]"); }
  catch { return []; }
}

function saveWarnings(warnings: RestaurantWarning[]): void {
  try { localStorage.setItem(WARNINGS_KEY, JSON.stringify(warnings)); } catch { }
}

// ─── Feedback classification ──────────────────────────────────────────────────

const SAFE_TYPES = new Set<FeedbackEntry["type"]>([
  "confirmed-safe",
  "staff-confirmed-safe",
  "false-positive",
]);

const UNSAFE_TYPES = new Set<FeedbackEntry["type"]>([
  "found-unsafe",
  "staff-confirmed-unsafe",
  "false-negative",
  "shared-fryer",
]);

// ─── Verdict / confidence derivation ─────────────────────────────────────────

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

// ─── Memory fact update ───────────────────────────────────────────────────────

/**
 * Update restaurant memory from a feedback entry.
 * Only meaningful when an allergen is specified.
 */
export function updateMemoryFromFeedback(feedback: FeedbackEntry): void {
  if (!feedback.allergen) return;

  const facts = loadFacts();
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

  saveFacts(facts);
}

// ─── Memory read API ──────────────────────────────────────────────────────────

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
    loadFacts().find(
      (f) =>
        f.restaurantId === restaurantId &&
        f.dishNormalized === dishNormalized &&
        f.allergen === allergen,
    ) ?? null
  );
}

/**
 * All memory facts for a restaurant.
 * Used to show community knowledge on the detail page and to run the memory integration.
 */
export function getRestaurantMemory(restaurantId: string): RestaurantMemoryFact[] {
  return loadFacts().filter((f) => f.restaurantId === restaurantId);
}

/**
 * All memory facts for a specific dish at a restaurant (across all allergens).
 * Returns a MenuItemMemory shape — convenient for per-item UI rendering.
 */
export function getMenuItemMemory(
  restaurantId: string,
  dishNormalized: string,
): MenuItemMemory | null {
  const facts = loadFacts().filter(
    (f) => f.restaurantId === restaurantId && f.dishNormalized === dishNormalized,
  );
  if (facts.length === 0) return null;
  return {
    restaurantId,
    dishNormalized,
    facts,
    lastUpdated: Math.max(...facts.map((f) => f.lastUpdated)),
  };
}

// ─── Restaurant warnings ──────────────────────────────────────────────────────

/**
 * Get all warnings for a restaurant (shared fryer, cross-contact, etc.).
 */
export function getRestaurantWarnings(restaurantId: string): RestaurantWarning[] {
  return loadWarnings().filter((w) => w.restaurantId === restaurantId);
}

/**
 * Record or update a restaurant-level warning from a feedback entry.
 *
 * Warnings with the same restaurantId + warningType + allergen are merged.
 * evidenceCount accumulates; confidence increases with more reports.
 */
export function addRestaurantWarning(
  feedback: FeedbackEntry,
  warningType: RestaurantWarning["warningType"],
  description: string,
): void {
  const warnings = loadWarnings();
  const existing = warnings.find(
    (w) =>
      w.restaurantId === feedback.restaurantId &&
      w.warningType  === warningType &&
      w.allergen     === feedback.allergen,
  );

  if (existing) {
    existing.evidenceCount  += 1;
    existing.lastReportedAt  = Date.now();
    if (!existing.sources.includes(feedback.type)) existing.sources.push(feedback.type);
    // Confidence upgrades with evidence
    if (existing.evidenceCount >= 5) existing.confidence = "high";
    else if (existing.evidenceCount >= 2) existing.confidence = "medium";
  } else {
    warnings.push({
      id:             `rw_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      restaurantId:   feedback.restaurantId,
      warningType,
      allergen:       feedback.allergen,
      description,
      confidence:     "low",
      evidenceCount:  1,
      lastReportedAt: Date.now(),
      sources:        [feedback.type],
    });
  }

  saveWarnings(warnings);
}
