"use client";

import { useEffect, useRef, useState } from "react";
import type { ScoredRestaurant } from "@/lib/types";

type Props = {
  restaurants: ScoredRestaurant[];
  userLat?: number;
  userLng?: number;
  onSearchArea?: (lat: number, lng: number) => void;
  isDark?: boolean;
};

function safeColor(r: ScoredRestaurant): string {
  if (r.summary.total === 0) return "#9ca3af";
  const pct = (r.summary.likelySafe / r.summary.total) * 100;
  if (pct >= 70) return "#22c55e";
  if (pct >= 40) return "#f59e0b";
  return "#ef4444";
}

function makeMarkerHtml(r: ScoredRestaurant, dark: boolean): string {
  const color  = safeColor(r);
  const safePct = r.summary.total > 0
    ? Math.round((r.summary.likelySafe / r.summary.total) * 100)
    : null;
  const bg        = dark ? "#1c1c1e" : "#ffffff";
  const textColor = dark ? "#f2f2f7" : "#111111";
  const label     = safePct != null ? `${safePct}%` : "–";
  const shortName = r.name.length > 15 ? r.name.slice(0, 14) + "…" : r.name;

  // transform: translate(-50%, -50%) centers the pill on the coordinate point
  return `<div style="
    transform:translate(-50%,-50%);
    display:inline-flex;align-items:center;gap:5px;
    padding:5px 10px 5px 7px;border-radius:999px;
    background:${bg};border:2px solid ${color};
    box-shadow:0 2px 12px rgba(0,0,0,${dark ? "0.55" : "0.16"});
    font-family:Inter,Arial,sans-serif;white-space:nowrap;cursor:pointer;
  ">
    <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0;"></div>
    <span style="font-size:12px;font-weight:700;color:${textColor};">${shortName}</span>
    <span style="font-size:11px;font-weight:800;color:${color};">${label}</span>
  </div>`;
}

function makePopupHtml(r: ScoredRestaurant): string {
  const color      = safeColor(r);
  const total      = r.summary.total;
  const safePct    = total > 0 ? Math.round((r.summary.likelySafe / total) * 100) : null;
  const askPct     = total > 0 ? Math.round((r.summary.ask        / total) * 100) : 0;
  const avoidPct   = total > 0 ? Math.round((r.summary.avoid      / total) * 100) : 0;
  const distStr    = r.distance != null ? ` · ${r.distance} mi` : "";

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
    : `<span style="padding:3px 10px;border-radius:999px;background:#f3f4f6;font-size:11px;font-weight:700;color:#6b7280;">No menu data</span>`;

  const barHtml = total > 0
    ? `<div style="height:5px;border-radius:999px;background:#e5e7eb;overflow:hidden;display:flex;margin:10px 0 8px;">
        <div style="width:${safePct}%;background:#22c55e;transition:width 0.4s;"></div>
        <div style="width:${askPct}%;background:#f59e0b;"></div>
        <div style="width:${avoidPct}%;background:#ef4444;"></div>
      </div>
      <div style="display:flex;gap:10px;margin-bottom:10px;">
        <span style="font-size:11px;color:#15803d;font-weight:700;">${r.summary.likelySafe} safe</span>
        <span style="font-size:11px;color:#b45309;font-weight:700;">${r.summary.ask} ask</span>
        <span style="font-size:11px;color:#b91c1c;font-weight:700;">${r.summary.avoid} avoid</span>
      </div>`
    : `<div style="font-size:12px;color:#9ca3af;margin:8px 0 10px;">Tap to scan the menu</div>`;

  return `
    <div style="font-family:Inter,Arial,sans-serif;min-width:210px;padding:2px;">
      <div style="font-weight:900;font-size:15px;color:#111;line-height:1.2;margin-bottom:2px;">${r.name}</div>
      <div style="font-size:12px;color:#6b7280;margin-bottom:8px;">${r.cuisine}${distStr}</div>
      ${badgeHtml}
      ${barHtml}
      <a href="/restaurants/${r.id}"
        style="display:block;text-align:center;padding:9px;border-radius:12px;
          background:#eb1700;color:#fff;font-size:13px;font-weight:800;
          text-decoration:none;letter-spacing:0.01em;">
        View Menu Fit →
      </a>
    </div>`;
}

const POPUP_STYLES = `
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

export function RestaurantMap({ restaurants, userLat, userLng, onSearchArea, isDark = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<import("leaflet").Map | null>(null);
  const originRef    = useRef<{ lat: number; lng: number } | null>(null);
  const [pendingSearch, setPendingSearch] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      // Inject Leaflet CSS + custom popup CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id   = "leaflet-css";
        link.rel  = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
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

      // Zoom control bottom-right (less intrusive)
      L.control.zoom({ position: "bottomright" }).addTo(map);

      // CartoDB tiles — Voyager (light) or DarkMatter (dark)
      const tileUrl = isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

      L.tileLayer(tileUrl, {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

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

      // Restaurant markers
      for (const r of restaurants) {
        if (r.lat == null || r.lng == null) continue;

        const icon = L.divIcon({
          html: makeMarkerHtml(r, isDark),
          className: "",
          iconSize:    [0, 0],   // zero so the anchor point IS the coordinate
          iconAnchor:  [0, 0],   // pill is then centered via CSS transform
          popupAnchor: [0, -18], // popup appears above the pill
        });

        L.marker([r.lat, r.lng], { icon })
          .addTo(map)
          .bindPopup(makePopupHtml(r), { maxWidth: 260 });
      }

      // Show "Search this area" after panning
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

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "calc(100vh - 200px)",
          minHeight: 440,
          borderRadius: 20,
          overflow: "hidden",
          border: `1px solid ${isDark ? "#3a3a3c" : "#e5e7eb"}`,
          boxShadow: "0 4px 24px rgba(0,0,0,0.1)",
        }}
      />

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
              background: "#eb1700", color: "#fff",
              border: "none", borderRadius: 999,
              fontSize: 13, fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(235,23,0,0.4)",
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
    </div>
  );
}
