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
  // Lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const severe  = allergens.filter((a) => (severities[a] ?? "anaphylactic") === "anaphylactic");
  const mild    = allergens.filter((a) => severities[a] === "intolerance");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Allergy card — show to staff"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "#fff", color: "#111",
        display: "flex", flexDirection: "column",
        padding: `max(24px, env(safe-area-inset-top)) 24px max(24px, env(safe-area-inset-bottom))`,
        overflowY: "auto",
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute", top: "max(16px, env(safe-area-inset-top))", right: 16,
          width: 44, height: 44, borderRadius: 999, border: "1.5px solid #e5e7eb",
          background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 18, color: "#374151",
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 8 }}>
        <div style={{
          display: "inline-block", background: "#eb1700", color: "#fff",
          fontWeight: 900, fontSize: 13, letterSpacing: "0.08em",
          textTransform: "uppercase", borderRadius: 8, padding: "5px 14px", marginBottom: 16,
        }}>
          AllergEats — Staff Card
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#111", lineHeight: 1.3 }}>
          I have food allergies.
        </div>
        <div style={{ fontSize: 16, color: "#4b5563", marginTop: 6 }}>
          Please read carefully before preparing my order.
        </div>
      </div>

      {/* Severe / anaphylactic allergens */}
      {severe.length > 0 && (
        <div style={{
          background: "#fff1f0", border: "2px solid #ef4444",
          borderRadius: 20, padding: "20px 20px 16px", marginBottom: 20,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, color: "#b91c1c",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span> Life-threatening — must avoid completely
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {severe.map((id) => {
              const meta = ALLERGEN_LIST.find((a) => a.id === id);
              return (
                <div key={id} style={{
                  background: "#b91c1c", color: "#fff",
                  borderRadius: 12, padding: "12px 20px",
                  fontSize: 20, fontWeight: 900, lineHeight: 1,
                }}>
                  {meta?.label ?? id}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, fontSize: 13, color: "#b91c1c", fontWeight: 600, lineHeight: 1.5 }}>
            Even trace amounts can cause a severe reaction. Please ensure no cross-contact with shared utensils, surfaces, or fryer oil.
          </div>
        </div>
      )}

      {/* Mild / intolerance allergens */}
      {mild.length > 0 && (
        <div style={{
          background: "#fff7db", border: "1.5px solid #fcd34d",
          borderRadius: 20, padding: "20px 20px 16px", marginBottom: 20,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, color: "#92400e",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>
            Intolerance — please avoid if possible
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {mild.map((id) => {
              const meta = ALLERGEN_LIST.find((a) => a.id === id);
              return (
                <div key={id} style={{
                  background: "#f59e0b", color: "#fff",
                  borderRadius: 12, padding: "10px 18px",
                  fontSize: 18, fontWeight: 800, lineHeight: 1,
                }}>
                  {meta?.label ?? id}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* If no severity set but allergens exist, show all */}
      {severe.length === 0 && mild.length === 0 && allergens.length > 0 && (
        <div style={{
          background: "#fff1f0", border: "2px solid #ef4444",
          borderRadius: 20, padding: "20px 20px 16px", marginBottom: 20,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 900, color: "#b91c1c",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12,
          }}>
            ⚠ Allergic to — please avoid
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {allergens.map((id) => {
              const meta = ALLERGEN_LIST.find((a) => a.id === id);
              return (
                <div key={id} style={{
                  background: "#b91c1c", color: "#fff",
                  borderRadius: 12, padding: "12px 20px",
                  fontSize: 20, fontWeight: 900, lineHeight: 1,
                }}>
                  {meta?.label ?? id}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: "auto", paddingTop: 24,
        textAlign: "center", fontSize: 12, color: "#9ca3af", lineHeight: 1.6,
      }}>
        Thank you for your care.
        <br />
        If unsure about an ingredient, please check with the kitchen before serving.
      </div>
    </div>
  );
}
