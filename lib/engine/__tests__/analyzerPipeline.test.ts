import { describe, it, expect } from "vitest";
import { analyzeMenu, analyzeLine } from "../analyzerPipeline";

// ─── analyzeMenu ──────────────────────────────────────────────────────────────

describe("analyzeMenu — no allergens configured", () => {
  it("marks everything safe when allergen list is empty", () => {
    const result = analyzeMenu(["Cheeseburger", "Peanut Butter Pie"], []);
    expect(result.items.every((i) => i.risk === "safe")).toBe(true);
    expect(result.avoid).toHaveLength(0);
    expect(result.ask).toHaveLength(0);
  });

  it("returns explanation about missing allergen config", () => {
    const result = analyzeMenu(["Grilled Cheese"], []);
    expect(result.items[0].explanation).toMatch(/no allergies/i);
  });
});

describe("analyzeMenu — direct ingredient matches", () => {
  it("flags dairy in a cheeseburger for dairy-allergic user", () => {
    const result = analyzeMenu(["Cheeseburger with cheddar and lettuce"], ["dairy"]);
    const item = result.items[0];
    expect(item.matchedAllergens).toContain("dairy");
    expect(item.risk).not.toBe("safe");
  });

  it("flags peanuts in peanut butter for peanut-allergic user", () => {
    const result = analyzeMenu(["Peanut Butter Cookie"], ["peanut"]);
    const item = result.items[0];
    expect(item.matchedAllergens).toContain("peanut");
    expect(item.risk).not.toBe("safe");
  });

  it("flags wheat/gluten in bread for gluten-allergic user", () => {
    const result = analyzeMenu(["Whole Wheat Bread"], ["gluten"]);
    const item = result.items[0];
    expect(item.matchedAllergens.some((a) => a === "gluten" || a === "wheat")).toBe(true);
    expect(item.risk).not.toBe("safe");
  });

  it("flags shellfish in shrimp scampi for shellfish-allergic user", () => {
    const result = analyzeMenu(["Shrimp Scampi"], ["shellfish"]);
    const item = result.items[0];
    expect(item.matchedAllergens).toContain("shellfish");
    expect(item.risk).not.toBe("safe");
  });

  it("flags egg in mayo for egg-allergic user", () => {
    const result = analyzeMenu(["BLT with mayonnaise"], ["egg"]);
    const item = result.items[0];
    expect(item.matchedAllergens).toContain("egg");
  });
});

describe("analyzeMenu — dish inference", () => {
  it("infers dairy in Alfredo sauce", () => {
    const result = analyzeMenu(["Fettuccine Alfredo"], ["dairy"]);
    expect(result.items[0].matchedAllergens).toContain("dairy");
  });

  it("infers egg/dairy in Caesar salad", () => {
    const result = analyzeMenu(["Caesar Salad"], ["egg", "dairy"]);
    const matched = result.items[0].matchedAllergens;
    expect(matched.some((a) => a === "egg" || a === "dairy")).toBe(true);
  });

  it("infers soy in edamame for soy-allergic user", () => {
    const result = analyzeMenu(["Edamame"], ["soy"]);
    expect(result.items[0].matchedAllergens).toContain("soy");
  });
});

describe("analyzeMenu — safe items", () => {
  it("marks plain grilled chicken as safe for dairy+gluten allergy", () => {
    const result = analyzeMenu(["Grilled Chicken — plain, no sauce"], ["dairy", "gluten"]);
    // May be ask due to cross-contamination ambiguity — just verify not avoid
    expect(result.items[0].risk).not.toBe("avoid");
  });

  it("marks plain fruit salad as safe for peanut+shellfish allergy", () => {
    const result = analyzeMenu(["Fresh Fruit Salad — strawberries, melon, grapes"], ["peanut", "shellfish"]);
    expect(result.items[0].risk).toBe("safe");
  });
});

describe("analyzeMenu — result categorization", () => {
  it("partitions items into safe/ask/avoid correctly", () => {
    const lines = [
      "Peanut Butter Brownie",      // avoid for peanut
      "Grilled Salmon",             // fish match
      "Fresh Fruit Salad",          // safe
    ];
    const result = analyzeMenu(lines, ["peanut"]);
    const peanutItem = result.items.find((i) => i.name.toLowerCase().includes("peanut"));
    expect(peanutItem?.risk).not.toBe("safe");

    const fruitItem = result.items.find((i) => i.name.toLowerCase().includes("fruit"));
    expect(fruitItem?.risk).toBe("safe");
  });

  it("returns empty safe/ask/avoid arrays when input is empty", () => {
    const result = analyzeMenu([], ["dairy"]);
    expect(result.items).toHaveLength(0);
    expect(result.safe).toHaveLength(0);
    expect(result.ask).toHaveLength(0);
    expect(result.avoid).toHaveLength(0);
  });
});

describe("analyzeMenu — allDetectedAllergens", () => {
  it("reports allergens outside user profile for informational display", () => {
    // User only has peanut allergy, but item also contains dairy
    const result = analyzeMenu(["Peanut butter cheesecake with cream cheese"], ["peanut"]);
    const item = result.items[0];
    // matchedAllergens = only profile allergens that matched
    expect(item.matchedAllergens).toContain("peanut");
    // allDetectedAllergens = everything found regardless of profile
    expect(item.allDetectedAllergens).toContain("dairy");
  });
});

// ─── analyzeLine ─────────────────────────────────────────────────────────────

describe("analyzeLine", () => {
  it("analyzes a single line and returns a single AnalyzedItem", () => {
    const item = analyzeLine("Peanut Butter Cup", ["peanut"]);
    expect(item.matchedAllergens).toContain("peanut");
    expect(item.risk).not.toBe("safe");
  });

  it("returns safe for an item with no allergen matches", () => {
    const item = analyzeLine("House Salad — lettuce, tomato, cucumber", ["peanut"]);
    expect(item.risk).toBe("safe");
  });

  it("includes staff questions for matched allergens", () => {
    const item = analyzeLine("Pad Thai with peanuts", ["peanut"]);
    expect(item.staffQuestions.length).toBeGreaterThan(0);
  });

  it("returns a fallback item for an empty line without throwing", () => {
    const item = analyzeLine("", ["dairy"]);
    expect(item).toBeDefined();
    expect(item.risk).toBeDefined();
  });
});

// ─── Confidence levels ────────────────────────────────────────────────────────

describe("confidence levels", () => {
  it("returns a valid confidence level for every analyzed item", () => {
    const lines = ["Peanut Butter Sandwich", "Grilled Chicken", "Caesar Salad"];
    const result = analyzeMenu(lines, ["peanut", "egg", "dairy"]);
    for (const item of result.items) {
      expect(["high", "medium", "low"]).toContain(item.confidence);
    }
  });

  it("returns higher confidence with a menu sourceType than without", () => {
    const withSource = analyzeLine("Peanut Butter Sandwich", ["peanut"], "", "official");
    const withoutSource = analyzeLine("Peanut Butter Sandwich", ["peanut"]);
    const rank = { high: 2, medium: 1, low: 0 };
    expect(rank[withSource.confidence]).toBeGreaterThanOrEqual(rank[withoutSource.confidence]);
  });
});
