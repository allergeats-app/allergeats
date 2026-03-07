// ─── Source trust levels ───────────────────────────────────────────────────
export type SourceType =
  | "official"         // restaurant-controlled (official site / allergen page / API)
  | "verified-dataset" // manually curated dataset we trust
  | "aggregator"       // third-party structured source (e.g. Nutritionix)
  | "scraped"          // pulled from general menu pages / unverified
  | "user-input";      // pasted raw text or manually entered

// ─── Confidence: how certain we are in the data/source ─────────────────────
export type Confidence = "High" | "Medium" | "Low";

// ─── Risk: how dangerous the item is for the user's allergy profile ─────────
// NOTE: these are intentionally separate concerns.
// High confidence does NOT mean likely-safe.
export type Risk = "likely-safe" | "ask" | "avoid" | "unknown";

// ─── Allergen profile ───────────────────────────────────────────────────────
export type AllergenId =
  | "dairy"
  | "egg"
  | "wheat"
  | "gluten"
  | "soy"
  | "peanut"
  | "tree-nut"
  | "sesame"
  | "fish"
  | "shellfish"
  | "mustard"
  | "corn"
  | "legumes"
  | "oats";

// ─── Raw menu item (from adapters / seed data) ─────────────────────────────
export type RawMenuItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  // Optional per-item source override; falls back to restaurant sourceType
  sourceType?: SourceType;
  /**
   * Official allergen flags from a trusted source (e.g. Nutritionix).
   * When present, these are merged with text-detected allergens and the item
   * is scored with high confidence rather than relying solely on description parsing.
   */
  allergens?: string[];
};

// ─── Scored menu item (after running through the scoring pipeline) ──────────
export type ScoredMenuItem = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  sourceType: SourceType;
  confidence: Confidence;
  risk: Risk;
  detectedAllergens: string[];
  inferredAllergens: string[];
  inferredReasons: string[];
  triggerTerms: string[];
  explanation: string;
  staffQuestions: string[];
  /** Allergens from this item that match the user's own allergy profile */
  userAllergenHits: string[];
};

// ─── Restaurant safety summary (derived from scored items, never hardcoded) ──
export type RestaurantSafetySummary = {
  likelySafe: number;
  ask: number;
  avoid: number;
  unknown: number;
  total: number;
};

// ─── Restaurant ─────────────────────────────────────────────────────────────
export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  address?: string;
  lat?: number;
  lng?: number;
  distance?: number; // miles from user, computed by provider
  sourceType: SourceType;
  menuItems: RawMenuItem[];
};

// ─── Restaurant with scoring applied ────────────────────────────────────────
export type ScoredRestaurant = Restaurant & {
  scoredItems: ScoredMenuItem[];
  summary: RestaurantSafetySummary;
};

// ─── Legacy types for the manual scan (app/scan) ────────────────────────────
export type MenuSource = {
  id: string;
  restaurant: string;
  category: string;
  url?: string;
  location?: string;
  items: string[];
};

export type ImportedMenuRow = {
  restaurant: string;
  category: string;
  item: string;
};

// Row represents one analyzed line in the manual scan
export type Row = {
  item: string;
  detected: string[];
  hits: string[];
  inferredAllergens: string[];
  inferredReasons: string[];
  confidence: Confidence;
  staffQuestions: string[];
  learned?: boolean;
};

export type AvoidRow = Row & {
  hitsAllergens: string[];
};

export type Results = {
  safe: Row[];
  ask: Row[];
  avoid: AvoidRow[];
};

export type SavedScan = {
  id: string;
  createdAt: number;
  title: string;
  allergies: string;
  menuUrl: string;
  menu: string;
  results: Results;
};

export type LearnedRule = {
  id: string;
  item: string;
  normalizedItem: string;
  outcome: "safe" | "avoid" | "unsure";
  allergen?: string;
  createdAt: number;
};
