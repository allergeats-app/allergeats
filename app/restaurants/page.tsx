"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useFavorites } from "@/lib/favoritesContext";
import { loadProfileAllergens, saveProfileAllergens } from "@/lib/allergenProfile";
import { scoreRestaurant } from "@/lib/scoring";
import { locationProvider, MockLocationProvider } from "@/lib/providers/locationProvider";
import { RestaurantCard } from "@/components/RestaurantCard";
import { RestaurantMap } from "@/components/RestaurantMap";
import { EmptyState } from "@/components/EmptyState";
import { CameraScanButton } from "@/components/CameraScanButton";
import { RestaurantsHeader } from "@/components/RestaurantsHeader";
import { RestaurantsFilterDrawer } from "@/components/RestaurantsFilterDrawer";
import type { Restaurant } from "@/lib/types";
import type { AllergenId } from "@/lib/types";
import type { SortOption, LayoutOption, TypeFilter } from "./types";

const SESSION_KEY = "allegeats_live_restaurants";

function matchesType(r: { tags?: import("@/lib/types").RestaurantTag[] }, type: TypeFilter): boolean {
  if (type === "all") return true;
  return r.tags?.includes(type) ?? false;
}

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

  const [query, setQuery]               = useState(searchParams.get("q") ?? "");
  const [sort, setSort]                 = useState<SortOption>("best-match");
  const [typeFilter, setTypeFilter]     = useState<TypeFilter>("all");
  const [onlyWithMenu, setOnlyWithMenu] = useState(true);
  const [onlySaved, setOnlySaved]       = useState(false);
  const [radiusMiles, setRadiusMiles]   = useState(10);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Safe initialization — no browser APIs during render
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

  // Auth allergens take priority over localStorage
  useEffect(() => {
    if (!authLoading && authAllergens.length > 0) setLocalAllergens(authAllergens);
  }, [authLoading, authAllergens]);

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

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>

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
      />

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
