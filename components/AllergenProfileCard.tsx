"use client";

import Link from "next/link";
import { AllergySelector } from "@/components/AllergySelector";
import type { AllergenId } from "@/lib/types";
import type { SaveState } from "@/lib/hooks/useAllergenProfile";

interface AllergenProfileCardProps {
  allergens: AllergenId[];
  saveState: SaveState;
  isSignedIn: boolean;
  onChange: (next: AllergenId[]) => void;
}

export function AllergenProfileCard({ allergens, saveState, isSignedIn, onChange }: AllergenProfileCardProps) {
  return (
    <div style={{
      background: "var(--c-card)", border: "1px solid var(--c-border)",
      borderRadius: 20, padding: "16px 16px 14px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Your Allergies
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isSignedIn && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: saveState === "saved" ? "#22c55e" : saveState === "error" ? "#ef4444" : "var(--c-sub)",
              transition: "color 0.3s",
            }}>
              {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving…" : saveState === "error" ? "Failed to save" : "Auto-saved"}
            </span>
          )}
          {!isSignedIn && (
            <Link href="/auth" style={{ fontSize: 11, fontWeight: 700, color: "#1fbdcc", textDecoration: "none" }}>
              Sign in to save
            </Link>
          )}
        </div>
      </div>
      <AllergySelector selected={allergens} onChange={onChange} limit={4} />
      {allergens.length === 0 && (
        <div style={{
          marginTop: 10, display: "flex", alignItems: "center", gap: 6,
          padding: "8px 12px", borderRadius: 10,
          background: "#fef2f2", border: "1px solid #fecaca",
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#1fbdcc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
          </svg>
          <span style={{ fontSize: 12, color: "#b91c1c", fontWeight: 600 }}>
            Select your allergens above — results update instantly
          </span>
        </div>
      )}
    </div>
  );
}
