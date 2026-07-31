"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ALLERGEN_LIST,
  PROFILE_KEY,
  saveProfileAllergens,
  loadProfileAllergens,
  saveProfileSeverities,
  loadProfileSeverities,
} from "@/lib/allergenProfile";
import type { AllergenId, AllergenSeverity } from "@/lib/types";
import { useTheme } from "@/lib/themeContext";

const ONBOARDING_KEY = "allegeats_onboarded_v1";


const iosTap: React.CSSProperties = {
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
  userSelect: "none",
};

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

type Step = "welcome" | "safety" | "allergens" | "done";

export function OnboardingModal() {
  const { isDark } = useTheme();
  const [visible, setVisible]   = useState(false);
  const [step, setStep]         = useState<Step>("welcome");
  const [selected, setSelected] = useState<Set<AllergenId>>(new Set());
  const [severities, setSeverities] = useState<Partial<Record<AllergenId, AllergenSeverity>>>({});
  const [warnEmpty, setWarnEmpty]   = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      const existing = loadProfileAllergens();
      const existingSevs = loadProfileSeverities();
      if (existing.length > 0) setSelected(new Set(existing as AllergenId[]));
      if (Object.keys(existingSevs).length > 0) setSeverities(existingSevs);
      setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
  }, [visible, step]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last  = nodes[nodes.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(id: AllergenId) {
    setWarnEmpty(false);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function handleAllergenContinue() {
    if (selected.size === 0) {
      setWarnEmpty(true);
      return;
    }
    handleFinish(severities);
  }

  function handleFinish(finalSeverities: Partial<Record<AllergenId, AllergenSeverity>>) {
    const existing = loadProfileAllergens();
    const merged = [...new Set([...existing, ...selected])];
    saveProfileAllergens(merged);
    // Notify same-tab listeners (e.g. useAllergenProfile) that the profile changed
    window.dispatchEvent(new StorageEvent("storage", { key: PROFILE_KEY }));
    saveProfileSeverities(finalSeverities);
    localStorage.setItem(ONBOARDING_KEY, "1");
    setStep("done");
    setTimeout(() => setVisible(false), 1400);
  }

  function handleSkip() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  // ── Shared card shell ──────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AllergEats"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        WebkitBackdropFilter: "blur(6px)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))",
      }}
      onKeyDown={handleKeyDown}
    >
      <div ref={dialogRef} style={{
        background: isDark
          ? "linear-gradient(150deg,#111214 0%,#1e2023 20%,#141618 45%,#1a1d20 70%,#111214 100%)"
          : "linear-gradient(150deg,#f8f9fa 0%,#e8eaed 15%,#ffffff 32%,#d0d4d8 52%,#f4f5f6 68%,#c8ccd0 84%,#eef0f2 100%)",
        borderRadius: 28,
        width: "100%", maxWidth: 480,
        padding: "32px 24px 28px",
        boxShadow: isDark
          ? "0 0 0 1px rgba(180,185,195,0.2),0 16px 64px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.1),inset 0 -1px 0 rgba(0,0,0,0.4)"
          : "0 0 0 1px rgba(140,148,158,0.18),0 16px 64px rgba(60,70,80,0.22),inset 0 1px 0 rgba(255,255,255,0.95),inset 0 -1px 0 rgba(100,110,120,0.12)",
        border: isDark
          ? "1px solid rgba(160,168,178,0.3)"
          : "1px solid rgba(150,158,168,0.3)",
        maxHeight: "90dvh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as never,
        position: "relative",
      }}>
        {/* Metallic shine highlight */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 80,
          borderRadius: "28px 28px 0 0",
          background: isDark
            ? "linear-gradient(180deg,rgba(220,225,235,0.08) 0%,rgba(220,225,235,0) 100%)"
            : "linear-gradient(180deg,rgba(255,255,255,0.85) 0%,rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
        }} />

        {/* ── Step: Welcome ──────────────────────────────────────────────── */}
        {step === "welcome" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Image src="/logo 3d.png" alt="AllergEats" width={200} height={49}
                sizes="200px"
                style={{ width: "auto", height: 48, maxWidth: "70vw", margin: "0 auto 16px", display: "block" }} />
              <div style={{
                fontSize: 24, fontWeight: 900,
                fontFamily: "'Georgia','Times New Roman',serif",
                letterSpacing: "-0.02em", lineHeight: 1.15,
                background: isDark
                  ? "linear-gradient(135deg,#c8cdd5 0%,#e8ecf0 50%,#9aa0a8 100%)"
                  : "linear-gradient(135deg,#2c3038 0%,#4a5260 40%,#1e2228 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Eat Out Without Guessing.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", marginBottom: 24 }}>
              {[
                { text: "Find Nearby Restaurants", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> },
                { text: "Know What's Safe Instantly", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg> },
                { text: "Save Your Go-To Meals",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg> },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  borderRadius: 999, padding: "9px 16px 9px 10px",
                  background: isDark
                    ? "linear-gradient(135deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)"
                    : "linear-gradient(135deg,rgba(255,255,255,0.95) 0%,rgba(249,248,246,0.8) 100%)",
                  border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`,
                  boxShadow: isDark
                    ? "inset 0 1px 0 rgba(255,255,255,0.06),0 1px 4px rgba(0,0,0,0.25)"
                    : "inset 0 1px 0 rgba(255,255,255,1),0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, flexShrink: 0, background: isDark ? "rgba(31,189,204,0.12)" : "rgba(31,189,204,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {icon}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)", letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "rgba(180,188,198,0.7)" : "rgba(60,70,82,0.6)" }}>
                Set Up in 30 Seconds — No Account Required
              </div>
            </div>

            <button
              onClick={() => setStep("safety")}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: "linear-gradient(135deg,#149aab 0%,var(--c-brand) 50%,#35d4e4 100%)",
                boxShadow: "0 2px 0 rgba(0,0,0,0.2),0 6px 20px rgba(0,150,165,0.35),inset 0 1px 0 rgba(100,230,240,0.3)",
                color: "var(--c-brand-fg)",
                fontSize: 17, fontWeight: 800, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Set My Allergens &amp; Find Food
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14 }}>
              <button onClick={handleSkip} style={{ ...iosTap, minHeight: 44, padding: "10px 4px", border: "none", background: "transparent", color: "var(--c-sub)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                Skip for now
              </button>
              <span style={{ color: "var(--c-border)", fontSize: 14 }}>·</span>
              <span style={{ fontSize: 14, color: "var(--c-sub)" }}>
                Already a Member?{" "}
                <Link href="/auth" onClick={handleSkip} style={{ ...iosTap, color: "var(--c-brand)", fontWeight: 700, textDecoration: "none" }}>
                  Sign In
                </Link>
              </span>
            </div>
          </>
        )}

        {/* ── Step: Safety acknowledgment ───────────────────────────────── */}
        {step === "safety" && (
          <>
            <div style={{
              borderRadius: 18,
              background: isDark ? "#0d0808" : "#fff8f8",
              border: `1px solid ${isDark ? "rgba(220,38,38,0.2)" : "rgba(220,38,38,0.12)"}`,
              borderTop: "3px solid #dc2626",
              padding: "22px 20px 20px",
              marginBottom: 20,
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Faint red top glow */}
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 64, background: "radial-gradient(ellipse at 50% 0%, rgba(220,38,38,0.12) 0%, transparent 100%)", pointerEvents: "none" }} />

              {/* Icon + eyebrow */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#dc2626", boxShadow: "0 0 0 5px rgba(220,38,38,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="4" height="16" viewBox="0 0 4 16" fill="none" aria-hidden="true">
                    <rect x="0" y="0" width="4" height="10" rx="2" fill="white"/>
                    <rect x="0" y="13" width="4" height="3" rx="1.5" fill="white"/>
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#ef4444" }}>
                  Safety Notice
                </span>
              </div>

              {/* Headline */}
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.2, color: isDark ? "#ffffff" : "#110808", marginBottom: 8 }}>
                A guide, not a guarantee.
              </div>
              <div style={{ fontSize: 13, color: isDark ? "#9ca3af" : "#6b7280", lineHeight: 1.55, marginBottom: 18 }}>
                AllergEats reads menu text to flag potential allergens — but menus and kitchens are unpredictable.
              </div>

              {/* Bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 18 }}>
                {[
                  "Menus change — ingredients listed today may differ tomorrow",
                  "Cross-contamination can't be detected from text alone",
                  "Detection isn't 100% accurate for all ingredient names",
                ].map((text, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flexShrink: 0, width: 20, height: 20, borderRadius: "50%", background: isDark ? "rgba(251,191,36,0.1)" : "rgba(251,191,36,0.15)", border: `1.5px solid ${isDark ? "rgba(251,191,36,0.25)" : "rgba(251,191,36,0.4)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                      <svg width="4" height="11" viewBox="0 0 4 11" fill="none" aria-hidden="true">
                        <rect x="0" y="0" width="4" height="7" rx="2" fill="#fbbf24"/>
                        <rect x="0" y="9" width="4" height="2" rx="1" fill="#fbbf24"/>
                      </svg>
                    </div>
                    <span style={{ fontSize: 13, color: isDark ? "#c4b5a5" : "#4b4437", lineHeight: 1.6 }}>{text}</span>
                  </div>
                ))}
              </div>

              {/* Always-confirm CTA block */}
              <div style={{ borderRadius: 12, background: isDark ? "rgba(220,38,38,0.07)" : "rgba(220,38,38,0.05)", border: `1px solid ${isDark ? "rgba(220,38,38,0.2)" : "rgba(220,38,38,0.12)"}`, borderLeft: "3px solid #dc2626", padding: "12px 14px" }}>
                <span style={{ fontSize: 13, lineHeight: 1.6, color: isDark ? "#fca5a5" : "#991b1b" }}>
                  <strong style={{ fontWeight: 800, color: isDark ? "#ffffff" : "#1a0606" }}>Always confirm with restaurant staff</strong> before ordering — especially for severe or life-threatening allergies.
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep("allergens")}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: "linear-gradient(135deg,#149aab 0%,var(--c-brand) 50%,#35d4e4 100%)",
                color: "var(--c-brand-fg)",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              I Understand — Set My Allergens
            </button>
            <button onClick={() => setStep("welcome")} style={{ ...iosTap, marginTop: 10, width: "100%", minHeight: 44, border: "none", background: "transparent", color: "var(--c-sub)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              ← Back
            </button>
          </>
        )}

        {/* ── Step: Allergen picker ─────────────────────────────────────── */}
        {step === "allergens" && (
          <>
            <button onClick={() => setStep("safety")} style={{ ...iosTap, background: "none", border: "none", color: "var(--c-sub)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: "0 0 16px", minHeight: 44, display: "flex", alignItems: "center" }}>
              ← Back
            </button>

            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", marginBottom: 4 }}>
              Select your allergens
            </div>
            <div style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 20, lineHeight: 1.55 }}>
              Tap everything you need to avoid. You can update this anytime in your profile.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 9, marginBottom: 20 }}>
              {ALLERGEN_LIST.map(({ id, label }) => {
                const active = selected.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    aria-pressed={active}
                    style={{
                      ...iosTap,
                      minHeight: 52, padding: "11px 14px",
                      borderRadius: 14,
                      border: active
                        ? "2px solid var(--c-brand)"
                        : `1.5px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                      background: active
                        ? isDark ? "rgba(31,189,204,0.15)" : "rgba(31,189,204,0.07)"
                        : isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
                      color: active ? "var(--c-brand)" : "var(--c-text)",
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 8,
                      transition: "background 0.1s,border-color 0.1s,color 0.1s",
                      boxShadow: active
                        ? `0 0 0 1px var(--c-brand), 0 2px 8px rgba(31,189,204,${isDark ? "0.2" : "0.12"})`
                        : `0 1px 3px rgba(0,0,0,${isDark ? "0.2" : "0.06"})`,
                    }}
                  >
                    <span>{label}</span>
                    {active && (
                      <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Empty-selection warning */}
            {warnEmpty && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                padding: "10px 12px", borderRadius: 10, marginBottom: 12,
                background: isDark ? "rgba(239,68,68,0.1)" : "rgba(254,226,226,0.8)",
                border: `1px solid ${isDark ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.3)"}`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
                </svg>
                <span style={{ fontSize: 12, color: isDark ? "#fca5a5" : "#b91c1c", lineHeight: 1.5 }}>
                  No allergens selected — the app won't flag anything as unsafe. Tap the ones you need to avoid, or skip to browse all restaurants.
                </span>
              </div>
            )}

            {/* Safety note */}
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "10px 12px", borderRadius: 10, marginBottom: 14,
              background: isDark ? "rgba(217,119,6,0.10)" : "rgba(253,230,138,0.4)",
              border: `1px solid ${isDark ? "rgba(217,119,6,0.3)" : "rgba(251,191,36,0.5)"}`,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#fbbf24" : "#92400E"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span style={{ fontSize: 12, color: isDark ? "#fbbf24" : "#92400E", lineHeight: 1.5 }}>
                Always confirm allergen info with restaurant staff before ordering.
              </span>
            </div>

            <button
              onClick={selected.size === 0 ? undefined : handleAllergenContinue}
              disabled={selected.size === 0}
              aria-disabled={selected.size === 0}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: selected.size === 0
                  ? isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
                  : "linear-gradient(135deg,#149aab 0%,var(--c-brand) 50%,#35d4e4 100%)",
                boxShadow: selected.size > 0
                  ? "0 2px 0 rgba(0,0,0,0.15),0 6px 20px rgba(0,150,165,0.3),inset 0 1px 0 rgba(100,230,240,0.3)"
                  : "none",
                color: selected.size === 0
                  ? "var(--c-sub)"
                  : "var(--c-brand-fg)",
                fontSize: 17, fontWeight: 800,
                cursor: selected.size === 0 ? "not-allowed" : "pointer",
                opacity: selected.size === 0 ? 0.5 : 1,
                letterSpacing: "-0.01em",
                transition: "background 0.2s,color 0.2s,box-shadow 0.2s,opacity 0.2s",
              }}
            >
              {selected.size === 0
                ? "Select allergens to continue"
                : `Save ${selected.size} allergen${selected.size !== 1 ? "s" : ""}`}
            </button>

            {selected.size === 0 && (
              <button onClick={handleSkip} style={{ ...iosTap, marginTop: 8, width: "100%", minHeight: 44, border: "none", background: "transparent", color: "var(--c-sub)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                I have no food allergies — skip setup
              </button>
            )}
          </>
        )}

        {/* ── Step: Done ────────────────────────────────────────────────── */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "28px 0" }}>
            <div style={{
              width: 68, height: 68, borderRadius: 999,
              background: isDark ? "rgba(22,163,74,0.15)" : "#dcfce7",
              border: `1.5px solid ${isDark ? "rgba(34,197,94,0.4)" : "rgba(22,163,74,0.3)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={isDark ? "#86efac" : "#16a34a"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "var(--c-text)", marginBottom: 6, letterSpacing: "-0.02em" }}>
              You&apos;re all set!
            </div>
            <div style={{ fontSize: 14, color: "var(--c-sub)", lineHeight: 1.55 }}>
              {selected.size > 0
                ? `Finding restaurants safe for your ${selected.size} allergen${selected.size !== 1 ? "s" : ""}…`
                : "Start searching for safe places to eat."}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
