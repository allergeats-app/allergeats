"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function OnboardingModal() {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"welcome" | "safety" | "allergens" | "done">("welcome");
  const [selected, setSelected] = useState<Set<AllergenId>>(new Set());
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) {
      // Pre-populate any allergens already saved (e.g. user dismissed before, then re-opened)
      const existing = loadProfileAllergens();
      if (existing.length > 0) setSelected(new Set(existing as AllergenId[]));
      setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, []);

  // Focus first interactive element whenever the modal appears or the step changes
  useEffect(() => {
    if (!visible) return;
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    });
  }, [visible, step]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { handleSkip(); return; }
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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to AllergEats"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "max(20px, env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) max(20px, env(safe-area-inset-bottom)) max(20px, env(safe-area-inset-left))",
      }}
      onKeyDown={handleKeyDown}
    >
      <div ref={dialogRef} style={{
        background: isDark
          ? "linear-gradient(150deg, #111214 0%, #1e2023 20%, #141618 45%, #1a1d20 70%, #111214 100%)"
          : "linear-gradient(150deg, #f8f9fa 0%, #e8eaed 15%, #ffffff 32%, #d0d4d8 52%, #f4f5f6 68%, #c8ccd0 84%, #eef0f2 100%)",
        borderRadius: 28,
        width: "100%", maxWidth: 480,
        padding: "32px 24px 28px",
        boxShadow: isDark
          ? "0 0 0 1px rgba(180,185,195,0.2), 0 16px 64px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.4)"
          : "0 0 0 1px rgba(140,148,158,0.18), 0 16px 64px rgba(60,70,80,0.22), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(100,110,120,0.12)",
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
            ? "linear-gradient(180deg, rgba(220,225,235,0.08) 0%, rgba(220,225,235,0) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)",
          pointerEvents: "none",
        }} />

        {/* ── Welcome ── */}
        {step === "welcome" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Image src="/logo 3d.png" alt="AllergEats" width={200} height={49}
                sizes="200px"
                style={{ width: "auto", height: 48, maxWidth: "70vw", margin: "0 auto 16px", display: "block" }} />
              <div style={{
                fontSize: 24,
                fontWeight: 900,
                fontFamily: "'Georgia', 'Times New Roman', serif",
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                background: isDark
                  ? "linear-gradient(135deg, #c8cdd5 0%, #e8ecf0 50%, #9aa0a8 100%)"
                  : "linear-gradient(135deg, #2c3038 0%, #4a5260 40%, #1e2228 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                Eat Out Without Guessing.
              </div>
            </div>

            {/* Feature pills */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center", marginBottom: 24 }}>
              {[
                {
                  text: "Find Nearby Restaurants",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                  ),
                },
                {
                  text: "Know What's Safe Instantly",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/>
                    </svg>
                  ),
                },
                {
                  text: "Save Your Go-To Meals",
                  icon: (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                    background: isDark ? "rgba(31,189,204,0.12)" : "rgba(31,189,204,0.07)",
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
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "rgba(180,188,198,0.7)" : "rgba(60,70,82,0.6)" }}>
                Set Up in 30 Seconds
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep("safety")}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #149aab 0%, #1fbdcc 50%, #35d4e4 100%)",
                boxShadow: "0 2px 0 rgba(0,0,0,0.2), 0 6px 20px rgba(0,150,165,0.35), inset 0 1px 0 rgba(100,230,240,0.3)",
                color: "var(--c-brand-fg)",
                fontSize: 17, fontWeight: 800, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              Set My Allergens & Find Food
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
                    color: "var(--c-brand)", fontWeight: 700, textDecoration: "none",
                    display: "inline", minHeight: 44, padding: "10px 0",
                  }}
                >
                  Sign In
                </Link>
              </span>
            </div>
          </>
        )}

        {/* ── Safety acknowledgment ── */}
        {step === "safety" && (
          <>
            {/* Gold card */}
            <div style={{
              borderRadius: 20,
              background: "linear-gradient(160deg, #1e1a0e 0%, #2a2010 60%, #1a1508 100%)",
              border: "1.5px solid #b8892a",
              boxShadow: "0 0 32px rgba(212,160,40,0.25), inset 0 0 40px rgba(180,130,20,0.06)",
              padding: "28px 22px 24px",
              marginBottom: 20,
              textAlign: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Top gold line glow */}
              <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(212,160,40,0.8), transparent)" }} />
              {/* Bottom gold line glow */}
              <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg, transparent, rgba(212,160,40,0.5), transparent)" }} />

              {/* Icon */}
              <div style={{ marginBottom: 14, display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,160,40,0.35) 0%, transparent 70%)" }} />
                  <svg width="52" height="52" viewBox="0 0 52 52" fill="none" aria-hidden="true">
                    <polygon points="26,5 49,45 3,45" fill="url(#goldTriangle)" stroke="#c9922a" strokeWidth="1.5" strokeLinejoin="round"/>
                    <defs>
                      <linearGradient id="goldTriangle" x1="26" y1="5" x2="26" y2="45" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#f5c842"/>
                        <stop offset="100%" stopColor="#b8720a"/>
                      </linearGradient>
                    </defs>
                    <text x="26" y="38" textAnchor="middle" fontSize="20" fontWeight="900" fill="#1a1200">!</text>
                  </svg>
                </div>
              </div>

              {/* Title */}
              <div style={{
                fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", marginBottom: 4,
                background: "linear-gradient(135deg, #f5c842 0%, #e8a820 50%, #c9922a 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                Important Information
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,160,40,0.4), transparent)", margin: "14px 0" }} />

              {/* Body */}
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: 14, color: "#e8c97a", lineHeight: 1.65, fontWeight: 600, marginBottom: 12 }}>
                  <span style={{ color: "#f5c842" }}>AllergEats</span> is a decision-support tool, not medical advice. It helps you identify potential allergens in menu text, but:
                </div>
                <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: 14, color: "#c8a84a", lineHeight: 1.85 }}>
                  <li>Menus change — ingredients listed today may differ tomorrow</li>
                  <li>Cross-contamination is not detectable from text alone</li>
                  <li>Detection is not 100% accurate for all ingredient names</li>
                </ul>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(212,160,40,0.4), transparent)", margin: "14px 0" }} />

              {/* Red warning line */}
              <div style={{
                fontSize: 13, color: "#fca5a5", lineHeight: 1.6, fontWeight: 600,
              }}>
                <strong style={{ color: "#f87171" }}>Always confirm with restaurant staff before ordering</strong>, especially for severe or life-threatening allergies.
              </div>
            </div>

            <button
              onClick={() => setStep("allergens")}
              style={{
                ...iosTap,
                width: "100%", minHeight: 54, padding: "15px 0",
                borderRadius: 16, border: "none",
                background: "linear-gradient(135deg, #149aab 0%, #1fbdcc 50%, #35d4e4 100%)",
                color: "var(--c-brand-fg)",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
                letterSpacing: "-0.01em",
              }}
            >
              I Understand — Set My Allergens
            </button>
            <button
              onClick={() => setStep("welcome")}
              style={{
                ...iosTap,
                marginTop: 10, width: "100%", minHeight: 44,
                border: "none", background: "transparent",
                color: "var(--c-sub)", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Back
            </button>
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
                      border: active ? "2px solid var(--c-brand)" : "1.5px solid var(--c-border)",
                      background: active ? (isDark ? "rgba(31,189,204,0.15)" : "rgba(31,189,204,0.07)") : "var(--c-card)",
                      color: active ? "#1fbdcc" : "var(--c-text)",
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
                background: "var(--c-brand)", color: "var(--c-brand-fg)",
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