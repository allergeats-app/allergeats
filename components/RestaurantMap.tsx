"use client";

import { useEffect, useRef, useState } from "react";
import type { ScoredRestaurant } from "@/lib/types";

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

function makeMarkerHtml(r: ScoredRestaurant, dark: boolean): string {
  const color = safeColor(r);
  return `<div style="
    width:16px;height:16px;border-radius:50%;
    background:${color};
    border:2.5px solid ${dark ? "#1c1c1e" : "#fff"};
    box-shadow:0 1px 8px rgba(0,0,0,${dark ? "0.55" : "0.28"});
    cursor:pointer;
  "></div>`;
}

function makeTooltipHtml(r: ScoredRestaurant, dark: boolean): string {
  const color   = safeColor(r);
  const safePct = r.summary.total > 0
    ? Math.round((r.summary.likelySafe / r.summary.total) * 100)
    : null;
  const bg        = dark ? "rgba(28,28,30,0.96)" : "rgba(255,255,255,0.97)";
  const textColor = dark ? "#f2f2f7" : "#111";
  const label     = safePct != null ? `${safePct}% safe` : "No menu data";
  return `<div style="
    display:flex;align-items:center;gap:6px;
    padding:5px 10px;border-radius:999px;
    background:${bg};
    box-shadow:0 2px 10px rgba(0,0,0,${dark ? "0.5" : "0.18"});
    font-family:Inter,Arial,sans-serif;white-space:nowrap;pointer-events:none;
  ">
    <span style="font-size:12px;font-weight:700;color:${textColor};">${escHtml(r.name)}</span>
    <span style="font-size:11px;font-weight:800;color:${color};">${label}</span>
  </div>`;
}

function makePopupHtml(r: ScoredRestaurant, dark: boolean): string {
  const color      = safeColor(r);
  const total      = r.summary.total;
  const safePct    = total > 0 ? Math.round((r.summary.likelySafe / total) * 100) : null;
  const askPct     = total > 0 ? Math.round((r.summary.ask        / total) * 100) : 0;
  const avoidPct   = total > 0 ? Math.round((r.summary.avoid      / total) * 100) : 0;
  const distStr    = r.distance != null ? ` · ${r.distance} mi` : "";

  const textPrimary = dark ? "#f2f2f7"  : "#111111";
  const textSub     = dark ? "#8e8e93"  : "#6b7280";
  const barTrack    = dark ? "#2c2c2e"  : "#e5e7eb";
  const noDataBg    = dark ? "#2c2c2e"  : "#f3f4f6";
  const safeClr     = dark ? "#34d399"  : "#15803d";
  const askClr      = dark ? "#fbbf24"  : "#b45309";
  const avoidClr    = dark ? "#f87171"  : "#b91c1c";
  const ctaBg       = dark ? "#29d5e8"  : "#1fbdcc";
  const ctaFg       = dark ? "#ffffff"  : "#001f26";

  const badgeHtml = safePct != null
    ? `<span style="
        display:inline-flex;align-items:center;gap:4px;
        padding:3px 10px;border-radius:999px;
        background:${color}18;border:1.5px solid ${color};
        font-size:11px;font-weight:800;color:${color};
      ">
        <span style="width:6px;height:6px;border-radius:50%;background:${color};display:inline-block;"></span>
        ${safePct}% safe
      </span>`
    : `<span style="padding:3px 10px;border-radius:999px;background:${noDataBg};font-size:11px;font-weight:700;color:${textSub};">No menu data</span>`;

  const barHtml = total > 0
    ? `<div style="height:5px;border-radius:999px;background:${barTrack};overflow:hidden;display:flex;margin:10px 0 8px;">
        <div style="width:${safePct}%;background:#22c55e;transition:width 0.4s;"></div>
        <div style="width:${askPct}%;background:#f59e0b;"></div>
        <div style="width:${avoidPct}%;background:#ef4444;"></div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <span style="font-size:11px;color:${safeClr};font-weight:700;">${r.summary.likelySafe} safe</span>
        <span style="font-size:11px;color:${askClr};font-weight:700;">${r.summary.ask} ask</span>
        <span style="font-size:11px;color:${avoidClr};font-weight:700;">${r.summary.avoid} avoid</span>
      </div>`
    : `<div style="font-size:12px;color:${textSub};margin:8px 0 10px;">Tap to scan the menu</div>`;

  return `
    <div style="font-family:Inter,Arial,sans-serif;min-width:210px;padding:2px;">
      <div style="font-weight:900;font-size:15px;color:${textPrimary};line-height:1.2;margin-bottom:2px;">${escHtml(r.name)}</div>
      <div style="font-size:12px;color:${textSub};margin-bottom:8px;">${escHtml(r.cuisine ?? "")}${escHtml(distStr)}</div>
      ${badgeHtml}
      ${barHtml}
      <a href="/restaurants/${escHtml(r.id)}"
        style="display:block;text-align:center;padding:9px;border-radius:12px;
          background:${ctaBg};color:${ctaFg};font-size:13px;font-weight:800;
          text-decoration:none;letter-spacing:0.01em;">
        View Menu Fit →
      </a>
    </div>`;
}

const POPUP_STYLES = `
  .allegeats-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
  .allegeats-tooltip::before { display: none !important; }
  .leaflet-popup-content-wrapper {
    border-radius: 20px !important;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
    border: 1px solid #e5e7eb !important;
    padding: 14px 16px !important;
  }
  .leaflet-popup-content { margin: 0 !important; }
  .leaflet-popup-tip-container { display: none !important; }
  .leaflet-popup-close-button {
    top: 10px !important; right: 12px !important;
    font-size: 18px !important; color: #9ca3af !important;
    font-weight: 400 !important;
  }
`;

export function RestaurantMap({ restaurants, userLat, userLng, centerLat, centerLng, onSearchArea, isDark = false }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const mapRef         = useRef<import("leaflet").Map | null>(null);
  const markerGroupRef = useRef<import("leaflet").LayerGroup | null>(null);
  const LRef           = useRef<typeof import("leaflet") | null>(null);
  const originRef      = useRef<{ lat: number; lng: number } | null>(null);
  const didFitRef      = useRef(false);
  const [pendingSearch, setPendingSearch] = useState<{ lat: number; lng: number } | null>(null);
  const [menuOnly, setMenuOnly] = useState(false);
  const [satView, setSatView]   = useState(true);
  const tileLayerRef  = useRef<import("leaflet").TileLayer | null>(null);
  const labelLayerRef = useRef<import("leaflet").TileLayer | null>(null);

  // ── Map init (once on mount) ──────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      LRef.current = L;

      if (!document.getElementById("leaflet-popup-css")) {
        const style = document.createElement("style");
        style.id        = "leaflet-popup-css";
        style.textContent = POPUP_STYLES;
        document.head.appendChild(style);
      }

      if (cancelled || !containerRef.current) return;

      const centerLat = userLat ?? restaurants[0]?.lat ?? 37.7749;
      const centerLng = userLng ?? restaurants[0]?.lng ?? -122.4194;
      originRef.current = { lat: centerLat, lng: centerLng };

      const map = L.map(containerRef.current, { zoomControl: false }).setView(
        [centerLat, centerLng], 14
      );
      mapRef.current = map;

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // Satellite base layer (default)
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
      ).addTo(map);

      // Street-name labels overlay on satellite
      labelLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { attribution: "", maxZoom: 19, opacity: 0.9 }
      ).addTo(map);

      // User location — pulsing blue dot
      if (userLat != null && userLng != null) {
        const userIcon = L.divIcon({
          html: `<div style="
            width:16px;height:16px;border-radius:50%;
            background:#3b82f6;border:3px solid white;
            box-shadow:0 0 0 4px rgba(59,130,246,0.3);
          "></div>`,
          className: "",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup("<strong style='font-family:Inter,Arial,sans-serif'>You are here</strong>");
      }

      // Marker layer group — updated reactively in the effect below
      markerGroupRef.current = L.layerGroup().addTo(map);

      map.invalidateSize();
      requestAnimationFrame(() => { if (!cancelled) map.invalidateSize(); });
      setTimeout(()           => { if (!cancelled) map.invalidateSize(); }, 400);

      map.on("moveend", () => {
        const center = map.getCenter();
        const origin = originRef.current;
        if (!origin) return;
        const dist = Math.sqrt(
          (center.lat - origin.lat) ** 2 + (center.lng - origin.lng) ** 2
        );
        setPendingSearch(dist > 0.008 ? { lat: center.lat, lng: center.lng } : null);
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Re-center map when search location changes ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || centerLat == null || centerLng == null) return;
    originRef.current = { lat: centerLat, lng: centerLng };
    setPendingSearch(null);
    // Keep current zoom so "Search this area" doesn't zoom out
    map.setView([centerLat, centerLng], map.getZoom());
  }, [centerLat, centerLng]);

  // ── Marker update (restaurants list or menuOnly filter changes) ───────────
  useEffect(() => {
    const L     = LRef.current;
    const group = markerGroupRef.current;
    const map   = mapRef.current;
    if (!L || !group || !map) return;

    group.clearLayers();

    const visible = menuOnly
      ? restaurants.filter((r) => r.scoredItems.length > 0)
      : restaurants;

    const coords: [number, number][] = [];

    for (const r of visible) {
      if (r.lat == null || r.lng == null) continue;
      coords.push([r.lat, r.lng]);

      const icon = L.divIcon({
        html:        makeMarkerHtml(r, isDark),
        className:   "",
        iconSize:    [16, 16],
        iconAnchor:  [8, 8],
        popupAnchor: [0, -12],
      });

      L.marker([r.lat, r.lng], { icon })
        .addTo(group)
        .bindTooltip(makeTooltipHtml(r, isDark), {
          direction: "top",
          offset: [0, -10],
          opacity: 1,
          className: "allegeats-tooltip",
        })
        .bindPopup(makePopupHtml(r, isDark), { maxWidth: 260 });
    }

    // Auto-fit on first load only — don't fight the user's panning after that
    if (!didFitRef.current && coords.length > 1) {
      try {
        map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 15 });
      } catch { /* ignore */ }
      didFitRef.current = true;
    }
  }, [restaurants, menuOnly, isDark]);

  // ── Swap tile layers when satView changes ─────────────────────────────────
  useEffect(() => {
    const L   = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Remove existing tile layers
    if (tileLayerRef.current)  { map.removeLayer(tileLayerRef.current);  }
    if (labelLayerRef.current) { map.removeLayer(labelLayerRef.current); }

    if (satView) {
      tileLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "© Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
      ).addTo(map);
      labelLayerRef.current = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
        { attribution: "", maxZoom: 19, opacity: 0.9 }
      ).addTo(map);
    } else {
      const streetUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
      tileLayerRef.current = L.tileLayer(streetUrl, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      labelLayerRef.current = null;
    }

    // Markers live in Leaflet's marker pane (z-index 600), always above tile layers.
  }, [satView, isDark]);

  const menuCount = restaurants.filter((r) => r.scoredItems.length > 0).length;
  const chipBg    = isDark ? "rgba(28,28,30,0.9)" : "rgba(255,255,255,0.92)";
  const chipText  = isDark ? "#f2f2f7" : "#374151";

  return (
    <div style={{ position: "relative", overflow: "hidden", isolation: "isolate" }}>
      <div
        ref={containerRef}
        className="restaurant-map-container"
        style={{ width: "100%", height: "calc(100dvh - max(96px, calc(88px + env(safe-area-inset-top))))", minHeight: 300 }}
      />

      {/* Search this area */}
      {pendingSearch && onSearchArea && (
        <div style={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000,
        }}>
          <button
            onClick={() => {
              originRef.current = pendingSearch;
              setPendingSearch(null);
              onSearchArea(pendingSearch.lat, pendingSearch.lng);
            }}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              background: "#1fbdcc", color: "var(--c-brand-fg)",
              border: "none", borderRadius: 999,
              fontSize: 13, fontWeight: 800,
              cursor: "pointer",
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

      {/* Menu filter chips */}
      <div style={{
        position: "absolute", top: 14, left: 14,
        zIndex: 1000, display: "flex", gap: 6,
      }}>
        <button
          onClick={() => setMenuOnly(false)}
          aria-pressed={!menuOnly}
          style={{
            padding: "7px 13px", borderRadius: 999,
            background: !menuOnly ? (isDark ? "#f2f2f7" : "#111827") : chipBg,
            color:      !menuOnly ? (isDark ? "#111827" : "#fff")    : chipText,
            border: "none",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            whiteSpace: "nowrap",
          }}
        >
          All · {restaurants.length}
        </button>
        <button
          onClick={() => setMenuOnly(true)}
          aria-pressed={menuOnly}
          style={{
            padding: "7px 13px", borderRadius: 999,
            background: menuOnly ? "#1fbdcc" : chipBg,
            color:      menuOnly ? "#fff"    : chipText,
            border: "none",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            whiteSpace: "nowrap",
            opacity: menuCount === 0 ? 0.5 : 1,
          }}
        >
          Has Menu · {menuCount}
        </button>
      </div>

      {/* Satellite / Street toggle */}
      <div style={{ position: "absolute", top: 14, right: 14, zIndex: 1000 }}>
        <button
          onClick={() => setSatView((v) => !v)}
          aria-label={satView ? "Switch to street map" : "Switch to satellite"}
          style={{
            padding: "7px 13px", borderRadius: 999,
            background: chipBg, color: chipText,
            border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            display: "flex", alignItems: "center", gap: 5,
          }}
        >
          {satView ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              Street
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              Satellite
            </>
          )}
        </button>
      </div>

      {/* Safety legend */}
      <div style={{
        position: "absolute", bottom: 54, left: 14,
        zIndex: 1000,
        background: chipBg, backdropFilter: "blur(8px)",
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
