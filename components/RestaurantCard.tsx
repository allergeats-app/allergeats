"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { coverageTier, coverageTierLabel, coverageTierColor } from "@/lib/scoring";
import { fitLevel, fitBadge, fitExplanation } from "@/lib/fitLevel";
import type { ScoredRestaurant } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { coverGradient } from "@/lib/coverGradient";

type Props = { restaurant: ScoredRestaurant };


export function RestaurantCard({ restaurant: r }: Props) {
  const { isDark } = useTheme();
  const { summary } = r;
  const safePercent  = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const safeItemNames = r.scoredItems.filter((i) => i.risk === "likely-safe").slice(0, 3).map((i) => i.name);
  const askPercent   = summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0;
  const cover = { bg: coverGradient(r.cuisine, r.name) };
  const level = fitLevel(safePercent, summary.avoid, summary.ask, summary.total);
  const badge = fitBadge(level);
  const explanation = fitExplanation(level, summary.avoid, summary.ask, summary.likelySafe);
  const tier = coverageTier(summary.total);
  const tierLabel = coverageTierLabel(summary.total);
  const tierColor = coverageTierColor(tier);

  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(r.id);
  const photoSrc = !photoFailed
    ? r.googlePlaceId
      ? `/api/places-photo?placeId=${encodeURIComponent(r.googlePlaceId)}`
      : r.lat != null && r.lng != null
        ? `/api/places-photo?name=${encodeURIComponent(r.name)}&lat=${r.lat}&lng=${r.lng}`
        : null
    : null;

  return (
    <Link href={`/restaurants/${r.id}`} onClick={() => trackEvent("restaurant_clicked", { id: r.id, name: r.name, fit: level, coverage: tier })} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.1s",
      }}>
        {/* Cover image area — cuisine gradient is always the base; photo fades in on load */}
        <div style={{ height: 110, background: cover.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {photoSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={r.name}
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoFailed(true)}
              loading="lazy"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: photoLoaded ? 1 : 0, transition: "opacity 0.3s ease" }}
            />
          )}
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: badge.bg, color: badge.color,
            padding: "5px 10px", borderRadius: 999,
            fontSize: 12, fontWeight: 800,
            textAlign: "center", lineHeight: 1.2,
          }}>
            {level}
            {summary.total >= 5 && (
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>
                {Math.round(safePercent)}% safe
              </div>
            )}
          </div>
          {r.distance != null && (
            <div style={{
              position: "absolute", bottom: 10, left: 12,
              background: "rgba(0,0,0,0.45)", color: "#fff",
              padding: "4px 9px", borderRadius: 999,
              fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)",
            }}>
              {r.distance} mi
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); trackEvent(favorited ? "place_unsaved" : "place_saved", { id: r.id, name: r.name, fit: level, coverage: tier }); toggleFavorite(r.id, { name: r.name, cuisine: r.cuisine }); }}
            title={favorited ? "Remove from saved" : "Save restaurant"}
            style={{
              position: "absolute", bottom: 8, right: 8,
              background: favorited ? "#eb1700" : "rgba(0,0,0,0.38)",
              border: "none", borderRadius: 999,
              width: 44, height: 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(4px)",
              fontSize: 18, lineHeight: 1,
              transition: "background 0.15s",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={favorited ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Card body */}
        <div style={{ padding: "16px 18px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 19, color: "var(--c-text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 3 }}>{r.cuisine}</div>
              {r.address && (
                <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.address}
                </div>
              )}
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#eb1700", flexShrink: 0, paddingTop: 2 }}>See menu fit →</div>
          </div>

          <div style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 12, lineHeight: 1.5 }}>
            {explanation}
          </div>

          {summary.total > 0 ? (
            <div>
              <div style={{ height: 5, borderRadius: 999, background: "var(--c-muted)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${safePercent}%`, background: "#22c55e" }} />
                <div style={{ width: `${askPercent}%`, background: "#f59e0b" }} />
                <div style={{ width: `${avoidPercent}%`, background: "#ef4444" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <Stat count={summary.likelySafe} label="Safe"  color="#16a34a" />
                  <Stat count={summary.ask}        label="Ask"   color="#d97706" />
                  <Stat count={summary.avoid}      label="Avoid" color="#dc2626" />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 999, background: tierColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{tierLabel}</span>
                </div>
              </div>
              {safeItemNames.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {safeItemNames.map((name) => (
                    <span key={name} style={{
                      fontSize: 13, fontWeight: 700,
                      color: isDark ? "#86efac" : "#15803d",
                      background: isDark ? "#0a2414" : "#f0fdf4",
                      border: `1px solid ${isDark ? "#14532d" : "#bbf7d0"}`,
                      padding: "4px 10px", borderRadius: 999,
                    }}>
                      ✓ {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: "var(--c-sub)" }}>
              Menu not analyzed yet — tap to scan
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function Stat({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ fontSize: 15, fontWeight: 800, color }}>{count}</span>
      <span style={{ fontSize: 14, color: "var(--c-sub)" }}>{label}</span>
    </div>
  );
}
