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

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
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
          cursor: "pointer", fontSize: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          transition: "background 0.15s",
        }}
      >
        ⚙
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

              {/* My Account */}
              <Link href="/profile" onClick={() => setOpen(false)} style={itemStyle}>
                <span>My Account</span>
                <span style={{ fontSize: 13, color: "var(--c-sub)" }}>→</span>
              </Link>

              {/* Dark mode */}
              <button onClick={toggle} style={itemStyle}>
                <span>{isDark ? "🌙  Dark mode" : "☀️  Light mode"}</span>
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
                <span>{isDark ? "🌙  Dark mode" : "☀️  Light mode"}</span>
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
