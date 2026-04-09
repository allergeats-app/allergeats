"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ALLERGEN_LIST, saveProfileAllergens, loadProfileAllergens } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";
import { useTheme } from "@/lib/themeContext";

const ONBOARDING_KEY = "allegeats_onboarded_v1";

// iOS tap highlight suppression applied globally to all interactive elements in this modal
const iosTap: React.CSSProperties = {
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  userSelect: "none",
};

export function OnboardingModal() {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"welcome" | "allergens" | "done">("welcome");
  const [selected, setSelected] = useState<Set<AllergenId>>(new Set());

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  function toggle(id: AllergenId) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleFinish() {
    const existing = loadProfileAllergens();
    const merged = [...new Set([...existing, ...selected])];
    saveProfileAllergens(merged);
    localStorage.setItem(ONBOARDING_KEY, "1");
    setStep("done");
    setTimeout(() => setVisible(false), 1200);
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    // Backdrop — no bottom padding so sheet fills edge-to-edge on iOS
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      WebkitBackdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      {/* Sheet — extends to physical bottom edge; internal padding clears home indicator */}
      <div style={{
        background: "var(--c-card)",
        borderRadius: "28px 28px 0 0",
        width: "100%", maxWidth: 520,
        // Top padding + side padding + bottom padding respects home indicator
        padding: `28px 24px max(36px, calc(24px + env(safe-area-inset-bottom)))`,
        boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
        maxHeight: "92dvh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as never,
      }}>

        {/* ── Welcome ── */}
        {step === "welcome" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Image src="/logo.png" alt="AllergEats" width={200} height={46}
                style={{ width: "auto", height: 44, maxWidth: "70vw", margin: "0 auto 16px", display: "block" }} />
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--c-text)" }}>
                Eat out safely.
              </div>
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", marginBottom: 24 }}>
              {[
                {
                  text: "Find Nearby Restaurants",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb1700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                },
                {
                  text: "Know What's Safe Instantly",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb1700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                    </svg>
                  ),
                },
                {
                  text: "Save Your Go-To Meals",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eb1700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  ),
                },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  borderRadius: 999, padding: "9px 16px 9px 10px",
                  background: isDark
                    ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                    : "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(249,248,246,0.8) 100%)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`,
                  boxShadow: isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.06), 0 1px 4px rgba(0,0,0,0.25)"
                    : "inset 0 1px 0 rgba(255,255,255,1), 0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 999, flexShrink: 0,
                    background: isDark ? "rgba(235,23,0,0.12)" : "rgba(235,23,0,0.07)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtitle */}
            <div style={{ textAlign: "center", fontSize: 15, color: "var(--c-sub)", lineHeight: 1.65, marginBottom: 16 }}>
              Instantly shows what you can eat. Set up in 30 seconds.
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep("allergens")}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: "#eb1700", color: "#fff",
                fontSize: 17, fontWeight: 800, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Set My Allergens
            </button>

            {/* Skip + Sign In — centered */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
              <button
                onClick={handleSkip}
                style={{
                  ...iosTap,
                  minHeight: 44, padding: "10px 4px",
                  border: "none", background: "transparent",
                  color: "var(--c-sub)", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                Skip for now
              </button>
              <span style={{ color: "var(--c-border)", fontSize: 14, userSelect: "none" }}>·</span>
              <span style={{ fontSize: 14, color: "var(--c-sub)" }}>
                Already a Member?{" "}
                <Link
                  href="/auth"
                  onClick={handleSkip}
                  style={{
                    ...iosTap,
                    color: "#eb1700", fontWeight: 700, textDecoration: "none",
                    display: "inline", minHeight: 44, padding: "10px 0",
                  }}
                >
                  Sign In
                </Link>
              </span>
            </div>
          </>
        )}

        {/* ── Allergen picker ── */}
        {step === "allergens" && (
          <>
            <button
              onClick={() => setStep("welcome")}
              style={{
                ...iosTap,
                background: "none", border: "none",
                color: "var(--c-sub)", fontSize: 13, fontWeight: 700,
                cursor: "pointer", padding: "0 0 16px", minHeight: 44,
                display: "flex", alignItems: "center",
              }}
            >
              ← Back
            </button>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>
              Select your allergens
            </div>
            <div style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 20, lineHeight: 1.55 }}>
              Tap everything you need to avoid. You can update this anytime in your profile.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
              {ALLERGEN_LIST.map(({ id, label }) => {
                const active = selected.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    style={{
                      ...iosTap,
                      minHeight: 48, padding: "13px 14px",
                      borderRadius: 14,
                      border: active ? "2px solid #eb1700" : "1.5px solid var(--c-border)",
                      background: active ? (isDark ? "rgba(235,23,0,0.15)" : "rgba(235,23,0,0.07)") : "var(--c-card)",
                      color: active ? "#eb1700" : "var(--c-text)",
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      cursor: "pointer", textAlign: "left",
                      transition: "background 0.1s, border-color 0.1s, color 0.1s",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleFinish}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: "#eb1700", color: "#fff",
                fontSize: 17, fontWeight: 800, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              {selected.size === 0 ? "Continue with no allergens" : `Save ${selected.size} allergen${selected.size !== 1 ? "s" : ""}`}
            </button>
          </>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 999,
              background: isDark ? "#14532d" : "#dcfce7",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#86efac" : "#16a34a"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>You&apos;re all set!</div>
            <div style={{ fontSize: 14, color: "var(--c-sub)" }}>Start searching for safe places to eat.</div>
          </div>
        )}

      </div>
    </div>
  );
}