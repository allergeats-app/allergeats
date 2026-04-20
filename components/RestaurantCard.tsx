"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/themeContext";
import { useFavorites } from "@/lib/favoritesContext";
import { coverageTier, coverageTierLabel, coverageTierColor } from "@/lib/scoring";
import { fitLevel, fitBadge, fitExplanation } from "@/lib/fitLevel";
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

  const [photoFailed, setPhotoFailed] = useState(false);
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [fallbackSrc, setFallbackSrc] = useState<string | null>(null);
  const fallbackFiredRef = useRef(false);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(r.id);

  // Image priority:
  //   1. r.imageUrl   — pre-enriched URL from the image enrichment pipeline
  //   2. chainLogoUrl — Wikipedia photo via /api/wiki-thumb (free, no API key)
  //   3. places-photo — Google Places proxy (requires API key, best for OSM restaurants)
  //   4. restaurant-image — Google Places → Yelp → website og:image (last resort, async)
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

  // Fire the restaurant-image fallback when the primary chain has nothing to show
  useEffect(() => {
    if (fallbackFiredRef.current) return;
    if (primarySrc && !photoFailed) return; // primary chain has a URL — don't fire yet
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

  // Wiki-thumb images are chain logos — use contain so the full logo is visible.
  // Places photos, fallback images, and pre-enriched photos use cover.
  const isLogo = (() => {
    if (!photoSrc) return false;
    if (photoSrc === fallbackSrc) return false; // restaurant-image results are always photos
    if (photoSrc.startsWith("/api/wiki-thumb?url=")) {
      const decoded = decodeURIComponent(photoSrc);
      return /\.svg(\.png)?$/i.test(decoded) || /[Ll]ogo/.test(decoded);
    }
    return photoSrc.startsWith("/api/wiki-thumb") || /\.svg\.png(\?|$)/i.test(photoSrc);
  })();

  const imgHeight = isRail ? 108 : isCompact ? 108 : 148;

  return (
    <Link href={`/restaurants/${r.id}`} onClick={() => trackEvent("restaurant_clicked", { id: r.id, name: r.name, fit: level, coverage: tier })} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{
        background: "var(--c-card)",
        border: "1px solid var(--c-border)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.1s",
      }}>
        {/* Cover image area */}
        <div style={{
          height: imgHeight,
          background: isLogo && photoLoaded ? "#fff" : photoLoaded ? "var(--c-card)" : cover.bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", overflow: "hidden",
          transition: "background 0.3s ease",
        }}>
          {/* Initial logo — shown when no photo has loaded */}
          {!photoLoaded && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: isRail || isCompact ? 48 : 60,
                height: isRail || isCompact ? 48 : 60,
                borderRadius: 16,
                background: "rgba(255,255,255,0.12)",
                border: "1.5px solid rgba(255,255,255,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}>
                <span style={{
                  fontSize: isRail || isCompact ? 22 : 28,
                  fontWeight: 900,
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1,
                  fontFamily: "Georgia, serif",
                  letterSpacing: "-0.02em",
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
          {/* Gradient scrim on photos */}
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
              fontSize: 10, fontWeight: 700, backdropFilter: "blur(4px)",
            }}>
              {r.distance} mi
            </div>
          )}
          {/* Save button */}
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); trackEvent(favorited ? "place_unsaved" : "place_saved", { id: r.id, name: r.name, fit: level, coverage: tier }); toggleFavorite(r.id, { name: r.name, cuisine: r.cuisine }); }}
            aria-label={favorited ? `Remove ${r.name} from saved` : `Save ${r.name}`}
            title={favorited ? "Remove from saved" : "Save restaurant"}
            style={{
              position: "absolute", bottom: 6, right: 6,
              background: favorited ? "#1fbdcc" : "rgba(0,0,0,0.38)",
              border: "none", borderRadius: 999,
              width: isRail ? 36 : 44, height: isRail ? 36 : 44,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", backdropFilter: "blur(4px)",
              fontSize: 18, lineHeight: 1,
              transition: "background 0.15s",
            }}
          >
            <svg aria-hidden="true" width={isRail ? 13 : 16} height={isRail ? 13 : 16} viewBox="0 0 24 24" fill={favorited ? "#fff" : "none"} stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>

        {/* Card body */}
        <div style={{ padding: isRail ? "11px 13px 13px" : isCompact ? "12px 14px 14px" : "16px 18px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isRail ? 2 : 4 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 900,
                fontSize: isRail ? 15 : isCompact ? 16 : 19,
                color: "var(--c-text)", lineHeight: 1.2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>{r.name}</div>
              <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 2 }}>{r.cuisine}</div>
            </div>
            {!isRail && (
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1fbdcc", flexShrink: 0, paddingTop: 2 }}>→</div>
            )}
          </div>

          {/* Explanation — default: 2 lines; compact: 1 line; rail: hidden */}
          {!isRail && (
            <div style={{
              fontSize: 13, color: "var(--c-sub)", marginBottom: isCompact ? 8 : 12, lineHeight: 1.45,
              ...(isCompact ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : {}),
            }}>
              {explanation}
            </div>
          )}

          {summary.total > 0 ? (
            <div>
              {/* Progress bar — hidden on rail */}
              {!isRail && (
                <div style={{ position: "relative", height: 7, marginBottom: isCompact ? 8 : 8 }}>
                  {/* Blurred glow layer */}
                  <div style={{
                    position: "absolute", inset: "-4px 0", borderRadius: 999,
                    display: "flex", overflow: "hidden",
                    filter: "blur(5px)",
                    opacity: isDark ? 0.75 : 0.5,
                  }}>
                    {safePercent  > 0 && <div style={{ width: `${safePercent}%`,  background: "#22c55e" }} />}
                    {askPercent   > 0 && <div style={{ width: `${askPercent}%`,   background: "#f59e0b" }} />}
                    {avoidPercent > 0 && <div style={{ width: `${avoidPercent}%`, background: "#ef4444" }} />}
                  </div>
                  {/* Actual bar */}
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: 999,
                    background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                    overflow: "hidden", display: "flex",
                  }}>
                    {safePercent  > 0 && <div style={{ width: `${safePercent}%`,  background: "linear-gradient(90deg,#16a34a,#22c55e)" }} />}
                    {askPercent   > 0 && <div style={{ width: `${askPercent}%`,   background: "linear-gradient(90deg,#d97706,#f59e0b)" }} />}
                    {avoidPercent > 0 && <div style={{ width: `${avoidPercent}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)" }} />}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: isRail ? 5 : 7 }}>
                  <Stat count={summary.likelySafe} label="Safe"  rgb="22,163,74"  isDark={isDark} small={isRail} />
                  <Stat count={summary.ask}        label="Ask"   rgb="217,119,6"  isDark={isDark} small={isRail} />
                  <Stat count={summary.avoid}      label="Avoid" rgb="220,38,38"  isDark={isDark} small={isRail} />
                </div>
                {!isRail && !isCompact && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{ width: 7, height: 7, borderRadius: 999, background: tierColor, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{tierLabel}</span>
                  </div>
                )}
              </div>

              {/* Safe item tags — default only */}
              {!isRail && !isCompact && safeItemNames.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {safeItemNames.map((name, i) => (
                    <span key={`${i}-${name}`} style={{
                      fontSize: 13, fontWeight: 700,
                      color: isDark ? "#86efac" : "#15803d",
                      background: isDark ? "#0a2414" : "#f0fdf4",
                      border: `1px solid ${isDark ? "#14532d" : "#bbf7d0"}`,
                      padding: "4px 10px", borderRadius: 999,
                      maxWidth: "100%", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      ✓ {name}
                    </span>
                  ))}
                </div>
              )}
            </div>
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

function Stat({ count, label, rgb, isDark, small }: { count: number; label: string; rgb: string; isDark: boolean; small?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: small ? 3 : 5,
      padding: small ? "4px 9px" : "5px 12px", borderRadius: 999,
      background: `rgba(${rgb},${isDark ? "0.18" : "0.10"})`,
      border: `1.5px solid rgba(${rgb},${isDark ? "0.4" : "0.25"})`,
      boxShadow: count > 0 ? `0 2px 10px rgba(${rgb},${isDark ? "0.3" : "0.18"})` : "none",
    }}>
      <span style={{ fontSize: small ? 13 : 16, fontWeight: 900, color: `rgb(${rgb})`, letterSpacing: "-0.03em" }}>{count}</span>
      <span style={{ fontSize: small ? 10 : 12, fontWeight: 800, color: `rgba(${rgb},${isDark ? "0.9" : "0.8"})` }}>{label}</span>
    </div>
  );
}