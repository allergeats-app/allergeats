"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function BottomNav({
  onMapPress,
  onSearchPress,
}: {
  onMapPress?: () => void;
  onSearchPress?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const activeColor = "var(--c-brand)";

  const handleMap    = onMapPress    ?? (() => router.push("/"));
  const handleSearch = onSearchPress ?? (() => router.push("/"));
  const circleShadow = "0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)";

  const circle: React.CSSProperties = {
    width: 48, height: 48, borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, border: "none",
    background: "var(--bn-circle-bg)",
    boxShadow: circleShadow,
    WebkitTapHighlightColor: "transparent",
    transition: "transform 0.12s ease",
    textDecoration: "none",
    color: "var(--bn-icon)",
    WebkitUserSelect: "none",
    userSelect: "none",
  };

  return (
    <>
      <style>{`
        :root {
          --bn-circle-bg: #ffffff;
          --bn-icon: #374151;
          --bn-pill-bg: #ffffff;
          --bn-pill-text: #9ca3af;
          --bn-bar-bg: transparent;
          --bn-fade-start: rgba(255,255,255,0);
          --bn-fade-s1:    rgba(255,255,255,0.03);
          --bn-fade-s2:    rgba(255,255,255,0.09);
          --bn-fade-s3:    rgba(255,255,255,0.20);
          --bn-fade-s4:    rgba(255,255,255,0.38);
          --bn-fade-s5:    rgba(255,255,255,0.60);
          --bn-fade-s6:    rgba(255,255,255,0.80);
          --bn-fade-s7:    rgba(255,255,255,0.93);
          --bn-fade-end:   rgba(255,255,255,1);
        }
        .bn-btn:active { transform: scale(0.90) !important; }
        .bn-btn {
          touch-action: manipulation;
          user-select: none;
          -webkit-user-select: none;
          will-change: transform;
          cursor: pointer;
        }
      `}</style>

      {/* Eased gradient scrim */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 49,
        height: "max(160px, calc(120px + env(safe-area-inset-bottom)))",
        background: `linear-gradient(
          to bottom,
          var(--bn-fade-start)  0%,
          var(--bn-fade-s1)     8%,
          var(--bn-fade-s2)    18%,
          var(--bn-fade-s3)    31%,
          var(--bn-fade-s4)    46%,
          var(--bn-fade-s5)    62%,
          var(--bn-fade-s6)    76%,
          var(--bn-fade-s7)    88%,
          var(--bn-fade-end)  100%
        )`,
        pointerEvents: "none",
      }} />

      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 50,
          padding: "8px 12px",
          paddingBottom: "max(18px, calc(12px + env(safe-area-inset-bottom)))",
          background: "var(--bn-bar-bg)",
          pointerEvents: "none",
        }}
      >
        <div style={{
          maxWidth: 540, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 8,
          pointerEvents: "auto",
        }}>

          {/* Home */}
          <Link href="/" aria-label="Home" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
              fill={pathname === "/" ? activeColor : "var(--bn-icon)"}
              stroke="none">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </Link>

          {/* Map */}
          <button type="button" onClick={handleMap} aria-label="Map view" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
              stroke="var(--bn-icon)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </button>

          {/* Search pill */}
          <button
            type="button"
            onClick={handleSearch}
            aria-label="Search restaurants"
            className="bn-btn"
            style={{
              flex: 1,
              minWidth: 0,
              height: 48, borderRadius: 999,
              display: "flex", alignItems: "center", gap: 8,
              padding: "0 16px",
              background: "var(--bn-pill-bg)",
              border: "none",
              boxShadow: "0 2px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.07)",
              cursor: "text",
              WebkitTapHighlightColor: "transparent",
              overflow: "hidden",
            }}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="var(--bn-pill-text)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
              style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <span style={{ fontSize: 15, fontWeight: 500, color: "var(--bn-pill-text)", flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Search
            </span>
          </button>

          {/* Saved */}
          <Link href="/saved" aria-label="My Saved Items" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"
              fill={pathname === "/saved" ? activeColor : "none"}
              stroke={pathname === "/saved" ? activeColor : "var(--bn-icon)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </Link>

          {/* Profile */}
          <Link href="/profile" aria-label="Profile" className="bn-btn" style={circle}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"
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
