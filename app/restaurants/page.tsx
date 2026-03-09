"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { SettingsButton } from "@/components/SettingsButton";
import { loadProfileAllergens, saveProfileAllergens } from "@/lib/allergenProfile";
import { useAuth } from "@/lib/authContext";
import { useFavorites } from "@/lib/favoritesContext";
import { scoreRestaurant } from "@/lib/scoring";
import { locationProvider, MockLocationProvider } from "@/lib/providers/locationProvider";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantMap } from "@/components/RestaurantMap";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/EmptyState";
import { AllergySelector } from "@/components/AllergySelector";
import { CameraScanButton } from "@/components/CameraScanButton";
import type { Restaurant } from "@/lib/types";
import type { AllergenId } from "@/lib/types";

type SortOption   = "best-match" | "distance" | "most-safe" | "least-avoid";
type LayoutOption = "list" | "grid" | "map";
type TypeFilter   = "all" | "burgers" | "mexican" | "chicken" | "coffee" | "sandwiches";

const SORT_CHIPS = [
  { value: "best-match"  as SortOption, label: "Best Match" },
  { value: "distance"    as SortOption, label: "Nearest" },
  { value: "most-safe"   as SortOption, label: "Most Allergy-Friendly" },
  { value: "least-avoid" as SortOption, label: "Lowest Risk" },
];

const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "burgers",    label: "Burgers" },
  { value: "mexican",    label: "Mexican" },
  { value: "chicken",    label: "Chicken" },
  { value: "coffee",     label: "Coffee & Café" },
  { value: "sandwiches", label: "Sandwiches" },
];

function matchesType(r: { tags?: import("@/lib/types").RestaurantTag[] }, type: TypeFilter): boolean {
  if (type === "all") return true;
  return r.tags?.includes(type) ?? false;
}

const SESSION_KEY = "allegeats_live_restaurants";

// ── Shared sub-components ───────────────────────────────────────────────────

function DrawerSection({ title, hint, last, action, children }: {
  title: string; hint?: string; last?: boolean; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: last ? "none" : "1px solid var(--c-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {title}
          </div>
          {hint && <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 3 }}>{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width: 46, height: 28, borderRadius: 999, flexShrink: 0,
        background: checked ? "#eb1700" : "var(--c-border)",
        border: "none", cursor: "pointer", padding: 0,
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 4, left: checked ? 22 : 4,
        width: 20, height: 20, borderRadius: 999,
        background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </button>
  );
}

// ── PageHeader ───────────────────────────────────────────────────────────────

function PageHeader({
  locationLabel, usingFallback,
  query, setQuery,
  activeFilterCount, showFilterDrawer, setShowFilterDrawer,
  layout, setLayout,
  loading, filteredCount, radiusMiles,
}: {
  locationLabel: string; usingFallback: boolean;
  query: string; setQuery: (q: string) => void;
  activeFilterCount: number; showFilterDrawer: boolean; setShowFilterDrawer: (v: boolean) => void;
  layout: LayoutOption; setLayout: (l: LayoutOption) => void;
  loading: boolean; filteredCount: number; radiusMiles: number;
}) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--c-hdr)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--c-border)",
      padding: "10px 16px 12px",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 8 }}>

        {/* Row 1 — location · logo · settings */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 36 }}>
          <span style={{
            position: "absolute", left: 0,
            fontSize: 11, color: "#9ca3af",
            maxWidth: "35%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {locationLabel}
            {usingFallback && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · Sample</span>}
          </span>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Image src="/logo.png" alt="AllergEats" width={160} height={40} style={{ width: "auto", height: 32 }} priority />
          </Link>
          <div style={{ position: "absolute", right: 0 }}>
            <SettingsButton />
          </div>
        </div>

        {/* Row 2 — search + filter button */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
              style={{
                position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
                color: "#9ca3af", pointerEvents: "none",
              }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants…"
              aria-label="Search restaurants"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "11px 16px 11px 37px",
                border: "1px solid var(--c-border)", borderRadius: 14, fontSize: 15,
                background: "var(--c-card)", outline: "none", color: "var(--c-text)",
              }}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            aria-expanded={showFilterDrawer}
            aria-haspopup="dialog"
            style={{
              flexShrink: 0, display: "flex", alignItems: "center", gap: 6,
              padding: "0 14px", borderRadius: 14, height: 46,
              background: activeFilterCount > 0 ? "#eb1700" : "var(--c-card)",
              border: `1.5px solid ${activeFilterCount > 0 ? "#eb1700" : "var(--c-border)"}`,
              color: activeFilterCount > 0 ? "#fff" : "var(--c-text)",
              fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
          </button>
        </div>

        {/* Row 3 — count · layout toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {loading
              ? "Finding restaurants…"
              : `${filteredCount} restaurant${filteredCount === 1 ? "" : "s"} · ${radiusMiles} mi`}
          </span>
          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="View layout">
            {(["list", "grid", "map"] as LayoutOption[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                aria-pressed={layout === l}
                aria-label={l === "list" ? "List view" : l === "grid" ? "Grid view" : "Map view"}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "1.5px solid",
                  borderColor: layout === l ? "#eb1700" : "var(--c-border)",
                  background: layout === l ? "#eb1700" : "var(--c-card)",
                  color: layout === l ? "#fff" : "var(--c-sub)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {l === "list" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                ) : l === "grid" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── FilterDrawer ─────────────────────────────────────────────────────────────

function FilterDrawer({
  open, onClose,
  activeFilterCount, loading, filteredCount,
  localAllergens, onAllergenChange,
  sort, setSort,
  typeFilter, setTypeFilter,
  radiusMiles, setRadiusMiles, clearSearchCenter,
  onlyWithMenu, setOnlyWithMenu,
  onlySaved, setOnlySaved,
  onReset,
}: {
  open: boolean; onClose: () => void;
  activeFilterCount: number; loading: boolean; filteredCount: number;
  localAllergens: AllergenId[]; onAllergenChange: (v: AllergenId[]) => void;
  sort: SortOption; setSort: (v: SortOption) => void;
  typeFilter: TypeFilter; setTypeFilter: (v: TypeFilter) => void;
  radiusMiles: number; setRadiusMiles: (v: number) => void; clearSearchCenter: () => void;
  onlyWithMenu: boolean; setOnlyWithMenu: (v: boolean) => void;
  onlySaved: boolean; setOnlySaved: (v: boolean) => void;
  onReset: () => void;
}) {
  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleRows = [
    { checked: onlyWithMenu, onChange: setOnlyWithMenu, label: "Available Menus Only", hint: "Only restaurants with scored menu items" },
    { checked: onlySaved,    onChange: setOnlySaved,    label: "Saved restaurants",  hint: "Only places you've hearted" },
  ];

  return (
    <>
      {/* Backdrop — always in DOM, opacity animated */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
          background: "var(--c-card)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          boxShadow: "0 -16px 56px rgba(0,0,0,0.2)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: open
            ? "transform 0.38s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.28s cubic-bezier(0.4,0,1,1)",
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px" }}>

          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, marginBottom: 2 }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--c-border)" }} />
          </div>

          {/* Sticky inner header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0 18px",
            position: "sticky", top: 0, zIndex: 1,
            background: "var(--c-card)",
            borderBottom: "1px solid var(--c-border)",
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)", lineHeight: 1 }}>Filters</div>
              {activeFilterCount > 0 && (
                <div style={{ fontSize: 12, color: "#eb1700", fontWeight: 700, marginTop: 3 }}>
                  {activeFilterCount} active
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              style={{
                width: 32, height: 32, borderRadius: 999,
                background: "var(--c-muted)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--c-sub)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Allergies */}
          <DrawerSection
            title="Your allergies"
            hint="Results update as you change selections"
            action={localAllergens.length > 0 ? (
              <button
                type="button"
                onClick={() => onAllergenChange([])}
                style={{
                  fontSize: 12, fontWeight: 700, color: "#eb1700",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                Clear
              </button>
            ) : undefined}
          >
            <AllergySelector selected={localAllergens} onChange={onAllergenChange} />
          </DrawerSection>

          {/* Sort */}
          <DrawerSection title="Sort by">
            <FilterChips chips={SORT_CHIPS} active={sort} onChange={setSort} />
          </DrawerSection>

          {/* Cuisine */}
          <DrawerSection title="Cuisine type">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setTypeFilter(c.value)}
                  aria-pressed={typeFilter === c.value}
                  style={{
                    padding: "8px 16px", borderRadius: 999,
                    border: `1.5px solid ${typeFilter === c.value ? "var(--c-text)" : "var(--c-border)"}`,
                    background: typeFilter === c.value ? "var(--c-text)" : "transparent",
                    color: typeFilter === c.value ? "var(--c-bg)" : "var(--c-sub)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Radius */}
          <DrawerSection title="Search radius" hint="Larger radius searches more of the map">
            <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Search radius in miles">
              {[5, 10, 25, 50].map((mi) => (
                <button
                  key={mi}
                  type="button"
                  onClick={() => { clearSearchCenter(); setRadiusMiles(mi); }}
                  aria-pressed={radiusMiles === mi}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 14,
                    border: `1.5px solid ${radiusMiles === mi ? "#eb1700" : "var(--c-border)"}`,
                    background: radiusMiles === mi ? "#fef2f2" : "transparent",
                    color: radiusMiles === mi ? "#eb1700" : "var(--c-sub)",
                    fontSize: 14, fontWeight: 800, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {mi}
                  <span style={{ fontSize: 11, fontWeight: 600, display: "block", marginTop: 1, opacity: 0.75 }}>mi</span>
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Show only toggles */}
          <DrawerSection title="Show only" last>
            <div>
              {toggleRows.map(({ checked, onChange, label, hint }, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange(!checked)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, padding: "14px 0", width: "100%",
                    background: "none", border: "none", textAlign: "left", cursor: "pointer",
                    borderBottom: i < toggleRows.length - 1 ? "1px solid var(--c-border)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 2 }}>{hint}</div>
                  </div>
                  <ToggleSwitch checked={checked} onChange={onChange} label={label} />
                </button>
              ))}
            </div>
          </DrawerSection>

        </div>

        {/* Sticky footer */}
        <div style={{
          padding: "14px 20px 36px",
          borderTop: "1px solid var(--c-border)",
          background: "var(--c-card)",
          display: "flex", gap: 10,
        }}>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              style={{
                flex: "0 0 auto", padding: "0 18px", height: 52,
                background: "transparent", border: "1.5px solid var(--c-border)",
                borderRadius: 14, fontSize: 13, fontWeight: 700,
                color: "var(--c-sub)", cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "0 20px", height: 52,
              background: "var(--c-text)", color: "var(--c-bg)",
              border: "none", borderRadius: 14,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 1,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>Done</span>
            {!loading && (
              <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, lineHeight: 1 }}>
                {filteredCount} restaurant{filteredCount === 1 ? "" : "s"}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
        Loading…
      </main>
    }>
      <RestaurantsContent />
    </Suspense>
  );
}

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  const [query, setQuery]               = useState(queryParam);
  const [sort, setSort]                 = useState<SortOption>("best-match");
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>("all");
  const [onlyWithMenu, setOnlyWithMenu] = useState(true);
  const [onlySaved, setOnlySaved]       = useState(false);
  const [radiusMiles, setRadiusMiles]   = useState(10);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Safe initialization — no sessionStorage/localStorage during render
  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]               = useState(true);
  const [localAllergens, setLocalAllergens] = useState<AllergenId[]>([]);

  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [usingFallback, setUsingFallback] = useState(false);
  const [layout, setLayout]               = useState<LayoutOption>("list");
  const [userCoords, setUserCoords]       = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter]   = useState<{ lat: number; lng: number } | null>(null);

  const { allergens: authAllergens, loading: authLoading } = useAuth();
  const { isFavorite } = useFavorites();

  // Hydrate from localStorage + sessionStorage after mount
  useEffect(() => {
    setLocalAllergens(loadProfileAllergens());
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        setRawRestaurants(JSON.parse(cached) as Restaurant[]);
        setLoading(false);
      }
    } catch { /* ignore */ }
  }, []);

  const activeFilterCount = [
    sort !== "best-match",
    typeFilter !== "all",
    onlySaved,
    !onlyWithMenu,
    radiusMiles !== 10,
  ].filter(Boolean).length;

  // Auth allergens take priority over localStorage
  useEffect(() => {
    if (!authLoading && authAllergens.length > 0) setLocalAllergens(authAllergens);
  }, [authLoading, authAllergens]);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const a = data.address ?? {};
      return a.neighbourhood ?? a.suburb ?? a.city_district ?? a.city ?? a.town ?? a.village ?? `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
    } catch {
      return `${lat.toFixed(3)}°, ${lng.toFixed(3)}°`;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!rawRestaurants.length) setLoading(true);
      setUsingFallback(false);

      try {
        let lat: number, lng: number;

        if (searchCenter) {
          lat = searchCenter.lat; lng = searchCenter.lng;
          reverseGeocode(lat, lng).then((label) => { if (!cancelled) setLocationLabel(label); });
        } else {
          const position = await locationProvider.getUserLocation();
          const usingDemoLocation = !position;
          lat = position?.lat ?? 37.7749;
          lng = position?.lng ?? -122.4194;
          if (!usingDemoLocation && !cancelled) setUserCoords({ lat, lng });
          if (usingDemoLocation && !cancelled) {
            setUsingFallback(true);
            setLocationLabel("Location unavailable");
          } else {
            reverseGeocode(lat, lng).then((label) => { if (!cancelled) setLocationLabel(label); });
          }
        }

        let raw: Restaurant[];
        try {
          raw = await locationProvider.searchRestaurants(lat, lng, radiusMiles);
        } catch {
          const fallback = new MockLocationProvider();
          raw = await fallback.searchRestaurants(lat, lng, 9999);
          if (!cancelled) setUsingFallback(true);
        }

        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(raw)); } catch { /* ignore */ }
        if (!cancelled) setRawRestaurants(raw);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [radiusMiles, searchCenter]); // eslint-disable-line react-hooks/exhaustive-deps

  const restaurants = useMemo(() =>
    rawRestaurants.map((r) => scoreRestaurant(r, localAllergens)),
    [rawRestaurants, localAllergens]
  );

  function handleAllergenChange(next: AllergenId[]) {
    setLocalAllergens(next);
    saveProfileAllergens(next);
  }

  function resetFilters() {
    setSort("best-match");
    setTypeFilter("all");
    setOnlySaved(false);
    setOnlyWithMenu(true);
    setRadiusMiles(10);
    setSearchCenter(null);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = restaurants.filter((r) => matchesType(r, typeFilter));
    if (onlySaved)    list = list.filter((r) => isFavorite(r.id));
    if (onlyWithMenu) list = list.filter((r) => r.scoredItems.length > 0);
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));

    switch (sort) {
      case "best-match":
        list = [...list].sort((a, b) => {
          const score = (r: typeof a) => {
            const t = r.summary.total || 1;
            return (r.summary.likelySafe / t) * 0.6
              - (r.summary.avoid / t) * 0.3
              - ((r.distance ?? 10) / 50) * 0.1;
          };
          return score(b) - score(a);
        });
        break;
      case "distance":   list = [...list].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99)); break;
      case "most-safe":  list = [...list].sort((a, b) => b.summary.likelySafe - a.summary.likelySafe); break;
      case "least-avoid": list = [...list].sort((a, b) => a.summary.avoid - b.summary.avoid); break;
    }
    return list;
  }, [restaurants, query, sort, typeFilter, onlyWithMenu, onlySaved, isFavorite]);

  const closeDrawer       = useCallback(() => setShowFilterDrawer(false), []);
  const clearSearchCenter = useCallback(() => setSearchCenter(null), []);

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>

      <PageHeader
        locationLabel={locationLabel}
        usingFallback={usingFallback}
        query={query}
        setQuery={setQuery}
        activeFilterCount={activeFilterCount}
        showFilterDrawer={showFilterDrawer}
        setShowFilterDrawer={setShowFilterDrawer}
        layout={layout}
        setLayout={setLayout}
        loading={loading}
        filteredCount={filtered.length}
        radiusMiles={radiusMiles}
      />

      <FilterDrawer
        open={showFilterDrawer}
        onClose={closeDrawer}
        activeFilterCount={activeFilterCount}
        loading={loading}
        filteredCount={filtered.length}
        localAllergens={localAllergens}
        onAllergenChange={handleAllergenChange}
        sort={sort}
        setSort={setSort}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        radiusMiles={radiusMiles}
        setRadiusMiles={setRadiusMiles}
        clearSearchCenter={clearSearchCenter}
        onlyWithMenu={onlyWithMenu}
        setOnlyWithMenu={setOnlyWithMenu}
        onlySaved={onlySaved}
        setOnlySaved={setOnlySaved}
        onReset={resetFilters}
      />

      {/* ── Results ─────────────────────────────────────────────────────── */}
      <div className={`rp-results rp-results--${layout}`}>
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 700, marginBottom: 4 }}>Finding restaurants near you…</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Searching within {radiusMiles} miles</div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No restaurants found"
            subtitle={
              query
                ? `No results for "${query}". Try a different search.`
                : `Nothing within ${radiusMiles} miles. Try a wider radius in Filters.`
            }
            action={
              <CameraScanButton style={{ display: "inline-block", padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
                Scan a Menu
              </CameraScanButton>
            }
          />
        ) : layout === "map" ? (
          <RestaurantMap
            restaurants={filtered}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
            onSearchArea={(lat, lng) => setSearchCenter({ lat, lng })}
          />
        ) : (
          <div className={layout === "grid" ? "rp-grid" : undefined} style={{ display: "grid", gap: 12 }}>
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} compact={layout === "grid"} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
