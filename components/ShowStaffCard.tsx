"use client";

import { useEffect } from "react";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId, AllergenSeverity } from "@/lib/types";

type Props = {
  allergens: AllergenId[];
  severities?: Partial<Record<AllergenId, AllergenSeverity>>;
  onClose: () => void;
};

export function ShowStaffCard({ allergens, severities = {}, onClose }: Props) {
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
  // Fallback: no severities set — treat all as severe
  const showAll = severe.length === 0 && mild.length === 0 && allergens.length > 0;
  const severeList = showAll ? allergens : severe;

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
        fontFamily: "Inter, -apple-system, Arial, sans-serif",
      }}
    >
      {/* Top bar — branding + close */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: `max(16px, env(safe-area-inset-top)) 20px 12px`,
        borderBottom: "1px solid #f3f4f6",
      }}>
        <div style={{
          background: "#eb1700", color: "#fff",
          fontWeight: 900, fontSize: 11, letterSpacing: "0.1em",
          textTransform: "uppercase", borderRadius: 6, padding: "4px 10px",
        }}>
          AllergEats
        </div>
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

      {/* Main content */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "28px 20px max(24px, env(safe-area-inset-bottom))",
        maxWidth: 480, margin: "0 auto", width: "100%",
        gap: 24,
      }}>

        {/* Alert header */}
        <div style={{ textAlign: "center" }}>
          {/* Warning triangle icon */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#ef4444" stroke="#ef4444" strokeWidth="0" />
              <line x1="12" y1="9" x2="12" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="17" r="1" fill="#fff" />
            </svg>
          </div>
          <div style={{
            fontSize: 26, fontWeight: 900, color: "#111", lineHeight: 1.2, marginBottom: 8,
            letterSpacing: "-0.01em",
          }}>
            I have food allergies.
          </div>
          <div style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.5 }}>
            Please read before preparing my order.
          </div>
        </div>

        {/* Severe / anaphylactic section */}
        {severeList.length > 0 && (
          <div style={{
            width: "100%",
            background: "#fff1f0",
            border: "2.5px solid #ef4444",
            borderRadius: 20,
            overflow: "hidden",
          }}>
            {/* Section label */}
            <div style={{
              background: "#ef4444",
              padding: "10px 20px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" fill="#fff" />
                <line x1="12" y1="9" x2="12" y2="13" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="17" r="1" fill="#ef4444" />
              </svg>
              <span style={{
                fontSize: 12, fontWeight: 900, color: "#fff",
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                {showAll ? "Must avoid completely" : "Life-threatening — must avoid completely"}
              </span>
            </div>

            {/* Allergen pills */}
            <div style={{
              padding: "20px 16px 16px",
              display: "flex", flexWrap: "wrap",
              gap: 10, justifyContent: "center",
            }}>
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

            {/* Warning text */}
            <div style={{
              padding: "0 20px 16px",
              textAlign: "center", fontSize: 13, color: "#b91c1c",
              fontWeight: 600, lineHeight: 1.5,
            }}>
              Even trace amounts can cause a severe reaction.
              <br />
              No cross-contact with shared surfaces, utensils, or fryer oil.
            </div>
          </div>
        )}

        {/* Mild / intolerance section */}
        {mild.length > 0 && (
          <div style={{
            width: "100%",
            background: "#fffbeb",
            border: "2px solid #fbbf24",
            borderRadius: 20,
            overflow: "hidden",
          }}>
            <div style={{
              background: "#f59e0b",
              padding: "10px 20px",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="#fff" />
                <line x1="12" y1="8" x2="12" y2="12" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="#f59e0b" />
              </svg>
              <span style={{
                fontSize: 12, fontWeight: 900, color: "#fff",
                textTransform: "uppercase", letterSpacing: "0.1em",
              }}>
                Intolerance — please avoid if possible
              </span>
            </div>

            <div style={{
              padding: "20px 16px 20px",
              display: "flex", flexWrap: "wrap",
              gap: 10, justifyContent: "center",
            }}>
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
        <div style={{
          textAlign: "center", fontSize: 13, color: "#9ca3af", lineHeight: 1.6, marginTop: 4,
        }}>
          Thank you for your care.
          <br />
          If unsure about an ingredient, please check with the kitchen.
        </div>
      </div>
    </div>
  );
}
