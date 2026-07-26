"use client";

import { useEffect, useRef, useState } from "react";
import type { ScoredRestaurant } from "@/lib/types";

type SafetyLevel = "safe" | "caution" | "unsafe" | "nodata";

type Props = {
  restaurants: ScoredRestaurant[];
  userLat?: number;
  userLng?: number;
  /** The active search center (may differ from GPS position). When this changes, the map re-centers. */
  centerLat?: number;
  centerLng?: number;
  onSearchArea?: (lat: number, lng: number) => void;
  isDark?: boolean;
};

function escHtml(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}

function safeColor(r: ScoredRestaurant): string {
  if (r.summary.total === 0) return "#9ca3af";
  const pct = (r.summary.likelySafe / r.summary.total) * 100;
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

function safePercent(r: ScoredRestaurant): number | null {
  if (r.summary.total === 0) return null;
  return Math.round((r.summary.likelySafe / r.summary.total) * 100);
}

function safetyLevel(r: ScoredRestaurant): SafetyLevel {
  if (r.summary.total === 0) return "nodata";
  const pct = (r.summary.likelySafe / r.summary.total) * 100;
  if (pct >= 70) return "safe";
  if (pct >= 40) return "caution";
  return "unsafe";
}

function makePillHtml(r: ScoredRestaurant, isDark: boolean): string {
  const color = safeColor(r);
  const pct = safePercent(r);
  const label = pct != null ? `${pct}%` : "?";
  const bg = isDark ? "#1c1c1e" : "#ffffff";
  const border = isDark ? "#3a3a3c" : "#d1d5db";
  const nameColor = isDark ? "#f2f2f7" : "#111827";
  const displayName = r.name.length > 18 ? r.name.slice(0, 17) + "…" : r.name;

  return `<div style="position:relative;display:inline-block;padding-bottom:7px;pointer-events:auto;">
    <div style="
      display:flex;align-items:center;gap:6px;
      padding:5px 10px 5px 9px;
      background:${bg};border:1.5px solid ${border};
      border-radius:999px;
      box-shadow:0 2px 10px rgba(0,0,0,${isDark ? "0.45" : "0.12"}),0 1px 3px rgba(0,0,0,${isDark ? "0.3" : "0.07"});
      white-space:nowrap;cursor:pointer;user-select:none;
    ">
      <span style="font-size:12px;font-weight:700;color:${nameColor};max-width:120px;overflow:hidden;text-overflow:ellipsis;">${escHtml(displayName)}</span>
      <span style="display:flex;align-items:center;gap:3px;flex-shrink:0;">
        <span style="width:6px;height:6px;border-radius:50%;background:${color};flex-shrink:0;"></span>
        <span style="font-size:11px;font-weight:800;color:${color};">${label}</span>
      </span>
    </div>
    <div style="
      position:absolute;bottom:2px;left:50%;
      transform:translateX(-50%) rotate(45deg);
      width:8px;height:8px;
      background:${bg};border-right:1.5px solid ${border};border-bottom:1.5px solid ${border};
    "></div>
  </div>`;
}

function makePopupHtml(r: ScoredRestaurant, isDark: boolean): string {
  const color    = safeColor(r);
  const total    = r.summary.total;
  const safePct  = total > 0 ? Math.round((r.summary.likelySafe / total) * 100) : null;
  const askPct   = total > 0 ? Math.round((r.summary.ask        / total) * 100) : 0;
  const avoidPct = total > 0 ? Math.round((r.summary.avoid      / total) * 100) : 0;
  const distStr  = r.distance != null ? ` · ${r.distance} mi` : "";

  const textPrimary = isDark ? "#f2f2f7" : "#111827";
  const textSub     = isDark ? "#8e8e93" : "#6b7280";
  const barTrack    = isDark ? "#2c2c2e" : "#f3f4f6";
  const safeClr     = isDark ? "#34d399" : "#15803d";
  const askClr      = isDark ? "#fbbf24" : "#b45309";
  const avoidClr    = isDark ? "#f87171" : "#b91c1c";
  const noDataBg    = isDark ? "#2c2c2e" : "#f3f4f6";

  const badgeHtml = safePct != null
    ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:${color}18;border:1.5px solid ${color};font-size:11px;font-weight:800;color:${color};">
        <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
        ${safePct}% safe
      </span>`
    : `<span style="padding:3px 10px;border-radius:999px;background:${noDataBg};font-size:11px;font-weight:700;color:${textSub};">No menu data</span>`;

  const barHtml = total > 0
    ? `<div style="height:5px;border-radius:999px;background:${barTrack};overflow:hidden;display:flex;margin:10px 0 8px;">
        <div style="width:${safePct}%;background:#22c55e;"></div>
        <div style="width:${askPct}%;background:#f59e0b;"></div>
        <div style="width:${avoidPct}%;background:#ef4444;"></div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <span style="font-size:11px;color:${safeClr};font-weight:700;">${r.summary.likelySafe} safe</span>
        <span style="font-size:11px;color:${askClr};font-weight:700;">${r.summary.ask} ask</span>
        <span style="font-size:11px;color:${avoidClr};font-weight:700;">${r.summary.avoid} avoid</span>
      </div>`
    : `<div style="font-size:12px;color:${textSub};margin:8px 0 10px;">Tap to scan the menu</div>`;

  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-width:210px;padding:2px;">
    <div style="font-weight:900;font-size:15px;color:${textPrimary};line-height:1.2;margin-bottom:2px;">${escHtml(r.name)}</div>
    <div style="font-size:12px;color:${textSub};margin-bottom:8px;">${escHtml(r.cuisine ?? "")}${escHtml(distStr)}</div>
    ${badgeHtml}
    ${barHtml}
    <a href="/restaurants/${escHtml(r.id)}" style="display:block;text-align:center;padding:9px;border-radius:12px;background:var(--c-brand);color:var(--c-brand-fg,#fff);font-size:13px;font-weight:800;text-decoration:none;letter-spacing:0.01em;">
      View Menu Fit →
    </a>
  </div>`;
}

function getStyleUrl(isDark: boolean): string {
  return isDark
    ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
    : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";
}

const SATELLITE_STYLE = {
  version: 8 as const,
  sources: {
    satellite: {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
      attribution: "© Esri, Maxar, Earthstar Geographics",
    },
    labels: {
      type: "raster" as const,
      tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
      tileSize: 256,
    },
  },
  layers: [
    { id: "satellite", type: "raster" as const, source: "satellite" },
    { id: "labels",    type: "raster" as const, source: "labels" },
  ],
  glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
  sprite: "",
};

const MAP_CSS = `
  .ae-popup .maplibregl-popup-content {
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18);
    border: 1px solid var(--c-border, #e5e7eb);
    padding: 14px 16px;
    background: var(--c-card, #fff);
  }
  .ae-popup .maplibregl-popup-tip { display: none; }
  .ae-popup .maplibregl-popup-close-button {
    top: 12px; right: 14px;
    font-size: 18px; line-height: 1;
    color: var(--c-sub, #6b7280);
    background: transparent; border: none;
    padding: 2px 6px;
  }
  .maplibregl-ctrl-group {
    border-radius: 12px !important;
    box-shadow: 0 2px 10px rgba(0,0,0,0.15) !important;
    overflow: hidden;
  }
  .maplibregl-ctrl-attrib {
    font-size: 9px !important;
  }
`;

const SAFETY_LAYERS: { key: SafetyLevel; color: string; label: string; sub: string }[] = [
  { key: "safe",    color: "#22c55e", label: "Safe",          sub: "≥70% items" },
  { key: "caution", color: "#f59e0b", label: "Caution",       sub: "40–69%"     },
  { key: "unsafe",  color: "#ef4444", label: "Unsafe",        sub: "<40%"       },
  { key: "nodata",  color: "#9ca3af", label: "No menu data",  sub: ""           },
];

export function RestaurantMap({ restaurants, userLat, userLng, centerLat, centerLng, onSearchArea, isDark = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("maplibre-gl").Map | null>(null);
  const markersRef   = useRef<import("maplibre-gl").Marker[]>([]);
  const originRef    = useRef<{ lat: number; lng: number } | null>(null);
  const didFitRef    = useRef(false);
  const [pendingSearch, setPendingSearch] = useState<{ lat: number; lng: number } | null>(null);
  const [menuOnly, setMenuOnly]     = useState(false);
  const [satView, setSatView]       = useState(false);
  const [layersOpen, setLayersOpen] = useState(false);
  const [tilt3d, setTilt3d]         = useState(true);
  const [safetyFilter, setSafetyFilter] = useState<Record<SafetyLevel, boolean>>({
    safe: true, caution: true, unsafe: true, nodata: true,
  });

  // ── Map init (once on mount) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const maplibregl = await import("maplibre-gl");

      if (!document.getElementById("maplibre-ae-css")) {
        const style = document.createElement("style");
        style.id = "maplibre-ae-css";
        style.textContent = MAP_CSS;
        document.head.appendChild(style);
      }

      if (cancelled || !containerRef.current) return;

      const initLat = userLat ?? restaurants[0]?.lat ?? 37.7749;
      const initLng = userLng ?? restaurants[0]?.lng ?? -122.4194;
      originRef.current = { lat: initLat, lng: initLng };

      maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getStyleUrl(isDark),
        center: [initLng, initLat],
        zoom: 14,
        pitch: 40, // 3D tilt auto-selected
        attributionControl: false,
      });
      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");

      if (userLat != null && userLng != null) {
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`;
        new maplibregl.Marker({ element: el })
          .setLngLat([userLng, userLat])
          .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(`<strong style="font-family:-apple-system,sans-serif">You are here</strong>`))
          .addTo(map);
      }

      map.on("moveend", () => {
        const { lat, lng } = map.getCenter();
        const origin = originRef.current;
        if (!origin) return;
        const dist = Math.sqrt((lat - origin.lat) ** 2 + (lng - origin.lng) ** 2);
        setPendingSearch(dist > 0.008 ? { lat, lng } : null);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-center when search location changes ────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || centerLat == null || centerLng == null) return;
    originRef.current = { lat: centerLat, lng: centerLng };
    setPendingSearch(null);
    mapRef.current.setCenter([centerLng, centerLat]);
  }, [centerLat, centerLng]);

  // ── Style swap when sat/dark changes ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(satView ? SATELLITE_STYLE : getStyleUrl(isDark));
  }, [satView, isDark]);

  // ── 3D tilt toggle ────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch: tilt3d ? 40 : 0, duration: 400 });
  }, [tilt3d]);

  // ── Rebuild markers when restaurants, filters, or theme changes ───────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    let cancelled = false;

    const rebuildMarkers = async () => {
      if (cancelled) return;
      const maplibregl = await import("maplibre-gl");
      if (cancelled) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const visible = restaurants.filter((r) => {
        if (menuOnly && r.scoredItems.length === 0) return false;
        return safetyFilter[safetyLevel(r)];
      });

      const bounds: [number, number][] = [];

      for (const r of visible) {
        if (r.lat == null || r.lng == null) continue;
        bounds.push([r.lng, r.lat]);

        const el = document.createElement("div");
        el.innerHTML = makePillHtml(r, isDark);

        const popup = new maplibregl.Popup({
          closeButton: true,
          maxWidth: "280px",
          className: "ae-popup",
          offset: 10,
        }).setHTML(makePopupHtml(r, isDark));

        const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([r.lng, r.lat])
          .setPopup(popup)
          .addTo(map);

        markersRef.current.push(marker);
      }

      if (!didFitRef.current && bounds.length > 1) {
        const lngs = bounds.map((b) => b[0]);
        const lats = bounds.map((b) => b[1]);
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          { padding: 48, maxZoom: 15 }
        );
        didFitRef.current = true;
      }
    };

    if (map.isStyleLoaded()) {
      rebuildMarkers();
    } else {
      map.once("load", rebuildMarkers);
    }

    return () => {
      cancelled = true;
      map.off("load", rebuildMarkers);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, menuOnly, isDark, safetyFilter.safe, safetyFilter.caution, safetyFilter.unsafe, safetyFilter.nodata]);

  const menuCount = restaurants.filter((r) => r.scoredItems.length > 0).length;
  const chipBg    = isDark ? "rgba(28,28,30,0.92)" : "rgba(255,255,255,0.94)";
  const chipText  = "var(--c-text)";
  const divider   = isDark ? "#2c2c2e" : "#f0f0f0";
  const subText   = isDark ? "#6b7280" : "#9ca3af";
  const inactiveDot = isDark ? "#4b5563" : "#d1d5db";

  return (
    <div style={{ position: "relative", overflow: "hidden", isolation: "isolate" }}>
      <div
        ref={containerRef}
        className="restaurant-map-container"
        style={{ width: "100%", height: "calc(100dvh - max(96px, calc(88px + env(safe-area-inset-top))))", minHeight: 300 }}
      />

      {/* Search this area */}
      {pendingSearch && onSearchArea && (
        <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          <button
            onClick={() => {
              originRef.current = pendingSearch;
              setPendingSearch(null);
              onSearchArea(pendingSearch.lat, pendingSearch.lng);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              background: "var(--c-brand)", color: "var(--c-brand-fg)",
              border: "none", borderRadius: 999,
              fontSize: 13, fontWeight: 800, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(31,189,204,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            Search this area
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ position: "absolute", top: 14, left: 14, zIndex: 10, display: "flex", gap: 6 }}>
        <button
          onClick={() => setMenuOnly(false)}
          aria-pressed={!menuOnly}
          style={{
            padding: "7px 13px", borderRadius: 999,
            background: !menuOnly ? "var(--c-text)" : chipBg,
            color: !menuOnly ? (isDark ? "#111827" : "#fff") : chipText,
            border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)", whiteSpace: "nowrap",
          }}
        >
          All · {restaurants.length}
        </button>
        <button
          onClick={() => setMenuOnly(true)}
          aria-pressed={menuOnly}
          style={{
            padding: "7px 13px", borderRadius: 999,
            background: menuOnly ? "var(--c-brand)" : chipBg,
            color: menuOnly ? "#fff" : chipText,
            border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)", whiteSpace: "nowrap",
            opacity: menuCount === 0 ? 0.5 : 1,
          }}
        >
          Has Menu · {menuCount}
        </button>
      </div>

      {/* Click-outside overlay */}
      {layersOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 15 }}
          onClick={() => setLayersOpen(false)}
        />
      )}

      {/* Layers button + panel */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 20 }}>
        <button
          onClick={() => setLayersOpen((v) => !v)}
          aria-label="Map layers"
          aria-expanded={layersOpen}
          style={{
            padding: "7px 13px", borderRadius: 999,
            background: layersOpen ? "var(--c-text)" : chipBg,
            color: layersOpen ? (isDark ? "#111827" : "#fff") : chipText,
            border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            display: "flex", alignItems: "center", gap: 5,
            WebkitTapHighlightColor: "transparent",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
          Layers
        </button>

        {layersOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            width: 228,
            background: isDark ? "rgba(22,22,24,0.97)" : "rgba(255,255,255,0.97)",
            WebkitBackdropFilter: "blur(20px)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            boxShadow: isDark
              ? "0 8px 40px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.06) inset"
              : "0 8px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}>

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px 12px",
              borderBottom: `1px solid ${divider}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={chipText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                  <polyline points="2 17 12 22 22 17"/>
                  <polyline points="2 12 12 17 22 12"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.07em", color: chipText }}>MAP LAYERS</span>
              </div>
              <button
                onClick={() => setLayersOpen(false)}
                aria-label="Close layers panel"
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  background: isDark ? "#3a3a3c" : "#f3f4f6",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: subText, fontSize: 14, fontWeight: 700,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                ✕
              </button>
            </div>

            {/* Map style toggle */}
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${divider}` }}>
              <div style={{ display: "flex", gap: 8 }}>
                {/* Street */}
                <button
                  onClick={() => setSatView(false)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: !satView ? (isDark ? "#3a3a3c" : "#f0f0f5") : "transparent",
                    border: "none", borderRadius: 12, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={!satView ? chipText : subText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/>
                    <line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: !satView ? chipText : subText }}>Street</span>
                </button>
                {/* Satellite */}
                <button
                  onClick={() => setSatView(true)}
                  style={{
                    flex: 1, padding: "10px 0",
                    background: satView ? (isDark ? "#3a3a3c" : "#f0f0f5") : "transparent",
                    border: "none", borderRadius: 12, cursor: "pointer",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke={satView ? chipText : subText} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  <span style={{ fontSize: 10, fontWeight: 700, color: satView ? chipText : subText }}>Satellite</span>
                </button>
              </div>
            </div>

            {/* Safety score filters */}
            <div style={{ padding: "10px 0 6px" }}>
              <div style={{ padding: "0 16px 6px", fontSize: 10, fontWeight: 800, letterSpacing: "0.07em", color: subText }}>
                SAFETY SCORE
              </div>
              {SAFETY_LAYERS.map(({ key, color, label, sub }) => {
                const active = safetyFilter[key];
                return (
                  <button
                    key={key}
                    onClick={() => setSafetyFilter((f) => ({ ...f, [key]: !f[key] }))}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 16px",
                      background: active ? `${color}14` : "transparent",
                      border: "none", cursor: "pointer", textAlign: "left",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                      background: active ? color : "transparent",
                      border: `2px solid ${active ? color : inactiveDot}`,
                      transition: "background 0.15s, border-color 0.15s",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? chipText : subText, flex: 1 }}>{label}</span>
                    {sub && <span style={{ fontSize: 11, color: inactiveDot, fontWeight: 500 }}>{sub}</span>}
                  </button>
                );
              })}
            </div>

            <div style={{ height: 1, background: divider, margin: "0 16px" }} />

            {/* Has menu only */}
            <div style={{ padding: "6px 0" }}>
              <button
                onClick={() => setMenuOnly((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 16px",
                  background: menuOnly ? "rgba(31,189,204,0.10)" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: menuOnly ? "var(--c-brand)" : "transparent",
                  border: `2px solid ${menuOnly ? "var(--c-brand)" : inactiveDot}`,
                  transition: "background 0.15s, border-color 0.15s",
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: menuOnly ? chipText : subText, flex: 1 }}>Has menu data</span>
                <span style={{ fontSize: 11, color: inactiveDot, fontWeight: 500 }}>{menuCount}</span>
              </button>
            </div>

            <div style={{ height: 1, background: divider, margin: "0 16px" }} />

            {/* 3D Tilt */}
            <div style={{ padding: "6px 0 4px" }}>
              <button
                onClick={() => setTilt3d((v) => !v)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 16px",
                  background: tilt3d ? (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: tilt3d ? (isDark ? "#f2f2f7" : "#111827") : "transparent",
                  border: `2px solid ${tilt3d ? (isDark ? "#f2f2f7" : "#111827") : inactiveDot}`,
                  transition: "background 0.15s, border-color 0.15s",
                }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: tilt3d ? chipText : subText, flex: 1 }}>3D Tilt</span>
              </button>
            </div>

          </div>
        )}
      </div>

      {/* Safety legend */}
      <div style={{
        position: "absolute", bottom: 54, left: 14, zIndex: 10,
        background: chipBg, WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)",
        borderRadius: 10, padding: "6px 10px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
        display: "flex", flexDirection: "column", gap: 3,
      }}>
        {([
          { color: "#22c55e", label: "≥70% safe" },
          { color: "#f59e0b", label: "40–69%" },
          { color: "#ef4444", label: "<40%" },
          { color: "#9ca3af", label: "No data" },
        ] as const).map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: chipText, lineHeight: 1 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
