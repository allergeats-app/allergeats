"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { coverageTier, coverageTierLabel, coverageTierColor } from "@/lib/scoring";
import { fitLevel, fitBadge, fitExplanation } from "@/lib/fitLevel";
import type { ScoredRestaurant } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { coverGradient } from "@/lib/coverGradient";
import { chainLogoUrl } from "@/lib/chainLogos";

type Props = { restaurant: ScoredRestaurant };

// Map fit badge color → a glow-safe rgba for shadows and borders
function glowFromColor(color: string): string {
  if (color.includes("16a34a") || color.includes("15803d") || color.includes("22c55e") || color.includes("34d399")) return "34,197,94";
  if (color.includes("d97706") || color.includes("92400e") || color.includes("f59e0b") || color.includes("fbbf24")) return "245,158,11";
  if (color.includes("dc2626") || color.includes("b91c1c") || color.includes("f87171") || color.includes("ef4444")) return "239,68,68";
  return "120,120,120";
}

export function RestaurantCard({ restaurant: r }: Props) {
  const { isDark } = useTheme();
  const { summary } = r;

  const safePercent  = useMemo(() => summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0, [summary]);
  const askPercent   = useMemo(() => summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0, [summary]);
  const avoidPercent = useMemo(() => summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0, [summary]);
  const safeItemNames = useMemo(() => r.scoredItems.filter((i) => i.risk === "likely-safe").slice(0, 3).map((i) => i.name), [r.scoredItems]);
  const cover        = useMemo(() => ({ bg: coverGradient(r.cuisine, r.name) }), [r.cuisine, r.name]);
  const level        = useMemo(() => fitLevel(safePercent, summary.avoid, summary.ask, summary.total), [safePercent, summary]);
  const badge        = useMemo(() => fitBadge(level), [level]);
  const explanation  = useMemo(() => fitExplanation(level, summary.avoid, summary.ask, summary.likelySafe), [level, summary]);
  const tier         = useMemo(() => coverageTier(summary.total), [summary.total]);
  const tierLabel    = useMemo(() => coverageTierLabel(summary.total), [summary.total]);
  const tierColor    = useMemo(() => coverageTierColor(tier), [tier]);
  const glow         = useMemo(() => glowFromColor(badge.color), [badge.color]);

  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(r.id);

  const wikiUrl  = chainLogoUrl(r.name);
  const photoSrc = !photoFailed
    ? (r.imageUrl ?? wikiUrl
        ?? (r.googlePlaceId
          ? `/api/places-photo?placeId=${encodeURIComponent(r.googlePlaceId)}`
          : r.lat != null && r.lng != null
            ? `/api/places-photo?name=${encodeURIComponent(r.name)}&lat=${r.lat}&lng=${r.lng}`
            : null))
    : null;

  const isLogo = (() => {
    if (!photoSrc) return false;
    if (photoSrc.startsWith("/api/wiki-thumb?url=")) return /\.svg\.png/i.test(decodeURIComponent(photoSrc));
    return photoSrc.startsWith("/api/wiki-thumb") || /\.svg\.png(\?|$)/i.test(photoSrc);
  })();

  return (
    <Link
      href={`/restaurants/${r.id}`}
      onClick={() => trackEvent("restaurant_clicked", { id: r.id, name: r.name, fit: level, coverage: tier })}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div style={{
        background: "var(--c-card)",
        border: `1px solid rgba(${glow},${isDark ? "0.22" : "0.14"})`,
        borderRadius: 24,
        overflow: "hidden",
        boxShadow: isDark
          ? `0 0 0 1px rgba(${glow},0.08), 0 8px 32px rgba(${glow},0.18), 0 2px 8px rgba(0,0,0,0.35)`
          : `0 0 0 1px rgba(${glow},0.06), 0 8px 28px rgba(${glow},0.14), 0 2px 6px rgba(0,0,0,0.06)`,
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.1s",
      }}>

        {/* ── Cover image area ── */}
        <div style={{
          height: 148,
          background: isLogo && photoLoaded ? "#fff" : cover.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          transition: "background 0.3s ease",
        }}>
          {photoSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={r.name}
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoFailed(true)}
              loading="lazy"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: isLogo ? "contain" : "cover",
                objectPosition: "center",
                padding: isLogo ? "20px 32px" : 0,
                opacity: photoLoaded ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          )}

          {/* Dark scrim on real photos */}
          {!isLogo && photoLoaded && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.38) 100%)",
              pointerEvents: "none",
            }} />
          )}

          {/* Prestige glow rim at the bottom of the cover */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 40,
            background: `linear-gradient(to top, rgba(${glow},${isDark ? "0.28" : "0.18"}) 0%, transparent 100%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            height: 3,
            background: `linear-gradient(90deg, transparent 0%, rgba(${glow},0.7) 40%, rgba(${glow},0.9) 50%, rgba(${glow},0.7) 60%, transparent 100%)`,
            pointerEvents: "none",
            filter: `blur(0.5px)`,
          }} />

          {/* Fit badge — top right */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            background: isDark ? `rgba(${glow},0.18)` : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(8px)",
            color: badge.color,
            padding: "5px 11px", borderRadius: 999,
            fontSize: 12, fontWeight: 800,
            textAlign: "center", lineHeight: 1.2,
            border: `1px solid rgba(${glow},${isDark ? "0.35" : "0.2"})`,
            boxShadow: `0 2px 10px rgba(${glow},0.25)`,
          }}>
            {level}
            {summary.total >= 5 && (
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>
                {Math.round(safePercent)}% safe
              </div>
            )}
          </div>

          {/* Distance pill — bottom left */}
          {r.distance != null && (
            <div style={{
              position: "absolute", bottom: 10, left: 12,
              background: "rgba(0,0,0,0.48)", color: "#fff",
              padding: "4px 9px", borderRadius: 999,
              fontSize: 11, fontWeight: 700, backdropFilter: "blur(4px)",
            }}>
              {r.distance} mi
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); trackEvent(favorited ? "place_unsaved" : "place_saved", { id: r.id, name: r.name, fit: level, coverage: tier }); toggleFavorite(r.id, { name: r.name, cuisine: r.cuisine }); }}
            aria-label={favorited ? `Remove ${r.name} from saved` : `Save ${r.name}`}
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

        {/* ── Card body ── */}
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
              {/* Progress bar — taller, glowing */}
              <div style={{
                height: 8, borderRadius: 999,
                background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
                overflow: "hidden", display: "flex",
                boxShadow: `inset 0 1px 2px rgba(0,0,0,0.12)`,
              }}>
                {safePercent > 0 && (
                  <div style={{
                    width: `${safePercent}%`,
                    background: "linear-gradient(90deg, #16a34a, #22c55e)",
                    boxShadow: "2px 0 8px rgba(34,197,94,0.5)",
                  }} />
                )}
                {askPercent > 0 && (
                  <div style={{
                    width: `${askPercent}%`,
                    background: "linear-gradient(90deg, #d97706, #f59e0b)",
                    boxShadow: "2px 0 8px rgba(245,158,11,0.4)",
                  }} />
                )}
                {avoidPercent > 0 && (
                  <div style={{
                    width: `${avoidPercent}%`,
                    background: "linear-gradient(90deg, #dc2626, #ef4444)",
                  }} />
                )}
              </div>

              {/* Safe / Ask / Avoid pill badges */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ display: "flex", gap: 7 }}>
                  <StatBadge count={summary.likelySafe} label="Safe"  rgb="22,163,74"   isDark={isDark} />
                  <StatBadge count={summary.ask}        label="Ask"   rgb="217,119,6"   isDark={isDark} />
                  <StatBadge count={summary.avoid}      label="Avoid" rgb="220,38,38"   isDark={isDark} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 999, background: tierColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{tierLabel}</span>
                </div>
              </div>

              {/* Safe item name pills */}
              {safeItemNames.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {safeItemNames.map((name) => (
                    <span key={name} style={{
                      fontSize: 13, fontWeight: 700,
                      color: isDark ? "#86efac" : "#15803d",
                      background: isDark ? "rgba(22,163,74,0.12)" : "#f0fdf4",
                      border: `1px solid ${isDark ? "rgba(22,163,74,0.25)" : "#bbf7d0"}`,
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

function StatBadge({ count, label, rgb, isDark }: { count: number; label: string; rgb: string; isDark: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 11px", borderRadius: 999,
      background: `rgba(${rgb},${isDark ? "0.14" : "0.08"})`,
      border: `1px solid rgba(${rgb},${isDark ? "0.28" : "0.18"})`,
      boxShadow: count > 0 ? `0 1px 6px rgba(${rgb},${isDark ? "0.2" : "0.1"})` : "none",
    }}>
      <span style={{ fontSize: 15, fontWeight: 900, color: `rgb(${rgb})`, letterSpacing: "-0.02em" }}>{count}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: `rgba(${rgb},${isDark ? "0.9" : "0.8"})` }}>{label}</span>
    </div>
  );
}
