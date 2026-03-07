"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AllergySelector } from "@/components/AllergySelector";
import { loadProfileAllergens, saveProfileAllergens } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

export default function HomePage() {
  const [selected, setSelected] = useState<AllergenId[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSelected(loadProfileAllergens());
  }, []);

  function handleSave() {
    saveProfileAllergens(selected);
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
          justifyContent: "flex-end",
          padding: "14px 20px",
          gap: 12,
        }}
      >
        <Link
          href="/scan"
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#6b7280",
            textDecoration: "none",
          }}
        >
          Manual Scan
        </Link>
      </nav>

      {/* Hero */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "32px 20px 48px",
          maxWidth: 520,
          margin: "0 auto",
          width: "100%",
          gap: 0,
        }}
      >
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🍽️</div>
          <h1
            style={{
              fontSize: 34,
              fontWeight: 900,
              color: "#111",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            AllergEats
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "#6b7280",
              marginTop: 8,
              lineHeight: 1.5,
              maxWidth: 300,
              margin: "8px auto 0",
            }}
          >
            Find restaurants where you can eat safely — filtered for your allergies.
          </p>
        </div>

        {/* Allergy selector card */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 24,
            width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 14,
            }}
          >
            Your Allergies
          </div>
          <AllergySelector selected={selected} onChange={setSelected} />

          <button
            onClick={handleSave}
            style={{
              marginTop: 20,
              width: "100%",
              padding: "14px 0",
              borderRadius: 14,
              border: "none",
              background: saved ? "#22c55e" : "#111",
              color: "#fff",
              fontSize: 14,
              fontWeight: 800,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {saved ? "Saved!" : "Save Profile"}
          </button>
        </div>

        {/* Primary CTA */}
        <Link
          href="/restaurants"
          style={{
            display: "block",
            width: "100%",
            padding: "16px 0",
            borderRadius: 16,
            background: "#eb1700",
            color: "#fff",
            fontSize: 15,
            fontWeight: 800,
            textAlign: "center",
            textDecoration: "none",
            boxShadow: "0 4px 14px rgba(235,23,0,0.25)",
            marginBottom: 12,
          }}
        >
          Find Restaurants Near Me →
        </Link>

        {/* Secondary CTA */}
        <Link
          href="/scan"
          style={{
            display: "block",
            width: "100%",
            padding: "14px 0",
            borderRadius: 16,
            background: "#fff",
            border: "1px solid #e5e7eb",
            color: "#374151",
            fontSize: 14,
            fontWeight: 700,
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          Scan a Menu Manually
        </Link>

        {/* Feature callouts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginTop: 32,
            width: "100%",
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
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 16,
                padding: "14px 8px",
                textAlign: "center",
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
            fontSize: 11,
            color: "#9ca3af",
            textAlign: "center",
            marginTop: 28,
            lineHeight: 1.6,
            maxWidth: 320,
          }}
        >
          Always confirm with staff before ordering. AllergEats is a decision-support tool, not medical advice.
        </p>
      </div>
    </main>
  );
}
