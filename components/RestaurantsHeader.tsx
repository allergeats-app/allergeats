"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { SettingsButton } from "@/components/SettingsButton";
import type { LayoutOption } from "@/app/restaurants/types";

const ICON_BTN: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 999, flexShrink: 0,
  background: "var(--c-card)", border: "1px solid var(--c-border)",
  display: "flex", alignItems: "center", justifyContent: "center",
  boxShadow: "0 1px 3px rgba(0,0,0,0.07)", color: "currentColor",
  cursor: "pointer",
};

export function RestaurantsHeader({
  locationLabel, locationMode, resultsSource,
  onLocationPress,
  query, setQuery,
  activeFilterCount, showFilterDrawer, setShowFilterDrawer,
  layout, setLayout,
  loading, filteredCount, radiusMiles,
}: {
  locationLabel: string;
  locationMode: "precise" | "approximate" | "cached" | "unavailable";
  resultsSource: "live" | "mock";
  onLocationPress: () => void;
  query: string; setQuery: (q: string) => void;
  activeFilterCount: number; showFilterDrawer: boolean; setShowFilterDrawer: (v: boolean) => void;
  layout: LayoutOption; setLayout: (l: LayoutOption) => void;
  loading: boolean; filteredCount: number; radiusMiles: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const placeholder = loading
    ? "Finding restaurants…"
    : `Search ${filteredCount} restaurant${filteredCount === 1 ? "" : "s"}…`;

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--c-hdr)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--c-border)",
      padding: "10px 16px 8px",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 8 }}>

        {/* ── Row 1: location · logo · scan + settings ─────────────────── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          minHeight: 36,
        }}>

          {/* Left: location */}
          <button
            type="button"
            onClick={onLocationPress}
            aria-label="Change location"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "none", border: "none", padding: 0,
              cursor: "pointer", minWidth: 0, justifyContent: "flex-start",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{
              fontSize: 11, color: "#9ca3af",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {locationLabel}
              {resultsSource === "mock"                                         && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · Sample</span>}
              {resultsSource === "live" && locationMode === "cached"            && <span style={{ color: "#f59e0b", fontWeight: 600 }}> · Saved</span>}
              {resultsSource === "live" && locationMode === "approximate"       && <span style={{ color: "#f59e0b", fontWeight: 600 }}> · Approx.</span>}
            </span>
          </button>

          {/* Center: logo — always mathematically centered */}
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Image src="/logo.png" alt="AllergEats" width={160} height={40} style={{ width: "auto", height: 28 }} priority />
          </Link>

          {/* Right: scan + settings */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
            <Link
              href="/scan"
              aria-label="Scan a menu"
              style={ICON_BTN}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </Link>
            <SettingsButton />
          </div>
        </div>

        {/* ── Row 2: search bar · filter icon · layout toggle ──────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

          {/* Search bar */}
          <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
            <svg
              width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true"
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label="Search restaurants"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "8px 28px 8px 32px",
                border: `1px solid ${query ? "#eb1700" : "var(--c-border)"}`,
                borderRadius: 10, fontSize: 13,
                background: query ? "#fef2f2" : "var(--c-card)",
                outline: "none", color: "var(--c-text)",
                transition: "border-color 0.15s, background 0.15s",
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  width: 18, height: 18, borderRadius: 999,
                  background: "#eb1700", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", color: "#fff",
                }}
              >
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Filter icon button with count badge */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            aria-expanded={showFilterDrawer}
            aria-haspopup="dialog"
            aria-label={`Filters${activeFilterCount > 0 ? `, ${activeFilterCount} active` : ""}`}
            style={{
              ...ICON_BTN,
              background: activeFilterCount > 0 ? "#eb1700" : "var(--c-card)",
              border: `1px solid ${activeFilterCount > 0 ? "#eb1700" : "var(--c-border)"}`,
              color: activeFilterCount > 0 ? "#fff" : "var(--c-text)",
              position: "relative",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
              <line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            {activeFilterCount > 0 && (
              <span style={{
                position: "absolute", top: -4, right: -4,
                minWidth: 16, height: 16, borderRadius: 999,
                background: "#fff", color: "#eb1700",
                fontSize: 9, fontWeight: 900,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "0 3px", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                lineHeight: 1,
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Layout toggle */}
          <div style={{ display: "flex", gap: 3 }} role="group" aria-label="View layout">
            {(["list", "grid", "map"] as LayoutOption[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                aria-pressed={layout === l}
                aria-label={l === "list" ? "List view" : l === "grid" ? "Grid view" : "Map view"}
                style={{
                  width: 28, height: 28, borderRadius: 7, border: "1.5px solid",
                  borderColor: layout === l ? "#eb1700" : "var(--c-border)",
                  background: layout === l ? "#eb1700" : "var(--c-card)",
                  color: layout === l ? "#fff" : "var(--c-sub)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {l === "list" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                ) : l === "grid" ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                )}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
