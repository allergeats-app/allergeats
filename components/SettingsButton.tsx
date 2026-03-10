"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { user, username, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click (pointerdown covers both mouse and touch)
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  const itemStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "10px 14px", cursor: "pointer", gap: 10,
    fontSize: 14, fontWeight: 600, color: "var(--c-text)",
    background: "none", border: "none", width: "100%", textAlign: "left",
    textDecoration: "none", borderRadius: 8,
  };

  return (
    <div ref={menuRef} style={{ position: "relative", flexShrink: 0 }}>
      {/* Gear trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Settings"
        aria-label="Open settings"
        aria-expanded={open}
        style={{
          width: 36, height: 36, borderRadius: 999,
          background: open ? "var(--c-border)" : "var(--c-card)",
          border: "1px solid var(--c-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          transition: "background 0.15s",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 8px)", right: 0,
            background: "var(--c-card)",
            border: "1px solid var(--c-border)",
            borderRadius: 14,
            boxShadow: "0 8px 32px rgba(0,0,0,0.13)",
            minWidth: 220, zIndex: 200,
            padding: "6px",
            animation: "fadeDropdown 0.12s ease",
          }}
        >
          {user ? (
            <>
              {/* User row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px 12px",
                borderBottom: "1px solid var(--c-border)",
                marginBottom: 4,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "#eb1700", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 900, flexShrink: 0,
                }}>
                  {(username || user.email)?.[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  {username && (
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)", lineHeight: 1.2 }}>{username}</div>
                  )}
                  <div style={{ fontSize: 11, color: "var(--c-sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </div>
                </div>
              </div>

              {/* Saved & Recent */}
              <Link href="/saved" onClick={() => setOpen(false)} style={itemStyle}>
                <span>Saved & Recent</span>
                <span style={{ fontSize: 13, color: "var(--c-sub)" }}>→</span>
              </Link>

              {/* My Account */}
              <Link href="/profile" onClick={() => setOpen(false)} style={itemStyle}>
                <span>My Account</span>
                <span style={{ fontSize: 13, color: "var(--c-sub)" }}>→</span>
              </Link>

              {/* My Allergies */}
              <Link href="/allergies" onClick={() => setOpen(false)} style={itemStyle}>
                <span>My Allergies</span>
                <span style={{ fontSize: 13, color: "var(--c-sub)" }}>→</span>
              </Link>

              {/* Dark mode */}
              <button onClick={toggle} style={itemStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {isDark ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  )}
                  {isDark ? "Dark mode" : "Light mode"}
                </span>
                <div style={{
                  width: 36, height: 22, borderRadius: 999, flexShrink: 0,
                  background: isDark ? "#eb1700" : "var(--c-border)",
                  position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    position: "absolute", top: 3, left: isDark ? 17 : 3,
                    width: 16, height: 16, borderRadius: 999,
                    background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </button>

              {/* Divider + Sign out */}
              <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 4, paddingTop: 4 }}>
                <button onClick={handleSignOut} style={{ ...itemStyle, color: "#b91c1c" }}>
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Dark mode */}
              <button onClick={toggle} style={itemStyle}>
                <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  {isDark ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="5"/>
                      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                    </svg>
                  )}
                  {isDark ? "Dark mode" : "Light mode"}
                </span>
                <div style={{
                  width: 36, height: 22, borderRadius: 999, flexShrink: 0,
                  background: isDark ? "#eb1700" : "var(--c-border)",
                  position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{
                    position: "absolute", top: 3, left: isDark ? 17 : 3,
                    width: 16, height: 16, borderRadius: 999,
                    background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
                  }} />
                </div>
              </button>

              {/* Sign in */}
              <div style={{ borderTop: "1px solid var(--c-border)", marginTop: 4, paddingTop: 4 }}>
                <Link href="/auth" onClick={() => setOpen(false)} style={{ ...itemStyle, fontWeight: 700, color: "#eb1700" }}>
                  Sign In / Create Account
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeDropdown {
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
