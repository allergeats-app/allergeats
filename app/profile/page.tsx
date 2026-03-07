"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { AllergySelector } from "@/components/AllergySelector";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading, allergens, saveAllergens, signOut } = useAuth();
  const router = useRouter();

  const [selected, setSelected]   = useState<AllergenId[]>([]);
  const [saved, setSaved]         = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Redirect to auth if not signed in (after loading completes)
  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  // Sync allergens from context once loaded
  useEffect(() => {
    if (allergens.length > 0) setSelected(allergens);
  }, [allergens]);

  async function handleSave() {
    await saveAllergens(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
  }

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100vh", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
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
        background: "#f7f7f7",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 48,
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "rgba(247,247,247,0.95)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e5e7eb", padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textDecoration: "none" }}>← Home</Link>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>My Account</span>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              fontSize: 13, fontWeight: 700, color: "#b91c1c",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 16 }}>

        {/* Account card */}
        <div
          style={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            Account
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Avatar initials */}
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#eb1700", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, flexShrink: 0,
              }}
            >
              {user.email?.[0].toUpperCase() ?? "?"}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{user.email}</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        {/* Allergy profile card */}
        <div
          style={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Allergy Profile
          </div>
          <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>
            Saved to your account and synced across devices.
          </div>

          <AllergySelector selected={selected} onChange={setSelected} />

          <button
            onClick={handleSave}
            style={{
              marginTop: 20, width: "100%", padding: "14px 0",
              borderRadius: 14, border: "none",
              background: saved ? "#22c55e" : "#111",
              color: "#fff", fontSize: 14, fontWeight: 800,
              cursor: "pointer", transition: "background 0.2s",
            }}
          >
            {saved ? "Saved!" : "Save Allergy Profile"}
          </button>
        </div>

        {/* Current profile summary */}
        {allergenLabels.length > 0 && (
          <div
            style={{
              background: "#fff", border: "1px solid #e5e7eb",
              borderRadius: 20, padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Active Restrictions ({allergenLabels.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allergenLabels.map((a) => (
                <div
                  key={a!.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "7px 12px", borderRadius: 999,
                    background: "#fff1f0", border: "1px solid #f3c5c0",
                  }}
                >
                  <span style={{ fontSize: 16 }}>{a!.emoji}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{a!.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allergenLabels.length === 0 && (
          <div
            style={{
              padding: "20px", borderRadius: 20, background: "#fff",
              border: "1px solid #e5e7eb", textAlign: "center",
              fontSize: 14, color: "#9ca3af",
            }}
          >
            No allergens selected yet. Choose from the list above.
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "grid", gap: 10 }}>
          <Link
            href="/restaurants"
            style={{
              display: "block", padding: "14px 18px", borderRadius: 14,
              background: "#eb1700", color: "#fff", textDecoration: "none",
              fontSize: 14, fontWeight: 800, textAlign: "center",
            }}
          >
            Find Restaurants →
          </Link>
          <Link
            href="/scan"
            style={{
              display: "block", padding: "14px 18px", borderRadius: 14,
              background: "#fff", border: "1px solid #e5e7eb",
              color: "#374151", textDecoration: "none",
              fontSize: 14, fontWeight: 700, textAlign: "center",
            }}
          >
            Manual Menu Scan
          </Link>
        </div>
      </div>
    </main>
  );
}
