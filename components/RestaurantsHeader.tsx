"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { SettingsButton } from "@/components/SettingsButton";
import type { LayoutOption } from "@/app/restaurants/types";

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
  const [searchOpen, setSearchOpen] = useState(!!query);
  const inputRef = useRef<HTMLInputElement>(null);

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
  }

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "var(--c-hdr)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--c-border)",
      padding: "10px 16px 10px",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto", display: "grid", gap: 8 }}>

        {/* Row 1 — location · logo · [search] [filters] [settings] */}
        {!searchOpen ? (
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 36 }}>
            <button
              type="button"
              onClick={onLocationPress}
              aria-label="Change location"
              style={{
                position: "absolute", left: 0,
                display: "flex", alignItems: "center", gap: 4,
                background: "none", border: "none", padding: "4px 0",
                cursor: "pointer", maxWidth: "35%",
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
                {resultsSource === "mock"      && <span style={{ color: "#f59e0b", fontWeight: 700 }}> · Sample</span>}
                {resultsSource === "live" && locationMode === "cached"      && <span style={{ color: "#f59e0b", fontWeight: 600 }}> · Saved</span>}
                {resultsSource === "live" && locationMode === "approximate" && <span style={{ color: "#f59e0b", fontWeight: 600 }}> · Approx.</span>}
              </span>
            </button>
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <Image src="/logo.png" alt="AllergEats" width={160} height={40} style={{ width: "auto", height: 32 }} priority />
            </Link>
            <div style={{ position: "absolute", right: 0, display: "flex", alignItems: "center", gap: 6 }}>
              {/* Scan icon */}
              <Link
                href="/scan"
                aria-label="Scan a menu"
                style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: "var(--c-card)",
                  border: "1px solid var(--c-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  color: "currentColor",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </Link>
              {/* Search icon */}
              <button
                type="button"
                onClick={openSearch}
                aria-label="Search restaurants"
                style={{
                  width: 36, height: 36, borderRadius: 999,
                  background: query ? "#fef2f2" : "var(--c-card)",
                  border: `1px solid ${query ? "#eb1700" : "var(--c-border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                  color: query ? "#eb1700" : "currentColor",
                  transition: "background 0.15s",
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </button>
              {/* Filters */}
              <button
                type="button"
                onClick={() => setShowFilterDrawer(!showFilterDrawer)}
                aria-expanded={showFilterDrawer}
                aria-haspopup="dialog"
                style={{
                  height: 36, display: "flex", alignItems: "center", gap: 5,
                  padding: "0 12px", borderRadius: 999,
                  background: activeFilterCount > 0 ? "#eb1700" : "var(--c-card)",
                  border: `1px solid ${activeFilterCount > 0 ? "#eb1700" : "var(--c-border)"}`,
                  color: activeFilterCount > 0 ? "#fff" : "var(--c-text)",
                  fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                  <line x1="11" y1="18" x2="13" y2="18"/>
                </svg>
                {activeFilterCount > 0 ? activeFilterCount : ""}
              </button>
              <SettingsButton />
            </div>
          </div>
        ) : (
          /* Search expanded */
          <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 36 }}>
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              style={{
                width: 36, height: 36, flexShrink: 0, borderRadius: 999,
                background: "var(--c-card)", border: "1px solid var(--c-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
              </svg>
            </button>
            <div style={{ flex: 1, position: "relative" }}>
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
                style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "#9ca3af", pointerEvents: "none" }}
              >
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search restaurants…"
                aria-label="Search restaurants"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 36px 10px 37px",
                  border: "1px solid var(--c-border)", borderRadius: 14, fontSize: 15,
                  background: "var(--c-card)", outline: "none", color: "var(--c-text)",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    width: 20, height: 20, borderRadius: 999,
                    background: "var(--c-border)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "var(--c-sub)",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Row 2 — count · layout toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
            {loading
              ? "Finding restaurants…"
              : `${filteredCount} restaurant${filteredCount === 1 ? "" : "s"} · ${radiusMiles} mi`}
          </span>
          <div style={{ display: "flex", gap: 4 }} role="group" aria-label="View layout">
            {(["list", "grid", "map"] as LayoutOption[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLayout(l)}
                aria-pressed={layout === l}
                aria-label={l === "list" ? "List view" : l === "grid" ? "Grid view" : "Map view"}
                style={{
                  width: 28, height: 28, borderRadius: 8, border: "1.5px solid",
                  borderColor: layout === l ? "#eb1700" : "var(--c-border)",
                  background: layout === l ? "#eb1700" : "var(--c-card)",
                  color: layout === l ? "#fff" : "var(--c-sub)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {l === "list" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                ) : l === "grid" ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
