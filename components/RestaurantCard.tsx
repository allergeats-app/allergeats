"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { coverageTier } from "@/lib/scoring";
import { fitLevel, fitBadge } from "@/lib/fitLevel";
import type { ScoredRestaurant } from "@/lib/types";
import { trackEvent } from "@/lib/analytics";
import { coverGradient } from "@/lib/coverGradient";
import { chainLogoUrl } from "@/lib/chainLogos";

type Props = { restaurant: ScoredRestaurant; variant?: "default" | "rail" | "compact" };

export function RestaurantCard({ restaurant: r, variant = "default" }: Props) {
  const { isDark } = useTheme();
  const { summary } = r;
  const isRail    = variant === "rail";
  const isCompact = variant === "compact";

  const safePercent = useMemo(() => summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0, [summary]);
  const cover       = useMemo(() => ({ bg: coverGradient(r.cuisine, r.name) }), [r.cuisine, r.name]);
  const level       = useMemo(() => fitLevel(safePercent, summary.avoid, summary.ask, summary.total), [safePercent, summary]);
  const badge       = useMemo(() => fitBadge(level), [level]);
  const tier        = useMemo(() => coverageTier(summary.total), [summary.total]);

  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const fallbackFiredRef = useRef(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(r.id);

  const wikiUrl  = chainLogoUrl(r.name);
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
    const controller = new AbortController();
    const params = new URLSearchParams({ name: r.name });
    if (r.lat  != null) params.set("lat",  String(r.lat));
    if (r.lng  != null) params.set("lng",  String(r.lng));
    fetch(`/api/restaurant-image?${params}`, { signal: controller.signal })
      .then(res => res.ok ? res.json() : null)
      .then((data: { imageUrl?: string } | null) => { if (data?.imageUrl) setFallbackSrc(data.imageUrl); })
      .catch(() => {});
    return () => controller.abort();
  }, [primarySrc, photoFailed, r.name, r.lat, r.lng]);

  const isLogo = (() => {
    if (!photoSrc) return false;
    if (photoSrc === fallbackSrc) return false;
    if (photoSrc.startsWith("/logos/")) return true;
    if (photoSrc.startsWith("/api/wiki-thumb?url=")) {
      const decoded = decodeURIComponent(photoSrc);
      return /\.svg(\.png)?$/i.test(decoded) || /[Ll]ogo/.test(decoded);
    }
    return photoSrc.startsWith("/api/wiki-thumb") || /\.svg\.png(\?|$)/i.test(photoSrc);
  })();

  const imgHeight = isRail ? 108 : isCompact ? 108 : 148;

  return (
    <Link
      href={`/restaurants/${r.id}`}
      onClick={() => trackEvent("restaurant_clicked", { id: r.id, name: r.name, fit: level, coverage: tier })}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.1s",
      }}>

        {/* ── Cover image ── */}
        <div style={{
          height: imgHeight,
          background: isLogo && photoLoaded ? "#ffffff" : photoLoaded ? "var(--c-card)" : cover.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          transition: "background 0.3s ease",
        }}>
          {/* Placeholder initial */}
          {!photoLoaded && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{
                width: isRail || isCompact ? 48 : 60,
                height: isRail || isCompact ? 48 : 60,
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)",
              }}>
                <span style={{
                  fontSize: isRail || isCompact ? 22 : 28,
                  fontWeight: 900, color: "rgba(255,255,255,0.9)",
                  lineHeight: 1, fontFamily: "Georgia, serif", letterSpacing: "-0.02em",
                }}>
                  {r.name.trim().charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

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
                padding: isLogo ? (isRail || isCompact ? "14px 24px" : "20px 32px") : 0,
                opacity: photoLoaded ? 1 : 0,
                transition: "opacity 0.4s ease",
              }}
            />
          )}

          {/* Gradient scrim */}
          {!isLogo && photoLoaded && (
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.32) 100%)",
              pointerEvents: "none",
            }} />
          )}

          {/* Fit badge */}
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: badge.bg, color: badge.color,
            padding: isRail ? "4px 8px" : "5px 10px", borderRadius: 999,
            fontSize: isRail ? 11 : 12, fontWeight: 800,
            textAlign: "center", lineHeight: 1.2,
          }}>
            {level}
            {!isRail && summary.total >= 5 && (
              <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>
                {Math.round(safePercent)}% safe
              </div>
            )}
          </div>

          {/* Distance badge */}
          {r.distance != null && (
            <div style={{
              position: "absolute", bottom: 8, left: 10,
              background: "rgba(0,0,0,0.45)", color: "#fff",
              padding: "3px 8px", borderRadius: 999,
              fontSize: 10, fontWeight: 700, WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)",
            }}>
              {r.distance} mi
            </div>
          )}

          {/* Save button */}
          <button
            onClick={(e) => {
              e.preventDefault(); e.stopPropagation();
              trackEvent(favorited ? "place_unsaved" : "place_saved", { id: r.id, name: r.name, fit: level, coverage: tier });
              toggleFavorite(r.id, { name: r.name, cuisine: r.cuisine });
            }}
            aria-label={favorited ? `Remove ${r.name} from saved` : `Save ${r.name}`}
            title={favorited ? "Remove from saved" : "Save restaurant"}
            style={{
              position: "absolute", bottom: 6, right: 6,
              background: favorited ? "var(--c-brand)" : "rgba(0,0,0,0.38)",
              border: "none", borderRadius: 999,
              width: 44, height: 44,
              padding: isRail ? 4 : 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)",
              transition: "background 0.15s",
            }}
          >
            <svg aria-hidden="true" width={isRail ? 13 : 16} height={isRail ? 13 : 16} viewBox="0 0 24 24"
              fill={favorited ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* ── Card body ── */}
        <div style={{ padding: isRail ? "11px 13px 13px" : isCompact ? "12px 14px 14px" : "14px 16px 16px" }}>

          {/* Name + cuisine */}
          <div style={{ marginBottom: isRail ? 8 : 10 }}>
            <div style={{
              fontWeight: 900,
              fontSize: isRail ? 15 : isCompact ? 16 : 18,
              color: "var(--c-text)", lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {r.name}
            </div>
            <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 2 }}>
              {r.cuisine}
            </div>
          </div>

          {/* ── Stat blocks ── */}
          {summary.total > 0 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: isRail ? 5 : 6 }}>
                <StatBlock count={summary.likelySafe} label="Safe"      color="#22c55e" rgb="34,197,94"   isDark={isDark} isRail={isRail} isCompact={isCompact} />
                <StatBlock count={summary.ask}        label="Ask Staff" color="#f59e0b" rgb="245,158,11"  isDark={isDark} isRail={isRail} isCompact={isCompact} />
                <StatBlock count={summary.avoid}      label="Avoid"     color="#ef4444" rgb="239,68,68"   isDark={isDark} isRail={isRail} isCompact={isCompact} />
              </div>

              {/* CTA — default variant only */}
              {!isRail && !isCompact && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--c-border)",
                }}>
                  <span style={{ fontSize: 12, color: "var(--c-sub)" }}>{summary.total} items analyzed</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-brand)", display: "flex", alignItems: "center", gap: 4 }}>
                    See menu fit
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </span>
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--c-sub)" }}>
              {isRail ? "No menu yet" : "Menu not analyzed yet — tap to scan"}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

function StatBlock({
  count, label, color, rgb, isDark, isRail, isCompact,
}: {
  count: number; label: string; color: string; rgb: string; isDark: boolean; isRail?: boolean; isCompact?: boolean;
}) {
  const numSize    = isRail ? 20 : isCompact ? 24 : 28;
  const labelSize  = isRail ?  9 : isCompact ? 10 : 11;
  const topMargin  = isRail ?  3 : isCompact ?  4 :  5;
  const padding    = isRail ? "8px 4px" : isCompact ? "10px 6px" : "12px 8px";
  const radius     = isRail ? 10 : isCompact ? 12 : 14;
  return (
    <div style={{
      textAlign: "center",
      padding,
      borderRadius: radius,
      background: `rgba(${rgb},${isDark ? "0.14" : "0.08"})`,
      border: `1.5px solid rgba(${rgb},${isDark ? "0.35" : "0.22"})`,
      boxShadow: count > 0 ? `0 4px 16px rgba(${rgb},${isDark ? "0.25" : "0.12"})` : "none",
    }}>
      <div style={{ fontSize: numSize, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: labelSize, fontWeight: 800, color, opacity: 0.8, marginTop: topMargin, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </div>
  );
}
