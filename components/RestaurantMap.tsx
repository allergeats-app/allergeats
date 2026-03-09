"use client";

import { useEffect, useRef, useState } from "react";
import type { ScoredRestaurant } from "@/lib/types";

type Props = {
  restaurants: ScoredRestaurant[];
  userLat?: number;
  userLng?: number;
  onSearchArea?: (lat: number, lng: number) => void;
};

function markerColor(r: ScoredRestaurant): string {
  if (r.summary.total === 0) return "#6b7280";
  const safePercent = (r.summary.likelySafe / r.summary.total) * 100;
  if (safePercent >= 70) return "#22c55e";
  if (safePercent >= 40) return "#f59e0b";
  return "#ef4444";
}

function makeSvgIcon(color: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="6" fill="white" fill-opacity="0.9"/>
    </svg>`
  )}`;
}

export function RestaurantMap({ restaurants, userLat, userLng, onSearchArea }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const originRef = useRef<{ lat: number; lng: number } | null>(null);
  const [pendingSearch, setPendingSearch] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // already initialized

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;

      // Inject Leaflet CSS once
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (cancelled || !containerRef.current) return;

      // Pick a center: user location → first restaurant → SF fallback
      const centerLat = userLat ?? restaurants[0]?.lat ?? 37.7749;
      const centerLng = userLng ?? restaurants[0]?.lng ?? -122.4194;
      originRef.current = { lat: centerLat, lng: centerLng };

      const map = L.map(containerRef.current, { zoomControl: true }).setView(
        [centerLat, centerLng],
        13
      );
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // User location marker
      if (userLat != null && userLng != null) {
        const userIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.35);"></div>`,
          className: "",
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        });
        L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup("<strong>You are here</strong>");
      }

      // Restaurant markers
      for (const r of restaurants) {
        if (r.lat == null || r.lng == null) continue;

        const color = markerColor(r);
        const safePercent = r.summary.total > 0
          ? Math.round((r.summary.likelySafe / r.summary.total) * 100)
          : null;

        const icon = L.icon({
          iconUrl: makeSvgIcon(color),
          iconSize: [28, 36],
          iconAnchor: [14, 36],
          popupAnchor: [0, -38],
        });

        const badgeHtml = safePercent != null
          ? `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${color};color:white;font-size:11px;font-weight:800;margin-top:4px;">${safePercent}% Safe</span>`
          : `<span style="display:inline-block;padding:2px 8px;border-radius:999px;background:#e5e7eb;color:#6b7280;font-size:11px;font-weight:700;margin-top:4px;">No data</span>`;

        const distHtml = r.distance != null
          ? `<span style="font-size:11px;color:#6b7280;">${r.distance} mi away · </span>`
          : "";

        const popup = `
          <div style="font-family:Inter,Arial,sans-serif;min-width:160px;">
            <div style="font-weight:900;font-size:14px;color:#111;margin-bottom:2px;">${r.name}</div>
            <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">${r.cuisine}</div>
            ${badgeHtml}
            <div style="margin-top:8px;font-size:11px;">
              ${distHtml}
              <a href="/restaurants/${r.id}" style="color:#eb1700;font-weight:700;text-decoration:none;">View menu →</a>
            </div>
          </div>
        `;

        L.marker([r.lat, r.lng], { icon }).addTo(map).bindPopup(popup);
      }

      // "Search this area" — show button when user pans far enough from origin
      map.on("moveend", () => {
        const center = map.getCenter();
        const origin = originRef.current;
        if (!origin) return;
        const dist = Math.sqrt(
          (center.lat - origin.lat) ** 2 + (center.lng - origin.lng) ** 2
        );
        if (dist > 0.008) {
          setPendingSearch({ lat: center.lat, lng: center.lng });
        } else {
          setPendingSearch(null);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "calc(100vh - 220px)",
          minHeight: 400,
          borderRadius: 20,
          overflow: "hidden",
          border: "1px solid var(--c-border)",
        }}
      />
      {pendingSearch && onSearchArea && (
        <div style={{
          position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)",
          zIndex: 1000, pointerEvents: "auto",
        }}>
          <button
            onClick={() => {
              originRef.current = pendingSearch;
              setPendingSearch(null);
              onSearchArea(pendingSearch.lat, pendingSearch.lng);
            }}
            style={{
              padding: "10px 20px",
              background: "#111", color: "#fff",
              border: "none", borderRadius: 999,
              fontSize: 13, fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              whiteSpace: "nowrap",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", marginRight: 6 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Search this area
          </button>
        </div>
      )}
    </div>
  );
}
