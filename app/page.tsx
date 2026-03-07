"use client";

import Link from "next/link";
import { AllergySelector } from "@/components/AllergySelector";
import { useAuth } from "@/lib/authContext";
import type { AllergenId } from "@/lib/types";
import { useState } from "react";

export default function HomePage() {
  const { user, allergens, saveAllergens, loading } = useAuth();
  const [selected, setSelected] = useState<AllergenId[]>(allergens);
  const [saved, setSaved] = useState(false);

  // Keep local selection in sync when auth loads allergens
  // (runs once after context hydrates)
  if (!loading && allergens.length > 0 && selected.length === 0) {
    setSelected(allergens);
  }

  async function handleSave() {
    await saveAllergens(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #fff7f6 0%, #f7f7f7 60%)",
        fontFamily: "Inter, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top nav */}
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 20px",
        }}
      >
        <Link
          href="/scan"
          style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textDecoration: "none" }}
        >
          Manual Scan
        </Link>

        {user ? (
          <Link
            href="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 999,
              background: "#fff",
              border: "1px solid #e5e7eb",
              textDecoration: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                width: 24, height: 24, borderRadius: "50%",
                background: "#eb1700", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 900,
              }}
            >
              {user.email?.[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>Account</span>
          </Link>
        ) : (
          <Link
            href="/auth"
            style={{
              padding: "7px 16px", borderRadius: 999,
              background: "#111", color: "#fff",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}
          >
            Sign In
          </Link>
        )}
      </nav>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "24px 20px 48px",
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🍽️</div>
          <h1
            style={{
              fontSize: 34, fontWeight: 900, color: "#111",
              margin: 0, letterSpacing: "-0.5px",
            }}
          >
            AllergEats
          </h1>
          <p
            style={{
              fontSize: 15, color: "#6b7280", lineHeight: 1.5,
              maxWidth: 300, margin: "8px auto 0",
            }}
          >
            Find restaurants where you can eat safely — filtered for your allergies.
          </p>
        </div>

        {/* Allergy selector card */}
        <div
          style={{
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: 24, padding: 24, width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)", marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your Allergies
            </div>
            {user && (
              <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>
                Synced to account
              </div>
            )}
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
            {saved ? "Saved!" : user ? "Save to Account" : "Save Profile"}
          </button>

          {!user && (
            <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 10 }}>
              <Link href="/auth" style={{ color: "#eb1700", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
              {" "}to sync your profile across devices.
            </p>
          )}
        </div>

        {/* Primary CTA */}
        <Link
          href="/restaurants"
          style={{
            display: "block", width: "100%", padding: "16px 0",
            borderRadius: 16, background: "#eb1700", color: "#fff",
            fontSize: 15, fontWeight: 800, textAlign: "center",
            textDecoration: "none", boxShadow: "0 4px 14px rgba(235,23,0,0.25)",
            marginBottom: 12,
          }}
        >
          Find Restaurants Near Me →
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/scan"
          style={{
            display: "block", width: "100%", padding: "14px 0",
            borderRadius: 16, background: "#fff",
            border: "1px solid #e5e7eb", color: "#374151",
            fontSize: 14, fontWeight: 700, textAlign: "center",
            textDecoration: "none",
          }}
        >
          Scan a Menu Manually
        </Link>

        {/* Feature callouts */}
        <div
          style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12, marginTop: 32, width: "100%",
          }}
        >
          {[
            { icon: "🔍", label: "Menu Scanning" },
            { icon: "⚠️", label: "Staff Questions" },
            { icon: "📚", label: "Learns Your Rules" },
          ].map(({ icon, label }) => (
            <div
              key={label}
              style={{
                background: "#fff", border: "1px solid #e5e7eb",
                borderRadius: 16, padding: "14px 8px", textAlign: "center",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#374151", lineHeight: 1.3 }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            fontSize: 11, color: "#9ca3af", textAlign: "center",
            marginTop: 28, lineHeight: 1.6, maxWidth: 320,
          }}
        >
          Always confirm with staff before ordering. AllergEats is a decision-support tool, not medical advice.
        </p>
      </div>
    </main>
  );
}
