"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useTheme, type ThemeMode } from "@/lib/themeContext";
import { useAllergenProfile } from "@/lib/hooks/useAllergenProfile";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import { BottomNav } from "@/components/BottomNav";
import { SupportChat } from "@/components/SupportChat";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { FamilyProfileManager } from "@/components/FamilyProfileManager";

export default function ProfilePage() {
  const { user, loading, firstName, lastName, displayName, saveName, signOut } = useAuth();
  const { isDark, mode: themeMode, setMode: setThemeMode } = useTheme();
  const { allergens } = useAllergenProfile();
  const subscription = useSubscription();
  const router = useRouter();

  const [signingOut, setSigningOut]       = useState(false);
  const [showSupport, setShowSupport]     = useState(false);
  const [firstEdit,  setFirstEdit]  = useState("");
  const [lastEdit,   setLastEdit]   = useState("");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved,  setNameSaved]  = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Show success banner when returning from Stripe checkout
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      setShowUpgradeSuccess(true);
      window.history.replaceState({}, "", "/profile");
    }
  }, []);

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setPortalLoading(false);
    }
  }

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  useEffect(() => {
    setFirstEdit(firstName); // eslint-disable-line react-hooks/set-state-in-effect
    setLastEdit(lastName);
  }, [firstName, lastName]);

  async function handleSaveName() {
    setNameSaving(true);
    await saveName(firstEdit, lastEdit);
    setNameSaving(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
  }

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
        Loading…
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        background: "var(--c-bg)",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: "max(120px, calc(88px + env(safe-area-inset-bottom)))",
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "var(--c-hdr)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--c-border)",
          paddingTop: "max(12px, calc(12px + env(safe-area-inset-top)))",
          paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Home</Link>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>My Account</span>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              fontSize: 13, fontWeight: 700, color: "#b91c1c",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 16 }}>

        {/* Upgrade success banner */}
        {showUpgradeSuccess && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", borderRadius: 12,
            background: isDark ? "rgba(34,197,94,.12)" : "rgba(34,197,94,.08)",
            border: "1px solid rgba(34,197,94,.3)",
          }}>
            <span style={{ fontSize: 18 }}>🎉</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#86efac" : "#15803d" }}>Welcome to Pro!</div>
              <div style={{ fontSize: 12, color: isDark ? "#4ade80" : "#16a34a" }}>All Pro features are now active on your account.</div>
            </div>
            <button onClick={() => setShowUpgradeSuccess(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--c-sub)", fontSize: 18 }}>×</button>
          </div>
        )}

        {/* Account card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            Account
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "var(--c-brand)", color: "var(--c-brand-fg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, flexShrink: 0,
              }}
            >
              {(firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              {displayName && <div style={{ fontWeight: 900, fontSize: 16, color: "var(--c-text)" }}>{displayName}</div>}
              <div style={{ fontWeight: displayName ? 500 : 800, fontSize: displayName ? 13 : 15, color: displayName ? "var(--c-sub)" : "var(--c-text)" }}>{user.email}</div>
              <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 2 }}>
                Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription card */}
        {!subscription.loading && (
          subscription.isPro ? (
            <div style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                    color: "#8b5cf6", background: isDark ? "rgba(124,58,237,.15)" : "rgba(124,58,237,.08)",
                    padding: "3px 8px", borderRadius: 4 }}>Pro</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>Active</span>
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Cancels at period end</span>
                )}
              </div>
              {subscription.currentPeriodEnd && (
                <p style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 14 }}>
                  {subscription.cancelAtPeriodEnd ? "Access until" : "Renews"}{" "}
                  {subscription.currentPeriodEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              )}
              <button
                onClick={handleManageBilling}
                disabled={portalLoading}
                style={{
                  padding: "9px 16px", borderRadius: 8, border: "1px solid var(--c-border)",
                  background: "var(--c-bg)", color: "var(--c-text)", fontSize: 13, fontWeight: 600,
                  cursor: portalLoading ? "not-allowed" : "pointer", opacity: portalLoading ? 0.6 : 1,
                }}
              >
                {portalLoading ? "Loading…" : "Manage billing"}
              </button>
            </div>
          ) : (
            <UpgradePrompt isDark={isDark} />
          )
        )}

        {/* Family profiles card (Pro only) */}
        {subscription.isPro && (
          <div style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Family
            </div>
            <FamilyProfileManager isDark={isDark} />
          </div>
        )}

        {/* Settings card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Settings
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>
              Name
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                id="profile-first-name"
                type="text"
                autoComplete="given-name"
                value={firstEdit}
                onChange={(e) => setFirstEdit(e.target.value)}
                placeholder="First name"
                aria-label="First name"
                style={{
                  flex: 1, minWidth: 100, padding: "10px 12px", border: "1px solid var(--c-border)",
                  borderRadius: 10, fontSize: 16, color: "var(--c-text)",
                  background: "var(--c-input)", outline: "none", boxSizing: "border-box",
                }}
              />
              <input
                id="profile-last-name"
                type="text"
                autoComplete="family-name"
                value={lastEdit}
                onChange={(e) => setLastEdit(e.target.value)}
                placeholder="Last name"
                aria-label="Last name"
                style={{
                  flex: 1, minWidth: 100, padding: "10px 12px", border: "1px solid var(--c-border)",
                  borderRadius: 10, fontSize: 16, color: "var(--c-text)",
                  background: "var(--c-input)", outline: "none", boxSizing: "border-box",
                }}
              />
              {(firstEdit.trim() !== firstName || lastEdit.trim() !== lastName || nameSaved || nameSaving) && (
                <button
                  onClick={handleSaveName}
                  disabled={!firstEdit.trim() || !lastEdit.trim() || nameSaving}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: nameSaved ? "#22c55e" : nameSaving ? "#9ca3af" : (!firstEdit.trim() || !lastEdit.trim()) ? "var(--c-border)" : "var(--c-text)",
                    color: "var(--c-bg)", fontSize: 13, fontWeight: 700,
                    cursor: (!firstEdit.trim() || !lastEdit.trim() || nameSaving) ? "not-allowed" : "pointer",
                    transition: "background 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  {nameSaved ? "Saved!" : nameSaving ? "Saving…" : "Save"}
                </button>
              )}
            </div>
          </div>

          {/* Appearance / theme selector */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 10 }}>
              Appearance
            </div>
            <div style={{ display: "flex", background: isDark ? "#2c2c2e" : "#f3f4f6", borderRadius: 12, padding: 4, gap: 2 }}>
              {(["system", "light", "dark"] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setThemeMode(m)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 9, border: "none",
                    background: themeMode === m ? (isDark ? "#3a3a3c" : "#fff") : "transparent",
                    color: themeMode === m ? "var(--c-text)" : "var(--c-sub)",
                    fontSize: 13, fontWeight: themeMode === m ? 700 : 500,
                    cursor: "pointer",
                    boxShadow: themeMode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "system" ? "Auto" : m === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 6 }}>
              {themeMode === "system" ? "Matches your phone's display settings" :
               themeMode === "light" ? "Always light" : "Always dark"}
            </div>
          </div>
        </div>

        {/* Allergen Profile card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Allergen Profile
            </div>
            <Link href="/" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-brand)", textDecoration: "none" }}>
              Edit on home screen →
            </Link>
          </div>
          {allergens.length === 0 ? (
            <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5 }}>
              No allergens set.{" "}
              <Link href="/" style={{ color: "var(--c-brand)", fontWeight: 700, textDecoration: "none" }}>
                Add them from the home screen
              </Link>{" "}
              to see safety scores on restaurant menus.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allergens.map((id) => {
                const meta = ALLERGEN_LIST.find((a) => a.id === id);
                return (
                  <span
                    key={id}
                    style={{
                      padding: "6px 14px", borderRadius: 999,
                      background: isDark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.3)",
                      fontSize: 13, fontWeight: 700, color: isDark ? "#fca5a5" : "#b91c1c",
                    }}
                  >
                    {meta?.label ?? id}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Support */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 10 }}>Help</div>
          <button
            onClick={() => setShowSupport(true)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "14px 16px", borderRadius: 16, border: "none",
              background: "var(--c-card)", cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              outline: "1px solid var(--c-border)",
              WebkitTapHighlightColor: "transparent",
              textAlign: "left",
            }}
          >
            <span style={{
              width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
              background: "var(--c-brand-bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="var(--c-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>Contact Support</div>
              <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 1 }}>Chat with our AI assistant</div>
            </div>
            <svg style={{ marginLeft: "auto" }} width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="var(--c-sub)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>

      </div>

      <SupportChat open={showSupport} onClose={() => setShowSupport(false)} />
      <BottomNav />
    </main>
  );
}
