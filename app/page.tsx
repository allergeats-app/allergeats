"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { getRecentlyViewed } from "@/lib/recentlyViewed";
import type { RecentView } from "@/lib/recentlyViewed";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { useAllergenProfile } from "@/lib/hooks/useAllergenProfile";
import { useHomeData } from "@/lib/hooks/useHomeData";
import { scoreRestaurant, bestMatchScore } from "@/lib/scoring";
import { RestaurantsHeader } from "@/components/RestaurantsHeader";
import { RestaurantsFilterDrawer } from "@/components/RestaurantsFilterDrawer";
import { LocationPickerSheet } from "@/components/LocationPickerSheet";
import { CuisineChipRow } from "@/components/CuisineChipRow";
import { LocationBlockedBanner } from "@/components/LocationBlockedBanner";
import { RecentlyViewedRail } from "@/components/RecentlyViewedRail";
import { RestaurantFeed } from "@/components/RestaurantFeed";
import dynamic from "next/dynamic";
const RestaurantMap = dynamic(() => import("@/components/RestaurantMap").then((m) => m.RestaurantMap), { ssr: false });
import { BottomNav } from "@/components/BottomNav";
import { SmartEmptyState } from "@/components/SmartEmptyState";
import { SkeletonCard } from "@/components/SkeletonCard";
import { AllergenProfileCard } from "@/components/AllergenProfileCard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingModal } from "@/components/OnboardingModal";
import type { AllergenId } from "@/lib/types";
import type { SortOption, LayoutOption, TypeFilter } from "./restaurants/types";
import { trackEvent } from "@/lib/analytics";

function matchesType(r: { tags?: import("@/lib/types").RestaurantTag[] }, type: TypeFilter): boolean {
  if (type === "all") return true;
  return r.tags?.includes(type) ?? false;
}

function HomePageSkeleton() {
  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)" }}>
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
  const [query, setQuery]             = useState("");
  const [sort, setSort]               = useState<SortOption>("best-match");
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>("all");
  const [onlySaved, setOnlySaved]     = useState(false);
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [showFilterDrawer, setShowFilterDrawer]     = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [layout, setLayout]           = useState<LayoutOption>("list");
  const [recentViewed, setRecentViewed] = useState<RecentView[]>([]);

  const { isDark } = useTheme();
  const { user, firstName, severities } = useAuth();
  const { isFavorite } = useFavorites();
  const { allergens: localAllergens, saveState, setAllergens: setLocalAllergens } = useAllergenProfile();

  const {
    rawRestaurants, loading,
    locationLabel, locationMode, resultsSource,
    userLocation, searchCenter,
    locationDenied,
    handleSelectLocation, handleUseCurrentLocation, clearSearchCenter, onMapSearchArea,
  } = useHomeData(radiusMiles);

  useEffect(() => { setRecentViewed(getRecentlyViewed().slice(0, 8)); }, []);

  const activeFilterCount = [
    sort !== "best-match",
    typeFilter !== "all",
    onlySaved,
    radiusMiles !== 10,
  ].filter(Boolean).length;

  const restaurants = useMemo(() =>
    rawRestaurants.map((r) => scoreRestaurant(r, localAllergens, severities)),
    [rawRestaurants, localAllergens, severities]
  );

  const handleAllergenChange = useCallback((next: AllergenId[]) => {
    trackEvent("filters_allergens_changed", { count: next.length });
    setLocalAllergens(next);
  }, [setLocalAllergens]);

  const resetFilters = useCallback(() => {
    setSort("best-match");
    setTypeFilter("all");
    setOnlySaved(false);
    setRadiusMiles(10);
    clearSearchCenter();
  }, [clearSearchCenter]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = restaurants.filter((r) => matchesType(r, typeFilter));
    if (onlySaved)        list = list.filter((r) => isFavorite(r.id));
    if (layout !== "map") list = list.filter((r) => r.menuItems.length > 0);
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));

    switch (sort) {
      case "best-match":
        list = [...list].sort((a, b) => bestMatchScore(b) - bestMatchScore(a));
        break;
      case "distance":
        list = [...list].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
        break;
      case "most-safe":
        list = [...list].sort((a, b) => {
          const ratioA = a.summary.total > 0 ? a.summary.likelySafe / a.summary.total : 0;
          const ratioB = b.summary.total > 0 ? b.summary.likelySafe / b.summary.total : 0;
          return ratioB - ratioA || b.summary.total - a.summary.total;
        });
        break;
      case "least-avoid":
        list = [...list].sort((a, b) => {
          const ratioA = a.summary.total > 0 ? a.summary.avoid / a.summary.total : 1;
          const ratioB = b.summary.total > 0 ? b.summary.avoid / b.summary.total : 1;
          return ratioA - ratioB || (a.distance ?? 99) - (b.distance ?? 99);
        });
        break;
      case "coverage":
        list = [...list].sort((a, b) => b.summary.total - a.summary.total);
        break;
    }
    return list;
  }, [restaurants, query, sort, typeFilter, onlySaved, isFavorite, layout]);

  const nearbyFiltered = useMemo(() => filtered.filter((r) => !r.menuIsGenericChainTemplate || r.address), [filtered]);
  const chainTemplates  = useMemo(() => filtered.filter((r) =>  r.menuIsGenericChainTemplate && !r.address), [filtered]);

  return (
    <main className={layout !== "map" ? "safe-pb" : undefined} style={{ minHeight: "100dvh", background: "var(--c-bg)" }}>
      <h1 className="sr-only">AllergEats — Find nearby restaurants safe for your food allergies</h1>

      <RestaurantsHeader
        locationLabel={locationLabel}
        locationMode={locationMode}
        resultsSource={resultsSource}
        onLocationPress={() => setShowLocationPicker(true)}
      />

      {layout !== "map" && <div style={{ maxWidth: 600, margin: "0 auto", padding: "12px 16px 0" }}>
        {user && firstName && (
          <div style={{ marginBottom: 10, fontSize: 22, fontWeight: 900, color: "var(--c-text)" }}>
            Welcome, {firstName}
          </div>
        )}
        <AllergenProfileCard
          allergens={localAllergens}
          saveState={saveState}
          isSignedIn={!!user}
          onChange={handleAllergenChange}
        />
        <CuisineChipRow typeFilter={typeFilter} setTypeFilter={setTypeFilter} />
      </div>}

      <RestaurantsFilterDrawer
        open={showFilterDrawer}
        onClose={() => setShowFilterDrawer(false)}
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

      <div className={`rp-results rp-results--${layout}`}>
        {loading ? (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <div className="skeleton" style={{ width: 13, height: 13, borderRadius: 999 }} />
                <div className="skeleton" style={{ width: 140, height: 10 }} />
              </div>
              <SkeletonCard featured />
            </div>
            <div className="skeleton" style={{ height: 10, width: 80, margin: "20px 0 10px" }} />
            <div style={{ display: "grid", gap: 12 }}>
              {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
            </div>
          </>
        ) : filtered.length === 0 && locationMode === "unavailable" ? (
          <div style={{ padding: "56px 0 32px", textAlign: "center" }}>
            <div style={{ lineHeight: 1, marginBottom: 12 }}>
              <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
              </svg>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", margin: "0 0 6px" }}>Location unavailable</h2>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.5 }}>
              {locationLabel === "Location blocked"
                ? "Enable location in your browser settings to find nearby restaurants."
                : "We couldn't determine your location. Search the map to find restaurants near you."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto 28px" }}>
              <button type="button" onClick={() => setLayout("map")} style={{ padding: "11px 18px", borderRadius: 14, background: "var(--c-card)", border: "1.5px solid var(--c-border)", color: "var(--c-text)", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                Search the map
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <SmartEmptyState
            query={query}
            radiusMiles={radiusMiles}
            onlySaved={onlySaved}
            typeFilter={typeFilter}
            onClearQuery={() => setQuery("")}
            onClearSaved={() => setOnlySaved(false)}
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
            onSearchArea={onMapSearchArea}
            isDark={isDark}
          />
        ) : (
          <ErrorBoundary fallback={
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--c-sub)", fontSize: 14 }}>
              Couldn't load restaurants. Please reload the page.
            </div>
          }>
            <>
              {locationMode === "unavailable" && (
                <LocationBlockedBanner locationDenied={locationDenied} onRetry={handleUseCurrentLocation} />
              )}

              <RecentlyViewedRail recentViewed={recentViewed} isDark={isDark} />

              {localAllergens.length === 0 && filtered.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                  padding: "10px 14px", marginBottom: 16,
                  borderRadius: 12,
                  background: isDark ? "rgba(245,158,11,0.12)" : "rgba(254,243,199,1)",
                  border: "1.5px solid rgba(245,158,11,0.4)",
                }}>
                  <span style={{ fontSize: 13, color: isDark ? "#fbbf24" : "#92400e", fontWeight: 600, lineHeight: 1.4 }}>
                    Set your allergens to see accurate safety scores.
                  </span>
                  <button
                    type="button"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: "none", background: isDark ? "rgba(245,158,11,0.25)" : "rgba(245,158,11,0.2)", color: isDark ? "#fbbf24" : "#92400e", fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                  >
                    Set up profile →
                  </button>
                </div>
              )}

              <RestaurantFeed
                nearbyFiltered={nearbyFiltered}
                chainTemplates={chainTemplates}
                searchCenter={searchCenter}
              />
            </>
          </ErrorBoundary>
        )}
      </div>

      <BottomNav
        onMapPress={() => setLayout(layout === "map" ? "list" : "map")}
        onHomePress={layout === "map" ? () => setLayout("list") : undefined}
        query={query}
        setQuery={setQuery}
        isSignedIn={!!user}
      />

      <OnboardingModal />
    </main>
  );
}
