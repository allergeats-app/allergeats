"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { AllergySelector } from "@/components/AllergySelector";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import { ShowStaffCard } from "@/components/ShowStaffCard";
import type { AllergenId, AllergenSeverity } from "@/lib/types";

export default function AllergiesPage() {
  const { user, loading, allergens, severities, saveAllergens, saveSeverities } = useAuth();
  const router = useRouter();

  const [selected, setSelected]                     = useState<AllergenId[]>([]);
  const [savedSelection, setSavedSelection]         = useState<AllergenId[]>([]);
  const [localSeverities, setLocalSeverities]       = useState<Partial<Record<AllergenId, AllergenSeverity>>>({});
  const [saved, setSaved]                           = useState(false);
  const [showStaffCard, setShowStaffCard]           = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && allergens.length > 0 && selected.length === 0) {
      setSelected(allergens);          // eslint-disable-line react-hooks/set-state-in-effect
      setSavedSelection(allergens);
      setLocalSeverities(severities);  // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [loading, allergens, severities]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleSeverity(id: AllergenId) {
    setLocalSeverities((prev) => {
      const current = prev[id] ?? "anaphylactic";
      return { ...prev, [id]: current === "anaphylactic" ? "intolerance" : "anaphylactic" };
    });
  }

  const isDirty = [...selected].sort().join() !== [...savedSelection].sort().join()
    || JSON.stringify(localSeverities) !== JSON.stringify(severities);

  async function handleSave() {
    await saveAllergens(selected);
    saveSeverities(localSeverities);
    setSavedSelection([...selected]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
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
        minHeight: "100dvh",
        background: "var(--c-bg)",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 48,
      }}
    >
      {showStaffCard && (
        <ShowStaffCard
          allergens={selected}
          severities={localSeverities}
          onClose={() => setShowStaffCard(false)}
        />
      )}
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

          {selected.length > 0 && (
            <button
              onClick={() => setShowStaffCard(true)}
              style={{
                marginTop: 12, width: "100%", padding: "13px 0",
                borderRadius: 14,
                border: "1px solid #b8962e",
                background: "linear-gradient(135deg, #f5d060 0%, #e8b923 30%, #fce97a 50%, #d4a017 70%, #f5d060 100%)",
                backgroundSize: "200% 200%",
                color: "#5c3d00",
                fontSize: 14, fontWeight: 800, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 48,
                boxShadow: "0 1px 4px rgba(180,130,0,0.35), inset 0 1px 0 rgba(255,255,255,0.45)",
                textShadow: "0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              Show Allergy Card to Staff
            </button>
          )}
        </div>

        {/* Active restrictions with severity */}
        {allergenLabels.length > 0 && (
          <div
            style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 20, padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              Severity Levels
            </div>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 14, lineHeight: 1.5 }}>
              Tap each allergen to set how serious it is for you. <strong style={{ color: "var(--c-text)" }}>Severe</strong> = anaphylactic risk — the app will always show <em>Avoid</em> (never just &ldquo;Ask&rdquo;) for these.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {allergenLabels.map((a) => {
                const sev = localSeverities[a!.id] ?? "anaphylactic";
                const isAnaphylactic = sev === "anaphylactic";
                return (
                  <div
                    key={a!.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 14,
                      background: isAnaphylactic ? "#fff1f0" : "var(--c-muted)",
                      border: `1.5px solid ${isAnaphylactic ? "#f3c5c0" : "var(--c-border)"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: isAnaphylactic ? "#b91c1c" : "var(--c-text)" }}>
                        {a!.label}
                      </span>
                      {isAnaphylactic && (
                        <span style={{ fontSize: 10, fontWeight: 900, color: "#b91c1c", background: "#fde8e8", border: "1px solid #fca5a5", borderRadius: 6, padding: "2px 7px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          Severe
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSeverity(a!.id)}
                      style={{
                        padding: "6px 14px", borderRadius: 99, border: "none",
                        background: isAnaphylactic ? "#b91c1c" : "#6b7280",
                        color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        minHeight: 44, minWidth: 44,
                      }}
                    >
                      {isAnaphylactic ? "Severe" : "Mild"}
                    </button>
                  </div>
                );
              })}
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
