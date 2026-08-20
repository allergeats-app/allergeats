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

  const isLifetime =
    !!subscription.currentPeriodEnd &&
    subscription.currentPeriodEnd.getFullYear() >= 2090;

  // Show success banner when returning from Stripe checkout; poll until webhook fires
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") !== "1") return;
    setShowUpgradeSuccess(true);
    window.history.replaceState({}, "", "/profile");

    // Poll every 3s for up to 30s so the Pro card appears as soon as the webhook writes
    let attempts = 0;
    const id = setInterval(async () => {
      await subscription.refresh();
      if (++attempts >= 10) clearInterval(id);
    }, 3000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: subscription.isPro
                    ? "linear-gradient(135deg, #6d28d9, #7c3aed)"
                    : "var(--c-brand)",
                  color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900,
                  boxShadow: subscription.isPro
                    ? "0 0 0 2.5px #7c3aed, 0 0 14px rgba(124,58,237,0.35)"
                    : undefined,
                }}
              >
                {(firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                {displayName && <span style={{ fontWeight: 900, fontSize: 16, color: "var(--c-text)" }}>{displayName}</span>}
                {subscription.isPro && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase",
                    color: "#8b5cf6",
                    background: isDark ? "rgba(124,58,237,.18)" : "rgba(124,58,237,.1)",
                    padding: "2px 7px", borderRadius: 4,
                    border: "1px solid rgba(124,58,237,.2)",
                  }}>✦ Pro</span>
                )}
              </div>
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
              borderRadius: 20,
              background: "linear-gradient(140deg, #1a0533 0%, #3b0764 50%, #1e2d6b 100%)",
              padding: "24px 22px",
              position: "relative",
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(109,40,217,0.3), 0 2px 8px rgba(0,0,0,0.2)",
            }}>
              {/* Ambient glows */}
              <div style={{
                position: "absolute", top: -60, right: -40,
                width: 240, height: 180,
                background: "radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 65%)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", bottom: -50, left: -30,
                width: 180, height: 140,
                background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 65%)",
                pointerEvents: "none",
              }} />

              {/* Eyebrow */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 20,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(167,139,250,0.85)" }}>
                  ✦ AllergEats Pro
                </span>
                <span style={{ fontSize: 16, color: "rgba(255,255,255,0.15)", letterSpacing: 3 }}>◈◈</span>
              </div>

              {/* Identity */}
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-.03em", lineHeight: 1.1, marginBottom: 3 }}>
                {displayName || firstName || (user.email ?? "").split("@")[0]}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginBottom: 28 }}>
                {user.email}
              </div>

              {/* Status + renewal row */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
                    Status
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                      background: subscription.cancelAtPeriodEnd ? "#fbbf24" : "#4ade80",
                      boxShadow: subscription.cancelAtPeriodEnd ? "0 0 6px #fbbf24" : "0 0 6px #4ade80",
                    }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {isLifetime ? "Lifetime" : subscription.cancelAtPeriodEnd ? "Canceling" : "Active"}
                    </span>
                  </div>
                </div>
                {!isLifetime && subscription.currentPeriodEnd && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 5 }}>
                      {subscription.cancelAtPeriodEnd ? "Access until" : "Renews"}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
                      {subscription.currentPeriodEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                )}
              </div>

              {!isLifetime && (
                <button
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  style={{
                    marginTop: 18, padding: "7px 14px", borderRadius: 7,
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 11, fontWeight: 600,
                    cursor: portalLoading ? "not-allowed" : "pointer",
                    opacity: portalLoading ? 0.5 : 1,
                  }}
                >
                  {portalLoading ? "Loading…" : "Manage billing"}
                </button>
              )}
            </div>
          ) : showUpgradeSuccess ? (
            <div style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
                  color: "#8b5cf6", background: isDark ? "rgba(124,58,237,.15)" : "rgba(124,58,237,.08)",
                  padding: "3px 8px", borderRadius: 4 }}>Pro</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>Activating…</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--c-sub)", margin: 0 }}>
                Your subscription is being activated — this usually takes a few seconds.
              </p>
            </div>
          ) : (
            <UpgradePrompt isDark={isDark} />
          )
        )}

        {/* My Family card — always visible, CTA for free users */}
        {!subscription.loading && (
          <div style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              My Family
            </div>
            {subscription.isPro ? (
              <FamilyProfileManager isDark={isDark} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "8px 0 4px", textAlign: "center" }}>
                <div style={{ fontSize: 44, lineHeight: 1 }}>👨‍👩‍👧</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>
                    Family Allergen Profiles
                  </div>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                    Add a profile for each family member with their own allergen list. Switch instantly on the home screen to get safety scores tailored to whoever you&apos;re ordering for.
                  </div>
                </div>
                <UpgradePrompt isDark={isDark} compact />
              </div>
            )}
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
