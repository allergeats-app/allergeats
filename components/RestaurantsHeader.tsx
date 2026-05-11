"use client";

import Link from "next/link";
import Image from "next/image";
import { SettingsButton } from "@/components/SettingsButton";

export function RestaurantsHeader({
  locationLabel,
  locationMode,
  resultsSource,
  onLocationPress,
}: {
  locationLabel: string;
  locationMode: "precise" | "approximate" | "cached" | "unavailable";
  resultsSource: "live" | "mock";
  onLocationPress: () => void;
}) {
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
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
          alignItems: "center",
          height: 44,
        }}>

          {/* Left: location */}
          <button
            type="button"
            onClick={onLocationPress}
            aria-label="Change location"
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "none", border: "none", padding: 0,
              cursor: "pointer", minWidth: 0, overflow: "hidden",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: 999, flexShrink: 0,
              background: dotColor,
              boxShadow: locationMode === "precise" ? `0 0 0 3px ${dotColor}28` : "none",
              transition: "background 0.3s, box-shadow 0.3s",
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: "var(--c-text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {locationLabel}
            </span>
            {resultsSource === "mock" && (
              <span style={{ fontSize: 9, fontWeight: 800, color: "#f59e0b", letterSpacing: "0.04em", flexShrink: 0 }}>
                DEMO
              </span>
            )}
            <svg aria-hidden="true" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--c-sub)"
              strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Center: logo */}
          <Link href="/" aria-label="AllergEats home" style={{ display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
            <Image src="/logo 3d.png" alt="AllergEats" width={120} height={29} sizes="120px" style={{ width: "auto", height: 28 }} priority />
          </Link>

          {/* Right: settings */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <SettingsButton />
          </div>

        </div>
      </div>
    </header>
  );
}
