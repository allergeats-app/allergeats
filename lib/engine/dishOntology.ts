/**
 * lib/engine/dishOntology.ts
 *
 * Structured food knowledge base: dishes, sauces, breads, and desserts
 * mapped to their likely ingredients and allergens.
 *
 * Each entry has:
 *   canonical  — the authoritative dish name used in reasoning text
 *   variants   — all the ways this dish appears on real menus (substring match)
 *   category   — semantic grouping
 *   cuisine    — origin (optional, for context)
 *   ingredients — each ingredient with allergen, confidence (common/possible), and reason
 *
 * Confidence levels:
 *   "common"   — ingredient is present in virtually all versions → weight 3 (Avoid)
 *   "possible" — ingredient appears in many but not all versions → weight 2 (Ask)
 */

import type { AllergenId } from "@/lib/types";

export type IngredientConfidence = "common" | "possible";

export interface DishIngredient {
  ingredient: string;              // e.g. "cream", "parmesan", "anchovies"
  allergen:   AllergenId;
  confidence: IngredientConfidence;
  reason:     string;              // one sentence shown to the user
}

export type DishCategory =
  | "sauce" | "dressing" | "dish" | "soup" | "bread"
  | "pastry" | "dessert" | "condiment" | "side"
  | "sandwich" | "breakfast" | "pizza" | "pasta";

export interface DishEntry {
  canonical:   string;           // authoritative name used in reasoning
  variants:    string[];         // all menu-text substrings that trigger this entry
  category:    DishCategory;
  cuisine?:    string;
  ingredients: DishIngredient[];
}

// ─── Pre-sorted at module load (longest variant first) ───────────────────────
// Sorted in ingredientInferencer — exported raw here for testing/extension.

export const DISH_ONTOLOGY: DishEntry[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // SAUCES & DRESSINGS
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "alfredo sauce",
    variants:  ["alfredo"],
    category:  "sauce",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "heavy cream",  allergen: "dairy", confidence: "common",   reason: "Alfredo sauce is a cream and parmesan reduction" },
      { ingredient: "parmesan",     allergen: "dairy", confidence: "common",   reason: "Alfredo sauce is a cream and parmesan reduction" },
      { ingredient: "butter",       allergen: "dairy", confidence: "common",   reason: "Alfredo sauce uses butter as its fat base" },
    ],
  },

  {
    canonical: "carbonara sauce",
    variants:  ["carbonara"],
    category:  "sauce",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "egg yolks",  allergen: "egg",   confidence: "common",   reason: "Carbonara is made with egg yolks for creaminess" },
      { ingredient: "pecorino",   allergen: "dairy", confidence: "common",   reason: "Carbonara uses pecorino or parmesan cheese" },
      { ingredient: "guanciale",  allergen: "egg",   confidence: "possible", reason: "Some versions add cream (contains dairy)" },
    ],
  },

  {
    canonical: "caesar dressing",
    variants:  ["caesar"],
    category:  "dressing",
    cuisine:   "American",
    ingredients: [
      { ingredient: "anchovies",  allergen: "fish",  confidence: "common",   reason: "Traditional Caesar dressing contains anchovies" },
      { ingredient: "egg yolk",   allergen: "egg",   confidence: "common",   reason: "Caesar dressing uses egg yolk or mayo as emulsifier" },
      { ingredient: "parmesan",   allergen: "dairy", confidence: "common",   reason: "Caesar dressing contains parmesan cheese" },
    ],
  },

  {
    canonical: "hollandaise sauce",
    variants:  ["hollandaise", "eggs benedict", "eggs benny"],
    category:  "sauce",
    cuisine:   "French",
    ingredients: [
      { ingredient: "egg yolks", allergen: "egg",   confidence: "common", reason: "Hollandaise is an emulsion of egg yolks and butter" },
      { ingredient: "butter",    allergen: "dairy", confidence: "common", reason: "Hollandaise sauce is butter-based" },
    ],
  },

  {
    canonical: "béarnaise sauce",
    variants:  ["béarnaise", "bearnaise"],
    category:  "sauce",
    cuisine:   "French",
    ingredients: [
      { ingredient: "egg yolks", allergen: "egg",   confidence: "common", reason: "Béarnaise is an egg yolk and butter emulsion" },
      { ingredient: "butter",    allergen: "dairy", confidence: "common", reason: "Béarnaise sauce is clarified-butter based" },
    ],
  },

  {
    canonical: "béchamel sauce",
    variants:  ["bechamel", "béchamel", "white sauce", "mornay"],
    category:  "sauce",
    cuisine:   "French",
    ingredients: [
      { ingredient: "milk",        allergen: "dairy", confidence: "common", reason: "Béchamel is a milk and butter roux sauce" },
      { ingredient: "butter",      allergen: "dairy", confidence: "common", reason: "Béchamel is a milk and butter roux sauce" },
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Béchamel uses wheat flour as a thickener" },
    ],
  },

  {
    canonical: "ranch dressing",
    variants:  ["ranch dressing", "ranch sauce", "ranch"],
    category:  "dressing",
    ingredients: [
      { ingredient: "buttermilk", allergen: "dairy", confidence: "common",   reason: "Ranch dressing is buttermilk-based" },
      { ingredient: "mayonnaise", allergen: "egg",   confidence: "common",   reason: "Ranch dressing uses a mayo or egg base" },
    ],
  },

  {
    canonical: "blue cheese dressing",
    variants:  ["blue cheese dressing", "bleu cheese dressing"],
    category:  "dressing",
    ingredients: [
      { ingredient: "blue cheese",  allergen: "dairy", confidence: "common", reason: "Blue cheese dressing contains crumbled blue cheese" },
      { ingredient: "sour cream",   allergen: "dairy", confidence: "common", reason: "Blue cheese dressing uses a cream or mayo base" },
    ],
  },

  {
    canonical: "pesto",
    variants:  ["pesto"],
    category:  "sauce",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "pine nuts",  allergen: "tree-nut", confidence: "common",   reason: "Traditional pesto contains pine nuts" },
      { ingredient: "parmesan",   allergen: "dairy",    confidence: "common",   reason: "Traditional pesto is finished with parmesan" },
    ],
  },

  {
    canonical: "remoulade",
    variants:  ["remoulade", "rémoulade"],
    category:  "condiment",
    ingredients: [
      { ingredient: "mayonnaise", allergen: "egg",   confidence: "common", reason: "Remoulade is mayonnaise-based" },
      { ingredient: "mustard",    allergen: "mustard", confidence: "common", reason: "Remoulade typically contains mustard" },
    ],
  },

  {
    canonical: "aioli",
    variants:  ["aioli"],
    category:  "condiment",
    ingredients: [
      { ingredient: "egg yolk", allergen: "egg",  confidence: "common",   reason: "Aioli is an emulsified egg and oil sauce" },
      { ingredient: "garlic",   allergen: "egg",  confidence: "common",   reason: "Garlic aioli uses egg as an emulsifier" },
    ],
  },

  {
    canonical: "tartar sauce",
    variants:  ["tartar sauce", "tartare sauce"],
    category:  "condiment",
    ingredients: [
      { ingredient: "mayonnaise", allergen: "egg",   confidence: "common", reason: "Tartar sauce is mayonnaise-based" },
    ],
  },

  {
    canonical: "tahini",
    variants:  ["tahini"],
    category:  "condiment",
    ingredients: [
      { ingredient: "sesame paste", allergen: "sesame", confidence: "common", reason: "Tahini is ground sesame seed paste" },
    ],
  },

  {
    canonical: "tikka masala sauce",
    variants:  ["tikka masala", "tikka"],
    category:  "sauce",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "heavy cream",  allergen: "dairy", confidence: "common",   reason: "Tikka masala sauce is finished with cream" },
      { ingredient: "yogurt",       allergen: "dairy", confidence: "common",   reason: "Tikka masala marinade uses yogurt" },
    ],
  },

  {
    canonical: "korma sauce",
    variants:  ["korma"],
    category:  "sauce",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "cream",      allergen: "dairy",    confidence: "common",   reason: "Korma sauce is cream and nut based" },
      { ingredient: "cashews",    allergen: "tree-nut", confidence: "common",   reason: "Korma sauce is thickened with ground cashews or almonds" },
    ],
  },

  {
    canonical: "saag",
    variants:  ["saag", "palak"],
    category:  "dish",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "cream",  allergen: "dairy", confidence: "common",   reason: "Saag is finished with cream or paneer" },
      { ingredient: "paneer", allergen: "dairy", confidence: "possible", reason: "Saag paneer contains fresh cheese (paneer)" },
    ],
  },

  {
    canonical: "mole sauce",
    variants:  ["mole sauce", "mole negro", "mole"],
    category:  "sauce",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "dried chiles",  allergen: "tree-nut", confidence: "possible", reason: "Some mole sauces contain almonds or peanuts" },
      { ingredient: "chocolate",     allergen: "dairy",    confidence: "possible", reason: "Some mole sauces include chocolate or dairy" },
    ],
  },

  {
    canonical: "peanut sauce",
    variants:  ["peanut sauce", "satay sauce"],
    category:  "sauce",
    cuisine:   "Asian",
    ingredients: [
      { ingredient: "peanut butter", allergen: "peanut", confidence: "common",   reason: "Peanut/satay sauce is peanut butter based" },
      { ingredient: "soy sauce",     allergen: "soy",    confidence: "common",   reason: "Peanut sauce typically uses soy sauce" },
      { ingredient: "soy sauce",     allergen: "wheat",  confidence: "common",   reason: "Soy sauce in peanut sauce contains wheat" },
    ],
  },

  {
    canonical: "teriyaki sauce",
    variants:  ["teriyaki"],
    category:  "sauce",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "soy sauce",    allergen: "soy",   confidence: "common", reason: "Teriyaki sauce is soy sauce based" },
      { ingredient: "soy sauce",    allergen: "wheat", confidence: "common", reason: "Soy sauce in teriyaki contains wheat" },
    ],
  },

  {
    canonical: "hoisin sauce",
    variants:  ["hoisin"],
    category:  "sauce",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "soy",     allergen: "soy",   confidence: "common", reason: "Hoisin sauce is soybean paste based" },
      { ingredient: "sesame",  allergen: "sesame", confidence: "common", reason: "Hoisin sauce contains sesame" },
      { ingredient: "wheat",   allergen: "wheat",  confidence: "common", reason: "Hoisin sauce contains wheat starch" },
    ],
  },

  {
    canonical: "oyster sauce",
    variants:  ["oyster sauce"],
    category:  "sauce",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "oyster extract", allergen: "shellfish", confidence: "common", reason: "Oyster sauce is made from oyster extract" },
    ],
  },

  {
    canonical: "fish sauce",
    variants:  ["fish sauce", "nam pla", "nuoc mam"],
    category:  "condiment",
    cuisine:   "Southeast Asian",
    ingredients: [
      { ingredient: "fermented fish", allergen: "fish", confidence: "common", reason: "Fish sauce is fermented fish — contains fish" },
    ],
  },

  {
    canonical: "tzatziki",
    variants:  ["tzatziki"],
    category:  "condiment",
    cuisine:   "Greek",
    ingredients: [
      { ingredient: "Greek yogurt", allergen: "dairy", confidence: "common", reason: "Tzatziki is made with Greek yogurt" },
    ],
  },

  {
    canonical: "raita",
    variants:  ["raita"],
    category:  "condiment",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "yogurt", allergen: "dairy", confidence: "common", reason: "Raita is a yogurt-based condiment" },
    ],
  },

  {
    canonical: "queso",
    variants:  ["queso", "cheese sauce", "nacho cheese"],
    category:  "sauce",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "processed cheese", allergen: "dairy", confidence: "common", reason: "Queso/nacho cheese sauce is dairy based" },
      { ingredient: "milk",             allergen: "dairy", confidence: "common", reason: "Queso is melted cheese and milk" },
    ],
  },

  {
    canonical: "worcestershire sauce",
    variants:  ["worcestershire"],
    category:  "condiment",
    ingredients: [
      { ingredient: "anchovies", allergen: "fish", confidence: "common", reason: "Worcestershire sauce contains anchovies" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PASTA & RICE DISHES
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "macaroni and cheese",
    variants:  ["mac and cheese", "mac n cheese", "mac & cheese", "macaroni and cheese",
                "macaroni & cheese", "macaroni cheese", "truffle mac", "baked mac"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "pasta",          allergen: "wheat", confidence: "common", reason: "Mac and cheese uses wheat pasta" },
      { ingredient: "cheese sauce",   allergen: "dairy", confidence: "common", reason: "Mac and cheese is a cheese sauce dish" },
    ],
  },

  {
    canonical: "risotto",
    variants:  ["risotto"],
    category:  "dish",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "parmesan",  allergen: "dairy", confidence: "common",   reason: "Risotto is finished with parmesan and butter" },
      { ingredient: "butter",    allergen: "dairy", confidence: "common",   reason: "Risotto uses butter as a finishing ingredient" },
    ],
  },

  {
    canonical: "ravioli",
    variants:  ["ravioli"],
    category:  "dish",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "pasta dough",  allergen: "wheat", confidence: "common",   reason: "Ravioli is made from wheat pasta dough" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common",   reason: "Fresh pasta dough for ravioli contains egg" },
      { ingredient: "ricotta",      allergen: "dairy", confidence: "possible", reason: "Ravioli filling is often ricotta based" },
    ],
  },

  {
    canonical: "gnocchi",
    variants:  ["gnocchi"],
    category:  "dish",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common",   reason: "Traditional gnocchi contains wheat flour" },
      { ingredient: "egg",         allergen: "egg",   confidence: "possible", reason: "Many gnocchi recipes include egg yolk" },
    ],
  },

  {
    canonical: "lasagna",
    variants:  ["lasagna", "lasagne"],
    category:  "dish",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "pasta sheets",  allergen: "wheat", confidence: "common",   reason: "Lasagna uses wheat pasta sheets" },
      { ingredient: "béchamel",      allergen: "dairy", confidence: "common",   reason: "Lasagna typically includes a béchamel layer" },
      { ingredient: "cheese",        allergen: "dairy", confidence: "common",   reason: "Lasagna is layered with mozzarella and parmesan" },
      { ingredient: "egg",           allergen: "egg",   confidence: "possible", reason: "Some lasagna recipes bind the ricotta layer with egg" },
    ],
  },

  {
    canonical: "ramen",
    variants:  ["ramen"],
    category:  "dish",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "wheat noodles", allergen: "wheat", confidence: "common",   reason: "Ramen uses alkaline wheat noodles" },
      { ingredient: "soy broth",     allergen: "soy",   confidence: "common",   reason: "Ramen broth typically includes soy sauce" },
      { ingredient: "soft egg",      allergen: "egg",   confidence: "possible", reason: "Ramen is often topped with a marinated soft-boiled egg" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ASIAN DISHES
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "pad thai",
    variants:  ["pad thai"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "fish sauce",    allergen: "fish",   confidence: "common",   reason: "Pad Thai uses fish sauce for seasoning" },
      { ingredient: "egg",           allergen: "egg",    confidence: "common",   reason: "Pad Thai is typically stir-fried with egg" },
      { ingredient: "peanuts",       allergen: "peanut", confidence: "common",   reason: "Pad Thai is garnished with crushed peanuts" },
      { ingredient: "tamarind",      allergen: "soy",    confidence: "possible", reason: "Some Pad Thai preparations include soy sauce" },
    ],
  },

  {
    canonical: "massaman curry",
    variants:  ["massaman curry", "massaman"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "peanuts",       allergen: "peanut",    confidence: "common",   reason: "Massaman curry contains whole roasted peanuts" },
      { ingredient: "shrimp paste",  allergen: "shellfish", confidence: "possible", reason: "Massaman curry paste typically contains shrimp paste" },
      { ingredient: "coconut milk",  allergen: "tree-nut",  confidence: "possible", reason: "Coconut milk is not a tree-nut allergen by FDA rules, but some people react to it" },
    ],
  },

  {
    canonical: "green papaya salad",
    variants:  ["papaya salad", "som tum"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "fish sauce",  allergen: "fish",   confidence: "common",   reason: "Thai papaya salad uses fish sauce as dressing" },
      { ingredient: "dried shrimp", allergen: "shellfish", confidence: "common", reason: "Traditional som tum includes dried shrimp" },
      { ingredient: "peanuts",     allergen: "peanut", confidence: "possible", reason: "Many versions are garnished with peanuts" },
    ],
  },

  {
    canonical: "kung pao chicken",
    variants:  ["kung pao", "kung pow"],
    category:  "dish",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "peanuts",    allergen: "peanut", confidence: "common",   reason: "Kung pao is defined by its roasted peanuts" },
      { ingredient: "soy sauce",  allergen: "soy",    confidence: "common",   reason: "Kung pao sauce is soy-based" },
      { ingredient: "soy sauce",  allergen: "wheat",  confidence: "common",   reason: "Soy sauce in kung pao contains wheat" },
    ],
  },

  {
    canonical: "general tso's chicken",
    variants:  ["general tso", "general tso's", "general tsao"],
    category:  "dish",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "batter",     allergen: "wheat", confidence: "common",   reason: "General Tso's chicken is battered and fried in wheat" },
      { ingredient: "soy sauce",  allergen: "soy",   confidence: "common",   reason: "General Tso sauce is soy based" },
      { ingredient: "egg",        allergen: "egg",   confidence: "possible", reason: "The breading batter for General Tso's often includes egg" },
    ],
  },

  {
    canonical: "orange chicken",
    variants:  ["orange chicken"],
    category:  "dish",
    cuisine:   "Chinese-American",
    ingredients: [
      { ingredient: "batter",    allergen: "wheat", confidence: "common", reason: "Orange chicken is battered with wheat flour" },
      { ingredient: "soy sauce", allergen: "soy",   confidence: "common", reason: "Orange chicken sauce contains soy" },
      { ingredient: "egg",       allergen: "egg",   confidence: "possible", reason: "The batter for orange chicken may include egg" },
    ],
  },

  {
    canonical: "dumplings",
    variants:  ["dumplings", "gyoza", "jiaozi", "potstickers", "pot stickers", "wontons", "wonton"],
    category:  "dish",
    cuisine:   "Asian",
    ingredients: [
      { ingredient: "wheat wrapper", allergen: "wheat", confidence: "common",   reason: "Dumpling wrappers are made from wheat flour" },
      { ingredient: "soy dipping sauce", allergen: "soy", confidence: "common", reason: "Dumplings are served with soy-based dipping sauce" },
      { ingredient: "egg",           allergen: "egg",   confidence: "possible", reason: "Some dumpling wrappers contain egg" },
    ],
  },

  {
    canonical: "dim sum",
    variants:  ["dim sum", "yum cha"],
    category:  "dish",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "wheat wrappers", allergen: "wheat", confidence: "common",   reason: "Most dim sum items use wheat-based wrappers or dough" },
      { ingredient: "soy sauce",      allergen: "soy",   confidence: "common",   reason: "Dim sum is served with soy dipping sauces" },
      { ingredient: "egg",            allergen: "egg",   confidence: "possible", reason: "Some dim sum dishes (egg tarts, har gow variants) contain egg" },
      { ingredient: "shellfish",      allergen: "shellfish", confidence: "possible", reason: "Many dim sum items (har gow, siu mai) contain shrimp" },
    ],
  },

  {
    canonical: "spring rolls",
    variants:  ["spring rolls", "egg rolls"],
    category:  "dish",
    cuisine:   "Asian",
    ingredients: [
      { ingredient: "wheat wrapper", allergen: "wheat", confidence: "common", reason: "Spring/egg roll wrappers are wheat based" },
      { ingredient: "egg",           allergen: "egg",   confidence: "possible", reason: "Some spring roll wrappers contain egg" },
    ],
  },

  {
    canonical: "tempura",
    variants:  ["tempura"],
    category:  "dish",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "wheat flour batter", allergen: "wheat", confidence: "common",   reason: "Tempura batter is wheat flour based" },
      { ingredient: "egg",                allergen: "egg",   confidence: "possible", reason: "Some tempura batters include egg" },
    ],
  },

  {
    canonical: "miso soup",
    variants:  ["miso soup", "miso"],
    category:  "soup",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "miso paste",  allergen: "soy",  confidence: "common",   reason: "Miso paste is fermented soybean" },
      { ingredient: "dashi stock", allergen: "fish", confidence: "possible", reason: "Traditional miso soup uses dashi made from fish flakes" },
    ],
  },

  {
    canonical: "tom kha gai",
    variants:  ["tom kha", "tom kha gai"],
    category:  "soup",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "fish sauce",   allergen: "fish", confidence: "common", reason: "Tom kha gai uses fish sauce for seasoning" },
    ],
  },

  {
    canonical: "pho",
    variants:  ["pho"],
    category:  "soup",
    cuisine:   "Vietnamese",
    ingredients: [
      { ingredient: "fish sauce",  allergen: "fish", confidence: "possible", reason: "Pho broth often uses fish sauce as a seasoning" },
      { ingredient: "hoisin",      allergen: "soy",  confidence: "possible", reason: "Pho is commonly served with hoisin sauce (contains soy)" },
      { ingredient: "soy sauce",   allergen: "wheat", confidence: "possible", reason: "Some pho broths use soy sauce (contains wheat)" },
    ],
  },

  {
    canonical: "banh mi",
    variants:  ["banh mi", "bánh mì"],
    category:  "dish",
    cuisine:   "Vietnamese",
    ingredients: [
      { ingredient: "baguette",    allergen: "wheat", confidence: "common",   reason: "Banh mi is served on a wheat baguette" },
      { ingredient: "mayonnaise",  allergen: "egg",   confidence: "common",   reason: "Banh mi typically uses mayo or aioli spread" },
      { ingredient: "fish sauce",  allergen: "fish",  confidence: "possible", reason: "Some banh mi marinades use fish sauce" },
    ],
  },

  {
    canonical: "bibimbap",
    variants:  ["bibimbap"],
    category:  "dish",
    cuisine:   "Korean",
    ingredients: [
      { ingredient: "egg",        allergen: "egg",   confidence: "common",   reason: "Bibimbap is traditionally topped with a fried or raw egg" },
      { ingredient: "sesame oil", allergen: "sesame", confidence: "common",  reason: "Bibimbap is dressed with sesame oil" },
      { ingredient: "gochujang",  allergen: "soy",   confidence: "common",   reason: "Bibimbap sauce (gochujang) contains soy" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SOUPS & STEWS
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "clam chowder",
    variants:  ["clam chowder", "new england chowder"],
    category:  "soup",
    cuisine:   "American",
    ingredients: [
      { ingredient: "clams",       allergen: "shellfish", confidence: "common", reason: "Clam chowder is shellfish based" },
      { ingredient: "heavy cream", allergen: "dairy",     confidence: "common", reason: "New England clam chowder is cream based" },
      { ingredient: "flour",       allergen: "wheat",     confidence: "common", reason: "Clam chowder is thickened with wheat flour" },
    ],
  },

  {
    canonical: "lobster bisque",
    variants:  ["lobster bisque", "crab bisque", "seafood bisque", "bisque"],
    category:  "soup",
    cuisine:   "French",
    ingredients: [
      { ingredient: "shellfish",   allergen: "shellfish", confidence: "common",   reason: "Bisque is a shellfish-based cream soup" },
      { ingredient: "heavy cream", allergen: "dairy",     confidence: "common",   reason: "Bisque is cream based" },
      { ingredient: "flour",       allergen: "wheat",     confidence: "possible", reason: "Bisque is often thickened with wheat flour" },
    ],
  },

  {
    canonical: "French onion soup",
    variants:  ["french onion soup", "onion soup"],
    category:  "soup",
    cuisine:   "French",
    ingredients: [
      { ingredient: "croutons",  allergen: "wheat", confidence: "common", reason: "French onion soup is topped with wheat croutons" },
      { ingredient: "gruyère",   allergen: "dairy", confidence: "common", reason: "French onion soup is topped with melted gruyère cheese" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEDITERRANEAN & MIDDLE EASTERN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "hummus",
    variants:  ["hummus"],
    category:  "condiment",
    cuisine:   "Mediterranean",
    ingredients: [
      { ingredient: "chickpeas", allergen: "legumes", confidence: "common", reason: "Hummus is made from blended chickpeas" },
      { ingredient: "tahini",    allergen: "sesame",  confidence: "common", reason: "Hummus contains tahini (sesame paste)" },
    ],
  },

  {
    canonical: "falafel",
    variants:  ["falafel"],
    category:  "dish",
    cuisine:   "Mediterranean",
    ingredients: [
      { ingredient: "chickpeas", allergen: "legumes", confidence: "common",   reason: "Falafel is made from ground chickpeas or fava beans" },
      { ingredient: "sesame",    allergen: "sesame",  confidence: "common",   reason: "Falafel is often coated in sesame seeds" },
      { ingredient: "flour",     allergen: "wheat",   confidence: "possible", reason: "Some falafel recipes use wheat flour as a binder" },
    ],
  },

  {
    canonical: "baba ganoush",
    variants:  ["baba ganoush", "baba ghanoush", "baba ghanouj"],
    category:  "condiment",
    cuisine:   "Mediterranean",
    ingredients: [
      { ingredient: "tahini", allergen: "sesame", confidence: "common", reason: "Baba ganoush is blended with tahini (sesame paste)" },
    ],
  },

  {
    canonical: "shakshuka",
    variants:  ["shakshuka", "shakshouka"],
    category:  "dish",
    cuisine:   "Middle Eastern",
    ingredients: [
      { ingredient: "eggs", allergen: "egg", confidence: "common", reason: "Shakshuka is eggs poached in tomato sauce" },
    ],
  },

  {
    canonical: "spanakopita",
    variants:  ["spanakopita", "spinach pie"],
    category:  "pastry",
    cuisine:   "Greek",
    ingredients: [
      { ingredient: "phyllo dough", allergen: "wheat", confidence: "common", reason: "Spanakopita uses phyllo pastry (wheat based)" },
      { ingredient: "feta cheese",  allergen: "dairy", confidence: "common", reason: "Spanakopita filling contains feta cheese" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common", reason: "Spanakopita filling is bound with egg" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEXICAN & TEX-MEX
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "quesadilla",
    variants:  ["quesadilla"],
    category:  "dish",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "flour tortilla", allergen: "wheat", confidence: "common", reason: "Quesadillas use flour tortillas (wheat based)" },
      { ingredient: "cheese",         allergen: "dairy", confidence: "common", reason: "Quesadillas are filled with melted cheese" },
    ],
  },

  {
    canonical: "enchiladas",
    variants:  ["enchilada", "enchiladas"],
    category:  "dish",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "wheat tortilla", allergen: "wheat", confidence: "common",   reason: "Flour enchiladas use wheat tortillas" },
      { ingredient: "cheese",         allergen: "dairy", confidence: "common",   reason: "Enchiladas are topped with melted cheese" },
      { ingredient: "sour cream",     allergen: "dairy", confidence: "possible", reason: "Enchiladas are often served with sour cream" },
    ],
  },

  {
    canonical: "nachos",
    variants:  ["nachos"],
    category:  "dish",
    cuisine:   "Tex-Mex",
    ingredients: [
      { ingredient: "tortilla chips",  allergen: "corn",  confidence: "common", reason: "Nachos are corn tortilla chips" },
      { ingredient: "cheese sauce",    allergen: "dairy", confidence: "common", reason: "Nachos are topped with cheese sauce" },
    ],
  },

  {
    canonical: "chile relleno",
    variants:  ["chile relleno", "chili relleno", "relleno"],
    category:  "dish",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "egg batter", allergen: "egg",   confidence: "common",   reason: "Chile relleno is dipped in egg batter before frying" },
      { ingredient: "cheese",     allergen: "dairy", confidence: "common",   reason: "Chile relleno is stuffed with melted cheese" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INDIAN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "naan",
    variants:  ["naan"],
    category:  "bread",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common",   reason: "Naan is a wheat-based leavened flatbread" },
      { ingredient: "yogurt",      allergen: "dairy", confidence: "common",   reason: "Naan dough contains yogurt" },
      { ingredient: "butter",      allergen: "dairy", confidence: "possible", reason: "Naan is often brushed with butter or ghee" },
    ],
  },

  {
    canonical: "samosa",
    variants:  ["samosa", "samosas"],
    category:  "pastry",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "wheat dough", allergen: "wheat", confidence: "common", reason: "Samosa pastry is wheat based" },
    ],
  },

  {
    canonical: "biryani",
    variants:  ["biryani", "biriyani"],
    category:  "dish",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "ghee",   allergen: "dairy", confidence: "common",   reason: "Biryani is cooked with ghee (clarified butter)" },
      { ingredient: "yogurt", allergen: "dairy", confidence: "possible", reason: "Biryani marinade often includes yogurt" },
    ],
  },

  {
    canonical: "dal",
    variants:  ["dal", "dhal", "daal"],
    category:  "dish",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "lentils", allergen: "legumes", confidence: "common", reason: "Dal is a lentil or split pea based dish" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BREADS & PASTRY
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "croissant",
    variants:  ["croissant"],
    category:  "pastry",
    cuisine:   "French",
    ingredients: [
      { ingredient: "wheat flour",   allergen: "wheat", confidence: "common", reason: "Croissant dough is wheat based" },
      { ingredient: "butter layers", allergen: "dairy", confidence: "common", reason: "Croissants are laminated with layers of butter" },
      { ingredient: "egg wash",      allergen: "egg",   confidence: "common", reason: "Croissants are glazed with egg wash before baking" },
    ],
  },

  {
    canonical: "brioche",
    variants:  ["brioche"],
    category:  "bread",
    cuisine:   "French",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Brioche is a wheat-based enriched bread" },
      { ingredient: "butter",      allergen: "dairy", confidence: "common", reason: "Brioche contains a high proportion of butter" },
      { ingredient: "eggs",        allergen: "egg",   confidence: "common", reason: "Brioche dough contains multiple eggs" },
    ],
  },

  {
    canonical: "challah",
    variants:  ["challah"],
    category:  "bread",
    cuisine:   "Jewish",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Challah is a braided wheat bread" },
      { ingredient: "eggs",        allergen: "egg",   confidence: "common", reason: "Challah contains eggs in the dough and egg wash glaze" },
    ],
  },

  {
    canonical: "bao bun",
    variants:  ["bao bun", "steamed bun", "baozi", "bao"],
    category:  "bread",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Bao buns are steamed wheat dough" },
    ],
  },

  {
    canonical: "empanada",
    variants:  ["empanada", "empanadas"],
    category:  "pastry",
    cuisine:   "Latin American",
    ingredients: [
      { ingredient: "wheat dough", allergen: "wheat", confidence: "common",   reason: "Empanada pastry is wheat based" },
      { ingredient: "egg",         allergen: "egg",   confidence: "possible", reason: "Empanada dough may contain egg" },
    ],
  },

  {
    canonical: "pierogi",
    variants:  ["pierogi", "perogies", "pierogies"],
    category:  "dish",
    cuisine:   "Eastern European",
    ingredients: [
      { ingredient: "wheat dough", allergen: "wheat", confidence: "common",   reason: "Pierogi dough is wheat based" },
      { ingredient: "egg",         allergen: "egg",   confidence: "possible", reason: "Pierogi dough often contains egg" },
      { ingredient: "cheese",      allergen: "dairy", confidence: "possible", reason: "Pierogi filling is often potato and cheese" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EGGS & BRUNCH
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "quiche",
    variants:  ["quiche"],
    category:  "dish",
    cuisine:   "French",
    ingredients: [
      { ingredient: "eggs",         allergen: "egg",   confidence: "common", reason: "Quiche is an egg custard tart" },
      { ingredient: "cream",        allergen: "dairy", confidence: "common", reason: "Quiche filling contains cream or milk" },
      { ingredient: "pastry shell", allergen: "wheat", confidence: "common", reason: "Quiche has a wheat shortcrust pastry shell" },
    ],
  },

  {
    canonical: "frittata",
    variants:  ["frittata"],
    category:  "dish",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "eggs",   allergen: "egg",   confidence: "common",   reason: "Frittata is an Italian egg dish" },
      { ingredient: "cheese", allergen: "dairy", confidence: "possible", reason: "Frittata often contains cheese" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DESSERTS
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "tiramisu",
    variants:  ["tiramisu"],
    category:  "dessert",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "mascarpone",    allergen: "dairy", confidence: "common", reason: "Tiramisu uses mascarpone cheese" },
      { ingredient: "egg yolks",     allergen: "egg",   confidence: "common", reason: "Tiramisu is made with whipped egg yolks" },
      { ingredient: "ladyfinger biscuits", allergen: "wheat", confidence: "common", reason: "Tiramisu is layered with wheat-based ladyfinger cookies" },
    ],
  },

  {
    canonical: "crème brûlée",
    variants:  ["creme brulee", "crème brûlée", "creme brûlée"],
    category:  "dessert",
    cuisine:   "French",
    ingredients: [
      { ingredient: "heavy cream", allergen: "dairy", confidence: "common", reason: "Crème brûlée is a cream custard" },
      { ingredient: "egg yolks",   allergen: "egg",   confidence: "common", reason: "Crème brûlée custard is made with egg yolks" },
    ],
  },

  {
    canonical: "chocolate mousse",
    variants:  ["chocolate mousse", "mousse au chocolat"],
    category:  "dessert",
    cuisine:   "French",
    ingredients: [
      { ingredient: "cream",     allergen: "dairy", confidence: "common", reason: "Chocolate mousse is whipped cream based" },
      { ingredient: "egg whites", allergen: "egg",  confidence: "common", reason: "Chocolate mousse is aerated with egg whites" },
    ],
  },

  {
    canonical: "baklava",
    variants:  ["baklava"],
    category:  "dessert",
    cuisine:   "Mediterranean",
    ingredients: [
      { ingredient: "walnuts or pistachios", allergen: "tree-nut", confidence: "common", reason: "Baklava is layered with ground nuts (walnuts or pistachios)" },
      { ingredient: "phyllo dough",          allergen: "wheat",    confidence: "common", reason: "Baklava uses wheat-based phyllo pastry" },
    ],
  },

  {
    canonical: "cheesecake",
    variants:  ["cheesecake"],
    category:  "dessert",
    cuisine:   "American",
    ingredients: [
      { ingredient: "cream cheese", allergen: "dairy", confidence: "common",   reason: "Cheesecake filling is cream cheese based" },
      { ingredient: "eggs",         allergen: "egg",   confidence: "common",   reason: "Cheesecake is set with eggs in the filling" },
      { ingredient: "graham cracker crust", allergen: "wheat", confidence: "common", reason: "Cheesecake typically has a wheat-based crust" },
    ],
  },

  {
    canonical: "cannoli",
    variants:  ["cannoli", "cannolo"],
    category:  "dessert",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "ricotta or mascarpone", allergen: "dairy", confidence: "common", reason: "Cannoli filling is ricotta or mascarpone based" },
      { ingredient: "fried shell",           allergen: "wheat", confidence: "common", reason: "Cannoli shells are fried wheat dough" },
    ],
  },

  {
    canonical: "profiteroles",
    variants:  ["profiteroles", "cream puffs", "éclairs", "eclairs", "choux"],
    category:  "dessert",
    cuisine:   "French",
    ingredients: [
      { ingredient: "choux pastry",  allergen: "wheat", confidence: "common", reason: "Profiteroles/éclairs are made from wheat-based choux pastry" },
      { ingredient: "eggs",          allergen: "egg",   confidence: "common", reason: "Choux pastry is rich in eggs" },
      { ingredient: "cream filling", allergen: "dairy", confidence: "common", reason: "Profiteroles/éclairs are filled with cream" },
    ],
  },

  {
    canonical: "crêpe",
    variants:  ["crepe", "crêpe", "crepes", "crêpes"],
    category:  "pastry",
    cuisine:   "French",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Crêpe batter is wheat flour based" },
      { ingredient: "eggs",        allergen: "egg",   confidence: "common", reason: "Crêpe batter contains eggs" },
      { ingredient: "milk/butter", allergen: "dairy", confidence: "common", reason: "Crêpe batter uses milk and butter" },
    ],
  },

  {
    canonical: "churros",
    variants:  ["churros", "churro"],
    category:  "pastry",
    cuisine:   "Spanish",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common",   reason: "Churros are made from wheat choux dough" },
      { ingredient: "egg",         allergen: "egg",   confidence: "possible", reason: "Some churro recipes contain egg" },
    ],
  },

  {
    canonical: "crème caramel",
    variants:  ["creme caramel", "crème caramel", "flan", "flanc"],
    category:  "dessert",
    cuisine:   "French",
    ingredients: [
      { ingredient: "milk/cream", allergen: "dairy", confidence: "common", reason: "Flan/crème caramel is a milk and cream custard" },
      { ingredient: "eggs",       allergen: "egg",   confidence: "common", reason: "Flan is set with whole eggs or egg yolks" },
    ],
  },

  {
    canonical: "panna cotta",
    variants:  ["panna cotta"],
    category:  "dessert",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "cream", allergen: "dairy", confidence: "common", reason: "Panna cotta is a cream-based dessert" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AMERICAN / PUB
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "buffalo wings",
    variants:  ["buffalo wing", "buffalo wings", "buffalo chicken wing", "buffalo tenders"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "butter",       allergen: "dairy", confidence: "common",   reason: "Buffalo sauce is made with hot sauce emulsified with butter" },
      { ingredient: "wheat flour",  allergen: "wheat", confidence: "possible", reason: "Wings are often floured or breaded before frying" },
      { ingredient: "egg",          allergen: "egg",   confidence: "possible", reason: "Breaded versions use egg wash" },
    ],
  },

  {
    canonical: "fried chicken",
    variants:  ["fried chicken", "chicken tenders", "chicken strips", "chicken fingers", "crispy chicken"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "wheat flour",   allergen: "wheat", confidence: "common",   reason: "Fried chicken is dredged in seasoned wheat flour" },
      { ingredient: "egg",           allergen: "egg",   confidence: "common",   reason: "Egg wash helps the breading adhere" },
      { ingredient: "buttermilk",    allergen: "dairy", confidence: "possible", reason: "Southern fried chicken is often marinated in buttermilk" },
    ],
  },

  {
    canonical: "crab cakes",
    variants:  ["crab cake", "crab cakes"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "crab meat",    allergen: "shellfish", confidence: "common",   reason: "Crab cakes are made with crab meat" },
      { ingredient: "breadcrumbs",  allergen: "wheat",     confidence: "common",   reason: "Crab cakes are bound and coated with breadcrumbs" },
      { ingredient: "egg",          allergen: "egg",       confidence: "common",   reason: "Egg is used as a binder in crab cakes" },
      { ingredient: "mayonnaise",   allergen: "egg",       confidence: "common",   reason: "Mayo (egg-based) is used as a binder" },
      { ingredient: "cream",        allergen: "dairy",     confidence: "possible", reason: "Some recipes add cream or dairy" },
    ],
  },

  {
    canonical: "lobster roll",
    variants:  ["lobster roll", "lobster rolls"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "lobster",      allergen: "shellfish", confidence: "common", reason: "Lobster roll is filled with lobster meat" },
      { ingredient: "hot dog bun",  allergen: "wheat",     confidence: "common", reason: "Lobster rolls are served in a buttered, toasted bun" },
      { ingredient: "butter",       allergen: "dairy",     confidence: "common", reason: "Bun is toasted in butter; Connecticut style adds more butter" },
      { ingredient: "mayonnaise",   allergen: "egg",       confidence: "possible", reason: "Maine style uses mayo-dressed lobster salad" },
    ],
  },

  {
    canonical: "poutine",
    variants:  ["poutine"],
    category:  "dish",
    cuisine:   "Canadian",
    ingredients: [
      { ingredient: "cheese curds", allergen: "dairy", confidence: "common",   reason: "Poutine is topped with fresh cheese curds" },
      { ingredient: "gravy",        allergen: "wheat", confidence: "possible", reason: "Gravy is often thickened with wheat flour" },
    ],
  },

  {
    canonical: "pot pie",
    variants:  ["pot pie", "chicken pot pie", "beef pot pie"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "pastry crust", allergen: "wheat", confidence: "common",   reason: "Pot pie has a wheat-based pastry crust" },
      { ingredient: "cream/milk",   allergen: "dairy", confidence: "common",   reason: "The filling is a cream-based sauce" },
      { ingredient: "butter",       allergen: "dairy", confidence: "common",   reason: "Crust and sauce both use butter" },
      { ingredient: "egg wash",     allergen: "egg",   confidence: "possible", reason: "Crust is often brushed with egg wash for browning" },
    ],
  },

  {
    canonical: "fish and chips",
    variants:  ["fish and chips", "fish & chips", "fish n chips"],
    category:  "dish",
    cuisine:   "British",
    ingredients: [
      { ingredient: "battered fish",  allergen: "fish",  confidence: "common",   reason: "Fish and chips features battered white fish" },
      { ingredient: "wheat batter",   allergen: "wheat", confidence: "common",   reason: "The fish is coated in a wheat-flour batter" },
      { ingredient: "malt vinegar",   allergen: "gluten", confidence: "possible", reason: "Traditional accompaniment is malt (barley) vinegar" },
    ],
  },

  {
    canonical: "chicken cordon bleu",
    variants:  ["cordon bleu"],
    category:  "dish",
    cuisine:   "French",
    ingredients: [
      { ingredient: "breadcrumbs",  allergen: "wheat", confidence: "common", reason: "Cordon bleu is breaded with wheat breadcrumbs" },
      { ingredient: "egg wash",     allergen: "egg",   confidence: "common", reason: "Breading uses egg wash to adhere" },
      { ingredient: "cheese",       allergen: "dairy", confidence: "common", reason: "Stuffed with cheese (typically Swiss or Gruyère)" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ASIAN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "fried rice",
    variants:  ["fried rice", "wok fried rice", "egg fried rice"],
    category:  "dish",
    cuisine:   "Asian",
    ingredients: [
      { ingredient: "soy sauce", allergen: "soy",   confidence: "common", reason: "Fried rice is seasoned with soy sauce" },
      { ingredient: "soy sauce", allergen: "wheat",  confidence: "common", reason: "Standard soy sauce contains wheat" },
      { ingredient: "egg",       allergen: "egg",    confidence: "common", reason: "Egg fried rice is made with scrambled egg folded in" },
      { ingredient: "sesame oil", allergen: "sesame", confidence: "possible", reason: "Many fried rice recipes finish with sesame oil" },
    ],
  },

  {
    canonical: "bulgogi",
    variants:  ["bulgogi", "beef bulgogi", "pork bulgogi"],
    category:  "dish",
    cuisine:   "Korean",
    ingredients: [
      { ingredient: "soy sauce",  allergen: "soy",    confidence: "common",   reason: "Bulgogi marinade is soy sauce based" },
      { ingredient: "soy sauce",  allergen: "wheat",   confidence: "common",   reason: "Standard soy sauce contains wheat" },
      { ingredient: "sesame oil", allergen: "sesame",  confidence: "common",   reason: "Bulgogi marinade includes sesame oil" },
      { ingredient: "sesame seeds", allergen: "sesame", confidence: "common",  reason: "Bulgogi is typically garnished with sesame seeds" },
    ],
  },

  {
    canonical: "ahi poke",
    variants:  ["poke bowl", "ahi poke", "poke"],
    category:  "dish",
    cuisine:   "Hawaiian",
    ingredients: [
      { ingredient: "raw tuna",   allergen: "fish",   confidence: "common",   reason: "Ahi poke is made with raw yellowfin tuna" },
      { ingredient: "soy sauce",  allergen: "soy",    confidence: "common",   reason: "Poke is marinated in soy sauce" },
      { ingredient: "soy sauce",  allergen: "wheat",   confidence: "common",   reason: "Standard soy sauce contains wheat" },
      { ingredient: "sesame oil", allergen: "sesame",  confidence: "common",   reason: "Poke is dressed with sesame oil" },
      { ingredient: "sesame seeds", allergen: "sesame", confidence: "common",  reason: "Poke bowls are garnished with sesame seeds" },
    ],
  },

  {
    canonical: "peking duck",
    variants:  ["peking duck", "beijing duck", "crispy duck"],
    category:  "dish",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "hoisin sauce",    allergen: "soy",    confidence: "common", reason: "Peking duck is served with hoisin sauce" },
      { ingredient: "hoisin sauce",    allergen: "wheat",   confidence: "common", reason: "Hoisin sauce contains wheat" },
      { ingredient: "steamed pancakes", allergen: "wheat",  confidence: "common", reason: "Peking duck is wrapped in thin wheat-flour pancakes" },
      { ingredient: "sesame",          allergen: "sesame",  confidence: "possible", reason: "Hoisin sauce often contains sesame" },
    ],
  },

  {
    canonical: "schnitzel",
    variants:  ["schnitzel", "wiener schnitzel"],
    category:  "dish",
    cuisine:   "German",
    ingredients: [
      { ingredient: "wheat flour",  allergen: "wheat", confidence: "common", reason: "Schnitzel is dredged in flour before breading" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common", reason: "Schnitzel is coated in egg wash" },
      { ingredient: "breadcrumbs",  allergen: "wheat", confidence: "common", reason: "Schnitzel is coated in fine breadcrumbs" },
      { ingredient: "butter",       allergen: "dairy", confidence: "possible", reason: "Wiener schnitzel is traditionally fried in clarified butter" },
    ],
  },

  {
    canonical: "katsu",
    variants:  ["katsu", "tonkatsu", "chicken katsu", "pork katsu", "katsu curry"],
    category:  "dish",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "panko breadcrumbs", allergen: "wheat", confidence: "common", reason: "Katsu is coated in Japanese panko (wheat) breadcrumbs" },
      { ingredient: "egg wash",          allergen: "egg",   confidence: "common", reason: "Katsu uses egg wash to adhere the panko coating" },
      { ingredient: "katsu sauce",       allergen: "wheat", confidence: "common", reason: "Tonkatsu sauce contains wheat (Worcestershire base)" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // EUROPEAN / MIDDLE EASTERN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "moussaka",
    variants:  ["moussaka", "mousakka"],
    category:  "dish",
    cuisine:   "Greek",
    ingredients: [
      { ingredient: "béchamel sauce", allergen: "dairy", confidence: "common", reason: "Moussaka is topped with a thick béchamel sauce" },
      { ingredient: "wheat flour",    allergen: "wheat", confidence: "common", reason: "Béchamel is thickened with wheat flour" },
      { ingredient: "egg",            allergen: "egg",   confidence: "common", reason: "Béchamel topping often uses egg for richness" },
    ],
  },

  {
    canonical: "shepherd's pie",
    variants:  ["shepherd's pie", "shepherds pie", "cottage pie"],
    category:  "dish",
    cuisine:   "British",
    ingredients: [
      { ingredient: "butter",      allergen: "dairy", confidence: "common",   reason: "Mashed potato topping uses butter and cream" },
      { ingredient: "cream/milk",  allergen: "dairy", confidence: "common",   reason: "Mashed potatoes are made with cream or milk" },
      { ingredient: "wheat flour", allergen: "wheat", confidence: "possible", reason: "Gravy/sauce is often thickened with flour" },
    ],
  },

  {
    canonical: "meatballs",
    variants:  ["meatball", "meatballs", "polpette"],
    category:  "dish",
    ingredients: [
      { ingredient: "breadcrumbs",  allergen: "wheat", confidence: "common",   reason: "Meatballs are bound with breadcrumbs" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common",   reason: "Egg is used as a binder in meatballs" },
      { ingredient: "parmesan",     allergen: "dairy", confidence: "possible", reason: "Italian-style meatballs often contain parmesan" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INDIAN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "butter chicken",
    variants:  ["butter chicken", "murgh makhani", "chicken makhani"],
    category:  "dish",
    cuisine:   "Indian",
    ingredients: [
      { ingredient: "cream",  allergen: "dairy", confidence: "common", reason: "Butter chicken sauce is cream and tomato based" },
      { ingredient: "butter", allergen: "dairy", confidence: "common", reason: "The sauce is enriched with butter (makhani = butter)" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DESSERTS (additional)
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "bread pudding",
    variants:  ["bread pudding", "bread and butter pudding"],
    category:  "dessert",
    cuisine:   "British",
    ingredients: [
      { ingredient: "bread",   allergen: "wheat", confidence: "common", reason: "Bread pudding is made with stale bread" },
      { ingredient: "eggs",    allergen: "egg",   confidence: "common", reason: "Bread pudding custard is egg-based" },
      { ingredient: "milk/cream", allergen: "dairy", confidence: "common", reason: "Bread pudding is soaked in cream or milk custard" },
    ],
  },

  {
    canonical: "lava cake",
    variants:  ["lava cake", "molten cake", "molten chocolate cake", "chocolate lava cake", "fondant au chocolat"],
    category:  "dessert",
    cuisine:   "French",
    ingredients: [
      { ingredient: "butter",      allergen: "dairy", confidence: "common", reason: "Lava cake batter is enriched with butter" },
      { ingredient: "eggs",        allergen: "egg",   confidence: "common", reason: "Lava cake uses whole eggs and yolks for the batter" },
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Lava cake contains a small amount of wheat flour" },
    ],
  },

  {
    canonical: "tres leches",
    variants:  ["tres leches", "tres leches cake"],
    category:  "dessert",
    cuisine:   "Latin",
    ingredients: [
      { ingredient: "whole milk",        allergen: "dairy", confidence: "common", reason: "Tres leches is soaked in three types of milk" },
      { ingredient: "condensed milk",    allergen: "dairy", confidence: "common", reason: "Condensed milk is one of the three milk soak components" },
      { ingredient: "evaporated milk",   allergen: "dairy", confidence: "common", reason: "Evaporated milk is one of the three milk soak components" },
      { ingredient: "eggs",              allergen: "egg",   confidence: "common", reason: "The sponge cake base uses eggs" },
      { ingredient: "wheat flour",       allergen: "wheat", confidence: "common", reason: "The sponge cake base uses wheat flour" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // THAI CURRIES & SOUTHEAST ASIAN SOUPS
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "Thai green curry",
    variants:  ["green curry"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "green curry paste", allergen: "shellfish", confidence: "common",   reason: "Thai green curry paste is made with shrimp paste (kapi)" },
      { ingredient: "fish sauce",        allergen: "fish",       confidence: "common",   reason: "Green curry is seasoned with fish sauce" },
    ],
  },

  {
    canonical: "Thai red curry",
    variants:  ["red curry"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "red curry paste", allergen: "shellfish", confidence: "common",   reason: "Thai red curry paste is made with shrimp paste (kapi)" },
      { ingredient: "fish sauce",      allergen: "fish",       confidence: "common",   reason: "Red curry is seasoned with fish sauce" },
    ],
  },

  {
    canonical: "Thai yellow curry",
    variants:  ["yellow curry"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "yellow curry paste", allergen: "shellfish", confidence: "common",   reason: "Thai yellow curry paste is made with shrimp paste (kapi)" },
      { ingredient: "fish sauce",         allergen: "fish",       confidence: "common",   reason: "Yellow curry is seasoned with fish sauce" },
    ],
  },

  {
    canonical: "Panang curry",
    variants:  ["panang curry", "phanaeng curry"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "panang curry paste", allergen: "shellfish", confidence: "common",   reason: "Panang curry paste is made with shrimp paste" },
      { ingredient: "peanuts",            allergen: "peanut",    confidence: "common",   reason: "Panang curry is characterised by ground peanuts in the paste" },
      { ingredient: "fish sauce",         allergen: "fish",       confidence: "common",   reason: "Panang curry is seasoned with fish sauce" },
    ],
  },

  {
    canonical: "tom yum",
    variants:  ["tom yum", "tom yam", "tom yum goong"],
    category:  "soup",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "fish sauce",  allergen: "fish",      confidence: "common",   reason: "Tom yum uses fish sauce as its primary seasoning" },
      { ingredient: "shrimp",      allergen: "shellfish", confidence: "possible", reason: "Tom yum is commonly made with shrimp (tom yum goong)" },
    ],
  },

  {
    canonical: "laksa",
    variants:  ["laksa"],
    category:  "soup",
    cuisine:   "Southeast Asian",
    ingredients: [
      { ingredient: "shrimp paste", allergen: "shellfish", confidence: "common",   reason: "Laksa broth base is built on shrimp paste" },
      { ingredient: "fish sauce",   allergen: "fish",      confidence: "possible", reason: "Laksa broth is often seasoned with fish sauce" },
    ],
  },

  // ─── SANDWICHES & BURGERS ──────────────────────────────────────────────────

  {
    canonical: "chicken sandwich",
    variants:  ["chicken sandwich", "crispy chicken sandwich", "classic chicken sandwich",
                "spicy chicken sandwich", "chicken club", "chicken burger"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bun",          allergen: "wheat",  confidence: "common",   reason: "Served on a wheat bun" },
      { ingredient: "breading",     allergen: "wheat",  confidence: "common",   reason: "Chicken patty is coated in seasoned wheat flour" },
      { ingredient: "egg wash",     allergen: "egg",    confidence: "common",   reason: "Egg wash is used to adhere the breading to the chicken" },
      { ingredient: "mayo / sauce", allergen: "egg",    confidence: "common",   reason: "Standard sandwich sauces (mayo, aioli, ranch) are egg-based" },
      { ingredient: "cheese",       allergen: "dairy",  confidence: "possible", reason: "Cheese is a common topping — ask to omit if dairy-free" },
      { ingredient: "soy oil",      allergen: "soy",    confidence: "possible", reason: "Many fast-casual fryers use soybean oil; marinade may contain soy" },
    ],
  },

  {
    canonical: "burger",
    variants:  ["burger", "cheeseburger", "hamburger", "smash burger", "double burger",
                "bacon burger", "mushroom burger", "veggie burger"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bun",        allergen: "wheat",   confidence: "common",   reason: "Burger buns contain wheat flour" },
      { ingredient: "sesame bun", allergen: "sesame",  confidence: "common",   reason: "Classic burger buns are topped with sesame seeds" },
      { ingredient: "cheese",     allergen: "dairy",   confidence: "common",   reason: "Cheeseburgers include melted cheese — request no cheese to avoid dairy" },
      { ingredient: "mayo",       allergen: "egg",     confidence: "possible", reason: "Mayo and special sauces are egg-based" },
      { ingredient: "butter",     allergen: "dairy",   confidence: "possible", reason: "Buns are often toasted in butter" },
    ],
  },

  {
    canonical: "fish sandwich",
    variants:  ["fish sandwich", "fish burger", "crispy fish sandwich", "fish fillet sandwich",
                "filet o fish", "fish filet"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "fish patty",  allergen: "fish",   confidence: "common",   reason: "Contains a breaded fish fillet (typically pollock or cod)" },
      { ingredient: "bun",         allergen: "wheat",  confidence: "common",   reason: "Served on a wheat bun" },
      { ingredient: "breading",    allergen: "wheat",  confidence: "common",   reason: "Fish fillet is coated in wheat breading" },
      { ingredient: "tartar sauce",allergen: "egg",    confidence: "common",   reason: "Tartar sauce is mayo-based — contains egg" },
      { ingredient: "cheese",      allergen: "dairy",  confidence: "possible", reason: "Some versions include a slice of cheese" },
    ],
  },

  {
    canonical: "BLT",
    variants:  ["blt", "blt sandwich", "bacon lettuce tomato"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bread",  allergen: "wheat",  confidence: "common",   reason: "Served on toasted wheat bread" },
      { ingredient: "mayo",   allergen: "egg",    confidence: "common",   reason: "Mayo spread is egg-based" },
    ],
  },

  {
    canonical: "turkey sandwich",
    variants:  ["turkey sandwich", "turkey club", "turkey wrap", "turkey sub", "turkey melt"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bread",  allergen: "wheat",  confidence: "common",   reason: "Served on wheat bread, roll, or wrap" },
      { ingredient: "mayo",   allergen: "egg",    confidence: "common",   reason: "Mayo spread is egg-based" },
      { ingredient: "cheese", allergen: "dairy",  confidence: "possible", reason: "Turkey clubs and melts typically include cheese" },
    ],
  },

  {
    canonical: "grilled cheese",
    variants:  ["grilled cheese", "grilled cheese sandwich", "toasted cheese"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bread",   allergen: "wheat",  confidence: "common", reason: "Made with wheat bread" },
      { ingredient: "cheese",  allergen: "dairy",  confidence: "common", reason: "Grilled cheese is filled with melted cheese" },
      { ingredient: "butter",  allergen: "dairy",  confidence: "common", reason: "Bread is buttered on the outside before grilling" },
    ],
  },

  {
    canonical: "hot dog",
    variants:  ["hot dog", "hotdog", "frank", "frankfurter", "corn dog"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bun",      allergen: "wheat", confidence: "common",   reason: "Hot dog buns contain wheat flour" },
      { ingredient: "batter",   allergen: "wheat", confidence: "common",   reason: "Corn dog batter is made with wheat and/or cornmeal" },
      { ingredient: "egg",      allergen: "egg",   confidence: "possible", reason: "Corn dog batter typically includes egg" },
      { ingredient: "mustard",  allergen: "mustard", confidence: "possible", reason: "Mustard is a common condiment on hot dogs" },
    ],
  },

  // ─── BREAKFAST ITEMS ───────────────────────────────────────────────────────

  {
    canonical: "pancakes",
    variants:  ["pancake", "pancakes", "flapjacks", "hotcakes", "buttermilk pancakes"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Pancake batter is made with wheat flour" },
      { ingredient: "egg",         allergen: "egg",   confidence: "common", reason: "Eggs are in the batter for structure" },
      { ingredient: "buttermilk",  allergen: "dairy", confidence: "common", reason: "Buttermilk pancakes use dairy in the batter" },
      { ingredient: "butter",      allergen: "dairy", confidence: "common", reason: "Cooked in butter and typically served with butter" },
    ],
  },

  {
    canonical: "waffles",
    variants:  ["waffle", "waffles", "belgian waffle", "chicken and waffles"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Waffle batter is made with wheat flour" },
      { ingredient: "egg",         allergen: "egg",   confidence: "common", reason: "Eggs are in the batter for structure and crispness" },
      { ingredient: "butter/milk", allergen: "dairy", confidence: "common", reason: "Waffle batter contains milk and butter" },
    ],
  },

  {
    canonical: "french toast",
    variants:  ["french toast", "eggy bread"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bread",  allergen: "wheat", confidence: "common", reason: "Made with wheat bread" },
      { ingredient: "egg",    allergen: "egg",   confidence: "common", reason: "Bread is soaked in an egg custard before cooking" },
      { ingredient: "milk",   allergen: "dairy", confidence: "common", reason: "Custard mixture contains milk or cream" },
    ],
  },

  {
    canonical: "omelette",
    variants:  ["omelette", "omelet", "western omelette", "denver omelette", "veggie omelette"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "eggs",   allergen: "egg",   confidence: "common",   reason: "An omelette is made entirely from eggs" },
      { ingredient: "cheese", allergen: "dairy", confidence: "common",   reason: "Most omelettes include melted cheese" },
      { ingredient: "butter", allergen: "dairy", confidence: "possible", reason: "Cooked in butter" },
    ],
  },

  {
    canonical: "eggs benedict",
    variants:  ["eggs benedict", "egg benedict", "eggs florentine"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "eggs",         allergen: "egg",   confidence: "common", reason: "Poached eggs are the main component" },
      { ingredient: "hollandaise",  allergen: "egg",   confidence: "common", reason: "Hollandaise sauce is an egg-yolk emulsion" },
      { ingredient: "hollandaise",  allergen: "dairy", confidence: "common", reason: "Hollandaise sauce is made with butter" },
      { ingredient: "english muffin", allergen: "wheat", confidence: "common", reason: "Served on a wheat English muffin" },
    ],
  },

  // ─── PIZZA & PASTA ─────────────────────────────────────────────────────────

  {
    canonical: "margherita pizza",
    variants:  ["margherita", "margherita pizza", "cheese pizza", "plain pizza"],
    category:  "pizza",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "dough",        allergen: "wheat",  confidence: "common", reason: "Pizza dough is made with wheat flour" },
      { ingredient: "mozzarella",   allergen: "dairy",  confidence: "common", reason: "Topped with mozzarella cheese" },
    ],
  },

  {
    canonical: "pepperoni pizza",
    variants:  ["pepperoni pizza", "pepperoni"],
    category:  "pizza",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "dough",      allergen: "wheat", confidence: "common", reason: "Pizza dough is made with wheat flour" },
      { ingredient: "cheese",     allergen: "dairy", confidence: "common", reason: "Topped with mozzarella cheese" },
      { ingredient: "pepperoni",  allergen: "soy",   confidence: "possible", reason: "Pepperoni may contain soy fillers" },
    ],
  },

  {
    canonical: "carbonara",
    variants:  ["carbonara", "pasta carbonara", "spaghetti carbonara"],
    category:  "pasta",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "pasta",     allergen: "wheat",  confidence: "common", reason: "Made with wheat pasta" },
      { ingredient: "egg yolks", allergen: "egg",    confidence: "common", reason: "Carbonara sauce is an egg-yolk emulsion — no cream used in the authentic version" },
      { ingredient: "pecorino",  allergen: "dairy",  confidence: "common", reason: "Topped with pecorino Romano or parmesan" },
    ],
  },

  // ─── SIDES & APPETIZERS ────────────────────────────────────────────────────

  {
    canonical: "french fries",
    variants:  ["french fries", "fries", "waffle fries", "steak fries", "shoestring fries",
                "curly fries", "seasoned fries"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "soy oil",  allergen: "soy",  confidence: "possible", reason: "Many commercial fryers use soybean oil — cross-contact risk" },
      { ingredient: "seasoning", allergen: "wheat", confidence: "possible", reason: "Seasoned fries sometimes contain wheat-based flavoring or coating" },
    ],
  },

  {
    canonical: "onion rings",
    variants:  ["onion rings", "onion ring"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "batter",   allergen: "wheat", confidence: "common",   reason: "Onion rings are dipped in wheat flour batter" },
      { ingredient: "egg",      allergen: "egg",   confidence: "possible", reason: "Batter may include egg for crispness" },
      { ingredient: "buttermilk", allergen: "dairy", confidence: "possible", reason: "Some batters use buttermilk" },
    ],
  },

  {
    canonical: "mac and cheese",
    variants:  ["mac and cheese", "macaroni and cheese", "mac & cheese", "mac n cheese"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "pasta",  allergen: "wheat", confidence: "common", reason: "Macaroni is a wheat pasta" },
      { ingredient: "cheese sauce", allergen: "dairy", confidence: "common", reason: "The sauce is made from cheese, butter, and milk" },
      { ingredient: "egg",    allergen: "egg",   confidence: "possible", reason: "Some baked mac and cheese recipes use egg as a binder" },
    ],
  },

  {
    canonical: "coleslaw",
    variants:  ["coleslaw", "cole slaw", "slaw"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "mayo",  allergen: "egg",   confidence: "common",   reason: "Classic coleslaw dressing is mayo-based — contains egg" },
      { ingredient: "dairy", allergen: "dairy", confidence: "possible", reason: "Creamy coleslaw may contain sour cream or buttermilk" },
    ],
  },

  // ─── APPETIZERS & STARTERS ─────────────────────────────────────────────────

  {
    canonical: "bloomin onion",
    variants:  ["bloomin onion", "bloomin' onion", "cactus blossom", "awesome blossom",
                "awesome blossom petals", "blooming onion"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "batter",        allergen: "wheat", confidence: "common",   reason: "The onion is coated in a seasoned wheat flour batter before deep frying" },
      { ingredient: "egg wash",      allergen: "egg",   confidence: "common",   reason: "Egg wash is used to adhere the batter to the onion petals" },
      { ingredient: "dipping sauce", allergen: "egg",   confidence: "common",   reason: "The signature dipping sauce is a spiced mayo — egg-based" },
      { ingredient: "dipping sauce", allergen: "dairy", confidence: "possible", reason: "Some dipping sauce variants include cream or sour cream" },
    ],
  },

  {
    canonical: "chicken nuggets",
    variants:  ["chicken nugget", "chicken nuggets", "mcnuggets", "chicken bites",
                "popcorn chicken", "chicken poppers"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "wheat breading", allergen: "wheat", confidence: "common",   reason: "Chicken nuggets are coated in seasoned wheat flour and breadcrumbs" },
      { ingredient: "egg wash",       allergen: "egg",   confidence: "common",   reason: "Egg wash binds the breading to the chicken" },
      { ingredient: "soy oil",        allergen: "soy",   confidence: "possible", reason: "Fast-food fryers commonly use soybean oil; nugget batter may contain soy" },
    ],
  },

  {
    canonical: "calamari",
    variants:  ["calamari", "fried calamari", "fried squid", "calamari rings", "squid rings"],
    category:  "side",
    cuisine:   "Mediterranean",
    ingredients: [
      { ingredient: "squid",        allergen: "shellfish", confidence: "common",   reason: "Calamari is made from squid — a mollusk (shellfish)" },
      { ingredient: "wheat batter", allergen: "wheat",     confidence: "common",   reason: "Calamari rings are coated in wheat flour batter before frying" },
      { ingredient: "egg",          allergen: "egg",       confidence: "possible", reason: "Some batters include egg for texture" },
    ],
  },

  {
    canonical: "shrimp cocktail",
    variants:  ["shrimp cocktail", "prawn cocktail", "cocktail shrimp"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "shrimp",            allergen: "shellfish", confidence: "common", reason: "Shrimp cocktail is boiled shrimp — a shellfish" },
      { ingredient: "cocktail sauce",    allergen: "fish",      confidence: "possible", reason: "Some cocktail sauces contain Worcestershire, which has anchovies" },
    ],
  },

  {
    canonical: "loaded potato skins",
    variants:  ["potato skins", "loaded potato skins", "potato skin"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "cheese",     allergen: "dairy", confidence: "common",   reason: "Potato skins are loaded with shredded cheddar cheese" },
      { ingredient: "sour cream", allergen: "dairy", confidence: "common",   reason: "Served with a side of sour cream for dipping" },
    ],
  },

  {
    canonical: "rattlesnake bites",
    variants:  ["rattlesnake bites", "rattlesnake bite", "jalapeño bites", "jalapeno bites",
                "pepper bites", "jalapeño poppers", "jalapeno poppers"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "cheese filling", allergen: "dairy", confidence: "common",   reason: "Rattlesnake bites / jalapeño bites are stuffed with cream cheese or cheddar" },
      { ingredient: "batter",         allergen: "wheat", confidence: "common",   reason: "Coated in a seasoned wheat flour breading before frying" },
      { ingredient: "egg wash",       allergen: "egg",   confidence: "common",   reason: "Egg wash is used to adhere the breading" },
    ],
  },

  {
    canonical: "beer pretzels",
    variants:  ["beer pretzels", "soft pretzel", "soft pretzels", "pretzel bites",
                "beer pretzels and beer cheese", "pretzels and beer cheese dip"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "wheat dough",  allergen: "wheat",  confidence: "common",   reason: "Pretzels are made from wheat dough" },
      { ingredient: "beer cheese",  allergen: "dairy",  confidence: "common",   reason: "Beer cheese dip is a melted cheese sauce — contains dairy" },
      { ingredient: "beer",         allergen: "gluten", confidence: "common",   reason: "Beer in the dip or dough contains barley — a gluten source" },
      { ingredient: "egg",          allergen: "egg",    confidence: "possible", reason: "Some pretzel doughs include egg" },
    ],
  },

  // ─── SOUPS ──────────────────────────────────────────────────────────────────

  {
    canonical: "broccoli cheddar soup",
    variants:  ["broccoli cheddar soup", "broccoli cheese soup", "cheddar broccoli soup",
                "cream of broccoli"],
    category:  "soup",
    cuisine:   "American",
    ingredients: [
      { ingredient: "cheddar cheese", allergen: "dairy", confidence: "common",   reason: "Broccoli cheddar soup is a cream-based cheese soup" },
      { ingredient: "cream / milk",   allergen: "dairy", confidence: "common",   reason: "The soup base is heavy cream or whole milk" },
      { ingredient: "wheat flour",    allergen: "wheat", confidence: "common",   reason: "Roux thickener made from butter and wheat flour" },
    ],
  },

  {
    canonical: "creamy tomato soup",
    variants:  ["creamy tomato soup", "tomato bisque", "tomato cream soup", "tomato soup"],
    category:  "soup",
    cuisine:   "American",
    ingredients: [
      { ingredient: "cream",       allergen: "dairy", confidence: "common",   reason: "Creamy tomato soup is finished with heavy cream" },
      { ingredient: "wheat flour", allergen: "wheat", confidence: "possible", reason: "Some versions are thickened with a wheat flour roux" },
    ],
  },

  // ─── SALADS ──────────────────────────────────────────────────────────────────

  {
    canonical: "cobb salad",
    variants:  ["cobb salad", "classic cobb"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "hard-boiled egg", allergen: "egg",   confidence: "common",   reason: "Cobb salad always includes sliced hard-boiled egg" },
      { ingredient: "blue cheese",     allergen: "dairy", confidence: "common",   reason: "Cobb salad is topped with crumbled blue cheese" },
      { ingredient: "ranch or blue cheese dressing", allergen: "egg", confidence: "common", reason: "Classic dressings for cobb salad are mayo/egg-based" },
      { ingredient: "ranch or blue cheese dressing", allergen: "dairy", confidence: "common", reason: "Dressings contain dairy (buttermilk, blue cheese, sour cream)" },
    ],
  },

  {
    canonical: "asian chicken salad",
    variants:  ["asian chicken salad", "oriental chicken salad", "chinese chicken salad",
                "crispy chicken salad", "mandarin chicken salad"],
    category:  "dish",
    cuisine:   "Asian-American",
    ingredients: [
      { ingredient: "sesame dressing",  allergen: "sesame",  confidence: "common",   reason: "The dressing is sesame oil and soy sauce based" },
      { ingredient: "soy sauce",        allergen: "soy",     confidence: "common",   reason: "Asian salad dressing uses soy sauce" },
      { ingredient: "soy sauce",        allergen: "wheat",   confidence: "common",   reason: "Standard soy sauce contains wheat" },
      { ingredient: "wonton strips",    allergen: "wheat",   confidence: "common",   reason: "Topped with crispy wonton strips — wheat based" },
      { ingredient: "almonds",          allergen: "tree-nut", confidence: "possible", reason: "Many versions include slivered almonds or candied almonds" },
    ],
  },

  // ─── AMERICAN MAINS ─────────────────────────────────────────────────────────

  {
    canonical: "baby back ribs",
    variants:  ["baby back ribs", "baby back rib", "fall off the bone ribs", "bbq ribs",
                "pork ribs", "spare ribs"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bbq sauce",  allergen: "soy",   confidence: "possible", reason: "Many commercial BBQ sauces contain soy sauce or soy-based flavoring" },
      { ingredient: "bbq sauce",  allergen: "wheat", confidence: "possible", reason: "Some BBQ sauces are thickened with wheat-based Worcestershire sauce" },
    ],
  },

  {
    canonical: "country fried steak",
    variants:  ["country fried steak", "chicken fried steak", "country-fried steak"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "breading",     allergen: "wheat", confidence: "common",   reason: "Steak is dredged in seasoned wheat flour and breadcrumbs" },
      { ingredient: "egg wash",     allergen: "egg",   confidence: "common",   reason: "Egg wash is used to adhere the breading" },
      { ingredient: "cream gravy",  allergen: "dairy", confidence: "common",   reason: "Served with a white cream gravy made with milk" },
      { ingredient: "cream gravy",  allergen: "wheat", confidence: "common",   reason: "White gravy is thickened with wheat flour roux" },
    ],
  },

  // ─── BREAKFAST MAINS ────────────────────────────────────────────────────────

  {
    canonical: "hash browns",
    variants:  ["hash browns", "hashbrown", "hashbrowns", "hash brown patty"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "soy oil",     allergen: "soy",   confidence: "possible", reason: "Hash browns are typically fried in soybean oil at fast-food chains" },
      { ingredient: "wheat flour", allergen: "wheat", confidence: "possible", reason: "Some hash brown patties contain wheat flour as a binder" },
    ],
  },

  {
    canonical: "sausage biscuit",
    variants:  ["sausage biscuit", "sausage egg biscuit", "biscuit sandwich", "breakfast biscuit"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "biscuit",       allergen: "wheat", confidence: "common",   reason: "Biscuits are made from wheat flour and buttermilk" },
      { ingredient: "buttermilk",    allergen: "dairy", confidence: "common",   reason: "Southern biscuits use butter and buttermilk" },
      { ingredient: "butter",        allergen: "dairy", confidence: "common",   reason: "Biscuit dough is made with butter or shortening" },
      { ingredient: "egg",           allergen: "egg",   confidence: "possible", reason: "Versions with egg contain a fried or folded egg" },
    ],
  },

  // ─── LOADED & BAKED ITEMS ───────────────────────────────────────────────────

  {
    canonical: "loaded baked potato",
    variants:  ["loaded baked potato", "baked potato", "loaded potato", "twice baked potato"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "sour cream",  allergen: "dairy", confidence: "common",   reason: "Loaded baked potatoes are topped with sour cream" },
      { ingredient: "cheese",      allergen: "dairy", confidence: "common",   reason: "Topped with shredded cheddar cheese" },
      { ingredient: "butter",      allergen: "dairy", confidence: "common",   reason: "Butter is a classic baked potato topping" },
    ],
  },

  {
    canonical: "creamed spinach",
    variants:  ["creamed spinach", "cream of spinach"],
    category:  "side",
    cuisine:   "American",
    ingredients: [
      { ingredient: "heavy cream",  allergen: "dairy", confidence: "common",   reason: "Creamed spinach is made with a cream or béchamel sauce" },
      { ingredient: "butter",       allergen: "dairy", confidence: "common",   reason: "Cream sauce starts with a butter roux" },
      { ingredient: "wheat flour",  allergen: "wheat", confidence: "common",   reason: "Béchamel base uses wheat flour as a thickener" },
    ],
  },

  {
    canonical: "potatoes au gratin",
    variants:  ["potatoes au gratin", "au gratin potatoes", "gratin dauphinois",
                "scalloped potatoes", "potato gratin"],
    category:  "side",
    cuisine:   "French",
    ingredients: [
      { ingredient: "cream",   allergen: "dairy", confidence: "common",   reason: "Au gratin potatoes are baked in a cream sauce" },
      { ingredient: "cheese",  allergen: "dairy", confidence: "common",   reason: "Topped with a layer of melted cheese (typically gruyère or cheddar)" },
    ],
  },

  // ─── DESSERTS & BEVERAGES ───────────────────────────────────────────────────

  {
    canonical: "milkshake",
    variants:  ["milkshake", "milk shake", "shake", "chocolate shake", "vanilla shake",
                "strawberry shake", "oreo shake", "thick shake"],
    category:  "dessert",
    cuisine:   "American",
    ingredients: [
      { ingredient: "ice cream",  allergen: "dairy", confidence: "common",   reason: "Milkshakes are blended ice cream — dairy based" },
      { ingredient: "milk",       allergen: "dairy", confidence: "common",   reason: "Milk is the liquid base of a milkshake" },
      { ingredient: "cookie mix-ins", allergen: "wheat", confidence: "possible", reason: "Oreo, cookie dough, or brownie shakes contain wheat-based cookie pieces" },
      { ingredient: "egg",            allergen: "egg",   confidence: "possible", reason: "Some thick shakes are made with egg-containing custard ice cream" },
    ],
  },

  {
    canonical: "beer battered fish",
    variants:  ["beer battered fish", "beer battered cod", "beer battered halibut",
                "beer battered fish and chips", "beer-battered fish"],
    category:  "dish",
    cuisine:   "British",
    ingredients: [
      { ingredient: "fish",         allergen: "fish",   confidence: "common",   reason: "Beer-battered fish is made with white fish (cod, halibut, pollock)" },
      { ingredient: "wheat flour",  allergen: "wheat",  confidence: "common",   reason: "Beer batter is made from wheat flour" },
      { ingredient: "beer",         allergen: "gluten", confidence: "common",   reason: "Beer in the batter contains barley — a gluten source" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ASIAN — Thai
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "Pad Thai",
    variants:  ["pad thai", "phad thai", "pad-thai"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "fish sauce",    allergen: "fish",      confidence: "common",   reason: "Pad Thai is seasoned with fish sauce" },
      { ingredient: "tamarind",      allergen: "soy",       confidence: "possible", reason: "Some restaurants use soy sauce alongside tamarind" },
      { ingredient: "egg",           allergen: "egg",       confidence: "common",   reason: "Pad Thai is stir-fried with egg" },
      { ingredient: "peanuts",       allergen: "peanut",    confidence: "common",   reason: "Crushed peanuts are a standard topping on Pad Thai" },
      { ingredient: "rice noodles",  allergen: "soy",       confidence: "possible", reason: "Shared wok cross-contact with soy sauce is common" },
    ],
  },

  {
    canonical: "Pad See Ew",
    variants:  ["pad see ew", "pad see-ew", "pad siew", "pad si ew", "pad siew moo"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "soy sauce",    allergen: "soy",   confidence: "common",  reason: "Pad See Ew is made with dark and light soy sauce" },
      { ingredient: "oyster sauce", allergen: "fish",  confidence: "common",  reason: "Oyster sauce (contains shellfish/fish) is a key flavoring" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common",  reason: "Egg is stir-fried directly into Pad See Ew" },
      { ingredient: "wheat noodles",allergen: "wheat", confidence: "possible",reason: "Wide sen yai noodles are rice-based but some versions use wheat noodles" },
    ],
  },

  {
    canonical: "drunken noodles",
    variants:  ["drunken noodles", "pad kee mao", "pad kee maow", "kee mao"],
    category:  "dish",
    cuisine:   "Thai",
    ingredients: [
      { ingredient: "oyster sauce", allergen: "fish",  confidence: "common",  reason: "Oyster sauce is a core component of drunken noodles" },
      { ingredient: "soy sauce",    allergen: "soy",   confidence: "common",  reason: "Soy sauce seasons the dish" },
      { ingredient: "egg",          allergen: "egg",   confidence: "possible",reason: "Many versions include stir-fried egg" },
    ],
  },

  {
    canonical: "satay",
    variants:  ["satay", "saté", "chicken satay", "beef satay", "pork satay"],
    category:  "dish",
    cuisine:   "Southeast Asian",
    ingredients: [
      { ingredient: "peanut sauce", allergen: "peanut", confidence: "common",  reason: "Satay is served with peanut dipping sauce" },
      { ingredient: "soy sauce",    allergen: "soy",    confidence: "common",  reason: "Soy sauce is in the marinade" },
      { ingredient: "sesame oil",   allergen: "sesame", confidence: "possible",reason: "Sesame oil is often added to the marinade or sauce" },
    ],
  },

  {
    canonical: "larb",
    variants:  ["larb", "laab", "larp", "laap"],
    category:  "dish",
    cuisine:   "Thai/Lao",
    ingredients: [
      { ingredient: "fish sauce",  allergen: "fish",  confidence: "common",  reason: "Larb is seasoned with fish sauce" },
      { ingredient: "toasted rice",allergen: "wheat", confidence: "possible",reason: "Toasted rice powder used for texture may share equipment with wheat" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ASIAN — Japanese / Pan-Asian
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "ramen",
    variants:  ["ramen", "tonkotsu", "shoyu ramen", "miso ramen", "spicy ramen",
                "tan tan men", "tantanmen"],
    category:  "dish",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "wheat noodles", allergen: "wheat",  confidence: "common",  reason: "Ramen noodles are made from wheat flour" },
      { ingredient: "soy sauce",     allergen: "soy",    confidence: "common",  reason: "Shoyu tare or miso tare both contain soy" },
      { ingredient: "soft-boiled egg",allergen: "egg",   confidence: "common",  reason: "Ajitsuke tamago (marinated egg) is a standard ramen topping" },
      { ingredient: "sesame",        allergen: "sesame", confidence: "common",  reason: "Sesame oil and sesame seeds are common ramen garnishes" },
      { ingredient: "fish cake",     allergen: "fish",   confidence: "possible",reason: "Narutomaki/fish cake is a traditional ramen topping" },
    ],
  },

  {
    canonical: "gyoza",
    variants:  ["gyoza", "pot stickers", "potstickers", "pan-fried dumplings",
                "fried dumplings", "dumplings", "xiao long bao", "soup dumplings",
                "har gow", "shumai", "dim sum"],
    category:  "dish",
    cuisine:   "Japanese/Chinese",
    ingredients: [
      { ingredient: "wheat wrapper", allergen: "wheat",  confidence: "common",  reason: "Dumpling wrappers are made from wheat flour" },
      { ingredient: "soy sauce",     allergen: "soy",    confidence: "common",  reason: "Gyoza filling and dipping sauce both contain soy" },
      { ingredient: "sesame oil",    allergen: "sesame", confidence: "common",  reason: "Sesame oil is used in the filling and dipping sauce" },
      { ingredient: "egg wash",      allergen: "egg",    confidence: "possible",reason: "Some wrappers or pan-frying preparations use egg" },
    ],
  },

  {
    canonical: "tempura",
    variants:  ["tempura", "vegetable tempura", "shrimp tempura", "prawn tempura",
                "tempura roll", "spider roll"],
    category:  "dish",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "wheat batter", allergen: "wheat",    confidence: "common",  reason: "Tempura batter is made from wheat flour" },
      { ingredient: "egg",          allergen: "egg",      confidence: "common",  reason: "Egg is mixed into the tempura batter" },
      { ingredient: "shrimp",       allergen: "shellfish",confidence: "possible",reason: "Shrimp tempura is the most common variety" },
    ],
  },

  {
    canonical: "bao bun",
    variants:  ["bao", "bao bun", "steamed bun", "char siu bao", "bbq pork bun",
                "hirata bun", "gua bao"],
    category:  "bread",
    cuisine:   "Chinese/Japanese",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common",  reason: "Bao buns are made from wheat-based steamed dough" },
      { ingredient: "soy sauce",   allergen: "soy",   confidence: "common",  reason: "The filling is typically seasoned with soy sauce" },
      { ingredient: "sesame",      allergen: "sesame",confidence: "possible",reason: "Sesame seeds or oil are often added as garnish" },
    ],
  },

  {
    canonical: "bibimbap",
    variants:  ["bibimbap", "bibim bap", "dolsot bibimbap"],
    category:  "dish",
    cuisine:   "Korean",
    ingredients: [
      { ingredient: "egg",        allergen: "egg",    confidence: "common",  reason: "Bibimbap is topped with a fried or raw egg" },
      { ingredient: "gochujang",  allergen: "soy",    confidence: "common",  reason: "Gochujang (chili paste) contains fermented soy" },
      { ingredient: "sesame oil", allergen: "sesame", confidence: "common",  reason: "Sesame oil is drizzled over bibimbap before serving" },
    ],
  },

  {
    canonical: "General Tso's chicken",
    variants:  ["general tso", "general tso's", "general tsao", "general gau"],
    category:  "dish",
    cuisine:   "Chinese-American",
    ingredients: [
      { ingredient: "wheat batter", allergen: "wheat", confidence: "common",  reason: "Chicken is battered in wheat flour before frying" },
      { ingredient: "soy sauce",    allergen: "soy",   confidence: "common",  reason: "The sauce is soy-sauce based" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common",  reason: "Egg is used in the batter" },
      { ingredient: "sesame",       allergen: "sesame",confidence: "possible",reason: "Sesame seeds are often garnished on top" },
    ],
  },

  {
    canonical: "orange chicken",
    variants:  ["orange chicken", "orange beef", "orange peel chicken"],
    category:  "dish",
    cuisine:   "Chinese-American",
    ingredients: [
      { ingredient: "wheat batter", allergen: "wheat", confidence: "common",  reason: "Orange chicken is deep-fried in wheat batter" },
      { ingredient: "soy sauce",    allergen: "soy",   confidence: "common",  reason: "The orange sauce is soy-sauce based" },
      { ingredient: "egg",          allergen: "egg",   confidence: "common",  reason: "Egg is used in the batter coating" },
    ],
  },

  {
    canonical: "Kung Pao chicken",
    variants:  ["kung pao", "kung pao chicken", "kung po", "gong bao"],
    category:  "dish",
    cuisine:   "Chinese",
    ingredients: [
      { ingredient: "peanuts",    allergen: "peanut", confidence: "common",  reason: "Peanuts are a defining ingredient of Kung Pao" },
      { ingredient: "soy sauce",  allergen: "soy",    confidence: "common",  reason: "Soy sauce is in the stir-fry sauce" },
      { ingredient: "sesame oil", allergen: "sesame", confidence: "possible",reason: "Sesame oil is commonly added to the finish" },
    ],
  },

  {
    canonical: "miso soup",
    variants:  ["miso soup", "miso broth"],
    category:  "soup",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "miso paste", allergen: "soy",  confidence: "common",  reason: "Miso is fermented soybean paste" },
      { ingredient: "dashi stock",allergen: "fish", confidence: "common",  reason: "Traditional dashi is made from bonito flakes (fish)" },
    ],
  },

  {
    canonical: "edamame",
    variants:  ["edamame"],
    category:  "side",
    cuisine:   "Japanese",
    ingredients: [
      { ingredient: "soybeans", allergen: "soy", confidence: "common", reason: "Edamame are immature soybeans" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEXICAN / LATIN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "enchiladas",
    variants:  ["enchilada", "enchiladas", "beef enchilada", "chicken enchilada",
                "cheese enchilada"],
    category:  "dish",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "corn tortilla", allergen: "corn",  confidence: "common",  reason: "Enchiladas are made with corn tortillas" },
      { ingredient: "cheese",        allergen: "dairy", confidence: "common",  reason: "Enchiladas are smothered in melted cheese" },
      { ingredient: "sour cream",    allergen: "dairy", confidence: "possible",reason: "Often served with sour cream" },
      { ingredient: "wheat",         allergen: "wheat", confidence: "possible",reason: "Some restaurants use flour tortillas instead of corn" },
    ],
  },

  {
    canonical: "tamales",
    variants:  ["tamale", "tamales"],
    category:  "dish",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "masa (corn dough)", allergen: "corn",  confidence: "common",  reason: "Tamales are made from masa, which is corn-based" },
      { ingredient: "lard or butter",    allergen: "dairy", confidence: "possible",reason: "Some masa recipes use butter instead of traditional lard" },
    ],
  },

  {
    canonical: "nachos",
    variants:  ["nachos", "loaded nachos", "nachos supreme", "nacho fries"],
    category:  "dish",
    cuisine:   "Mexican-American",
    ingredients: [
      { ingredient: "tortilla chips", allergen: "corn",  confidence: "common",  reason: "Nachos are made from corn tortilla chips" },
      { ingredient: "cheese",         allergen: "dairy", confidence: "common",  reason: "Nachos are loaded with melted cheese" },
      { ingredient: "sour cream",     allergen: "dairy", confidence: "common",  reason: "Sour cream is a standard nacho topping" },
      { ingredient: "jalapeños",      allergen: "soy",   confidence: "possible",reason: "Queso dip may contain soy-based thickeners" },
    ],
  },

  {
    canonical: "fish tacos",
    variants:  ["fish taco", "fish tacos", "baja fish taco", "crispy fish taco"],
    category:  "dish",
    cuisine:   "Mexican",
    ingredients: [
      { ingredient: "fish",        allergen: "fish",  confidence: "common",  reason: "Fish tacos contain fried or grilled white fish" },
      { ingredient: "crema",       allergen: "dairy", confidence: "common",  reason: "Baja fish tacos are topped with crema (Mexican sour cream)" },
      { ingredient: "wheat batter",allergen: "wheat", confidence: "possible",reason: "Crispy fish tacos use wheat batter for frying" },
      { ingredient: "corn tortilla",allergen: "corn", confidence: "common",  reason: "Fish tacos are typically served on corn tortillas" },
    ],
  },

  {
    canonical: "churros",
    variants:  ["churro", "churros", "churro bites"],
    category:  "dessert",
    cuisine:   "Spanish/Mexican",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Churros are fried wheat dough" },
      { ingredient: "egg",         allergen: "egg",   confidence: "common", reason: "Eggs are in the churro dough" },
      { ingredient: "chocolate dip",allergen: "dairy",confidence: "possible",reason: "Often served with chocolate dipping sauce containing dairy" },
    ],
  },

  {
    canonical: "flan",
    variants:  ["flan", "crème caramel", "creme caramel"],
    category:  "dessert",
    cuisine:   "Spanish/Mexican",
    ingredients: [
      { ingredient: "eggs",         allergen: "egg",   confidence: "common", reason: "Flan is an egg custard dessert" },
      { ingredient: "whole milk",   allergen: "dairy", confidence: "common", reason: "Flan is made with whole milk or cream" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEDITERRANEAN / MIDDLE EASTERN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "falafel",
    variants:  ["falafel", "falafel wrap", "falafel bowl"],
    category:  "dish",
    cuisine:   "Middle Eastern",
    ingredients: [
      { ingredient: "sesame (tahini)", allergen: "sesame",  confidence: "common",  reason: "Falafel is served with tahini sauce — pure sesame paste" },
      { ingredient: "chickpeas",       allergen: "legumes", confidence: "common",  reason: "Falafel is made from ground chickpeas" },
      { ingredient: "wheat wrap",      allergen: "wheat",   confidence: "possible",reason: "Often served in a wheat pita or wrap" },
    ],
  },

  {
    canonical: "hummus",
    variants:  ["hummus", "houmous", "hummus dip", "hummus plate"],
    category:  "condiment",
    cuisine:   "Middle Eastern",
    ingredients: [
      { ingredient: "sesame (tahini)", allergen: "sesame",  confidence: "common", reason: "Tahini (sesame paste) is a primary ingredient in hummus" },
      { ingredient: "chickpeas",       allergen: "legumes", confidence: "common", reason: "Hummus is made from blended chickpeas" },
    ],
  },

  {
    canonical: "shawarma",
    variants:  ["shawarma", "shwarma", "chicken shawarma", "beef shawarma",
                "lamb shawarma"],
    category:  "dish",
    cuisine:   "Middle Eastern",
    ingredients: [
      { ingredient: "pita bread",    allergen: "wheat",  confidence: "common",  reason: "Shawarma is served in wheat pita bread" },
      { ingredient: "tahini",        allergen: "sesame", confidence: "common",  reason: "Tahini sauce (sesame) is standard on shawarma" },
      { ingredient: "garlic sauce",  allergen: "egg",    confidence: "possible",reason: "Toum (garlic sauce) often contains egg white" },
    ],
  },

  {
    canonical: "gyro",
    variants:  ["gyro", "gyros", "chicken gyro", "lamb gyro", "beef gyro"],
    category:  "dish",
    cuisine:   "Greek",
    ingredients: [
      { ingredient: "pita bread",  allergen: "wheat",  confidence: "common", reason: "Gyros are wrapped in wheat pita bread" },
      { ingredient: "tzatziki",    allergen: "dairy",  confidence: "common", reason: "Tzatziki (yogurt-cucumber sauce) is the standard gyro sauce" },
      { ingredient: "sesame",      allergen: "sesame", confidence: "possible",reason: "Some pita breads are topped with sesame seeds" },
    ],
  },

  {
    canonical: "tzatziki",
    variants:  ["tzatziki", "tzatziki sauce", "tzatziki dip"],
    category:  "sauce",
    cuisine:   "Greek",
    ingredients: [
      { ingredient: "Greek yogurt", allergen: "dairy", confidence: "common", reason: "Tzatziki is made from strained Greek yogurt" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SEAFOOD
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "lobster roll",
    variants:  ["lobster roll", "lobster salad roll", "warm lobster roll",
                "maine lobster roll", "connecticut lobster roll"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "lobster",    allergen: "shellfish", confidence: "common",  reason: "Lobster roll contains lobster — a shellfish" },
      { ingredient: "mayo",       allergen: "egg",       confidence: "common",  reason: "Cold lobster rolls are bound with mayonnaise" },
      { ingredient: "butter",     allergen: "dairy",     confidence: "possible",reason: "Warm Connecticut-style rolls are dressed with drawn butter" },
      { ingredient: "hot dog bun",allergen: "wheat",     confidence: "common",  reason: "Lobster rolls are served in a split-top wheat bun" },
    ],
  },

  {
    canonical: "crab cake",
    variants:  ["crab cake", "crab cakes", "lump crab cake", "maryland crab cake"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "crab",         allergen: "shellfish", confidence: "common",  reason: "Crab cakes contain crab — a shellfish" },
      { ingredient: "breadcrumbs",  allergen: "wheat",     confidence: "common",  reason: "Breadcrumbs bind the crab cake" },
      { ingredient: "egg",          allergen: "egg",       confidence: "common",  reason: "Egg is used as a binder" },
      { ingredient: "mayo",         allergen: "egg",       confidence: "common",  reason: "Mayonnaise is standard in crab cake mixture" },
      { ingredient: "mustard",      allergen: "mustard",   confidence: "possible",reason: "Old Bay/Dijon mustard is often in the crab cake mix" },
    ],
  },

  {
    canonical: "clam chowder",
    variants:  ["clam chowder", "new england clam chowder", "manhattan clam chowder",
                "chowder", "seafood chowder"],
    category:  "soup",
    cuisine:   "American",
    ingredients: [
      { ingredient: "clams",       allergen: "shellfish", confidence: "common", reason: "Clam chowder contains clams — a shellfish" },
      { ingredient: "heavy cream", allergen: "dairy",     confidence: "common", reason: "New England chowder is cream-based" },
      { ingredient: "flour",       allergen: "wheat",     confidence: "common", reason: "Flour thickens the chowder base" },
    ],
  },

  {
    canonical: "shrimp scampi",
    variants:  ["shrimp scampi", "scampi", "prawn scampi"],
    category:  "dish",
    cuisine:   "Italian-American",
    ingredients: [
      { ingredient: "shrimp",   allergen: "shellfish", confidence: "common",  reason: "Shrimp scampi is made with shrimp" },
      { ingredient: "butter",   allergen: "dairy",     confidence: "common",  reason: "Scampi sauce is a garlic butter sauce" },
      { ingredient: "pasta",    allergen: "wheat",     confidence: "common",  reason: "Scampi is typically served over linguine or pasta" },
    ],
  },

  {
    canonical: "ceviche",
    variants:  ["ceviche", "ceviche tostada", "shrimp ceviche", "fish ceviche"],
    category:  "dish",
    cuisine:   "Latin American",
    ingredients: [
      { ingredient: "raw fish/shellfish", allergen: "fish",     confidence: "common",  reason: "Ceviche is made with raw fish or shrimp cured in citrus" },
      { ingredient: "shrimp",             allergen: "shellfish",confidence: "possible",reason: "Many ceviches use shrimp as the primary protein" },
      { ingredient: "tostada",            allergen: "corn",     confidence: "possible",reason: "Often served on corn tostadas" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AMERICAN
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "Nashville hot chicken",
    variants:  ["nashville hot", "nashville hot chicken", "hot chicken sandwich",
                "spicy crispy chicken"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "wheat batter",  allergen: "wheat", confidence: "common",  reason: "Nashville hot chicken is fried in a wheat flour coating" },
      { ingredient: "egg",           allergen: "egg",   confidence: "common",  reason: "Egg wash is used in the breading process" },
      { ingredient: "butter",        allergen: "dairy", confidence: "possible",reason: "The hot paste is sometimes butter-based" },
    ],
  },

  {
    canonical: "Philly cheesesteak",
    variants:  ["philly cheesesteak", "cheesesteak", "cheese steak", "philly steak"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "hoagie roll", allergen: "wheat", confidence: "common", reason: "Cheesesteak is served on a wheat hoagie roll" },
      { ingredient: "cheese whiz", allergen: "dairy", confidence: "common", reason: "Classic Philly cheesesteaks use Cheez Whiz or provolone" },
      { ingredient: "soy",         allergen: "soy",   confidence: "possible",reason: "Processed cheese products like Cheez Whiz often contain soy" },
    ],
  },

  {
    canonical: "Reuben sandwich",
    variants:  ["reuben", "reuben sandwich"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "rye bread",      allergen: "wheat",   confidence: "common",  reason: "Reubens are served on rye bread (wheat-based)" },
      { ingredient: "Swiss cheese",   allergen: "dairy",   confidence: "common",  reason: "Swiss cheese is standard on a Reuben" },
      { ingredient: "Russian dressing",allergen: "egg",    confidence: "common",  reason: "Russian/Thousand Island dressing contains mayo (egg)" },
      { ingredient: "mustard",        allergen: "mustard", confidence: "possible",reason: "Some Reuben variations use mustard" },
    ],
  },

  {
    canonical: "Monte Cristo",
    variants:  ["monte cristo", "monte cristo sandwich"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "bread",  allergen: "wheat", confidence: "common", reason: "Monte Cristo is a bread-based sandwich" },
      { ingredient: "egg batter",allergen: "egg",confidence: "common", reason: "The sandwich is dipped in egg batter and fried" },
      { ingredient: "cheese", allergen: "dairy", confidence: "common", reason: "Monte Cristo contains ham and Swiss or gruyère cheese" },
    ],
  },

  {
    canonical: "po' boy",
    variants:  ["po boy", "po' boy", "poboy", "shrimp po boy", "oyster po boy",
                "catfish po boy"],
    category:  "sandwich",
    cuisine:   "American",
    ingredients: [
      { ingredient: "french bread",  allergen: "wheat",     confidence: "common",  reason: "Po' boys are served on French bread rolls" },
      { ingredient: "shrimp/oysters",allergen: "shellfish", confidence: "possible",reason: "Shrimp and oyster po' boys are the most common varieties" },
      { ingredient: "remoulade",     allergen: "egg",       confidence: "common",  reason: "Remoulade sauce is mayo-based (egg)" },
    ],
  },

  {
    canonical: "buffalo chicken",
    variants:  ["buffalo chicken", "buffalo wings", "boneless wings", "buffalo tenders",
                "buffalo chicken wrap", "buffalo chicken sandwich"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "butter",         allergen: "dairy", confidence: "common",  reason: "Buffalo sauce is made with hot sauce and melted butter" },
      { ingredient: "blue cheese dip",allergen: "dairy", confidence: "common",  reason: "Blue cheese dressing (dairy) is the classic pairing" },
      { ingredient: "wheat breading", allergen: "wheat", confidence: "possible",reason: "Breaded buffalo chicken uses wheat flour coating" },
      { ingredient: "egg",            allergen: "egg",   confidence: "possible",reason: "Breaded varieties use egg wash" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BREAKFAST / BRUNCH
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "quiche",
    variants:  ["quiche", "quiche lorraine", "spinach quiche", "veggie quiche"],
    category:  "breakfast",
    cuisine:   "French",
    ingredients: [
      { ingredient: "eggs",       allergen: "egg",   confidence: "common", reason: "Quiche is an egg custard baked in a pastry shell" },
      { ingredient: "cream",      allergen: "dairy", confidence: "common", reason: "Quiche filling is made with cream or milk" },
      { ingredient: "pastry shell",allergen: "wheat",confidence: "common", reason: "Quiche is baked in a wheat pastry crust" },
      { ingredient: "cheese",     allergen: "dairy", confidence: "common", reason: "Cheese is a standard quiche ingredient" },
    ],
  },

  {
    canonical: "shakshuka",
    variants:  ["shakshuka", "shakshouka"],
    category:  "breakfast",
    cuisine:   "Middle Eastern",
    ingredients: [
      { ingredient: "eggs",  allergen: "egg",   confidence: "common",  reason: "Shakshuka is eggs poached in tomato sauce" },
      { ingredient: "bread", allergen: "wheat", confidence: "possible",reason: "Often served with pita or crusty bread for dipping" },
      { ingredient: "feta",  allergen: "dairy", confidence: "possible",reason: "Many versions are topped with crumbled feta cheese" },
    ],
  },

  {
    canonical: "crepes",
    variants:  ["crepe", "crepes", "sweet crepes", "savory crepes", "galette"],
    category:  "breakfast",
    cuisine:   "French",
    ingredients: [
      { ingredient: "wheat flour", allergen: "wheat", confidence: "common", reason: "Crepes are thin wheat flour pancakes" },
      { ingredient: "eggs",        allergen: "egg",   confidence: "common", reason: "Eggs are a core ingredient in crepe batter" },
      { ingredient: "milk/butter", allergen: "dairy", confidence: "common", reason: "Crepes are made with milk and butter" },
    ],
  },

  {
    canonical: "overnight oats",
    variants:  ["overnight oats", "oat bowl", "oatmeal bowl"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "oats",  allergen: "oats",  confidence: "common",  reason: "Overnight oats are made with rolled oats" },
      { ingredient: "milk",  allergen: "dairy", confidence: "common",  reason: "Oats are soaked in dairy milk" },
      { ingredient: "nuts",  allergen: "tree-nut",confidence: "possible",reason: "Often topped with almonds, walnuts, or pecans" },
    ],
  },

  {
    canonical: "granola",
    variants:  ["granola", "granola bowl", "granola parfait"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "oats",    allergen: "oats",    confidence: "common",   reason: "Granola is oat-based" },
      { ingredient: "tree nuts",allergen: "tree-nut",confidence: "common",  reason: "Almonds, walnuts, pecans are standard granola ingredients" },
      { ingredient: "honey",   allergen: "soy",     confidence: "possible", reason: "Some granolas contain soy lecithin as an emulsifier" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ITALIAN DESSERTS
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "tiramisu",
    variants:  ["tiramisu", "tiramisù"],
    category:  "dessert",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "mascarpone", allergen: "dairy", confidence: "common", reason: "Tiramisu is made with mascarpone cheese" },
      { ingredient: "egg yolks",  allergen: "egg",   confidence: "common", reason: "Sabayon made from egg yolks is the base of tiramisu" },
      { ingredient: "ladyfingers",allergen: "wheat", confidence: "common", reason: "Savoiardi ladyfinger cookies are soaked in espresso" },
    ],
  },

  {
    canonical: "cannoli",
    variants:  ["cannoli", "cannolo"],
    category:  "dessert",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "ricotta",     allergen: "dairy", confidence: "common", reason: "Cannoli filling is made from sweetened ricotta" },
      { ingredient: "pastry shell",allergen: "wheat", confidence: "common", reason: "The fried pastry shell is wheat-based" },
      { ingredient: "egg",         allergen: "egg",   confidence: "possible",reason: "Egg yolk is sometimes in the pastry dough" },
      { ingredient: "pistachios",  allergen: "tree-nut",confidence: "possible",reason: "Cannoli are often garnished with pistachios" },
    ],
  },

  {
    canonical: "gelato",
    variants:  ["gelato", "gelati"],
    category:  "dessert",
    cuisine:   "Italian",
    ingredients: [
      { ingredient: "milk",     allergen: "dairy", confidence: "common",  reason: "Gelato is made from whole milk and cream" },
      { ingredient: "egg yolks",allergen: "egg",   confidence: "common",  reason: "Custard-based gelato uses egg yolks" },
      { ingredient: "nuts",     allergen: "tree-nut",confidence: "possible",reason: "Pistachio, hazelnut, and almond are common gelato flavors" },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MISC HIGH-FREQUENCY
  // ══════════════════════════════════════════════════════════════════════════

  {
    canonical: "avocado toast",
    variants:  ["avocado toast", "avo toast", "smashed avocado toast"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "toast",   allergen: "wheat",  confidence: "common",  reason: "Avocado toast is served on wheat bread" },
      { ingredient: "egg",     allergen: "egg",    confidence: "possible",reason: "Frequently topped with a poached or fried egg" },
      { ingredient: "sesame",  allergen: "sesame", confidence: "possible",reason: "Everything bagel seasoning or sesame seeds are common toppings" },
      { ingredient: "feta",    allergen: "dairy",  confidence: "possible",reason: "Many versions include crumbled feta cheese" },
    ],
  },

  {
    canonical: "acai bowl",
    variants:  ["acai bowl", "açaí bowl", "acai", "superfood bowl"],
    category:  "breakfast",
    cuisine:   "American",
    ingredients: [
      { ingredient: "granola",  allergen: "oats",     confidence: "common",  reason: "Acai bowls are typically topped with oat granola" },
      { ingredient: "nuts",     allergen: "tree-nut", confidence: "possible",reason: "Almond butter, almonds, or walnuts are common toppings" },
      { ingredient: "dairy",    allergen: "dairy",    confidence: "possible",reason: "Often blended with almond milk, oat milk, or coconut milk" },
    ],
  },

  {
    canonical: "pho",
    variants:  ["pho", "phở", "beef pho", "chicken pho", "pho bo", "pho ga"],
    category:  "soup",
    cuisine:   "Vietnamese",
    ingredients: [
      { ingredient: "rice noodles", allergen: "soy",   confidence: "possible",reason: "Pho broth often contains soy sauce for seasoning" },
      { ingredient: "fish sauce",   allergen: "fish",  confidence: "common",  reason: "Fish sauce is added to the broth" },
      { ingredient: "hoisin sauce", allergen: "wheat", confidence: "possible",reason: "Hoisin sauce (served on the side) contains wheat" },
      { ingredient: "bean sprouts", allergen: "soy",   confidence: "possible",reason: "Bean sprouts are soybean sprouts" },
    ],
  },

  {
    canonical: "banh mi",
    variants:  ["banh mi", "bánh mì", "vietnamese sandwich"],
    category:  "sandwich",
    cuisine:   "Vietnamese",
    ingredients: [
      { ingredient: "baguette",   allergen: "wheat",  confidence: "common",  reason: "Bánh mì is served on a French baguette" },
      { ingredient: "mayo",       allergen: "egg",    confidence: "common",  reason: "Mayonnaise is spread on the bread" },
      { ingredient: "soy sauce",  allergen: "soy",    confidence: "possible",reason: "Proteins are marinated in soy sauce" },
      { ingredient: "fish sauce", allergen: "fish",   confidence: "possible",reason: "Pickled daikon/carrots are sometimes seasoned with fish sauce" },
    ],
  },

  {
    canonical: "Buddha bowl",
    variants:  ["buddha bowl", "grain bowl", "power bowl", "harvest bowl",
                "nourish bowl", "wellness bowl"],
    category:  "dish",
    cuisine:   "American",
    ingredients: [
      { ingredient: "tahini dressing", allergen: "sesame",  confidence: "possible",reason: "Tahini-based dressings are common on grain bowls" },
      { ingredient: "tofu",            allergen: "soy",     confidence: "possible",reason: "Tofu is a common protein in plant-based bowls" },
      { ingredient: "edamame",         allergen: "soy",     confidence: "possible",reason: "Edamame is a standard grain bowl topping" },
      { ingredient: "nuts/seeds",      allergen: "tree-nut",confidence: "possible",reason: "Pumpkin seeds, sunflower seeds, or walnuts are common toppings" },
    ],
  },
];
