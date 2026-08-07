"use client";

import { useEffect, useState } from "react";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId, AllergenSeverity } from "@/lib/types";

type Props = {
  allergens: AllergenId[];
  severities?: Partial<Record<AllergenId, AllergenSeverity>>;
  onClose: () => void;
};

export function ShowStaffCard({ allergens, severities = {}, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const severe = allergens.filter((a) => (severities[a] ?? "anaphylactic") === "anaphylactic");
  const mild   = allergens.filter((a) => severities[a] === "intolerance");
  const showAll = severe.length === 0 && mild.length === 0 && allergens.length > 0;
  const severeList = showAll ? allergens : severe;

  async function handleShare() {
    const url = `${window.location.origin}/allergy-card?a=${allergens.join(",")}`;
    if (navigator.share) {
      try { await navigator.share({ title: "My allergy card — AllergEats", url }); } catch { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      } catch { /* ignore */ }
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Allergy card — show to staff"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "#fff",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch" as never,
        fontFamily: "Inter, -apple-system, Arial, sans-serif",
      }}
    >
      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `max(16px, env(safe-area-inset-top)) 20px 12px`,
        borderBottom: "1px solid #f3f4f6",
        gap: 10,
      }}>
        <div style={{
          background: "var(--c-brand)", color: "var(--c-brand-fg)",
          fontWeight: 900, fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", borderRadius: 6, padding: "4px 10px",
        }}>
          AllergEats
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Share button */}
          {allergens.length > 0 && (
            <button
              onClick={handleShare}
              aria-label="Share allergy card link"
              style={{
                height: 44, padding: "0 14px", borderRadius: 10,
                border: "1.5px solid #e5e7eb",
                background: copied ? "#f0fdf4" : "#f9fafb",
                display: "flex", alignItems: "center", gap: 6,
                cursor: "pointer", fontSize: 13, fontWeight: 700,
                color: copied ? "#16a34a" : "#374151",
                transition: "background 0.2s, color 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  Share link
                </>
              )}
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 44, height: 44, borderRadius: 999,
              border: "1.5px solid #e5e7eb", background: "#f9fafb",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", fontSize: 16, color: "#6b7280",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "28px 20px max(24px, env(safe-area-inset-bottom))",
        maxWidth: 480, margin: "0 auto", width: "100%",
        gap: 24,
      }}>

        {/* Alert header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#ef4444" />
              <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" fill="#fff" />
            </svg>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#111", lineHeight: 1.2, marginBottom: 8, letterSpacing: "-0.01em" }}>
            I have food allergies.
          </div>
          <div style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.5 }}>
            Please read before preparing my order.
          </div>
        </div>

        {/* Severe / anaphylactic section */}
        {severeList.length > 0 && (
          <div style={{ width: "100%", background: "#fff1f0", border: "2.5px solid #ef4444", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "#ef4444", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#fff" />
                <line x1="12" y1="9" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" fill="#ef4444" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {showAll ? "Cannot eat — must avoid completely" : "Life-threatening — must avoid completely"}
              </span>
            </div>

            {/* Allergen pills */}
            <div style={{ padding: "20px 16px 12px", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {severeList.map((id) => {
                const meta = ALLERGEN_LIST.find((a) => a.id === id);
                return (
                  <div key={id} style={{
                    background: "#c81e1e", color: "#fff",
                    borderRadius: 14, padding: "14px 24px",
                    fontSize: 22, fontWeight: 900, lineHeight: 1,
                    letterSpacing: "-0.01em",
                    boxShadow: "0 2px 8px rgba(185,28,28,0.25)",
                  }}>
                    {meta?.label ?? id}
                  </div>
                );
              })}
            </div>

            {/* Staff action checklist */}
            <div style={{ margin: "0 16px 12px", background: "#fee2e2", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#991b1b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                Before preparing my order:
              </div>
              {[
                "Put on fresh gloves",
                "Use clean utensils and a separate prep surface",
                "Check all sauces, dressings, and marinades",
                "No shared fryer oil or cooking water",
              ].map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                  <div style={{ flexShrink: 0, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
                      <polyline points="1.5 4 3 5.5 6.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 13, color: "#b91c1c", lineHeight: 1.4, fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: "0 20px 16px", textAlign: "center", fontSize: 13, color: "#b91c1c", fontWeight: 600, lineHeight: 1.5 }}>
              Even trace amounts can cause a severe reaction.
            </div>
          </div>
        )}

        {/* Mild / intolerance section */}
        {mild.length > 0 && (
          <div style={{ width: "100%", background: "#fffbeb", border: "2px solid #fbbf24", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "#f59e0b", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="#fff" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#f59e0b" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Intolerance — please avoid if possible
              </span>
            </div>
            <div style={{ padding: "20px 16px 20px", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {mild.map((id) => {
                const meta = ALLERGEN_LIST.find((a) => a.id === id);
                return (
                  <div key={id} style={{
                    background: "#d97706", color: "#fff",
                    borderRadius: 14, padding: "12px 22px",
                    fontSize: 19, fontWeight: 800, lineHeight: 1,
                    boxShadow: "0 2px 6px rgba(217,119,6,0.2)",
                  }}>
                    {meta?.label ?? id}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 14, color: "#4b5563", lineHeight: 1.65, marginTop: 4, fontWeight: 500 }}>
          If you&apos;re unsure about any ingredient,<br />
          <strong style={{ color: "#111", fontWeight: 800 }}>please confirm with the kitchen before preparing.</strong>
        </div>
      </div>
    </div>
  );
}
