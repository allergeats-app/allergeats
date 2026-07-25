"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { fitLevel, fitBadge } from "@/lib/fitLevel";
import { coverageTier } from "@/lib/scoring";
import type { ScoredRestaurant } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { coverGradient } from "@/lib/coverGradient";
import { chainLogoUrl } from "@/lib/chainLogos";

type Props = { restaurant: ScoredRestaurant };

export function HeroRestaurantCard({ restaurant: r }: Props) {
  const { isDark } = useTheme();
  const { summary } = r;

  const safePercent = useMemo(() => summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0, [summary]);
  const cover = useMemo(() => coverGradient(r.cuisine, r.name), [r.cuisine, r.name]);
  const level = useMemo(() => fitLevel(safePercent, summary.avoid, summary.ask, summary.total), [safePercent, summary]);
  const badge = useMemo(() => fitBadge(level), [level]);
  const tier  = useMemo(() => coverageTier(summary.total), [summary.total]);

  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const fallbackFiredRef = useRef(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(r.id);

  const wikiUrl = chainLogoUrl(r.name);
  const primarySrc = !photoFailed
    ? (r.imageUrl ?? wikiUrl
        ?? (r.googlePlaceId
          ? `/api/places-photo?placeId=${encodeURIComponent(r.googlePlaceId)}`
          : r.lat != null && r.lng != null
            ? `/api/places-photo?name=${encodeURIComponent(r.name)}&lat=${r.lat}&lng=${r.lng}`
            : null))
    : null;
  const photoSrc = primarySrc ?? fallbackSrc;

  useEffect(() => {
    if (fallbackFiredRef.current) return;
    if (primarySrc && !photoFailed) return;
    if (!r.name) return;
    fallbackFiredRef.current = true;
    const params = new URLSearchParams({ name: r.name });
    if (r.lat != null) params.set("lat", String(r.lat));
    if (r.lng != null) params.set("lng", String(r.lng));
    fetch(`/api/restaurant-image?${params}`)
      .then(res => res.ok ? res.json() : null)
      .then((data: { imageUrl?: string } | null) => { if (data?.imageUrl) setFallbackSrc(data.imageUrl); })
      .catch(() => {});
  }, [primarySrc, photoFailed, r.name, r.lat, r.lng]);

  const isLogo = (() => {
    if (!photoSrc) return false;
    if (photoSrc === fallbackSrc) return false;
    if (photoSrc.startsWith("/logos/")) return true;
    if (photoSrc.startsWith("/api/wiki-thumb?url=")) return /\.svg\.png/i.test(decodeURIComponent(photoSrc));
    return photoSrc.startsWith("/api/wiki-thumb") || /\.svg\.png(\?|$)/i.test(photoSrc);
  })();

  // Accent color based on fit level
  const accentColor = level === "Great Match" || level === "Good Option"
    ? "#22c55e"
    : level === "Use Caution"
      ? "#f59e0b"
      : "#ef4444";

  return (
    <Link
      href={`/restaurants/${r.id}`}
      onClick={() => trackEvent("restaurant_clicked", { id: r.id, name: r.name, fit: level, coverage: tier, hero: true })}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div style={{
        borderRadius: 24,
        overflow: "hidden",
        position: "relative",
        boxShadow: isDark
          ? `0 0 0 1px rgba(255,255,255,0.07), 0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${accentColor}18`
          : `0 0 0 1px rgba(0,0,0,0.06), 0 8px 40px rgba(0,0,0,0.14), 0 0 40px ${accentColor}14`,
        cursor: "pointer",
        background: isDark ? "#0a0a0a" : "#fff",
      }}>

        {/* ── Full-bleed image ── */}
        <div style={{
          height: 220,
          position: "relative",
          background: isLogo && photoLoaded ? (isDark ? "#111" : "#f9f9f9") : cover,
          overflow: "hidden",
        }}>
          {photoSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoSrc}
              alt={r.name}
              onLoad={() => setPhotoLoaded(true)}
              onError={() => setPhotoFailed(true)}
              loading="eager"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%",
                objectFit: isLogo ? "contain" : "cover",
                objectPosition: "center",
                padding: isLogo ? "28px 48px" : 0,
                opacity: photoLoaded ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          )}

          {/* Deep gradient scrim — stronger than regular cards */}
          <div style={{
            position: "absolute", inset: 0,
            background: isLogo
              ? "none"
              : "linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.55) 70%, rgba(0,0,0,0.82) 100%)",
            pointerEvents: "none",
          }} />

          {/* ── Top row: #1 Match badge + save button ── */}
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {/* #1 Match pill */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(0,0,0,0.48)",
              WebkitBackdropFilter: "blur(10px)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 999, padding: "5px 11px",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fbbf24" stroke="none" aria-hidden="true">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: "0.04em" }}>Best Match</span>
            </div>

            {/* Save */}
            <button
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                trackEvent(favorited ? "place_unsaved" : "place_saved", { id: r.id, name: r.name, fit: level, coverage: tier });
                toggleFavorite(r.id, { name: r.name, cuisine: r.cuisine });
              }}
              aria-label={favorited ? `Remove ${r.name} from saved` : `Save ${r.name}`}
              style={{
                width: 40, height: 40, borderRadius: 999,
                background: favorited ? "var(--c-brand)" : "rgba(0,0,0,0.4)",
                WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "background 0.15s",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={favorited ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>

          {/* ── Bottom overlay: name, cuisine, distance, fit badge ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "16px 16px 18px",
            display: isLogo ? "none" : "block",
          }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 22, fontWeight: 900, color: "#fff",
                  lineHeight: 1.15, letterSpacing: "-0.02em",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  textShadow: "0 1px 8px rgba(0,0,0,0.4)",
                }}>
                  {r.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{r.cuisine}</span>
                  {r.distance != null && (
                    <>
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>·</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{r.distance} mi</span>
                    </>
                  )}
                </div>
              </div>
              {/* Fit badge — large, prominent */}
              <div style={{
                flexShrink: 0,
                background: badge.bg,
                color: badge.color,
                padding: "7px 13px", borderRadius: 12,
                fontSize: 13, fontWeight: 900,
                textAlign: "center", lineHeight: 1.2,
                boxShadow: `0 2px 12px ${badge.bg}99`,
              }}>
                {level}
                {summary.total >= 5 && (
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.85, marginTop: 2 }}>
                    {Math.round(safePercent)}% safe
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: "14px 16px 18px" }}>

          {/* Name row for logo-style images (name wasn't shown on image) */}
          {isLogo && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2 }}>{r.cuisine}{r.distance != null ? ` · ${r.distance} mi` : ""}</div>
                </div>
                <div style={{
                  flexShrink: 0,
                  background: badge.bg, color: badge.color,
                  padding: "6px 12px", borderRadius: 10,
                  fontSize: 13, fontWeight: 900, textAlign: "center", lineHeight: 1.2,
                }}>
                  {level}
                  {summary.total >= 5 && <div style={{ fontSize: 10, opacity: 0.8, marginTop: 1 }}>{Math.round(safePercent)}% safe</div>}
                </div>
              </div>
            </div>
          )}

          {/* ── Big stat blocks ── */}
          {summary.total > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
              <StatBlock count={summary.likelySafe} label="Safe"      color="#22c55e" rgb="34,197,94"   isDark={isDark} />
              <StatBlock count={summary.ask}        label="Ask Staff" color="#f59e0b" rgb="245,158,11"  isDark={isDark} />
              <StatBlock count={summary.avoid}      label="Avoid"     color="#ef4444" rgb="239,68,68"   isDark={isDark} />
            </div>
          )}

          {/* CTA row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: summary.total > 0 ? 12 : 0,
            borderTop: summary.total > 0 ? `1px solid var(--c-border)` : "none",
          }}>
            <span style={{ fontSize: 13, color: "var(--c-sub)" }}>
              {summary.total > 0 ? `${summary.total} items analyzed` : "Tap to scan menu"}
            </span>
            <span style={{
              fontSize: 14, fontWeight: 800, color: "var(--c-brand)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              See menu fit
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatBlock({ count, label, color, rgb, isDark }: { count: number; label: string; color: string; rgb: string; isDark: boolean }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "13px 8px",
      borderRadius: 16,
      background: `rgba(${rgb},${isDark ? "0.14" : "0.08"})`,
      border: `1.5px solid rgba(${rgb},${isDark ? "0.35" : "0.22"})`,
      boxShadow: count > 0 ? `0 4px 16px rgba(${rgb},${isDark ? "0.25" : "0.12"})` : "none",
    }}>
      <div style={{ fontSize: 32, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color, opacity: 0.8, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}