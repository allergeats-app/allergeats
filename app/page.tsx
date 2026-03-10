"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useFavorites } from "@/lib/favoritesContext";
import { loadProfileAllergens, saveProfileAllergens } from "@/lib/allergenProfile";
import { scoreRestaurant } from "@/lib/scoring";
import { locationProvider, MockLocationProvider } from "@/lib/providers/locationProvider";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantMap } from "@/components/RestaurantMap";
import { CameraScanButton } from "@/components/CameraScanButton";
import { AllergySelector } from "@/components/AllergySelector";
import { RestaurantsHeader } from "@/components/RestaurantsHeader";
import { RestaurantsFilterDrawer } from "@/components/RestaurantsFilterDrawer";
import { HowItWorksSheet } from "@/components/HowItWorksSheet";
import type { Restaurant } from "@/lib/types";
import type { AllergenId } from "@/lib/types";
import type { SortOption, LayoutOption, TypeFilter } from "./restaurants/types";

const SESSION_KEY = "allegeats_live_restaurants";

function SmartEmptyState({
  query, radiusMiles, onlySaved, onlyWithMenu, typeFilter,
  onClearQuery, onClearSaved, onShowAll, onClearCuisine, onOpenMap,
}: {
  query: string; radiusMiles: number; onlySaved: boolean; onlyWithMenu: boolean; typeFilter: TypeFilter;
  onClearQuery: () => void; onClearSaved: () => void; onShowAll: () => void;
  onClearCuisine: () => void; onOpenMap: () => void;
}) {
  const suggestions: { label: string; action: () => void }[] = [];
  if (query)                suggestions.push({ label: `Clear search "${query}"`,       action: onClearQuery   });
  if (onlySaved)            suggestions.push({ label: "Turn off Saved Places",          action: onClearSaved  });
  if (onlyWithMenu)         suggestions.push({ label: "Show restaurants without menus", action: onShowAll     });
  if (typeFilter !== "all") suggestions.push({ label: "Show all cuisines",              action: onClearCuisine });
  suggestions.push(         { label: "Switch to map view",                              action: onOpenMap     });

  const subtitle = query
    ? `No restaurants match "${query}".`
    : onlySaved
    ? "None of your saved places match the current filters."
    : `Nothing found within ${radiusMiles} miles.`;

  return (
    <div style={{ padding: "56px 0 32px", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12, lineHeight: 1 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }} aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>No restaurants found</div>
      <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.5 }}>{subtitle}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto 28px" }}>
        {suggestions.map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={{
              padding: "11px 18px", borderRadius: 14,
              background: "var(--c-card)", border: "1.5px solid var(--c-border)",
              color: "var(--c-text)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
              transition: "border-color 0.15s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eb1700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 12 }}>Or scan any menu directly</div>
      <CameraScanButton style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "12px 22px", background: "#eb1700", color: "#fff",
        borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Scan a Menu
      </CameraScanButton>
    </div>
  );
}

function matchesType(r: { tags?: import("@/lib/types").RestaurantTag[] }, type: TypeFilter): boolean {
  if (type === "all") return true;
  return r.tags?.includes(type) ?? false;
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
        Loading…
      </main>
    }>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [query, setQuery]               = useState("");
  const [sort, setSort]                 = useState<SortOption>("best-match");
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>("all");
  const [onlyWithMenu, setOnlyWithMenu] = useState(true);
  const [onlySaved, setOnlySaved]       = useState(false);
  const [radiusMiles, setRadiusMiles]   = useState(10);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [showHowItWorks, setShowHowItWorks]     = useState(false);

  // Safe initialization — no browser APIs during render
  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]               = useState(true);
  const [localAllergens, setLocalAllergens] = useState<AllergenId[]>([]);
  const [saveState, setSaveState]           = useState<"idle" | "saving" | "saved" | "error">("idle");

  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [usingFallback, setUsingFallback] = useState(false);
  const [layout, setLayout]               = useState<LayoutOption>("list");
  const [userCoords, setUserCoords]       = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter]   = useState<{ lat: number; lng: number } | null>(null);

  const { user, allergens: authAllergens, loading: authLoading, saveAllergens } = useAuth();
  const { isFavorite } = useFavorites();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // Hydrate from localStorage + sessionStorage after mount
  useEffect(() => {
    const local = loadProfileAllergens();
    setLocalAllergens(local);
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        setRawRestaurants(JSON.parse(cached) as Restaurant[]);
        setLoading(false);
      }
    } catch { /* ignore */ }
  }, []);

  // Auth allergens take priority over localStorage (first load only)
  useEffect(() => {
    if (!authLoading && authAllergens.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setLocalAllergens(authAllergens);
    }
  }, [authLoading, authAllergens]);

  // Debounced Supabase save when signed-in user changes allergens
  useEffect(() => {
    if (!user || !initializedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("idle");
    debounceRef.current = setTimeout(async () => {
      setSaveState("saving");
      try {
        await saveAllergens(localAllergens);
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 4000);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [localAllergens]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeFilterCount = [
    sort !== "best-match",
    typeFilter !== "all",
    onlySaved,
    !onlyWithMenu,
    radiusMiles !== 10,
  ].filter(Boolean).length;

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
    initializedRef.current = true;
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
      case "distance":    list = [...list].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99)); break;
      case "most-safe":   list = [...list].sort((a, b) => b.summary.likelySafe - a.summary.likelySafe); break;
      case "least-avoid": list = [...list].sort((a, b) => a.summary.avoid - b.summary.avoid); break;
    }
    return list;
  }, [restaurants, query, sort, typeFilter, onlyWithMenu, onlySaved, isFavorite]);

  const closeDrawer       = useCallback(() => setShowFilterDrawer(false), []);
  const clearSearchCenter = useCallback(() => setSearchCenter(null), []);
  const openHowItWorks    = useCallback(() => setShowHowItWorks(true), []);
  const closeHowItWorks   = useCallback(() => setShowHowItWorks(false), []);

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>

      {/* ── 1. Sticky header ─────────────────────────────────────────────── */}
      <RestaurantsHeader
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
        onHowItWorks={openHowItWorks}
      />

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 16px 0" }}>

        {/* ── 2. Allergy profile card ───────────────────────────────────── */}
        <div style={{
          background: "var(--c-card)", border: "1px solid var(--c-border)",
          borderRadius: 20, padding: "16px 16px 14px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your Allergies
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {user && (
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: saveState === "saved" ? "#22c55e" : saveState === "error" ? "#ef4444" : "var(--c-sub)",
                  transition: "color 0.3s",
                }}>
                  {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Failed to save" : "Auto-saved"}
                </span>
              )}
              {!user && (
                <Link href="/auth" style={{ fontSize: 11, fontWeight: 700, color: "#eb1700", textDecoration: "none" }}>
                  Sign in to save
                </Link>
              )}
            </div>
          </div>
          <AllergySelector selected={localAllergens} onChange={handleAllergenChange} limit={4} />
        </div>

        {/* ── 3. Trust strip ───────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 16,
          padding: "10px 4px", marginTop: 2,
        }}>
          {[
            { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>, label: "Personalized to your allergies" },
            { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>, label: "Powered by menu data" },
            { icon: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>, label: "Safer picks highlighted" },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--c-sub)", fontSize: 11, fontWeight: 600 }}>
              {icon}
              {label}
            </div>
          ))}
        </div>

        {/* ── 4. Quick actions ─────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 8, marginTop: 4, marginBottom: 4 }}>
          <CameraScanButton style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "12px 0", borderRadius: 14,
            background: "#eb1700", color: "#fff",
            border: "none", cursor: "pointer",
            fontSize: 13, fontWeight: 800,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Scan a Menu
          </CameraScanButton>
          <button
            type="button"
            onClick={() => setLayout(layout === "map" ? "list" : "map")}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "12px 0", borderRadius: 14,
              background: layout === "map" ? "#fef2f2" : "var(--c-card)",
              border: `1.5px solid ${layout === "map" ? "#eb1700" : "var(--c-border)"}`,
              color: layout === "map" ? "#eb1700" : "var(--c-sub)",
              cursor: "pointer", fontSize: 13, fontWeight: 800,
              transition: "all 0.15s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
            Map View
          </button>
        </div>

      </div>

      <RestaurantsFilterDrawer
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

      <HowItWorksSheet open={showHowItWorks} onClose={closeHowItWorks} />

      {/* ── 5 & 6. Best Match + full results ─────────────────────────────── */}
      <div className={`rp-results rp-results--${layout}`}>
        {loading ? (
          <div style={{ padding: "80px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 700, marginBottom: 4 }}>Finding restaurants near you…</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Searching within {radiusMiles} miles</div>
          </div>
        ) : filtered.length === 0 ? (
          <SmartEmptyState
            query={query}
            radiusMiles={radiusMiles}
            onlySaved={onlySaved}
            onlyWithMenu={onlyWithMenu}
            typeFilter={typeFilter}
            onClearQuery={() => setQuery("")}
            onClearSaved={() => setOnlySaved(false)}
            onShowAll={() => setOnlyWithMenu(false)}
            onClearCuisine={() => setTypeFilter("all")}
            onOpenMap={() => setLayout("map")}
          />
        ) : layout === "map" ? (
          <RestaurantMap
            restaurants={filtered}
            userLat={userCoords?.lat}
            userLng={userCoords?.lng}
            onSearchArea={(lat, lng) => setSearchCenter({ lat, lng })}
          />
        ) : (
          <>
            {/* ── Best Match for You ──────────────────────────────── */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#eb1700" stroke="none" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Best Match for You
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "var(--c-sub)", paddingLeft: 19 }}>
                  Based on your allergies, menu data, and nearby distance
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", top: 12, right: 12, zIndex: 1,
                  background: "#eb1700", color: "#fff",
                  fontSize: 10, fontWeight: 800, padding: "3px 9px",
                  borderRadius: 999, letterSpacing: "0.04em", pointerEvents: "none",
                }}>
                  #1 Match
                </div>
                <RestaurantCard restaurant={filtered[0]} compact={false} />
              </div>
            </div>

            {/* ── All Restaurants ─────────────────────────────────── */}
            {filtered.length > 1 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 10px" }}>
                  More Nearby
                </div>
                <div className={layout === "grid" ? "rp-grid" : undefined} style={{ display: "grid", gap: 12 }}>
                  {filtered.slice(1).map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} compact={layout === "grid"} />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
