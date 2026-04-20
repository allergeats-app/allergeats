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

// ─── Allergen severity ──────────────────────────────────────────────────────
/**
 * How serious is this allergen for the specific user?
 *   anaphylactic — life-threatening reaction; any contact = avoid
 *   intolerance   — uncomfortable but not life-threatening; ask is acceptable
 */
export type AllergenSeverity = "anaphylactic" | "intolerance";

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

  // ── Ingestion-layer richness (populated by toRawMenuItems) ──────────────
  /**
   * Pre-cleaned text produced by the ingestion normalizer.
   * When present, the scoring engine uses this instead of re-cleaning name + description,
   * which avoids redundant normalization passes.
   */
  normalizedText?: string;
  /**
   * Per-item source confidence from the ingestion adapter ("high" | "medium" | "low").
   * Takes precedence over the restaurant-level sourceType confidence in scoreMenuItem().
   * Allows a single well-documented item inside a scrape to be treated as high confidence.
   */
  sourceConfidence?: "high" | "medium" | "low";
  /**
   * Human-readable evidence trail explaining why this item has its confidence level.
   * Preserved through scoring so it can be surfaced in the UI or debug tooling.
   * E.g. ["Toast POS — restaurant-controlled data", "has price — likely real menu item"]
   */
  sourceSignals?: string[];
  /**
   * Zero-based index of the section this item came from in the original NormalizedMenu.
   * Preserves section ordering through the flat-array bridge so the UI can
   * re-group or sort items by their original menu structure.
   */
  sectionIndex?: number;
  /** ISO date (YYYY-MM-DD) when this item's allergen data was last manually verified */
  lastVerified?: string;
  /** Free-text notes from the manual audit (e.g. "sesame in bun confirmed Apr 2026") */
  auditNotes?: string;
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
  /**
   * Severity of each user-allergen hit — populated when the user has set severity levels.
   * Anaphylactic hits drive stricter risk thresholds and bolder UI warnings.
   */
  severityHits?: Partial<Record<string, AllergenSeverity>>;
  /**
   * Whether this item's allergen presence is definitive ("contains X") vs.
   * precautionary ("may contain X / made in a facility with X").
   */
  allergenCertainty?: "definite" | "precautionary";
  /** Maps each user-profile allergen to the best signal reason explaining its source */
  allergenSources?: Partial<Record<string, string>>;
  /** Actionable substitution suggestions for the matched allergens */
  substitutions?: string[];
  /** Section position from the original NormalizedMenu (0-based). Undefined for legacy items. */
  sectionIndex?: number;
  /** Evidence trail from the ingestion adapter — surfaced in UI / debug tooling. */
  sourceSignals?: string[];
};

// ─── Restaurant safety summary (derived from scored items, never hardcoded) ──
export type RestaurantSafetySummary = {
  likelySafe: number;
  ask: number;
  avoid: number;
  unknown: number;
  total: number;
};

// ─── Restaurant category tags (structured, used for filtering) ───────────────
export type RestaurantTag =
  | "burgers" | "mexican" | "chicken" | "coffee" | "sandwiches" | "casual"
  | "steakhouse" | "fine-dining" | "seafood" | "italian" | "pizza" | "breakfast"
  | "sports-bar" | "asian" | "chinese" | "fast-food" | "fast-casual" | "wings"
  | "noodles" | "pasta" | "bar" | "craft-beer" | "southern" | "comfort-food"
  | "brunch" | "pancakes" | "american" | "drive-in" | "roast-beef" | "texas"
  | "ice-cream" | "custard" | "cheesecake" | "24-hour" | "burritos" | "tacos"
  | "salads" | "healthy" | "buffet";

// ─── Guided order builder config ────────────────────────────────────────────
export type BuilderStep = {
  /** Question shown to user, e.g. "Choose your bread" */
  label: string;
  /** Category name matching sectionName in the menu, e.g. "Breads" */
  category: string;
  /**
   * When set, pools items from all listed section names into a single step.
   * Overrides `category` when present. Used for sit-down restaurants where
   * "Choose your entrée" spans multiple sections (Steaks, Seafood, Chicken).
   */
  categories?: string[];
  /** Whether the user must pick at least one item before advancing */
  required: boolean;
  /** 1 = single-select (auto-advance); >1 = multi-select with Continue button */
  maxSelect: number;
  /**
   * When true, items in this step are displayed as numbered combos (#1, #2, #3…).
   * Used for fast food entrée steps where items map to meal numbers.
   */
  showAsCombo?: boolean;
};

export type BuilderConfig = {
  steps: BuilderStep[];
};

// ─── Restaurant ─────────────────────────────────────────────────────────────
export type Restaurant = {
  id: string;
  name: string;
  cuisine: string;
  tags?: RestaurantTag[];
  address?: string;
  lat?: number;
  lng?: number;
  distance?: number; // miles from user, computed by provider
  sourceType: SourceType;
  menuItems: RawMenuItem[];
  /** Image URL from enrichment system (website / Google Places / Yelp) */
  imageUrl?: string | null;
  /** Google Places place_id — when present, used by /api/places-photo for unambiguous lookup. */
  googlePlaceId?: string;
  phone?: string;
  website?: string;
  /**
   * When true, the restaurant was discovered from a live source (OSM / Google / Yelp)
   * but its menu items come from a generic chain template (MOCK_RESTAURANTS), not
   * location-specific data. The UI should make clear that menu details may differ
   * by location and have not been verified for this specific store.
   */
  menuIsGenericChainTemplate?: boolean;
  /** When present, the restaurant supports a guided step-by-step order builder */
  builderConfig?: BuilderConfig;
  /** Direct URL to the restaurant's official allergen/nutrition page — used in admin audit tool */
  allergenPageUrl?: string;
  /**
   * Allergens present in shared kitchen equipment (fryers, prep surfaces) at this location.
   * Items that don't contain these allergens in their own ingredient list will receive
   * a precautionary "may contain" signal — scored as "ask" rather than "avoid".
   */
  facilityAllergens?: AllergenId[];
  /**
   * ISO date (YYYY-MM-DD) when allergen data for this restaurant was last verified
   * against the chain's official allergen guide. Falls back to MENU_DATA_VERIFIED_DATE
   * when not set. Used to show a staleness warning in the UI.
   */
  dataVerifiedDate?: string;
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
