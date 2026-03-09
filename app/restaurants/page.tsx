"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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

type SortOption = "best-match" | "distance" | "most-safe" | "least-avoid";
type LayoutOption = "list" | "grid" | "map";
type TypeFilter = "all" | "burgers" | "mexican" | "chicken" | "coffee" | "sandwiches";

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

function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 12 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

const SESSION_KEY = "allegeats_live_restaurants";

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>Loading…</main>}>
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
  const onlyWithMenu = true;
  const [onlySaved, setOnlySaved]       = useState(false);
  const [radiusMiles, setRadiusMiles]   = useState(10);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  const [rawRestaurants, setRawRestaurants] = useState<Restaurant[]>(() => {
    try {
      const cached = sessionStorage.getItem(SESSION_KEY);
      if (cached) return JSON.parse(cached) as Restaurant[];
    } catch { /* ignore */ }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    try { return !sessionStorage.getItem(SESSION_KEY); } catch { return true; }
  });

  const [locationLabel, setLocationLabel]   = useState("Locating…");
  const [usingFallback, setUsingFallback]   = useState(false);
  const [localAllergens, setLocalAllergens] = useState<AllergenId[]>(() => loadProfileAllergens());
  const [layout, setLayout]                 = useState<LayoutOption>("list");
  const [userCoords, setUserCoords]         = useState<{ lat: number; lng: number } | null>(null);
  const [searchCenter, setSearchCenter]     = useState<{ lat: number; lng: number } | null>(null);
  const [windowWidth, setWindowWidth]       = useState(() => typeof window !== "undefined" ? window.innerWidth : 768);

  const { allergens: authAllergens, loading: authLoading } = useAuth();
  const { isFavorite } = useFavorites();

  // Active filter badge count — non-default selections
  const activeFilterCount = [
    localAllergens.length > 0,
    sort !== "best-match",
    typeFilter !== "all",
    onlySaved,
    radiusMiles !== 10,
  ].filter(Boolean).length;

  useEffect(() => {
    function onResize() { setWindowWidth(window.innerWidth); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Sync from auth context once it hydrates (takes priority over localStorage)
  useEffect(() => {
    if (!authLoading && authAllergens.length > 0) {
      setLocalAllergens(authAllergens);
    }
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
        let lat: number;
        let lng: number;

        if (searchCenter) {
          lat = searchCenter.lat;
          lng = searchCenter.lng;
          reverseGeocode(lat, lng).then((label) => {
            if (!cancelled) setLocationLabel(label);
          });
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
            reverseGeocode(lat, lng).then((label) => {
              if (!cancelled) setLocationLabel(label);
            });
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
    setRadiusMiles(10);
    setSearchCenter(null);
    setLocalAllergens([]);
    saveProfileAllergens([]);
  }

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = restaurants.filter((r) => matchesType(r, typeFilter));
    if (onlySaved) list = list.filter((r) => isFavorite(r.id));
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
      case "distance":
        list = [...list].sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
        break;
      case "most-safe":
        list = [...list].sort((a, b) => b.summary.likelySafe - a.summary.likelySafe);
        break;
      case "least-avoid":
        list = [...list].sort((a, b) => a.summary.avoid - b.summary.avoid);
        break;
    }
    return list;
  }, [restaurants, query, sort, typeFilter, onlyWithMenu, onlySaved, isFavorite]);

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>

      {/* ── Sticky header ────────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--c-border)",
        padding: "10px 16px 12px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 8 }}>

          {/* Row 1 — centered logo + location */}
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 32 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <Image src="/logo.png" alt="AllergEats" width={160} height={40} style={{ width: "auto", height: 32 }} priority />
            </Link>
            <span style={{ position: "absolute", right: 0, fontSize: 11, color: "#9ca3af", maxWidth: "35%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
              {locationLabel}
              {usingFallback && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · Sample</span>}
            </span>
          </div>

          {/* Row 2 — search + filter button */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search restaurants…"
              style={{
                flex: 1, minWidth: 0, boxSizing: "border-box",
                padding: "11px 16px",
                border: "1px solid var(--c-border)", borderRadius: 14, fontSize: 15,
                background: "var(--c-card)", outline: "none", color: "var(--c-text)",
              }}
            />
            <button
              onClick={() => setShowFilterDrawer((v) => !v)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 5,
                padding: "0 14px", borderRadius: 14, height: 46,
                background: activeFilterCount > 0 ? "#eb1700" : "var(--c-card)",
                border: `1.5px solid ${activeFilterCount > 0 ? "#eb1700" : "var(--c-border)"}`,
                color: activeFilterCount > 0 ? "#fff" : "var(--c-text)",
                fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Filters{activeFilterCount > 0 ? ` · ${activeFilterCount}` : ""}
            </button>
          </div>

          {/* Row 3 — count · layout toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>
              {loading
                ? "Finding restaurants…"
                : `${filtered.length} restaurant${filtered.length === 1 ? "" : "s"} · ${radiusMiles} mi`}
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              {(["list", "grid", "map"] as LayoutOption[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  title={l === "list" ? "List view" : l === "grid" ? "Grid view" : "Map view"}
                  style={{
                    width: 28, height: 28, borderRadius: 8, border: "1.5px solid",
                    borderColor: layout === l ? "#eb1700" : "var(--c-border)",
                    background: layout === l ? "#eb1700" : "var(--c-card)",
                    color: layout === l ? "#fff" : "var(--c-sub)",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
                  }}
                >
                  {l === "list" ? "☰" : l === "grid" ? "⊞" : "🗺"}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Filter drawer ─────────────────────────────────────────────── */}
      {showFilterDrawer && (
        <div
          onClick={() => setShowFilterDrawer(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 100, backdropFilter: "blur(2px)",
          }}
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
          background: "var(--c-card)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          transform: showFilterDrawer ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
          maxHeight: "84vh", overflowY: "auto",
          padding: "0 20px 40px",
        }}
      >
        {/* Drawer handle bar */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, marginBottom: 2 }}>
          <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--c-border)" }} />
        </div>

        {/* Drawer header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 0 16px",
          position: "sticky", top: 0, background: "var(--c-card)", zIndex: 1,
        }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)" }}>Filters</span>
          <button
            onClick={() => setShowFilterDrawer(false)}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--c-sub)", padding: 4, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Allergies */}
        <DrawerSection title="Your allergies">
          <AllergySelector selected={localAllergens} onChange={handleAllergenChange} />
        </DrawerSection>

        {/* Sort */}
        <DrawerSection title="Sort by">
          <FilterChips chips={SORT_CHIPS} active={sort} onChange={setSort} />
        </DrawerSection>

        {/* Cuisine */}
        <DrawerSection title="Cuisine">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TYPE_CHIPS.map((c) => (
              <button
                key={c.value}
                onClick={() => setTypeFilter(c.value)}
                style={{
                  padding: "7px 14px", borderRadius: 999,
                  border: `1.5px solid ${typeFilter === c.value ? "#111" : "var(--c-border)"}`,
                  background: typeFilter === c.value ? "var(--c-text)" : "transparent",
                  color: typeFilter === c.value ? "var(--c-bg)" : "var(--c-sub)",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </DrawerSection>

        {/* Radius */}
        <DrawerSection title="Search radius">
          <div style={{ display: "flex", gap: 8 }}>
            {[5, 10, 25, 50].map((mi) => (
              <button
                key={mi}
                onClick={() => { setSearchCenter(null); setRadiusMiles(mi); }}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 12,
                  border: `1.5px solid ${radiusMiles === mi ? "#eb1700" : "var(--c-border)"}`,
                  background: radiusMiles === mi ? "#fef2f2" : "transparent",
                  color: radiusMiles === mi ? "#eb1700" : "var(--c-sub)",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                }}
              >
                {mi} mi
              </button>
            ))}
          </div>
        </DrawerSection>

        {/* More filters */}
        <DrawerSection title="More filters">
          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={onlySaved}
                onChange={(e) => setOnlySaved(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "#eb1700", cursor: "pointer", flexShrink: 0 }}
              />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>Saved restaurants only</div>
                <div style={{ fontSize: 11, color: "var(--c-sub)", marginTop: 1 }}>Show only places you&apos;ve hearted</div>
              </div>
            </label>
          </div>
        </DrawerSection>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            style={{
              width: "100%", padding: "13px 0",
              background: "none", border: "1.5px solid var(--c-border)",
              borderRadius: 12, fontSize: 13, fontWeight: 700,
              color: "#6b7280", cursor: "pointer",
            }}
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* ── Restaurant list ───────────────────────────────────────────── */}
      <div style={{
        maxWidth: layout === "map" ? "100%" : layout === "grid" ? (windowWidth < 640 ? 600 : 960) : 600,
        margin: "0 auto", padding: "16px 16px 0",
      }}>
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
          <div style={{
            display: "grid", gap: 12,
            gridTemplateColumns: layout === "grid"
              ? windowWidth < 480 ? "repeat(2, 1fr)"
              : windowWidth < 768 ? "repeat(2, 1fr)"
              : "repeat(3, 1fr)"
              : "1fr",
          }}>
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} compact={layout === "grid"} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
