"use client";

import Link from "next/link";
import Image from "next/image";
import { SettingsButton } from "@/components/SettingsButton";
import { InlineLocationSearch } from "@/components/InlineLocationSearch";

export function RestaurantsHeader({
  locationLabel,
  locationMode,
  resultsSource,
  onSelectLocation,
  onUseCurrentLocation,
  onRetry,
}: {
  locationLabel: string;
  locationMode: "precise" | "approximate" | "cached" | "unavailable";
  resultsSource: "live" | "mock";
  onSelectLocation: (lat: number, lng: number, label: string) => void;
  onUseCurrentLocation: () => void;
  onRetry?: () => void;
}) {
  return (
    <header
      role="banner"
      style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--c-border)",
        paddingTop: "max(8px, env(safe-area-inset-top))",
        paddingBottom: 10,
        paddingLeft:  "max(12px, env(safe-area-inset-left))",
        paddingRight: "max(12px, env(safe-area-inset-right))",
      }}
    >
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr)",
          alignItems: "center",
          height: 44,
        }}>

          {/* Left: inline location search */}
          <InlineLocationSearch
            locationLabel={locationLabel}
            locationMode={locationMode}
            resultsSource={resultsSource}
            onSelectLocation={onSelectLocation}
            onUseCurrentLocation={onUseCurrentLocation}
          />

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
      {resultsSource === "mock" && (
        <div style={{
          background: "#FEF3C7", border: "1px solid #F59E0B",
          padding: "8px 16px", fontSize: "13px", color: "#92400E",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span>Showing sample restaurants — live location data unavailable</span>
          {onRetry && (
            <button onClick={onRetry} style={{
              fontSize: "12px", fontWeight: 600, color: "#D97706",
              background: "none", border: "none", cursor: "pointer", padding: "0 8px",
            }}>
              Retry
            </button>
          )}
        </div>
      )}
    </header>
  );
}
