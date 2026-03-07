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

const SORT_CHIPS = [
  { value: "distance"    as SortOption, label: "Nearest" },
  { value: "most-safe"   as SortOption, label: "Most Safe" },
  { value: "least-avoid" as SortOption, label: "Fewest Avoid" },
];

const SESSION_KEY = "allegeats_live_restaurants";

export default function RestaurantsPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>Loading…</main>}>
      <RestaurantsContent />
    </Suspense>
  );
}

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";

  const [query, setQuery]                 = useState(queryParam);
  const [sort, setSort]                   = useState<SortOption>("distance");
  const [restaurants, setRestaurants]     = useState<ScoredRestaurant[]>([]);
  const [loading, setLoading]             = useState(true);
  const [locationLabel, setLocationLabel] = useState("Locating…");
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setUsingFallback(false);

      try {
        const coords = await locationProvider.getUserLocation();
        const lat = coords?.lat ?? 37.7749;
        const lng = coords?.lng ?? -122.4194;

        if (!cancelled) setLocationLabel(`${lat.toFixed(3)}°, ${lng.toFixed(3)}°`);

        let raw: Restaurant[];
        try {
          raw = await locationProvider.searchRestaurants(lat, lng, 5);
        } catch {
          // Overpass failed — fall back to mock data
          const fallback = new MockLocationProvider();
          raw = await fallback.searchRestaurants(lat, lng, 9999);
          if (!cancelled) setUsingFallback(true);
        }

        // Cache in sessionStorage so the detail page can look up live restaurants
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
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let list = q
      ? restaurants.filter((r) => r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q))
      : restaurants;

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
  }, [restaurants, query, sort]);

  return (
    <main style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,247,247,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }}>
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
              background: "#fff", outline: "none", color: "#111",
            }}
          />

          <div style={{ marginTop: 10 }}>
            <FilterChips chips={SORT_CHIPS} active={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* Restaurant list */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>
        {loading ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>📍</div>
            <div style={{ fontSize: 14, color: "#374151", fontWeight: 700, marginBottom: 4 }}>Finding restaurants near you…</div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>This may take a moment</div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No restaurants found"
            subtitle={query ? `No results for "${query}". Try a different search.` : "No restaurants found near you. Try expanding your search or scan a menu manually."}
            action={
              <Link href="/scan" style={{ display: "inline-block", padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Scan a Menu Manually
              </Link>
            }
          />
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 2 }}>
              {filtered.length} restaurant{filtered.length === 1 ? "" : "s"} near you
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
