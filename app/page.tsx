"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { useAllergenProfile } from "@/lib/hooks/useAllergenProfile";
import { scoreRestaurant, bestMatchScore } from "@/lib/scoring";
import { locationProvider, MockLocationProvider, checkLocationPermission, loadLastLocation } from "@/lib/providers/locationProvider";
import type { Coordinates } from "@/lib/providers/locationProvider";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { RestaurantCard } from "@/components/RestaurantCard";
import { HeroRestaurantCard } from "@/components/HeroRestaurantCard";
import { RestaurantMap } from "@/components/RestaurantMap";
import { CameraScanButton } from "@/components/CameraScanButton";
import { RestaurantsHeader } from "@/components/RestaurantsHeader";
import { RestaurantsFilterDrawer } from "@/components/RestaurantsFilterDrawer";
import { LocationPickerSheet } from "@/components/LocationPickerSheet";
import { BottomNav } from "@/components/BottomNav";
import { SmartEmptyState } from "@/components/SmartEmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { AllergenProfileCard } from "@/components/AllergenProfileCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import type { Restaurant } from "@/lib/types";
import type { AllergenId } from "@/lib/types";
import type { SortOption, LayoutOption, TypeFilter } from "./restaurants/types";
import { trackEvent } from "@/lib/analytics";

const SESSION_KEY = "allegeats_live_restaurants";

/**
 * Append chain menu templates for any chain not already in the live results.
 * Templates are stripped of hardcoded distances/addresses — they have no real
 * location, so they should never appear to be "0.4 mi" from the user.
 * menuIsGenericChainTemplate: true flags them for separate UI treatment.
 */
function withAllChains(list: Restaurant[]): Restaurant[] {
  // Strip stale chain-template entries from cached lists (they may carry hardcoded
  // distance: 0.4 from a previous session). Real live entries always have an address
  // or were matched from a live source, so they're kept.
  const liveOnly = list.filter((r) => !r.menuIsGenericChainTemplate || r.address);

  const names = new Set(liveOnly.filter((r) => r.menuItems.length > 0).map((r) => r.name.toLowerCase()));
  const missing = MOCK_RESTAURANTS
    .filter((m) => !names.has(m.name.toLowerCase()))
    .map((m) => ({
      ...m,
      distance:                  undefined as number | undefined,
      address:                   undefined as string | undefined,
      menuIsGenericChainTemplate: true,
    }));
  return missing.length ? [...liveOnly, ...missing] : liveOnly;
}

function matchesType(r: { tags?: import("@/lib/types").RestaurantTag[] }, type: TypeFilter): boolean {
  if (type === "all") return true;
  return r.tags?.includes(type) ?? false;
}

function HomePageSkeleton() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)" }}>
      {/* Fake header bar */}
      <div style={{
        height: "max(56px, calc(48px + env(safe-area-inset-top)))",
        background: "var(--c-hdr)",
        borderBottom: "1px solid var(--c-border)",
      }} />
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>
        <div style={{ display: "grid", gap: 16 }}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonCard key={i} featured />
          ))}
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
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
  const { user, firstName, severities } = useAuth();
  const { isFavorite } = useFavorites();
  const { allergens: localAllergens, saveState, setAllergens: setLocalAllergens } = useAllergenProfile();

  // Hydrate sessionStorage cache after mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) {
        const parsed: unknown = JSON.parse(cached);
        if (Array.isArray(parsed)) setRawRestaurants(withAllChains(parsed as Restaurant[]));
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
    // Prevents the cached-position search result from overwriting fresh GPS results
    // if GPS resolves first (the two searches run concurrently).
    let freshResultsCommitted = false;

    async function load() {
      // Do NOT unconditionally setLoading(true) here — the closure captures rawRestaurants
      // from the initial render (always []), so this would override the sessionStorage
      // hydration's setLoading(false) and cause a skeleton flash even when cache exists.
      // Callers that need loading=true set it before triggering this effect.
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

          // Fast-path: show cached location + results immediately while GPS resolves.
          // This prevents a blank screen on first load when GPS takes 1–3 s.
          const cachedPos = loadLastLocation();
          if (cachedPos && !cancelled) {
            setUserLocation({ ...cachedPos, source: "cached" });
            setLocationMode("cached");
            reverseGeocode(cachedPos.lat, cachedPos.lng)
              .then((name) => { if (!cancelled) setLocationLabel(name); });
            // Kick off a restaurant search with the cached position — hits sessionStorage
            // or Overpass cache so it returns almost immediately.
            locationProvider
              .searchRestaurants(cachedPos.lat, cachedPos.lng, radiusMiles, cachedPos.accuracy)
              .then((cachedRaw) => {
                // Guard: don't overwrite fresh GPS results if they already arrived
                if (!cancelled && !freshResultsCommitted) {
                  setRawRestaurants(withAllChains(cachedRaw));
                  setLoading(false);
                }
              })
              .catch(() => {});
          }

          // Fetch fresh GPS (parallel GPS+network, resolves in ~1–3 s).
          // Runs concurrently with the cached search above.
          const position = await locationProvider.getUserLocation();

          if (!position) {
            // Both failed and no valid cache — nothing we can show
            if (!cancelled && !cachedPos) {
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
          freshResultsCommitted = true; // prevent stale cached-pos results from overwriting these
          raw = withAllChains(raw);
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
    rawRestaurants.map((r) => scoreRestaurant(r, localAllergens, severities)),
    [rawRestaurants, localAllergens, severities]
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

  // Split live-location results (real address + real distance) from chain-only templates
  const nearbyFiltered  = useMemo(() => filtered.filter((r) => !r.menuIsGenericChainTemplate || r.address), [filtered]);
  const chainTemplates  = useMemo(() => filtered.filter((r) =>  r.menuIsGenericChainTemplate && !r.address), [filtered]);

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
    <main className={layout !== "map" ? "safe-pb" : undefined} style={{ minHeight: "100dvh", background: "var(--c-bg)" }}>
      <h1 className="sr-only">AllergEats — Find nearby restaurants safe for your food allergies</h1>

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
              <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }} >
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 6, margin: "0 0 6px" }}>Location unavailable</h2>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.5 }}>
              {locationLabel === "Location blocked"
                ? "Enable location in your browser settings to find nearby restaurants."
                : "We couldn't determine your location. Search the map or scan a menu directly."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto 28px" }}>
              <button type="button" onClick={() => setLayout("map")} style={{ padding: "11px 18px", borderRadius: 14, background: "var(--c-card)", border: "1.5px solid var(--c-border)", color: "var(--c-text)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1fbdcc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" ><polyline points="9 18 15 12 9 6"/></svg>
                Search the map
              </button>
            </div>
            <div style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 12 }}>Or scan any menu directly</div>
            <CameraScanButton style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "12px 22px", background: "#1fbdcc", color: "var(--c-brand-fg)", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" ><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
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
          <ErrorBoundary fallback={
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--c-sub)", fontSize: 14 }}>
              Couldn't load restaurants. Please reload the page.
            </div>
          }>
          <>
            {/* ── Best Match for You (hero) ───────────────────────── */}
            {nearbyFiltered.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <HeroRestaurantCard restaurant={nearbyFiltered[0]} />
              </div>
            )}

            {/* ── Top Picks swipe rail (positions 2–5) ────────────── */}
            {nearbyFiltered.length > 1 && (
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                  {searchCenter ? "Also Nearby" : "Top Picks"}
                </h2>
                <div className="restaurant-rail" style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  gap: 10,
                  margin: "0 -16px",
                  padding: "2px 16px 10px",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch" as never,
                }}>
                  {nearbyFiltered.slice(1, 5).map((r) => (
                    <div key={r.id} style={{
                      flex: "0 0 72vw",
                      maxWidth: 300,
                      scrollSnapAlign: "start",
                    }}>
                      <RestaurantCard restaurant={r} variant="rail" />
                    </div>
                  ))}
                  {nearbyFiltered.slice(1, 5).length === 4 && (
                    <div style={{ flex: "0 0 8px", flexShrink: 0 }} />
                  )}
                </div>
              </div>
            )}

            {/* ── More Nearby compact list (position 6+) ──────────── */}
            {nearbyFiltered.length > 5 && (
              <>
                <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
                  {searchCenter ? "More in This Area" : "More Nearby"}
                </h2>
                <div style={{ display: "grid", gap: 10 }}>
                  {nearbyFiltered.slice(5).map((r) => (
                    <RestaurantCard key={r.id} restaurant={r} variant="compact" />
                  ))}
                </div>
              </>
            )}

            {/* ── Chain menus (no confirmed nearby location) ───────── */}
            {chainTemplates.length > 0 && (
              <div style={{ marginTop: nearbyFiltered.length > 0 ? 28 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>
                    Browse Popular Menus
                  </h2>
                </div>
                <div style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 10 }}>
                  No Nearby Results — Menus Only
                </div>
                <div className="restaurant-rail" style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  gap: 10,
                  margin: "0 -16px",
                  padding: "2px 16px 10px",
                  scrollbarWidth: "none",
                  WebkitOverflowScrolling: "touch" as never,
                }}>
                  {chainTemplates.map((r) => (
                    <div key={r.id} style={{
                      flex: "0 0 72vw",
                      maxWidth: 300,
                      scrollSnapAlign: "start",
                    }}>
                      <RestaurantCard restaurant={r} variant="rail" />
                    </div>
                  ))}
                  <div style={{ flex: "0 0 8px", flexShrink: 0 }} />
                </div>
              </div>
            )}
          </>
          </ErrorBoundary>
        )}
      </div>

      <BottomNav
        onMapPress={() => setLayout(layout === "map" ? "list" : "map")}
        onSearchPress={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
      />

    </main>
  );
}
