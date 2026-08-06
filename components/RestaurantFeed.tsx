"use client";

import { RestaurantCard } from "@/components/RestaurantCard";
import { HeroRestaurantCard } from "@/components/HeroRestaurantCard";
import type { ScoredRestaurant } from "@/lib/types";

export function RestaurantFeed({
  nearbyFiltered,
  chainTemplates,
  searchCenter,
}: {
  nearbyFiltered: ScoredRestaurant[];
  chainTemplates: ScoredRestaurant[];
  searchCenter: { lat: number; lng: number; label?: string } | null;
}) {
  return (
    <>
      {/* Best Match hero */}
      {nearbyFiltered.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <HeroRestaurantCard restaurant={nearbyFiltered[0]} />
        </div>
      )}

      {/* Top Picks swipe rail (positions 2–5) */}
      {nearbyFiltered.length > 1 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
            {searchCenter ? "Also Nearby" : "Top Picks"}
          </h2>
          <div className="restaurant-rail" style={{
            display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
            gap: 10, margin: "0 -16px", padding: "2px 16px 10px",
            scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as never,
            overscrollBehavior: "contain auto",
          }}>
            {nearbyFiltered.slice(1, 5).map((r) => (
              <div key={r.id} style={{ flex: "0 0 72vw", maxWidth: 300, scrollSnapAlign: "start" }}>
                <RestaurantCard restaurant={r} variant="rail" />
              </div>
            ))}
            {nearbyFiltered.slice(1, 5).length === 4 && (
              <div style={{ flex: "0 0 8px", flexShrink: 0 }} />
            )}
          </div>
        </div>
      )}

      {/* More Nearby compact list (position 6+) */}
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

      {/* Chain menus — always shown */}
      {chainTemplates.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
            Popular Chain Menus
          </h2>
          <div className="restaurant-rail" style={{
            display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
            gap: 10, margin: "0 -16px", padding: "2px 16px 10px",
            scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as never,
            overscrollBehavior: "contain auto",
          }}>
            {chainTemplates.map((r) => (
              <div key={r.id} style={{ flex: "0 0 72vw", maxWidth: 300, scrollSnapAlign: "start" }}>
                <RestaurantCard restaurant={r} variant="rail" />
              </div>
            ))}
            <div style={{ flex: "0 0 8px", flexShrink: 0 }} />
          </div>
        </div>
      )}
    </>
  );
}
