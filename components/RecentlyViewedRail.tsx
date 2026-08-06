"use client";

import Link from "next/link";
import type { RecentView } from "@/lib/recentlyViewed";

export function RecentlyViewedRail({
  recentViewed,
  isDark,
}: {
  recentViewed: RecentView[];
  isDark: boolean;
}) {
  if (recentViewed.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 10px" }}>
        Recently Viewed
      </h2>
      <div className="restaurant-rail" style={{
        display: "flex", overflowX: "auto", scrollSnapType: "x mandatory",
        gap: 8, margin: "0 -16px", padding: "2px 16px 8px",
        scrollbarWidth: "none", WebkitOverflowScrolling: "touch" as never,
        overscrollBehavior: "contain auto",
      }}>
        {recentViewed.map((r) => (
          <Link key={r.id} href={`/restaurants/${r.id}`} style={{
            flex: "0 0 140px", scrollSnapAlign: "start", textDecoration: "none",
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            padding: "12px 14px", borderRadius: 16, minHeight: 72,
            background: isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.9)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}`,
            boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {r.name}
            </div>
            {r.cuisine && (
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--c-brand)", marginTop: 6, textTransform: "capitalize" }}>
                {r.cuisine}
              </div>
            )}
          </Link>
        ))}
        <div style={{ flex: "0 0 8px" }} />
      </div>
    </div>
  );
}
