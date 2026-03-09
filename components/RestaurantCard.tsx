"use client";

import { useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/favoritesContext";
import type { ScoredRestaurant } from "@/lib/types";

type Props = { restaurant: ScoredRestaurant; compact?: boolean };

function coverForRestaurant(cuisine: string, name: string): { bg: string; emoji: string } {
  const c = cuisine.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes("mcdonald") || c.includes("burger") || n.includes("burger") || n.includes("wendy") || n.includes("shake shack") || n.includes("five guys"))
    return { bg: "linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)", emoji: "🍔" };
  if (c.includes("mexican") || c.includes("tex-mex") || n.includes("chipotle") || n.includes("taco"))
    return { bg: "linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)", emoji: "🌮" };
  if (c.includes("chicken") || n.includes("chick-fil") || n.includes("popeyes") || n.includes("kfc"))
    return { bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)", emoji: "🍗" };
  if (c.includes("coffee") || c.includes("café") || c.includes("cafe") || c.includes("bakery") || n.includes("starbucks") || n.includes("dunkin") || n.includes("panera"))
    return { bg: "linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)", emoji: "☕" };
  if (c.includes("pizza") || n.includes("domino") || n.includes("pizza hut"))
    return { bg: "linear-gradient(135deg, #fca5a5 0%, #fb923c 100%)", emoji: "🍕" };
  if (c.includes("sandwich") || c.includes("sub") || n.includes("subway") || n.includes("jersey mike") || n.includes("jimmy john"))
    return { bg: "linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%)", emoji: "🥪" };
  if (c.includes("asian") || c.includes("chinese") || c.includes("sushi") || c.includes("japanese"))
    return { bg: "linear-gradient(135deg, #fde68a 0%, #86efac 100%)", emoji: "🍜" };
  if (c.includes("italian") || c.includes("pasta"))
    return { bg: "linear-gradient(135deg, #fca5a5 0%, #fde68a 100%)", emoji: "🍝" };
  return { bg: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)", emoji: "🍽️" };
}

function safetyBadge(safePercent: number, hasData: boolean): { label: string; bg: string; color: string } | null {
  if (!hasData) return null;
  if (safePercent >= 70) return { label: `${Math.round(safePercent)}% Safe`, bg: "#dcfce7", color: "#15803d" };
  if (safePercent >= 40) return { label: `${Math.round(safePercent)}% Safe`, bg: "#fef9c3", color: "#a16207" };
  return { label: `${Math.round(safePercent)}% Safe`, bg: "#fee2e2", color: "#b91c1c" };
}

export function RestaurantCard({ restaurant: r, compact = false }: Props) {
  const { summary } = r;
  const safePercent  = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const askPercent   = summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0;
  const cover = coverForRestaurant(r.cuisine, r.name);
  const badge = safetyBadge(safePercent, summary.total > 0);

  const [photoFailed, setPhotoFailed] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(r.id);
  const photoSrc =
    !photoFailed && r.lat != null && r.lng != null
      ? `/api/places-photo?name=${encodeURIComponent(r.name)}&lat=${r.lat}&lng=${r.lng}`
      : null;

  return (
    <Link href={`/restaurants/${r.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.1s",
      }}>
        {/* Cover image area */}
        <div style={{ height: compact ? 80 : 110, background: photoSrc ? "#e5e7eb" : cover.bg, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={r.name}
              onError={() => setPhotoFailed(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <span style={{ fontSize: 48, lineHeight: 1 }}>{cover.emoji}</span>
          )}
          {badge && (
            <div style={{
              position: "absolute", top: 10, right: 10,
              background: badge.bg, color: badge.color,
              padding: "5px 10px", borderRadius: 999,
              fontSize: 12, fontWeight: 800,
            }}>
              {badge.label}
            </div>
          )}
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(r.id); }}
            title={favorited ? "Remove from saved" : "Save restaurant"}
            style={{
              position: "absolute", bottom: 10, right: 12,
              background: favorited ? "#eb1700" : "rgba(0,0,0,0.38)",
              border: "none", borderRadius: 999,
              width: 30, height: 30,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(4px)",
              fontSize: 15, lineHeight: 1,
              transition: "background 0.15s",
            }}
          >
            {favorited ? "♥" : "♡"}
          </button>
        </div>

        {/* Card body */}
        <div style={{ padding: compact ? "10px 12px 12px" : "14px 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: compact ? 7 : 10 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: compact ? 13 : 17, color: "var(--c-text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "var(--c-sub)", marginTop: 2 }}>{r.cuisine}</div>
            </div>
            {!compact && <div style={{ fontSize: 13, fontWeight: 700, color: "#eb1700", flexShrink: 0, paddingTop: 2 }}>View →</div>}
          </div>

          {summary.total > 0 ? (
            <div>
              <div style={{ height: 5, borderRadius: 999, background: "var(--c-muted)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${safePercent}%`, background: "#22c55e" }} />
                <div style={{ width: `${askPercent}%`, background: "#f59e0b" }} />
                <div style={{ width: `${avoidPercent}%`, background: "#ef4444" }} />
              </div>
              {!compact && (
                <div style={{ display: "flex", gap: 14, marginTop: 8 }}>
                  <Stat count={summary.likelySafe} label="Safe"  color="#16a34a" />
                  <Stat count={summary.ask}        label="Ask"   color="#d97706" />
                  <Stat count={summary.avoid}      label="Avoid" color="#dc2626" />
                </div>
              )}
              {compact && (
                <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                  <Stat count={summary.likelySafe} label="✓" color="#16a34a" />
                  <Stat count={summary.avoid}      label="✗" color="#dc2626" />
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--c-sub)" }}>No data yet</div>
          )}
        </div>
      </div>
    </Link>
  );
}

function Stat({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>{count}</span>
      <span style={{ fontSize: 12, color: "var(--c-sub)" }}>{label}</span>
    </div>
  );
}
