"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadProfileAllergens, profileToDetectorAllergens } from "@/lib/allergenProfile";
import { scoreRestaurant } from "@/lib/scoring";
import { locationProvider, MockLocationProvider } from "@/lib/providers/locationProvider";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/EmptyState";
import type { Restaurant, ScoredRestaurant } from "@/lib/types";

type SortOption = "distance" | "most-safe" | "least-avoid";
type TypeFilter = "all" | "burgers" | "mexican" | "chicken" | "coffee" | "sandwiches";

const SORT_CHIPS = [
  { value: "distance"    as SortOption, label: "Nearest" },
  { value: "most-safe"   as SortOption, label: "Most Safe" },
  { value: "least-avoid" as SortOption, label: "Fewest Avoid" },
];

const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "burgers",    label: "Burgers" },
  { value: "mexican",    label: "Mexican" },
  { value: "chicken",    label: "Chicken" },
  { value: "coffee",     label: "Coffee & Café" },
  { value: "sandwiches", label: "Sandwiches" },
];

function matchesType(cuisine: string, name: string, type: TypeFilter): boolean {
  if (type === "all") return true;
  const c = cuisine.toLowerCase();
  const n = name.toLowerCase();
  if (type === "burgers")    return c.includes("burger") || n.includes("burger") || n.includes("mcdonald") || n.includes("shake shack") || n.includes("wendy") || n.includes("in-n-out") || n.includes("five guys");
  if (type === "mexican")    return c.includes("mexican") || c.includes("tex-mex") || n.includes("chipotle") || n.includes("taco bell") || n.includes("taco");
  if (type === "chicken")    return c.includes("chicken") || n.includes("chick-fil-a") || n.includes("chick fil") || n.includes("popeyes") || n.includes("kfc");
  if (type === "coffee")     return c.includes("café") || c.includes("cafe") || c.includes("coffee") || c.includes("bakery") || c.includes("donut") || n.includes("starbucks") || n.includes("dunkin") || n.includes("panera");
  if (type === "sandwiches") return c.includes("sandwich") || c.includes("sub") || n.includes("subway") || n.includes("jersey mike") || n.includes("jimmy john") || c.includes("pizza") || n.includes("domino");
  return false;
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

  const [query, setQuery]                 = useState(queryParam);
  const [sort, setSort]                   = useState<SortOption>("distance");
  const [typeFilter, setTypeFilter]       = useState<TypeFilter>("all");
  const [restaurants, setRestaurants]     = useState<ScoredRestaurant[]>([]);
  const [loading, setLoading]             = useState(true);
  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [usingFallback, setUsingFallback] = useState(false);
  const [radiusMiles, setRadiusMiles]     = useState(10);

  // Reverse-geocode coords → city/neighbourhood name
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
      setLoading(true);
      setUsingFallback(false);

      try {
        const position = await locationProvider.getUserLocation();
        const lat = position?.lat ?? 37.7749;
        const lng = position?.lng ?? -122.4194;

        // Reverse-geocode in parallel with restaurant search
        reverseGeocode(lat, lng).then((label) => {
          if (!cancelled) setLocationLabel(label);
        });

        let raw: Restaurant[];
        try {
          raw = await locationProvider.searchRestaurants(lat, lng, radiusMiles);
        } catch {
          const fallback = new MockLocationProvider();
          raw = await fallback.searchRestaurants(lat, lng, 9999);
          if (!cancelled) setUsingFallback(true);
        }

        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(raw));
        } catch { /* ignore */ }

        const profileAllergens = loadProfileAllergens();
        const userAllergens = profileToDetectorAllergens(profileAllergens);
        const scored = raw.map((r) => scoreRestaurant(r, userAllergens));

        if (!cancelled) setRestaurants(scored);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [radiusMiles]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = restaurants.filter((r) => matchesType(r.cuisine, r.name, typeFilter));
    if (q) list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q));

    switch (sort) {
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
  }, [restaurants, query, sort, typeFilter]);

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--c-hdr)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--c-border)", padding: "12px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textDecoration: "none" }}>← Back</Link>
            <span style={{ fontSize: 13, color: "#9ca3af" }}>·</span>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{locationLabel}</span>
            {usingFallback && (
              <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 700 }}>· Demo data</span>
            )}
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search restaurants…"
            style={{
              width: "100%", boxSizing: "border-box", padding: "12px 16px",
              border: "1px solid #e5e7eb", borderRadius: 14, fontSize: 15,
              background: "var(--c-card)", outline: "none", color: "var(--c-text)",
            }}
          />

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            <FilterChips chips={SORT_CHIPS} active={sort} onChange={setSort} />
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setTypeFilter(c.value)}
                  style={{
                    padding: "6px 13px", borderRadius: 999, flexShrink: 0,
                    border: `1.5px solid ${typeFilter === c.value ? "#111" : "var(--c-border)"}`,
                    background: typeFilter === c.value ? "var(--c-text)" : "var(--c-card)",
                    color: typeFilter === c.value ? "var(--c-bg)" : "var(--c-sub)",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant list */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>
        {loading ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "var(--c-text)", fontWeight: 700, marginBottom: 4 }}>Finding restaurants near you…</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>Searching within {radiusMiles} miles</div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No restaurants found"
            subtitle={query ? `No results for "${query}". Try a different search.` : `Nothing within ${radiusMiles} miles. Try searching wider.`}
            action={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
                {!query && (
                  <button
                    onClick={() => setRadiusMiles((r) => r + 10)}
                    style={{ padding: "12px 20px", background: "var(--c-text)", color: "var(--c-bg)", borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}
                  >
                    Search {radiusMiles + 10} miles
                  </button>
                )}
                <Link href="/scan" style={{ display: "inline-block", padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                  Scan a Menu Manually
                </Link>
              </div>
            }
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                {filtered.length} restaurant{filtered.length === 1 ? "" : "s"} within {radiusMiles} mi
              </div>
              <button
                onClick={() => setRadiusMiles((r) => r + 10)}
                style={{ fontSize: 12, fontWeight: 700, color: "#eb1700", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                Search wider →
              </button>
            </div>
            {filtered.map((r) => (
              <RestaurantCard key={r.id} restaurant={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
