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
  | "pastry" | "dessert" | "condiment" | "side";

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
      { ingredient: "peanuts",       allergen: "peanut",   confidence: "common",   reason: "Massaman curry contains whole roasted peanuts" },
      { ingredient: "coconut milk",  allergen: "tree-nut", confidence: "possible", reason: "Coconut milk is not a tree-nut allergen by FDA rules, but some people react to it" },
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
];
