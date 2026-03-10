/**
 * lib/db/types.ts
 *
 * TypeScript interfaces matching the menu ingestion database schema.
 * These mirror the columns in migration 004_menu_ingestion.sql.
 *
 * Naming convention: Db prefix = row shape returned by Supabase queries.
 * Insert variants omit server-generated fields (id, timestamps, etc.).
 */

// ─── restaurants ─────────────────────────────────────────────────────────────

export type DbRestaurant = {
  id:         string;
  name:       string;
  cuisine?:   string | null;
  address?:   string | null;
  lat?:       number | null;
  lng?:       number | null;
  phone?:     string | null;
  website?:   string | null;
  places_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type DbRestaurantInsert = Omit<DbRestaurant, "created_at" | "updated_at">;

// ─── menu_sources ─────────────────────────────────────────────────────────────

export type DbMenuSource = {
  id:                  string;
  restaurant_id:       string;
  source_type:         string;          // MenuIngestionSourceType
  source_url?:         string | null;
  source_label?:       string | null;
  source_confidence:   "high" | "medium" | "low";
  imported_at:         string;
  last_seen_at:        string;
  raw_snapshot?:       string | null;
  raw_snapshot_hash?:  string | null;
  import_status:       "success" | "partial" | "failed";
  notes?:              string | null;
};

export type DbMenuSourceInsert = Omit<DbMenuSource, "id" | "imported_at" | "last_seen_at">;

// ─── menu_versions ────────────────────────────────────────────────────────────

export type DbMenuVersion = {
  id:              string;
  restaurant_id:   string;
  menu_source_id?: string | null;
  version_number:  number;
  imported_at:     string;
  is_active:       boolean;
  checksum?:       string | null;
  section_count:   number;
  item_count:      number;
};

export type DbMenuVersionInsert = Omit<DbMenuVersion, "id" | "imported_at">;

// ─── menu_sections ────────────────────────────────────────────────────────────

export type DbMenuSection = {
  id:               string;
  menu_version_id:  string;
  section_name:     string;
  sort_order:       number;
};

export type DbMenuSectionInsert = Omit<DbMenuSection, "id">;

// ─── menu_items ───────────────────────────────────────────────────────────────

export type DbMenuItem = {
  id:                 string;
  menu_version_id:    string;
  menu_section_id?:   string | null;
  restaurant_id:      string;
  external_item_id?:  string | null;
  item_name:          string;
  description?:       string | null;
  price?:             string | null;
  raw_text:           string;
  normalized_text:    string;
  source_confidence:  "high" | "medium" | "low";
  source_signals?:    string[] | null;   // stored as jsonb
  checksum?:          string | null;
  sort_order:         number;
  created_at:         string;
};

export type DbMenuItemInsert = Omit<DbMenuItem, "id" | "created_at">;

// ─── active_menus view ────────────────────────────────────────────────────────

export type DbActiveMenu = {
  restaurant_id:        string;
  restaurant_name:      string;
  cuisine?:             string | null;
  menu_version_id:      string;
  version_number:       number;
  version_imported_at:  string;
  item_count:           number;
  section_count:        number;
  version_checksum?:    string | null;
  source_type?:         string | null;
  source_url?:          string | null;
  source_confidence?:   string | null;
  source_imported_at?:  string | null;
  source_last_seen_at?: string | null;
};

// ─── Repository result types ──────────────────────────────────────────────────

/** Full menu hierarchy returned by getActiveMenuForRestaurant */
export type ActiveMenuResult = {
  version:  DbMenuVersion;
  source?:  DbMenuSource | null;
  sections: Array<DbMenuSection & { items: DbMenuItem[] }>;
};

/** Result from persistMenu() */
export type PersistResult =
  | { status: "skipped";  reason: "duplicate_source" | "duplicate_version"; versionId: string }
  | { status: "created";  versionId: string; itemCount: number; versionNumber: number }
  | { status: "error";    error: string };
