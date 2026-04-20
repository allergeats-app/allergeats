"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const CIRCLE: React.CSSProperties = {
  width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  border: "none", cursor: "pointer",
  WebkitTapHighlightColor: "transparent",
  transition: "background 0.12s, box-shadow 0.12s",
  textDecoration: "none",
};

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

  return (
    <>
      <style>{`
        .bn-circle {
          background: var(--bn-btn);
          box-shadow: 0 2px 10px rgba(0,0,0,0.09);
          color: var(--bn-icon);
        }
        .bn-circle:active { transform: scale(0.93); }
        .bn-pill {
          background: var(--bn-pill-bg);
          border: 1.5px solid var(--bn-pill-border);
          box-shadow: 0 2px 14px rgba(0,0,0,0.10);
          color: var(--bn-pill-placeholder);
        }
        .bn-pill:active { transform: scale(0.98); }

        :root {
          --bn-bg:              rgba(255,255,255,0.78);
          --bn-btn:             rgba(255,255,255,0.96);
          --bn-icon:            #374151;
          --bn-pill-bg:         rgba(255,255,255,0.97);
          --bn-pill-border:     rgba(0,0,0,0.08);
          --bn-pill-placeholder:#9ca3af;
        }
        [data-theme="dark"] {
          --bn-bg:              rgba(18,20,26,0.78);
          --bn-btn:             rgba(30,33,42,0.95);
          --bn-icon:            #d1d5db;
          --bn-pill-bg:         rgba(30,33,42,0.98);
          --bn-pill-border:     rgba(255,255,255,0.10);
          --bn-pill-placeholder:#6b7280;
        }
      `}</style>

      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          padding: "10px 14px",
          paddingBottom: "max(14px, calc(10px + env(safe-area-inset-bottom)))",
          background: "var(--bn-bg)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          borderTop: "1px solid rgba(128,128,128,0.12)",
        }}
      >
        <div style={{
          maxWidth: 540, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 10,
        }}>

          {/* ── Left: Home + Location ── */}
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/"
              aria-label="Home"
              className="bn-circle"
              style={{
                ...CIRCLE,
                color: pathname === "/" ? activeColor : undefined,
              }}
            >
              <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none"
                stroke={pathname === "/" ? activeColor : "var(--bn-icon)"}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <polyline points="9 21 9 13 15 13 15 21"/>
              </svg>
            </Link>

            <button
              type="button"
              onClick={onLocationPress}
              aria-label="Change location"
              className="bn-circle"
              style={CIRCLE}
            >
              <span style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none"
                  stroke="var(--bn-icon)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 8, height: 8, borderRadius: "50%",
                  background: dotColor,
                  border: "1.5px solid var(--bn-pill-bg)",
                  boxShadow: locationMode === "precise" ? `0 0 0 2px ${dotColor}44` : "none",
                  transition: "background 0.3s",
                }} />
              </span>
            </button>
          </div>

          {/* ── Center: Search pill ── */}
          <button
            type="button"
            onClick={onSearchPress}
            aria-label="Search restaurants"
            className="bn-pill"
            style={{
              flex: 1,
              height: 46, borderRadius: 999,
              display: "flex", alignItems: "center", gap: 9,
              padding: "0 18px",
              cursor: "text",
              background: "var(--bn-pill-bg)",
              border: "1.5px solid var(--bn-pill-border)",
              boxShadow: "0 2px 14px rgba(0,0,0,0.10)",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--bn-pill-placeholder)" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style={{
              fontSize: 15, fontWeight: 500,
              color: "var(--bn-pill-placeholder)",
              flex: 1, textAlign: "left",
              overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
            }}>
              Search restaurants…
            </span>
          </button>

          {/* ── Right: Saved + Profile ── */}
          <div style={{ display: "flex", gap: 8 }}>
            <Link
              href="/saved"
              aria-label="My Saved Items"
              className="bn-circle"
              style={CIRCLE}
            >
              <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24"
                fill={pathname === "/saved" ? activeColor : "none"}
                stroke={pathname === "/saved" ? activeColor : "var(--bn-icon)"}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </Link>

            <Link
              href="/profile"
              aria-label="Profile"
              className="bn-circle"
              style={CIRCLE}
            >
              <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none"
                stroke={pathname === "/profile" ? activeColor : "var(--bn-icon)"}
                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </Link>
          </div>

        </div>
      </nav>
    </>
  );
}
