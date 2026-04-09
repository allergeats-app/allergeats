"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ALLERGEN_LIST, saveProfileAllergens, loadProfileAllergens } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";
import { useTheme } from "@/lib/themeContext";

const ONBOARDING_KEY = "allegeats_onboarded_v1";

export function OnboardingModal() {
  const { isDark } = useTheme();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<"welcome" | "allergens" | "done">("welcome");
  const [selected, setSelected] = useState<Set<AllergenId>>(new Set());

  useEffect(() => {
    // Show only if user hasn't completed onboarding and has no allergens set
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
    // Merge with any already-saved allergens (e.g. from auth sync)
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
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
      padding: "0 0 env(safe-area-inset-bottom)",
    }}>
      <div style={{
        background: "var(--c-card)",
        borderRadius: "28px 28px 0 0",
        width: "100%", maxWidth: 520,
        padding: "28px 24px 36px",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
        maxHeight: "90dvh",
        overflowY: "auto",
      }}>

        {/* Welcome step */}
        {step === "welcome" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <Image src="/logo.png" alt="AllergEats" width={200} height={46}
                style={{ width: "auto", height: 44, maxWidth: "70vw", margin: "0 auto 16px", display: "block" }} />
              <div style={{ fontSize: 22, fontWeight: 900, color: "var(--c-text)", marginBottom: 10 }}>
                Eat out safely.
              </div>
              <div style={{ fontSize: 15, color: "var(--c-sub)", lineHeight: 1.65 }}>
                Instantly shows what you can eat. Set up in 30 seconds.
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
              {[
                { icon: "🔍", text: "Search nearby restaurants" },
                { icon: "⚠️", text: "See Safe / Ask / Avoid ratings per item" },
                { icon: "💾", text: "Save scans and orders for later" },
              ].map(({ icon, text }) => (
                <div key={text} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  background: isDark ? "#1c1c1e" : "#f9f8f6",
                  borderRadius: 14, padding: "12px 16px",
                }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: "var(--c-text)" }}>{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep("allergens")}
              style={{
                width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
                background: "#eb1700", color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
              }}
            >
              Set My Allergens
            </button>
            <button
              onClick={handleSkip}
              style={{
                width: "100%", padding: "12px 0", marginTop: 10, borderRadius: 16,
                border: "none", background: "transparent",
                color: "var(--c-sub)", fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Skip for now
            </button>
          </>
        )}

        {/* Allergen picker step */}
        {step === "allergens" && (
          <>
            <button
              onClick={() => setStep("welcome")}
              style={{ background: "none", border: "none", color: "var(--c-sub)", fontSize: 13, fontWeight: 700, cursor: "pointer", padding: 0, marginBottom: 16 }}
            >
              ← Back
            </button>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>
              Select your allergens
            </div>
            <div style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 20, lineHeight: 1.55 }}>
              Tap everything you need to avoid. You can update this anytime in your Allergen Profile.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
              {ALLERGEN_LIST.map(({ id, label }) => {
                const active = selected.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggle(id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: active ? "2px solid #eb1700" : "1.5px solid var(--c-border)",
                      background: active ? (isDark ? "rgba(235,23,0,0.15)" : "rgba(235,23,0,0.07)") : "var(--c-card)",
                      color: active ? "#eb1700" : "var(--c-text)",
                      fontSize: 14, fontWeight: active ? 700 : 500,
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.12s",
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
                width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
                background: "#eb1700", color: "#fff",
                fontSize: 16, fontWeight: 800, cursor: "pointer",
              }}
            >
              {selected.size === 0 ? "Continue with no allergens" : `Save ${selected.size} allergen${selected.size !== 1 ? "s" : ""}`}
            </button>
          </>
        )}

        {/* Done step */}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", marginBottom: 6 }}>You&apos;re all set!</div>
            <div style={{ fontSize: 14, color: "var(--c-sub)" }}>Start searching for safe places to eat.</div>
          </div>
        )}

      </div>
    </div>
  );
}