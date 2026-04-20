"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BottomNav({
  onLocationPress,
  locationMode,
  onSearchPress,
}: {
  onLocationPress: () => void;
  locationMode: "precise" | "approximate" | "cached" | "unavailable";
  onSearchPress: () => void;
}) {
  const pathname = usePathname();

  const dotColor =
    locationMode === "precise"     ? "#22c55e" :
    locationMode === "cached"      ? "#f59e0b" :
    locationMode === "approximate" ? "#f59e0b" : "#9ca3af";

  const activeColor = "#1fbdcc";

  const circleShadow = "0 4px 18px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)";

  const circle: React.CSSProperties = {
    width: 60, height: 60, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, border: "none", cursor: "pointer",
    background: "var(--bn-circle-bg)",
    boxShadow: circleShadow,
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.1s, box-shadow 0.1s",
    textDecoration: "none",
    color: "var(--bn-icon)",
  };

  return (
    <>
      <style>{`
        :root {
          --bn-circle-bg: #ffffff;
          --bn-icon: #374151;
          --bn-pill-bg: #ffffff;
          --bn-pill-text: #9ca3af;
          --bn-fade-start: rgba(255,255,255,0);
          --bn-fade-end: rgba(255,255,255,0.97);
        }
        [data-theme="dark"] {
          --bn-circle-bg: #000000;
          --bn-icon: #e5e7eb;
          --bn-pill-bg: #000000;
          --bn-pill-text: #6b7280;
          --bn-fade-start: rgba(0,0,0,0);
          --bn-fade-end: rgba(0,0,0,0.97);
        }
        .bn-btn:active { transform: scale(0.92) !important; }
      `}</style>

      {/* Gradient fade behind the nav */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 49,
        height: "max(120px, calc(96px + env(safe-area-inset-bottom)))",
        background: "linear-gradient(to bottom, var(--bn-fade-start), var(--bn-fade-end) 55%)",
        pointerEvents: "none",
      }} />

      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          padding: "10px 16px",
          paddingBottom: "max(18px, calc(14px + env(safe-area-inset-bottom)))",
          background: "transparent",
          pointerEvents: "none",
        }}
      >
        <div style={{
          maxWidth: 560, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 12,
          pointerEvents: "auto",
        }}>

          {/* Home */}
          <Link href="/" aria-label="Home" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24"
              fill={pathname === "/" ? activeColor : "var(--bn-icon)"}
              stroke="none">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </Link>

          {/* Location */}
          <button type="button" onClick={onLocationPress} aria-label="Change location" className="bn-btn" style={circle}>
            <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke="var(--bn-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="var(--bn-icon)" stroke="none"/>
              </svg>
              <span style={{
                position: "absolute", top: -5, right: -5,
                width: 9, height: 9, borderRadius: "50%",
                background: dotColor,
                border: "1.5px solid var(--bn-circle-bg)",
                boxShadow: locationMode === "precise" ? `0 0 0 2px ${dotColor}55` : "none",
                transition: "background 0.3s",
              }} />
            </span>
          </button>

          {/* Search pill */}
          <button
            type="button"
            onClick={onSearchPress}
            aria-label="Search restaurants"
            className="bn-btn"
            style={{
              flex: 1,
              height: 60, borderRadius: 999,
              display: "flex", alignItems: "center", gap: 10,
              padding: "0 22px",
              background: "var(--bn-pill-bg)",
              border: "none",
              boxShadow: "0 4px 18px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.10)",
              cursor: "text",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="var(--bn-pill-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style={{
              fontSize: 16, fontWeight: 500,
              color: "var(--bn-pill-text)",
              flex: 1, textAlign: "left",
            }}>
              Search
            </span>
          </button>

          {/* Saved */}
          <Link href="/saved" aria-label="My Saved Items" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24"
              fill={pathname === "/saved" ? activeColor : "none"}
              stroke={pathname === "/saved" ? activeColor : "var(--bn-icon)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </Link>

          {/* Profile */}
          <Link href="/profile" aria-label="Profile" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke={pathname === "/profile" ? activeColor : "var(--bn-icon)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </Link>

        </div>
      </nav>
    </>
  );
}
