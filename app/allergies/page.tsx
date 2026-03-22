"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { AllergySelector } from "@/components/AllergySelector";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

export default function AllergiesPage() {
  const { user, loading, allergens, saveAllergens } = useAuth();
  const router = useRouter();

  const [selected, setSelected]             = useState<AllergenId[]>([]);
  const [savedSelection, setSavedSelection] = useState<AllergenId[]>([]);
  const [saved, setSaved]                   = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && allergens.length > 0 && selected.length === 0) {
      setSelected(allergens);          // eslint-disable-line react-hooks/set-state-in-effect
      setSavedSelection(allergens);
    }
  }, [loading, allergens]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = [...selected].sort().join() !== [...savedSelection].sort().join();

  async function handleSave() {
    await saveAllergens(selected);
    setSavedSelection([...selected]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
        Loading…
      </main>
    );
  }

  const allergenLabels = selected
    .map((id) => ALLERGEN_LIST.find((a) => a.id === id))
    .filter(Boolean);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 48,
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "var(--c-hdr)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--c-border)", padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/profile" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Back</Link>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>My Allergies</span>
          <div style={{ width: 48 }} />
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 16 }}>

        {/* Allergy profile card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Allergy Profile
          </div>
          <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 16 }}>
            Saved to your account and synced across devices.
          </div>

          <AllergySelector selected={selected} onChange={setSelected} limit={4} />

          {(isDirty || saved) && (
            <button
              onClick={handleSave}
              style={{
                marginTop: 20, width: "100%", padding: "14px 0",
                borderRadius: 14, border: "none",
                background: saved ? "#22c55e" : "var(--c-text)",
                color: "var(--c-bg)", fontSize: 14, fontWeight: 800,
                cursor: "pointer", transition: "background 0.2s",
              }}
            >
              {saved ? "Saved!" : "Save Allergy Profile"}
            </button>
          )}
        </div>

        {/* Active restrictions */}
        {allergenLabels.length > 0 && (
          <div
            style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 20, padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Active Restrictions ({allergenLabels.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allergenLabels.map((a) => (
                <div
                  key={a!.id}
                  style={{
                    padding: "7px 12px", borderRadius: 999,
                    background: "#fff1f0", border: "1px solid #f3c5c0",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{a!.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allergenLabels.length === 0 && (
          <div
            style={{
              padding: "20px", borderRadius: 20, background: "var(--c-card)",
              border: "1px solid var(--c-border)", textAlign: "center",
              fontSize: 14, color: "var(--c-sub)",
            }}
          >
            No allergens selected yet. Choose from the list above.
          </div>
        )}

      </div>
    </main>
  );
}
