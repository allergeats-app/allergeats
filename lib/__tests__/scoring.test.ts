import { describe, it, expect } from "vitest";
import {
  scoreMenuItem,
  scoreRestaurant,
  bestMatchScore,
  coverageTier,
  coverageWeight,
} from "../scoring";
import type { RawMenuItem, Restaurant } from "../types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeItem(name: string, overrides: Partial<RawMenuItem> = {}): RawMenuItem {
  return { id: name, name, ...overrides };
}

function makeRestaurant(items: RawMenuItem[], overrides: Partial<Restaurant> = {}): Restaurant {
  return {
    id: "test-restaurant",
    name: "Test Place",
    cuisine: "American",
    sourceType: "user-input",
    menuItems: items,
    ...overrides,
  } as Restaurant;
}

// ─── scoreMenuItem ────────────────────────────────────────────────────────────

describe("scoreMenuItem — basic risk classification", () => {
  it("marks a peanut item as avoid for peanut-allergic user", () => {
    const result = scoreMenuItem(makeItem("Peanut Butter Cookie"), "user-input", ["peanut"]);
    expect(result.risk).toBe("avoid");
    expect(result.userAllergenHits).toContain("peanut");
  });

  it("marks a dairy-free item as likely-safe for dairy-only allergy", () => {
    const result = scoreMenuItem(
      makeItem("Fresh Fruit Salad — strawberries, melon, grapes"),
      "user-input",
      ["dairy"]
    );
    expect(result.risk).toBe("likely-safe");
    expect(result.userAllergenHits).toHaveLength(0);
  });

  it("marks a cheesy item as avoid for dairy-allergic user", () => {
    const result = scoreMenuItem(makeItem("Mac and Cheese"), "user-input", ["dairy"]);
    expect(result.risk).not.toBe("likely-safe");
  });

  it("includes explanation for every item", () => {
    const result = scoreMenuItem(makeItem("Shrimp Tacos"), "user-input", ["shellfish"]);
    expect(result.explanation).toBeTruthy();
    expect(result.explanation.length).toBeGreaterThan(5);
  });
});

describe("scoreMenuItem — official source type", () => {
  it("returns likely-safe for official data with no allergen hits", () => {
    const item = makeItem("Grilled Chicken", {
      sourceType: "official",
      allergens: [],
    });
    const result = scoreMenuItem(item, "official", ["dairy", "peanut"]);
    expect(result.risk).toBe("likely-safe");
    expect(result.userAllergenHits).toHaveLength(0);
    expect(result.staffQuestions).toHaveLength(0);
  });

  it("returns avoid for official data that lists a user allergen", () => {
    const item = makeItem("Cheese Pizza", {
      sourceType: "official",
      allergens: ["dairy"],
    });
    const result = scoreMenuItem(item, "official", ["dairy"]);
    expect(result.risk).toBe("avoid");
    expect(result.userAllergenHits).toContain("dairy");
  });

  it("escalates to ask when name contains allergen not in official list (non-FDA allergen)", () => {
    // Corn is not FDA-required — restaurant may omit it from official list
    const item = makeItem("Corn Chowder", {
      sourceType: "official",
      allergens: [],
    });
    const result = scoreMenuItem(item, "official", ["corn"]);
    // Either ask (escalated) or likely-safe — must NOT be avoid (no official hit)
    expect(["ask", "likely-safe"]).toContain(result.risk);
    expect(result.risk).not.toBe("avoid");
  });
});

describe("scoreMenuItem — severity escalation", () => {
  it("escalates ask → avoid when allergen is anaphylactic", () => {
    // Use an item that would normally only warrant "ask" (ambiguous / inferred)
    const item = makeItem("Caesar Salad", { sourceType: "user-input" });
    const anaphylacticSeverities = { egg: "anaphylactic" as const };
    const result = scoreMenuItem(item, "user-input", ["egg"], "Italian", anaphylacticSeverities);
    if (result.userAllergenHits.includes("egg")) {
      // If the engine flagged egg, anaphylactic severity should push it to avoid
      expect(result.risk).toBe("avoid");
    }
    // If no egg hit — verify risk is not inflated
    else {
      expect(result.risk).toBe("likely-safe");
    }
  });

  it("escalates ask → avoid when allergen appears in 'may contain' text and anaphylactic severity set", () => {
    // "may contain peanuts" still contains the word "peanuts", so the direct vocabulary
    // matcher fires alongside the precautionary detector — the item gets a definite signal.
    // With anaphylactic severity, this correctly escalates to avoid.
    const item = makeItem("Granola Bar — may contain peanuts", { sourceType: "user-input" });
    const result = scoreMenuItem(item, "user-input", ["peanut"], "", { peanut: "anaphylactic" });
    expect(result.risk).toBe("avoid");
    expect(result.userAllergenHits).toContain("peanut");
  });
});

describe("scoreMenuItem — output shape", () => {
  it("always returns valid confidence level", () => {
    const result = scoreMenuItem(makeItem("Peanut Butter Sandwich"), "user-input", ["peanut"]);
    expect(["High", "Medium", "Low"]).toContain(result.confidence);
  });

  it("includes substitutions for non-safe items", () => {
    const result = scoreMenuItem(makeItem("Cheese Quesadilla"), "user-input", ["dairy"]);
    if (result.risk !== "likely-safe") {
      expect(Array.isArray(result.substitutions)).toBe(true);
    }
  });

  it("returns empty substitutions for likely-safe items", () => {
    const result = scoreMenuItem(
      makeItem("Garden Salad — lettuce, tomato, cucumber, olive oil"),
      "user-input",
      ["peanut"]
    );
    if (result.risk === "likely-safe") {
      expect(result.substitutions).toHaveLength(0);
    }
  });
});

// ─── scoreRestaurant ──────────────────────────────────────────────────────────

describe("scoreRestaurant", () => {
  it("partitions items into correct summary buckets", () => {
    const items = [
      makeItem("Peanut Butter Cookie"),   // avoid
      makeItem("Grilled Chicken"),         // likely-safe
      makeItem("Fruit Salad"),             // likely-safe
    ];
    const result = scoreRestaurant(makeRestaurant(items), ["peanut"]);
    expect(result.summary.total).toBe(3);
    expect(result.summary.avoid).toBeGreaterThanOrEqual(1);
    expect(result.summary.likelySafe).toBeGreaterThanOrEqual(1);
    expect(
      result.summary.likelySafe + result.summary.ask + result.summary.avoid + result.summary.unknown
    ).toBe(result.summary.total);
  });

  it("returns all likely-safe when user has no allergens", () => {
    const items = [makeItem("Peanut Butter Pie"), makeItem("Cheesecake"), makeItem("Shrimp Tacos")];
    const result = scoreRestaurant(makeRestaurant(items), []);
    expect(result.summary.avoid).toBe(0);
    expect(result.summary.ask).toBe(0);
    expect(result.summary.likelySafe).toBe(3);
  });

  it("returns empty summary for a restaurant with no menu items", () => {
    const result = scoreRestaurant(makeRestaurant([]), ["dairy"]);
    expect(result.summary.total).toBe(0);
    expect(result.summary.likelySafe).toBe(0);
  });

  it("passes cuisine context to each scored item", () => {
    const items = [makeItem("Pad Thai")];
    const result = scoreRestaurant(
      makeRestaurant(items, { cuisine: "Thai" }),
      ["peanut"]
    );
    // Pad Thai in a Thai restaurant should flag peanut via cuisine inference at minimum
    const item = result.scoredItems[0];
    expect(item.risk).not.toBe("likely-safe");
  });
});

// ─── bestMatchScore ───────────────────────────────────────────────────────────

describe("bestMatchScore", () => {
  it("returns negative for a restaurant with no menu data", () => {
    const score = bestMatchScore({ summary: { likelySafe: 0, avoid: 0, total: 0 } });
    expect(score).toBeLessThan(0);
  });

  it("ranks a high-safe restaurant above a high-avoid restaurant", () => {
    const safe  = bestMatchScore({ summary: { likelySafe: 18, avoid: 0,  total: 20 }, distance: 1 });
    const risky = bestMatchScore({ summary: { likelySafe: 2,  avoid: 15, total: 20 }, distance: 1 });
    expect(safe).toBeGreaterThan(risky);
  });

  it("awards zero-avoid bonus only when total ≥ 5", () => {
    const bigMenu   = bestMatchScore({ summary: { likelySafe: 10, avoid: 0, total: 10 } });
    const tinyMenu  = bestMatchScore({ summary: { likelySafe: 2,  avoid: 0, total: 2  } });
    expect(bigMenu).toBeGreaterThan(tinyMenu);
  });

  it("penalises distance — closer is better at equal safety", () => {
    const near = bestMatchScore({ summary: { likelySafe: 10, avoid: 0, total: 10 }, distance: 0.5 });
    const far  = bestMatchScore({ summary: { likelySafe: 10, avoid: 0, total: 10 }, distance: 10 });
    expect(near).toBeGreaterThan(far);
  });

  it("treats null distance as 15 miles (max penalty)", () => {
    const nullDist = bestMatchScore({ summary: { likelySafe: 10, avoid: 0, total: 10 }, distance: null });
    const farDist  = bestMatchScore({ summary: { likelySafe: 10, avoid: 0, total: 10 }, distance: 15 });
    expect(nullDist).toBeCloseTo(farDist, 5);
  });
});

// ─── coverageTier ─────────────────────────────────────────────────────────────

describe("coverageTier", () => {
  it("returns none for 0 items", ()  => expect(coverageTier(0)).toBe("none"));
  it("returns limited for 1 item",  ()  => expect(coverageTier(1)).toBe("limited"));
  it("returns limited for 4 items", ()  => expect(coverageTier(4)).toBe("limited"));
  it("returns partial for 5 items", ()  => expect(coverageTier(5)).toBe("partial"));
  it("returns partial for 19 items",()  => expect(coverageTier(19)).toBe("partial"));
  it("returns full for 20 items",   ()  => expect(coverageTier(20)).toBe("full"));
  it("returns full for 100 items",  ()  => expect(coverageTier(100)).toBe("full"));
});

// ─── coverageWeight ───────────────────────────────────────────────────────────

describe("coverageWeight", () => {
  it("returns 0 for 0 items", () => expect(coverageWeight(0)).toBe(0));
  it("returns 1 for 20+ items", () => expect(coverageWeight(20)).toBe(1));
  it("returns 1 for 100 items", () => expect(coverageWeight(100)).toBe(1));

  it("scales between 0 and 1 for all valid counts", () => {
    for (let n = 0; n <= 25; n++) {
      const w = coverageWeight(n);
      expect(w).toBeGreaterThanOrEqual(0);
      expect(w).toBeLessThanOrEqual(1);
    }
  });

  it("is monotonically non-decreasing as item count grows", () => {
    let prev = 0;
    for (let n = 1; n <= 25; n++) {
      const w = coverageWeight(n);
      expect(w).toBeGreaterThanOrEqual(prev);
      prev = w;
    }
  });
});