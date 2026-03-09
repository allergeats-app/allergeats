"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";

function ThemeRow({ isDark, toggle }: { isDark: boolean; toggle: () => void }) {
  return (
    <div
      onClick={toggle}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 0", cursor: "pointer",
        borderBottom: "1px solid var(--c-border)",
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>
        {isDark ? "🌙  Dark mode" : "☀️  Light mode"}
      </span>
      <div style={{
        width: 46, height: 28, borderRadius: 999, flexShrink: 0,
        background: isDark ? "#eb1700" : "var(--c-border)",
        position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          position: "absolute", top: 4,
          left: isDark ? 22 : 4,
          width: 20, height: 20, borderRadius: 999,
          background: "#fff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
          transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
        }} />
      </div>
    </div>
  );
}

export function SettingsButton() {
  const [open, setOpen] = useState(false);
  const { user, username, signOut } = useAuth();
  const { isDark, toggle } = useTheme();
  const router = useRouter();

  async function handleSignOut() {
    setOpen(false);
    await signOut();
    router.push("/");
  }

  return (
    <>
      {/* Gear trigger */}
      <button
        onClick={() => setOpen(true)}
        title="Settings"
        aria-label="Open settings"
        style={{
          width: 36, height: 36, borderRadius: 999, flexShrink: 0,
          background: "var(--c-card)",
          border: "1px solid var(--c-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 17,
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        }}
      >
        ⚙
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 200, backdropFilter: "blur(3px)",
          }}
        />
      )}

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
          background: "var(--c-card)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          boxShadow: "0 -12px 48px rgba(0,0,0,0.2)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.3s cubic-bezier(0.32,0.72,0,1)",
          padding: "0 20px 40px",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12, marginBottom: 4 }}>
          <div style={{ width: 40, height: 5, borderRadius: 999, background: "var(--c-border)" }} />
        </div>

        {user ? (
          <>
            {/* User identity */}
            <div style={{
              display: "flex", alignItems: "center", gap: 14,
              padding: "16px 0 20px",
              borderBottom: "1px solid var(--c-border)",
              marginBottom: 4,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: "#eb1700", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 19, fontWeight: 900, flexShrink: 0,
              }}>
                {(username || user.email)?.[0].toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                {username && (
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 2 }}>
                    {username}
                  </div>
                )}
                <div style={{ fontSize: 13, color: "var(--c-sub)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
              </div>
            </div>

            {/* Theme */}
            <ThemeRow isDark={isDark} toggle={toggle} />

            {/* My Account */}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 0", cursor: "pointer",
                borderBottom: "1px solid var(--c-border)",
                textDecoration: "none",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 600, color: "var(--c-text)" }}>My Account</span>
              <span style={{ fontSize: 16, color: "var(--c-sub)" }}>→</span>
            </Link>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              style={{
                width: "100%", padding: "15px 0", marginTop: 20,
                background: "none", border: "1.5px solid var(--c-border)",
                borderRadius: 14, fontSize: 15, fontWeight: 700,
                color: "var(--c-sub)", cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            {/* Guest */}
            <div style={{ padding: "18px 0 8px" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)", marginBottom: 5 }}>Settings</div>
              <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 20, lineHeight: 1.5 }}>
                Sign in to save your allergy profile across sessions.
              </div>
            </div>

            {/* Theme (available even signed out) */}
            <ThemeRow isDark={isDark} toggle={toggle} />

            {/* Sign in CTA */}
            <Link
              href="/auth"
              onClick={() => setOpen(false)}
              style={{
                display: "block", width: "100%", padding: "15px 0",
                textAlign: "center", marginTop: 20,
                background: "#111", color: "#fff",
                borderRadius: 14, fontSize: 15, fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Sign In / Create Account
            </Link>
          </>
        )}
      </div>
    </>
  );
}
