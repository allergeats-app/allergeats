"use client";

import { useState } from "react";
import Link from "next/link";
import { useFavorites } from "@/lib/favoritesContext";
import type { ScoredRestaurant } from "@/lib/types";

type Props = { restaurant: ScoredRestaurant; compact?: boolean };

type FitLevel = "Great Match" | "Good Option" | "Use Caution" | "Limited Data";

function coverForRestaurant(cuisine: string, name: string): { bg: string } {
  const c = cuisine.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes("mcdonald") || c.includes("burger") || n.includes("burger") || n.includes("wendy") || n.includes("shake shack") || n.includes("five guys"))
    return { bg: "linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)" };
  if (c.includes("mexican") || c.includes("tex-mex") || n.includes("chipotle") || n.includes("taco"))
    return { bg: "linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)" };
  if (c.includes("chicken") || n.includes("chick-fil") || n.includes("popeyes") || n.includes("kfc"))
    return { bg: "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)" };
  if (c.includes("coffee") || c.includes("café") || c.includes("cafe") || c.includes("bakery") || n.includes("starbucks") || n.includes("dunkin") || n.includes("panera"))
    return { bg: "linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)" };
  if (c.includes("pizza") || n.includes("domino") || n.includes("pizza hut"))
    return { bg: "linear-gradient(135deg, #fca5a5 0%, #fb923c 100%)" };
  if (c.includes("sandwich") || c.includes("sub") || n.includes("subway") || n.includes("jersey mike") || n.includes("jimmy john"))
    return { bg: "linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%)" };
  if (c.includes("asian") || c.includes("chinese") || c.includes("sushi") || c.includes("japanese"))
    return { bg: "linear-gradient(135deg, #fde68a 0%, #86efac 100%)" };
  if (c.includes("italian") || c.includes("pasta"))
    return { bg: "linear-gradient(135deg, #fca5a5 0%, #fde68a 100%)" };
  return { bg: "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)" };
}

function fitLevel(safePercent: number, avoidCount: number, askCount: number, total: number): FitLevel {
  // Not enough data to say anything meaningful
  if (total < 5) return "Limited Data";

  const avoidPercent = (avoidCount / total) * 100;
  const askPercent   = (askCount   / total) * 100;

  // Great Match: strong coverage, dominant safe ratio, minimal avoid and ask
  if (total >= 8 && safePercent >= 60 && avoidPercent <= 10 && askPercent <= 35)
    return "Great Match";

  // Good Option: decent safe ratio, low avoid — moderate ask is acceptable
  if (safePercent >= 40 && avoidPercent < 20 && avoidCount <= 4)
    return "Good Option";

  // Use Caution: notable avoid count, low safe ratio, or lots of ask
  return "Use Caution";
}

function fitBadge(level: FitLevel): { bg: string; color: string } {
  switch (level) {
    case "Great Match":  return { bg: "#dcfce7", color: "#15803d" };
    case "Good Option":  return { bg: "#fef9c3", color: "#a16207" };
    case "Use Caution":  return { bg: "#fee2e2", color: "#b91c1c" };
    case "Limited Data": return { bg: "#f1f5f9", color: "#64748b" };
  }
}

function fitExplanation(level: FitLevel, avoidCount: number, askCount: number, safeCount: number): string {
  switch (level) {
    case "Great Match":
      return avoidCount === 0
        ? `${safeCount} safe items, nothing to avoid`
        : `${safeCount} safe items, very little to worry about`;
    case "Good Option":
      if (avoidCount === 0) return `${safeCount} safe picks — ask about ${askCount} item${askCount === 1 ? "" : "s"}`;
      if (avoidCount === 1) return "1 item to avoid — most options are safe";
      return `${safeCount} safe picks, ${avoidCount} items to avoid`;
    case "Use Caution":
      return `${avoidCount} item${avoidCount === 1 ? "" : "s"} to avoid — check before ordering`;
    case "Limited Data":
      return "Tap to scan the menu yourself";
  }
}

function coverageLabel(total: number): string {
  if (total === 0) return "No menu data yet";
  if (total < 5) return "Limited menu data";
  return `${total} items analyzed`;
}

export function RestaurantCard({ restaurant: r, compact = false }: Props) {
  const { summary } = r;
  const safePercent  = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const askPercent   = summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0;
  const cover = coverForRestaurant(r.cuisine, r.name);
  const level = fitLevel(safePercent, summary.avoid, summary.ask, summary.total);
  const badge = fitBadge(level);
  const explanation = fitExplanation(level, summary.avoid, summary.ask, summary.likelySafe);
  const coverage = coverageLabel(summary.total);

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
          ) : null}
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: badge.bg, color: badge.color,
            padding: "5px 10px", borderRadius: 999,
            fontSize: 12, fontWeight: 800,
            textAlign: "center", lineHeight: 1.2,
          }}>
            {level}
            {!compact && summary.total > 0 && (
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
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(r.id); }}
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
        <div style={{ padding: compact ? "10px 12px 12px" : "14px 16px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: compact ? 6 : 4 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: compact ? 13 : 17, color: "var(--c-text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
              <div style={{ fontSize: 11, color: "var(--c-sub)", marginTop: 2 }}>{r.cuisine}</div>
            </div>
            {!compact && <div style={{ fontSize: 13, fontWeight: 700, color: "#eb1700", flexShrink: 0, paddingTop: 2 }}>See menu fit →</div>}
          </div>

          {!compact && (
            <div style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 10, lineHeight: 1.4 }}>
              {explanation}
            </div>
          )}

          {summary.total > 0 ? (
            <div>
              <div style={{ height: 5, borderRadius: 999, background: "var(--c-muted)", overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${safePercent}%`, background: "#22c55e" }} />
                <div style={{ width: `${askPercent}%`, background: "#f59e0b" }} />
                <div style={{ width: `${avoidPercent}%`, background: "#ef4444" }} />
              </div>
              {!compact && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <div style={{ display: "flex", gap: 14 }}>
                    <Stat count={summary.likelySafe} label="Safe"  color="#16a34a" />
                    <Stat count={summary.ask}        label="Ask"   color="#d97706" />
                    <Stat count={summary.avoid}      label="Avoid" color="#dc2626" />
                  </div>
                  <div style={{ fontSize: 11, color: "var(--c-sub)" }}>{coverage}</div>
                </div>
              )}
              {compact && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Stat count={summary.likelySafe} label="✓" color="#16a34a" />
                    <Stat count={summary.avoid}      label="✗" color="#dc2626" />
                  </div>
                  <div style={{
                    fontSize: 11, fontWeight: 700,
                    color: badge.color, background: badge.bg,
                    padding: "2px 8px", borderRadius: 999,
                  }}>
                    {level}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "var(--c-sub)" }}>
                {compact ? "No menu data" : "Menu not analyzed yet — tap to scan"}
              </div>
              {compact && (
                <div style={{ fontSize: 11, fontWeight: 700, color: badge.color, background: badge.bg, padding: "2px 8px", borderRadius: 999 }}>
                  {level}
                </div>
              )}
            </div>
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
