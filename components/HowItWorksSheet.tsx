"use client";

import { useEffect } from "react";

export function HowItWorksSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="How It Works"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 201,
          background: "var(--c-card)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          boxShadow: "0 -16px 56px rgba(0,0,0,0.2)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: open
            ? "transform 0.38s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.28s cubic-bezier(0.4,0,1,1)",
          maxHeight: "90dvh",
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px max(36px, env(safe-area-inset-bottom))" }}>

          {/* Handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, marginBottom: 4 }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--c-border)" }} />
          </div>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0 20px",
            position: "sticky", top: 0, zIndex: 1,
            background: "var(--c-card)",
            borderBottom: "1px solid var(--c-border)",
            marginBottom: 28,
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>
                Your Safe Dining Assistant
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", lineHeight: 1.2 }}>
                Eat Out Confidently — Even with Food Allergies
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                background: "var(--c-muted)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--c-sub)", marginLeft: 12,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Steps */}
          <div style={{ display: "grid", gap: 10, marginBottom: 32 }}>
            {[
              { n: "1", title: "Set Your Allergy Profile", desc: "Tell us what to avoid. Your profile syncs across every restaurant and scan." },
              { n: "2", title: "Find Safe Restaurants or Scan Any Menu", desc: "Browse nearby restaurants filtered for your allergies, or point your camera at any menu." },
              { n: "3", title: "Know Exactly What to Order", desc: "See what's safe, what to ask staff, and what to avoid — in seconds." },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--c-bg)", border: "1px solid var(--c-border)", borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#1fbdcc", color: "var(--c-brand-fg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Example results */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ textAlign: "center", marginBottom: 18 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text)", lineHeight: 1.2, marginBottom: 4 }}>See How it Works</div>
              <div style={{ fontSize: 12, color: "var(--c-sub)" }}>Menu analyzed by AllergEats · Dairy + wheat allergies selected</div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Grilled Salmon</div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>Low Risk</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>Likely Safe</div>
              </div>
              <div style={{ background: "#fff7db", border: "1px solid #f4dd8d", borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Caesar Salad</div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#fff7db", color: "#854d0e", border: "1px solid #f4dd8d", whiteSpace: "nowrap" }}>Medium Risk</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#854d0e", marginBottom: 3 }}>Ask Staff</div>
                <div style={{ fontSize: 12, color: "#854d0e" }}>Caesar dressing may contain egg, dairy, or anchovies</div>
              </div>
              <div style={{ background: "#fff1f0", border: "1px solid #f3c5c0", borderRadius: 16, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Chicken Alfredo</div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#fff1f0", color: "#b91c1c", border: "1px solid #f3c5c0", whiteSpace: "nowrap" }}>High Risk</span>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#b91c1c", marginBottom: 3 }}>Avoid</div>
                <div style={{ fontSize: 12, color: "#b91c1c" }}>Contains: dairy, wheat</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
