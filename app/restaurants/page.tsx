"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadProfileAllergens, profileToDetectorAllergens } from "@/lib/allergenProfile";
import { scoreRestaurant } from "@/lib/scoring";
import { locationProvider } from "@/lib/providers/locationProvider";
import { RestaurantCard } from "@/components/RestaurantCard";
import { FilterChips } from "@/components/FilterChips";
import { EmptyState } from "@/components/EmptyState";
import type { ScoredRestaurant } from "@/lib/types";

type SortOption = "distance" | "most-safe" | "least-avoid";

const SORT_CHIPS = [
  { value: "distance"   as SortOption, label: "Nearest" },
  { value: "most-safe"  as SortOption, label: "Most Safe" },
  { value: "least-avoid" as SortOption, label: "Fewest Avoid" },
];

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

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const coords = await locationProvider.getUserLocation();
        const lat = coords?.lat ?? 37.7749;
        const lng = coords?.lng ?? -122.4194;

        if (!cancelled) setLocationLabel(`${lat.toFixed(2)}°, ${lng.toFixed(2)}°`);

        const raw = await locationProvider.searchRestaurants(lat, lng, 10);

        // Score all restaurants against the user's saved allergy profile
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
          </div>

          {/* Search bar */}
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

          {/* Sort chips */}
          <div style={{ marginTop: 10 }}>
            <FilterChips chips={SORT_CHIPS} active={sort} onChange={setSort} />
          </div>
        </div>
      </div>

      {/* Restaurant list */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#9ca3af", fontSize: 14 }}>Finding restaurants near you…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🍽️"
            title="No restaurants found"
            subtitle={query ? `No results for "${query}". Try a different search.` : "No restaurants in your area yet."}
            action={
              <Link href="/" style={{ display: "inline-block", padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
                Back to home
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
