// lib/allergenDB.ts

export type Allergen =
  | "dairy"
  | "egg"
  | "soy"
  | "wheat"
  | "gluten"
  | "fish"
  | "shellfish"
  | "nuts"
  | "peanut"
  | "tree-nut"
  | "sesame"
  | "corn"
  | "mustard"
  | "legumes"
  | "oats";

export type TermRule = {
  term: string;
  allergens: Allergen[];
  confidence: number;
  note?: string;
};

export const TERM_RULES: TermRule[] = [
  // Dairy
  { term: "milk",        allergens: ["dairy"], confidence: 5 },
  { term: "butter",      allergens: ["dairy"], confidence: 5 },
  { term: "cheese",      allergens: ["dairy"], confidence: 5 },
  { term: "cream",       allergens: ["dairy"], confidence: 5 },
  { term: "whey",        allergens: ["dairy"], confidence: 5 },
  { term: "casein",      allergens: ["dairy"], confidence: 5 },
  { term: "yogurt",      allergens: ["dairy"], confidence: 5 },
  { term: "yoghurt",     allergens: ["dairy"], confidence: 5 },
  { term: "ghee",        allergens: ["dairy"], confidence: 5, note: "Clarified butter — dairy" },
  { term: "ricotta",     allergens: ["dairy"], confidence: 5 },
  { term: "mozzarella",  allergens: ["dairy"], confidence: 5 },
  { term: "parmesan",    allergens: ["dairy"], confidence: 5 },
  { term: "feta",        allergens: ["dairy"], confidence: 5 },
  { term: "brie",        allergens: ["dairy"], confidence: 5 },
  { term: "cheddar",     allergens: ["dairy"], confidence: 5 },
  { term: "gouda",       allergens: ["dairy"], confidence: 5 },
  { term: "provolone",   allergens: ["dairy"], confidence: 5 },
  { term: "gruyere",     allergens: ["dairy"], confidence: 5 },
  { term: "sour cream",  allergens: ["dairy"], confidence: 5 },
  { term: "buttermilk",  allergens: ["dairy"], confidence: 5 },
  { term: "half and half", allergens: ["dairy"], confidence: 5 },
  { term: "heavy cream", allergens: ["dairy"], confidence: 5 },
  { term: "milk chocolate", allergens: ["dairy"], confidence: 5 },
  { term: "cream cheese", allergens: ["dairy"], confidence: 5 },

  // Egg
  { term: "egg",        allergens: ["egg"], confidence: 5 },
  { term: "mayo",       allergens: ["egg"], confidence: 5 },
  { term: "mayonnaise", allergens: ["egg"], confidence: 5 },
  { term: "aioli",      allergens: ["egg"], confidence: 4, note: "Commonly mayo-based" },
  { term: "brioche",    allergens: ["wheat", "gluten", "egg", "dairy"], confidence: 4, note: "Often contains egg + butter" },

  // Soy
  { term: "soy sauce",   allergens: ["soy", "wheat", "gluten"], confidence: 5 },
  { term: "soy",         allergens: ["soy"], confidence: 5 },
  { term: "tofu",        allergens: ["soy"], confidence: 5 },
  { term: "miso",        allergens: ["soy"], confidence: 5 },
  { term: "edamame",     allergens: ["soy"], confidence: 5 },
  { term: "tempeh",      allergens: ["soy"], confidence: 5 },
  { term: "tamari",      allergens: ["soy"], confidence: 5, note: "Gluten-free soy sauce alternative" },
  { term: "hoisin",      allergens: ["soy", "wheat", "gluten"], confidence: 4, note: "Hoisin sauce contains soy and often wheat" },
  { term: "hoisin sauce", allergens: ["soy", "wheat", "gluten"], confidence: 5 },
  { term: "natto",       allergens: ["soy"], confidence: 5 },
  { term: "yuba",        allergens: ["soy"], confidence: 5, note: "Tofu skin — 100% soy" },
  { term: "soybean",     allergens: ["soy"], confidence: 5 },
  { term: "soymilk",     allergens: ["soy"], confidence: 5 },
  { term: "soy milk",    allergens: ["soy"], confidence: 5 },

  // Wheat / Gluten
  { term: "flour",          allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "bread",          allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "bun",            allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "tempura",        allergens: ["wheat", "gluten", "egg"], confidence: 4 },
  { term: "gluten",         allergens: ["gluten", "wheat"], confidence: 5 },
  { term: "barley",         allergens: ["gluten"], confidence: 5 },
  { term: "rye",            allergens: ["gluten"], confidence: 4, note: "Rye contains gluten" },
  { term: "pasta",          allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "noodle",         allergens: ["wheat", "gluten"], confidence: 4 },
  { term: "crouton",        allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "tortilla",       allergens: ["wheat", "gluten"], confidence: 3, note: "Flour tortillas only; corn tortillas are wheat-free" },
  { term: "pretzel",        allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "croissant",      allergens: ["wheat", "gluten", "dairy", "egg"], confidence: 5 },
  { term: "waffle",         allergens: ["wheat", "gluten", "egg", "dairy"], confidence: 5 },
  { term: "pancake",        allergens: ["wheat", "gluten", "egg", "dairy"], confidence: 4 },
  { term: "naan",           allergens: ["wheat", "gluten", "dairy"], confidence: 5, note: "Indian flatbread — wheat + often yogurt" },
  { term: "pita",           allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "wonton",         allergens: ["wheat", "gluten", "egg"], confidence: 5, note: "Wonton wrappers contain wheat and egg" },
  { term: "dumpling",       allergens: ["wheat", "gluten"], confidence: 4, note: "Most dumpling wrappers are wheat-based" },
  { term: "gyoza",          allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "udon",           allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "seitan",         allergens: ["wheat", "gluten"], confidence: 5, note: "Pure wheat gluten — severe wheat allergen" },
  { term: "panko",          allergens: ["wheat", "gluten"], confidence: 5, note: "Japanese breadcrumbs" },
  { term: "breadcrumb",     allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "breadcrumbs",    allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "puff pastry",    allergens: ["wheat", "gluten", "dairy"], confidence: 5 },
  { term: "phyllo",         allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "filo",           allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "soba",           allergens: ["wheat", "gluten"], confidence: 4, note: "Often blended with wheat; pure buckwheat is GF" },
  { term: "couscous",       allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "bulgur",         allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "semolina",       allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "spelt",          allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "farro",          allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "kamut",          allergens: ["wheat", "gluten"], confidence: 5 },
  { term: "triticale",      allergens: ["wheat", "gluten"], confidence: 5 },

  // Fish
  { term: "fish sauce",     allergens: ["fish"], confidence: 5 },
  { term: "worcestershire", allergens: ["fish"], confidence: 4, note: "Typically contains anchovies" },
  { term: "anchovy",        allergens: ["fish"], confidence: 5 },
  { term: "anchovies",      allergens: ["fish"], confidence: 5 },
  { term: "salmon",         allergens: ["fish"], confidence: 5 },
  { term: "tuna",           allergens: ["fish"], confidence: 5 },
  { term: "cod",            allergens: ["fish"], confidence: 5 },
  { term: "tilapia",        allergens: ["fish"], confidence: 5 },
  { term: "halibut",        allergens: ["fish"], confidence: 5 },
  { term: "trout",          allergens: ["fish"], confidence: 5 },
  { term: "sea bass",       allergens: ["fish"], confidence: 5 },
  { term: "mahi",           allergens: ["fish"], confidence: 5, note: "Mahi-mahi is a fish" },
  { term: "mahi-mahi",      allergens: ["fish"], confidence: 5 },
  { term: "snapper",        allergens: ["fish"], confidence: 5 },
  { term: "swordfish",      allergens: ["fish"], confidence: 5 },
  { term: "mackerel",       allergens: ["fish"], confidence: 5 },
  { term: "sardine",        allergens: ["fish"], confidence: 5 },
  { term: "sardines",       allergens: ["fish"], confidence: 5 },
  { term: "herring",        allergens: ["fish"], confidence: 5 },
  { term: "catfish",        allergens: ["fish"], confidence: 5 },
  { term: "flounder",       allergens: ["fish"], confidence: 5 },
  { term: "sole",           allergens: ["fish"], confidence: 4, note: "Sole is a fish; context-dependent" },
  { term: "perch",          allergens: ["fish"], confidence: 5 },
  { term: "ponzu",          allergens: ["fish", "soy"], confidence: 4, note: "Ponzu contains citrus + fish-based dashi or soy" },

  // Shellfish
  { term: "shrimp",   allergens: ["shellfish"], confidence: 5 },
  { term: "prawn",    allergens: ["shellfish"], confidence: 5 },
  { term: "prawns",   allergens: ["shellfish"], confidence: 5 },
  { term: "crab",     allergens: ["shellfish"], confidence: 5 },
  { term: "lobster",  allergens: ["shellfish"], confidence: 5 },
  { term: "clam",     allergens: ["shellfish"], confidence: 5 },
  { term: "clams",    allergens: ["shellfish"], confidence: 5 },
  { term: "oyster",   allergens: ["shellfish"], confidence: 5 },
  { term: "scallop",  allergens: ["shellfish"], confidence: 5 },
  { term: "mussel",   allergens: ["shellfish"], confidence: 5 },
  { term: "mussels",  allergens: ["shellfish"], confidence: 5 },
  { term: "calamari", allergens: ["shellfish"], confidence: 5 },
  { term: "squid",    allergens: ["shellfish"], confidence: 5 },
  { term: "octopus",  allergens: ["shellfish"], confidence: 4, note: "Cephalopod — cross-reactive with shellfish for many" },
  { term: "crayfish", allergens: ["shellfish"], confidence: 5 },
  { term: "crawfish", allergens: ["shellfish"], confidence: 5 },
  { term: "oyster sauce", allergens: ["shellfish", "fish"], confidence: 5, note: "Made from oyster extract" },

  // Peanuts (distinct from tree nuts)
  { term: "peanut butter",  allergens: ["peanut", "nuts"], confidence: 5 },
  { term: "peanut",         allergens: ["peanut", "nuts"], confidence: 5 },
  { term: "peanuts",        allergens: ["peanut", "nuts"], confidence: 5 },
  { term: "satay",          allergens: ["peanut", "nuts"], confidence: 4, note: "Satay sauce typically contains peanuts" },
  { term: "pad thai",       allergens: ["peanut", "nuts"], confidence: 4, note: "Commonly garnished with crushed peanuts" },
  { term: "kung pao",       allergens: ["peanut", "nuts"], confidence: 4, note: "Kung Pao dishes traditionally contain peanuts" },
  { term: "gado gado",      allergens: ["peanut", "nuts"], confidence: 5, note: "Indonesian peanut sauce dish" },
  { term: "botan",          allergens: ["peanut", "nuts"], confidence: 4, note: "Botan rice candy coated in rice paper, filling may vary" },
  { term: "groundnut",      allergens: ["peanut", "nuts"], confidence: 5, note: "British/African term for peanut" },
  { term: "groundnuts",     allergens: ["peanut", "nuts"], confidence: 5 },

  // Tree nuts (distinct from peanuts)
  { term: "pine nut",    allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pine nuts",   allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "almond",      allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "almonds",     allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "walnut",      allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "walnuts",     allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "cashew",      allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "cashews",     allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pecan",       allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pecans",      allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pistachio",   allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "pistachios",  allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "hazelnut",    allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "hazelnuts",   allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "macadamia",   allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "macadamias",  allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "brazil nut",  allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "brazil nuts", allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "chestnut",    allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "chestnuts",   allergens: ["tree-nut", "nuts"], confidence: 5 },
  { term: "coconut",     allergens: ["tree-nut", "nuts"], confidence: 4, note: "FDA classifies coconut as tree nut; many nut-allergic tolerate it" },
  { term: "praline",     allergens: ["tree-nut", "nuts", "dairy"], confidence: 4, note: "Caramelized nuts — typically pecans or almonds" },
  { term: "marzipan",    allergens: ["tree-nut", "nuts"], confidence: 5, note: "Made from almond paste" },
  { term: "frangipane",  allergens: ["tree-nut", "nuts", "egg", "dairy"], confidence: 5, note: "Almond cream filling" },
  { term: "pesto",       allergens: ["tree-nut", "nuts"], confidence: 3, note: "Typically pine nuts or walnuts" },
  { term: "nut",         allergens: ["tree-nut", "nuts"], confidence: 3, note: "Generic — may be peanut or tree nut" },
  { term: "nuts",        allergens: ["tree-nut", "nuts"], confidence: 3, note: "Generic — may be peanut or tree nut" },
  { term: "mixed nuts",  allergens: ["tree-nut", "nuts", "peanut"], confidence: 5 },

  // Sesame
  { term: "sesame",       allergens: ["sesame"], confidence: 5 },
  { term: "tahini",       allergens: ["sesame"], confidence: 5 },
  { term: "hummus",       allergens: ["sesame"], confidence: 4, note: "Hummus typically contains tahini" },
  { term: "sesame oil",   allergens: ["sesame"], confidence: 5 },
  { term: "sesame seed",  allergens: ["sesame"], confidence: 5 },
  { term: "sesame seeds", allergens: ["sesame"], confidence: 5 },
  { term: "gochujang",    allergens: ["sesame"], confidence: 3, note: "Korean chili paste — may contain sesame" },
  { term: "benne",        allergens: ["sesame"], confidence: 5, note: "Southern US term for sesame" },

  // Corn
  { term: "cornstarch",  allergens: ["corn"], confidence: 5 },
  { term: "corn",        allergens: ["corn"], confidence: 5 },
  { term: "masa",        allergens: ["corn"], confidence: 5 },
  { term: "polenta",     allergens: ["corn"], confidence: 5 },
  { term: "corn flour",  allergens: ["corn"], confidence: 5 },
  { term: "cornmeal",    allergens: ["corn"], confidence: 5 },
  { term: "corn syrup",  allergens: ["corn"], confidence: 5 },
  { term: "corn oil",    allergens: ["corn"], confidence: 4, note: "Highly refined corn oil may be tolerated by some" },
  { term: "grits",       allergens: ["corn"], confidence: 5 },
  { term: "hominy",      allergens: ["corn"], confidence: 5 },
  { term: "popcorn",     allergens: ["corn"], confidence: 5 },
  { term: "tortilla chip", allergens: ["corn"], confidence: 4, note: "Corn tortilla chips" },
  { term: "corn tortilla", allergens: ["corn"], confidence: 5 },
  { term: "elote",       allergens: ["corn", "dairy"], confidence: 4, note: "Mexican street corn — corn base with cheese/crema" },

  // Mustard
  { term: "mustard",             allergens: ["mustard"], confidence: 5 },
  { term: "dijon",               allergens: ["mustard"], confidence: 5, note: "Dijon is a mustard" },
  { term: "dijon mustard",       allergens: ["mustard"], confidence: 5 },
  { term: "mustard seed",        allergens: ["mustard"], confidence: 5 },
  { term: "mustard seeds",       allergens: ["mustard"], confidence: 5 },
  { term: "mustard oil",         allergens: ["mustard"], confidence: 5 },
  { term: "whole grain mustard", allergens: ["mustard"], confidence: 5 },
  { term: "honey mustard",       allergens: ["mustard"], confidence: 5 },
  { term: "yellow mustard",      allergens: ["mustard"], confidence: 5 },
  { term: "spicy brown mustard", allergens: ["mustard"], confidence: 5 },

  // Legumes (separate from soy — different allergen)
  { term: "lupin",       allergens: ["legumes"], confidence: 5 },
  { term: "lupine",      allergens: ["legumes"], confidence: 5 },
  { term: "fava bean",   allergens: ["legumes"], confidence: 5 },
  { term: "kidney bean", allergens: ["legumes"], confidence: 5 },
  { term: "pinto bean",  allergens: ["legumes"], confidence: 5 },
  { term: "black bean",  allergens: ["legumes"], confidence: 5 },
  { term: "chickpeas",   allergens: ["legumes"], confidence: 5 },
  { term: "chickpea",    allergens: ["legumes"], confidence: 5 },
  { term: "lentils",     allergens: ["legumes"], confidence: 5 },
  { term: "lentil",      allergens: ["legumes"], confidence: 5 },

  // Oats
  { term: "muesli",          allergens: ["oats"], confidence: 5 },
  { term: "oatmeal",         allergens: ["oats"], confidence: 5 },
  { term: "granola",         allergens: ["oats"], confidence: 4, note: "Granola is oat-based" },
  { term: "oats",            allergens: ["oats"], confidence: 5 },
  { term: "oat",             allergens: ["oats"], confidence: 5 },
  { term: "oat flour",       allergens: ["oats", "gluten"], confidence: 5 },
  { term: "oat milk",        allergens: ["oats"], confidence: 5 },
  { term: "rolled oats",     allergens: ["oats"], confidence: 5 },
  { term: "steel-cut oats",  allergens: ["oats"], confidence: 5 },
  { term: "steel cut oats",  allergens: ["oats"], confidence: 5 },
  { term: "porridge",        allergens: ["oats"], confidence: 4, note: "Usually oat-based in Western contexts" },
  { term: "overnight oats",  allergens: ["oats"], confidence: 5 },
];

