"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { useAllergenProfile } from "@/lib/hooks/useAllergenProfile";
import { scoreRestaurant, bestMatchScore } from "@/lib/scoring";
import { locationProvider, MockLocationProvider, checkLocationPermission } from "@/lib/providers/locationProvider";
import type { Coordinates } from "@/lib/providers/locationProvider";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantMap } from "@/components/RestaurantMap";
import { CameraScanButton } from "@/components/CameraScanButton";
import { RestaurantsHeader } from "@/components/RestaurantsHeader";
import { RestaurantsFilterDrawer } from "@/components/RestaurantsFilterDrawer";
import { LocationPickerSheet } from "@/components/LocationPickerSheet";
import { SmartEmptyState } from "@/components/SmartEmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { AllergenProfileCard } from "@/components/AllergenProfileCard";
import type { Restaurant } from "@/lib/types";
import type { AllergenId } from "@/lib/types";
import type { SortOption, LayoutOption, TypeFilter } from "./restaurants/types";
import { trackEvent } from "@/lib/analytics";

const SESSION_KEY = "allegeats_live_restaurants";

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
  const [showFilterDrawer, setShowFilterDrawer]   = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading]               = useState(true);
  const [locationLabel, setLocationLabel]   = useState("Locating…");
  const [locationMode, setLocationMode]     = useState<"precise" | "approximate" | "cached" | "unavailable">("unavailable");
  const [resultsSource, setResultsSource]   = useState<"live" | "mock">("live");
  const [layout, setLayout]                 = useState<LayoutOption>("list");
  const [userLocation, setUserLocation]     = useState<Coordinates | null>(null);
  const [searchCenter, setSearchCenter]     = useState<{ lat: number; lng: number; label?: string } | null>(null);
  const [locationRefresh, setLocationRefresh] = useState(0);

  const { isDark } = useTheme();
  const { user, firstName } = useAuth();
  const { isFavorite } = useFavorites();
  const { allergens: localAllergens, saveState, setAllergens: setLocalAllergens } = useAllergenProfile();

  // Hydrate sessionStorage cache after mount
  useEffect(() => {
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

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en", "User-Agent": "AllergEats/1.0" } }
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const a = data.address ?? {};
      return a.neighbourhood ?? a.suburb ?? a.city_district ?? a.city ?? a.town ?? a.village ?? "Nearby";
    } catch {
      return "Nearby";
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!rawRestaurants.length) setLoading(true);
      setResultsSource("live");

      try {
        let lat: number, lng: number;
        let accuracy: number | undefined;

        if (searchCenter) {
          lat = searchCenter.lat;
          lng = searchCenter.lng;
          setLocationMode("precise");
          if (searchCenter.label) {
            // User explicitly picked a location by name — use it directly
            if (!cancelled) setLocationLabel(searchCenter.label);
          } else {
            // Map pan — geocode to get a name
            setLocationLabel("Searching this area");
            reverseGeocode(lat, lng).then((name) => { if (!cancelled) setLocationLabel(name); });
          }
        } else {
          // Preflight: if the user has already denied location, skip the GPS wait entirely.
          // "prompt" and "unsupported" still proceed — we let the browser handle those naturally.
          const permission = await checkLocationPermission();
          if (permission === "denied") {
            if (!cancelled) {
              setLocationMode("unavailable");
              setLocationLabel("Location blocked");
              setLoading(false);
            }
            return;
          }

          const position = await locationProvider.getUserLocation();

          if (!position) {
            // GPS + network both failed and no cache — don't silently fake a location
            if (!cancelled) {
              setLocationMode("unavailable");
              setLocationLabel("Location unavailable");
              setLoading(false);
            }
            return;
          }

          lat       = position.lat;
          lng       = position.lng;
          accuracy  = position.accuracy;

          if (!cancelled) {
            setUserLocation(position);
            // Derive display mode from source + accuracy
            const mode: "precise" | "approximate" | "cached" =
              position.source === "cached"                        ? "cached"      :
              (accuracy != null && accuracy <= 100)               ? "precise"     :
                                                                    "approximate";
            setLocationMode(mode);
          }

          reverseGeocode(lat, lng).then((name) => { if (!cancelled) setLocationLabel(name); });
        }

        let raw: Restaurant[];
        try {
          // Pass accuracy so the provider can expand the search radius for coarse locations
          raw = await locationProvider.searchRestaurants(lat, lng, radiusMiles, accuracy);
        } catch {
          const fallback = new MockLocationProvider();
          raw = await fallback.searchRestaurants(lat, lng, 9999);
          if (!cancelled) setResultsSource("mock");
        }

        if (!cancelled) {
          try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(raw)); } catch { /* ignore */ }
          setRawRestaurants(raw);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [radiusMiles, searchCenter, locationRefresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const restaurants = useMemo(() =>
    rawRestaurants.map((r) => scoreRestaurant(r, localAllergens)),
    [rawRestaurants, localAllergens]
  );

  function handleAllergenChange(next: AllergenId[]) {
    trackEvent("filters_allergens_changed", { count: next.length });
    setLocalAllergens(next);
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
    if (onlySaved)                         list = list.filter((r) => isFavorite(r.id));
    if (onlyWithMenu && layout !== "map")  list = list.filter((r) => r.scoredItems.length > 0);
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));

    switch (sort) {
      case "best-match":
        // Coverage-weighted safe ratio + zero-avoid bonus + distance penalty
        list = [...list].sort((a, b) => bestMatchScore(b) - bestMatchScore(a));
        break;
      case "distance":
        list = [...list].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
        break;
      case "most-safe":
        // Sort by safe ratio (not raw count) so big menus don't unfairly dominate;
        // tie-break by total items (more coverage = more confidence)
        list = [...list].sort((a, b) => {
          const ratioA = a.summary.total > 0 ? a.summary.likelySafe / a.summary.total : 0;
          const ratioB = b.summary.total > 0 ? b.summary.likelySafe / b.summary.total : 0;
          return ratioB - ratioA || b.summary.total - a.summary.total;
        });
        break;
      case "least-avoid":
        // Sort by avoid ratio (not raw count); tie-break by distance
        list = [...list].sort((a, b) => {
          const ratioA = a.summary.total > 0 ? a.summary.avoid / a.summary.total : 1;
          const ratioB = b.summary.total > 0 ? b.summary.avoid / b.summary.total : 1;
          return ratioA - ratioB || (a.distance ?? 99) - (b.distance ?? 99);
        });
        break;
      case "coverage":
        // Most menu items analyzed first — useful for finding well-documented restaurants
        list = [...list].sort((a, b) => b.summary.total - a.summary.total);
        break;
    }
    return list;
  }, [restaurants, query, sort, typeFilter, onlyWithMenu, onlySaved, isFavorite, layout]);

  const closeDrawer       = useCallback(() => setShowFilterDrawer(false), []);
  const clearSearchCenter = useCallback(() => setSearchCenter(null), []);

  function handleSelectLocation(lat: number, lng: number, label: string) {
    // Batch all state changes together: loading=true prevents the empty-state flash
    // that would otherwise appear between clearing results and the load effect starting.
    setRawRestaurants([]);
    setLoading(true);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSearchCenter({ lat, lng, label });
    setLocationLabel(label);
  }

  function handleUseCurrentLocation() {
    setRawRestaurants([]);
    setLoading(true);
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSearchCenter(null);
    setLocationLabel("Locating…");
    setLocationRefresh((n) => n + 1); // force load effect to re-run even if searchCenter was already null
  }

  return (
    <main className={layout !== "map" ? "safe-pb" : undefined} style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif" }}>

      {/* ── 1. Sticky header ─────────────────────────────────────────────── */}
      <RestaurantsHeader
        locationLabel={locationLabel}
        locationMode={locationMode}
        resultsSource={resultsSource}
        onLocationPress={() => setShowLocationPicker(true)}
        query={query}
        setQuery={setQuery}
        activeFilterCount={activeFilterCount}
        showFilterDrawer={showFilterDrawer}
        setShowFilterDrawer={setShowFilterDrawer}
        layout={layout}
        setLayout={setLayout}
        loading={loading}
        filteredCount={filtered.length}
      />

      {layout !== "map" && <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 16px 0" }}>

        {/* ── Welcome greeting (signed-in users only) ───────────────────── */}
        {user && firstName && (
          <div style={{ marginBottom: 10, fontSize: 22, fontWeight: 900, color: "var(--c-text)" }}>
            Welcome, {firstName}
          </div>
        )}

        {/* ── 2. Allergy profile card ───────────────────────────────────── */}
        <AllergenProfileCard
          allergens={localAllergens}
          saveState={saveState}
          isSignedIn={!!user}
          onChange={handleAllergenChange}
        />

      </div>}

      <RestaurantsFilterDrawer
        open={showFilterDrawer}
        onClose={closeDrawer}
        activeFilterCount={activeFilterCount}
        loading={loading}
        filteredCount={filtered.length}
        localAllergens={localAllergens}
        onAllergenChange={handleAllergenChange}
        sort={sort}
        setSort={(v) => { trackEvent("filters_sort_changed", { sort: v }); setSort(v); }}
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

      <LocationPickerSheet
        open={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onSelectLocation={handleSelectLocation}
        onUseCurrentLocation={handleUseCurrentLocation}
      />

      {/* ── 5 & 6. Best Match + full results ─────────────────────────────── */}
      <div className={`rp-results rp-results--${layout}`}>
        {loading ? (
          <>
            {/* Featured skeleton */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div className="skeleton" style={{ width: 13, height: 13, borderRadius: 999 }} />
                <div className="skeleton" style={{ width: 140, height: 10 }} />
              </div>
              <SkeletonCard featured />
            </div>
            {/* List skeletons */}
            <div className="skeleton" style={{ height: 10, width: 80, margin: "20px 0 10px" }} />
            <div style={{ display: "grid", gap: 12 }}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : filtered.length === 0 && locationMode === "unavailable" ? (
          <div style={{ padding: "56px 0 32px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12, lineHeight: 1 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }} aria-hidden="true">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
              </svg>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>Location unavailable</div>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.5 }}>
              {locationLabel === "Location blocked"
                ? "Enable location in your browser settings to find nearby restaurants."
                : "We couldn't determine your location. Search the map or scan a menu directly."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto 28px" }}>
              <button type="button" onClick={() => setLayout("map")} style={{ padding: "11px 18px", borderRadius: 14, background: "var(--c-card)", border: "1.5px solid var(--c-border)", color: "var(--c-text)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eb1700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
                Search the map
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 12 }}>Or scan any menu directly</div>
            <CameraScanButton style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              Scan a Menu
            </CameraScanButton>
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
            userLat={userLocation?.lat}
            userLng={userLocation?.lng}
            centerLat={searchCenter?.lat ?? userLocation?.lat}
            centerLng={searchCenter?.lng ?? userLocation?.lng}
            onSearchArea={(lat, lng) => setSearchCenter({ lat, lng })}
            isDark={isDark}
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
                  {searchCenter
                    ? "Best option in this area based on your allergies and menu data"
                    : "Based on your allergies, menu data, and nearby distance"}
                </div>
              </div>
              <div style={{ position: "relative" }}>
                <div style={{
                  position: "absolute", top: 12, left: 12, zIndex: 1,
                  background: "#eb1700", color: "#fff",
                  fontSize: 10, fontWeight: 800, padding: "3px 9px",
                  borderRadius: 999, letterSpacing: "0.04em", pointerEvents: "none",
                }}>
                  #1 Match
                </div>
                <RestaurantCard restaurant={filtered[0]} />
              </div>
            </div>

            {/* ── All Restaurants ─────────────────────────────────── */}
            {filtered.length > 1 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "20px 0 10px" }}>
                  {searchCenter ? "More in This Area" : "More Nearby"}
                </div>
                <div style={{ display: "grid", gap: 12 }}>
                  {filtered.slice(1).map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} />
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
