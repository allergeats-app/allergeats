"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SettingsButton } from "@/components/SettingsButton";
import type { LayoutOption } from "@/app/restaurants/types";

// ─── Design tokens ────────────────────────────────────────────────────────────
const ICON: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "var(--c-card)", border: "1px solid var(--c-border)",
  cursor: "pointer", color: "var(--c-text)",
  WebkitTapHighlightColor: "transparent",
  transition: "background 0.12s, border-color 0.12s",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function RestaurantsHeader({
  locationLabel,
  locationMode,
  resultsSource,
  onLocationPress,
  query, setQuery,
  activeFilterCount, showFilterDrawer, setShowFilterDrawer,
  layout, setLayout,
  loading, filteredCount,
}: {
  locationLabel: string;
  locationMode: "precise" | "approximate" | "cached" | "unavailable";
  resultsSource: "live" | "mock";
  onLocationPress: () => void;
  query: string; setQuery: (q: string) => void;
  activeFilterCount: number; showFilterDrawer: boolean; setShowFilterDrawer: (v: boolean) => void;
  layout: LayoutOption; setLayout: (l: LayoutOption) => void;
  loading: boolean; filteredCount: number;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep search open if there's an active query
  const isSearchActive = searchOpen || query.length > 0;

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  // Dot color = GPS signal quality
  const dotColor =
    locationMode === "precise"     ? "#22c55e" :
    locationMode === "cached"      ? "#f59e0b" :
    locationMode === "approximate" ? "#f59e0b" : "#d1d5db";

  return (
    <header
      role="banner"
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--c-border)",
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: 8,
        paddingLeft:  "max(16px, env(safe-area-inset-left))",
        paddingRight: "max(16px, env(safe-area-inset-right))",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>

        {/* ── Single 44px row — two states animated on same plane ─────────── */}
        <div style={{ position: "relative", height: 44 }}>

          {/* ── DEFAULT STATE ───────────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute", inset: 0,
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              opacity: isSearchActive ? 0 : 1,
              transform: isSearchActive ? "scale(0.96) translateY(-3px)" : "scale(1) translateY(0)",
              transition: "opacity 0.18s ease, transform 0.18s ease",
              pointerEvents: isSearchActive ? "none" : "auto",
            }}
          >
            {/* Left: location pill */}
            <button
              type="button"
              onClick={onLocationPress}
              aria-label="Change location"
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "none", border: "none", padding: 0,
                cursor: "pointer", minWidth: 0,
                WebkitTapHighlightColor: "transparent",
                overflow: "hidden",
              }}
            >
              {/* GPS quality dot */}
              <span style={{
                width: 7, height: 7, borderRadius: 999, flexShrink: 0,
                background: dotColor,
                boxShadow: locationMode === "precise" ? `0 0 0 3px ${dotColor}28` : "none",
                transition: "background 0.3s, box-shadow 0.3s",
              }} />
              <span style={{
                fontSize: 13, fontWeight: 600, color: "var(--c-text)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                maxWidth: 110,
              }}>
                {locationLabel}
              </span>
              {resultsSource === "mock" && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.04em", flexShrink: 0 }}>
                  DEMO
                </span>
              )}
              {/* chevron */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--c-sub)"
                strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {/* Center: logo — grid column keeps it from ever overlapping neighbors */}
            <Link
              href="/"
              aria-label="AllergEats home"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                textDecoration: "none",
              }}
            >
              <Image
                src="/logo.png" alt="AllergEats"
                width={120} height={30}
                style={{ width: "auto", height: 24 }}
                priority
              />
            </Link>

            {/* Right: icon cluster */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>

              {/* Search */}
              <button type="button" onClick={openSearch} aria-label="Search restaurants" style={ICON}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>

              {/* Filter — fills red when active */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                aria-expanded={showFilterDrawer}
                aria-haspopup="dialog"
                aria-label={`Filters${activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ""}`}
                style={{
                  ...ICON,
                  background: activeFilterCount > 0 ? "#eb1700" : "var(--c-card)",
                  borderColor: activeFilterCount > 0 ? "#eb1700" : "var(--c-border)",
                  color: activeFilterCount > 0 ? "#fff" : "var(--c-text)",
                  position: "relative",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                {activeFilterCount > 0 && (
                  <span style={{
                    position: "absolute", top: -5, right: -5,
                    minWidth: 16, height: 16, borderRadius: 999,
                    background: "#fff", color: "#eb1700",
                    fontSize: 9, fontWeight: 900, lineHeight: 1,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                    animation: "popIn 0.15s ease",
                  }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Layout toggle — single icon, flips on tap */}
              <button
                type="button"
                onClick={() => setLayout(layout === "list" ? "map" : "list")}
                aria-label={layout === "list" ? "Switch to map" : "Switch to list"}
                aria-pressed={layout === "map"}
                style={{
                  ...ICON,
                  background: layout === "map" ? "var(--c-card)" : "var(--c-card)",
                  color: layout === "map" ? "#eb1700" : "var(--c-sub)",
                  borderColor: layout === "map" ? "#eb1700" : "var(--c-border)",
                }}
              >
                {layout === "list" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                    <line x1="8" y1="2" x2="8" y2="18"/>
                    <line x1="16" y1="6" x2="16" y2="22"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                )}
              </button>

              {/* Settings — existing dropdown component */}
              <SettingsButton />

            </div>
          </div>

          {/* ── SEARCH STATE ─────────────────────────────────────────────────── */}
          <div
            style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", gap: 8,
              opacity: isSearchActive ? 1 : 0,
              transform: isSearchActive ? "translateY(0)" : "translateY(6px) scale(0.98)",
              transition: "opacity 0.18s ease, transform 0.18s ease",
              pointerEvents: isSearchActive ? "auto" : "none",
            }}
          >
            {/* Cancel */}
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Cancel search"
              style={{
                background: "none", border: "none", padding: "0 2px",
                cursor: "pointer", color: "var(--c-sub)",
                fontSize: 14, fontWeight: 600, flexShrink: 0,
                WebkitTapHighlightColor: "transparent",
                letterSpacing: "-0.01em",
              }}
            >
              Cancel
            </button>

            {/* Search input */}
            <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="var(--c-sub)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
                style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
                placeholder={
                  loading
                    ? "Finding restaurants…"
                    : `Search ${filteredCount} restaurant${filteredCount === 1 ? "" : "s"}…`
                }
                aria-label="Search restaurants"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{
                  width: "100%", boxSizing: "border-box",
                  height: 40, padding: "0 40px 0 34px",
                  border: "1.5px solid var(--c-border)",
                  borderRadius: 12, fontSize: 14, fontWeight: 500,
                  background: "var(--c-card)",
                  outline: "none", color: "var(--c-text)",
                  transition: "border-color 0.15s",
                  WebkitAppearance: "none",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#eb1700")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "var(--c-border)")}
              />
              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  style={{
                    position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)",
                    width: 28, height: 28, borderRadius: 999,
                    background: "transparent", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: 999, background: "#9ca3af",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#fff"
                      strokeWidth="3.5" strokeLinecap="round" aria-hidden="true">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </span>
                </button>
              )}
            </div>

            {/* Filter — stays accessible during search */}
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              aria-expanded={showFilterDrawer}
              aria-haspopup="dialog"
              aria-label={`Filters${activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ""}`}
              style={{
                ...ICON,
                background: activeFilterCount > 0 ? "#eb1700" : "var(--c-card)",
                borderColor: activeFilterCount > 0 ? "#eb1700" : "var(--c-border)",
                color: activeFilterCount > 0 ? "#fff" : "var(--c-text)",
                position: "relative", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.3" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="6" x2="20" y2="6"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
                <line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              {activeFilterCount > 0 && (
                <span style={{
                  position: "absolute", top: -5, right: -5,
                  minWidth: 16, height: 16, borderRadius: 999,
                  background: "#fff", color: "#eb1700",
                  fontSize: 9, fontWeight: 900, lineHeight: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "0 3px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                }}>
                  {activeFilterCount}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes popIn {
          from { transform: scale(0.4); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
      `}</style>
    </header>
  );
}