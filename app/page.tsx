"use client";

import Link from "next/link";
import Image from "next/image";
import { AllergySelector } from "@/components/AllergySelector";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import type { AllergenId } from "@/lib/types";
import { useState } from "react";

export default function HomePage() {
  const { user, allergens, saveAllergens, loading } = useAuth();
  useTheme(); // ensures re-render when theme changes
  const [selected, setSelected] = useState<AllergenId[]>(allergens);
  const [savedSelection, setSavedSelection] = useState<AllergenId[]>(allergens);
  const [saved, setSaved] = useState(false);

  // Keep local selection in sync when auth loads allergens
  // (runs once after context hydrates)
  if (!loading && allergens.length > 0 && selected.length === 0) {
    setSelected(allergens);
    setSavedSelection(allergens);
  }

  const isDirty = [...selected].sort().join() !== [...savedSelection].sort().join();

  async function handleSave() {
    await saveAllergens(selected);
    setSavedSelection([...selected]);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
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
          style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}
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
              background: "var(--c-card)",
              border: "1px solid var(--c-border)",
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>Account</span>
          </Link>
        ) : (
          <Link
            href="/auth"
            style={{
              padding: "7px 16px", borderRadius: 999,
              background: "var(--c-text)", color: "var(--c-bg)",
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
          <Image src="/logo.png" alt="AllergEats" width={320} height={80} style={{ width: "auto", height: 80, maxWidth: "90vw", display: "block", margin: "0 auto", transform: "translateX(-2px)" }} priority />
          <p
            style={{
              fontSize: 15, color: "var(--c-sub)", lineHeight: 1.5,
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
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Your Allergies
            </div>
            {user && (
              <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>
                Synced to account
              </div>
            )}
          </div>

          <AllergySelector selected={selected} onChange={setSelected} limit={4} />

          {user && (isDirty || saved) && (
            <button
              onClick={handleSave}
              style={{
                marginTop: 20, width: "100%", padding: "14px 0",
                borderRadius: 14, border: "none",
                background: saved ? "#22c55e" : "var(--c-text)",
                color: "#fff", fontSize: 14, fontWeight: 800,
                cursor: "pointer", transition: "background 0.2s",
              }}
            >
              {saved ? "Saved!" : "Save to Account"}
            </button>
          )}

          {!user && (
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "#fafaf8", border: "1px solid var(--c-border)", textAlign: "center" }}>
              <span style={{ fontSize: 13, color: "var(--c-sub)" }}>
                <Link href="/auth" style={{ color: "#eb1700", fontWeight: 700, textDecoration: "none" }}>Sign in</Link>
                {" "}to Save your Allergy Profile
              </span>
            </div>
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
            borderRadius: 16, background: "var(--c-card)",
            border: "1px solid var(--c-border)", color: "var(--c-text)",
            fontSize: 14, fontWeight: 700, textAlign: "center",
            textDecoration: "none",
          }}
        >
          Scan a Menu Manually
        </Link>

        {/* How it works */}
        <div style={{ width: "100%", marginTop: 40 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>How It Works</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", lineHeight: 1.2 }}>Safe eating in 3 steps</div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[
              { n: "1", title: "Set your allergy profile", desc: "Choose your allergens once. They sync to your account across all devices." },
              { n: "2", title: "Scan any menu", desc: "Paste menu text, drop in a link, or pick from our restaurant database." },
              { n: "3", title: "Get instant safety results", desc: "Every item is labeled Safe, Ask Staff, or Avoid — with reasons and staff questions ready to copy." },
            ].map(({ n, title, desc }) => (
              <div key={n} style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 16, padding: "14px 16px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "#eb1700", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)", marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example results */}
        <div style={{ width: "100%", marginTop: 36 }}>
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Example</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", lineHeight: 1.2 }}>Results look like this</div>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 6 }}>Scanning a pasta menu for dairy + wheat allergies</div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ background: "#fff1f0", border: "1px solid #f3c5c0", borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Chicken Alfredo</div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#fff1f0", color: "#b91c1c", border: "1px solid #f3c5c0", whiteSpace: "nowrap" }}>High</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#b91c1c", marginBottom: 4 }}>❌ Avoid</div>
              <div style={{ fontSize: 12, color: "#b91c1c" }}>Contains: dairy, wheat</div>
            </div>
            <div style={{ background: "#fff7db", border: "1px solid #f4dd8d", borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Caesar Salad</div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#fff7db", color: "#854d0e", border: "1px solid #f4dd8d", whiteSpace: "nowrap" }}>Medium</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#854d0e", marginBottom: 4 }}>⚠ Ask Staff</div>
              <div style={{ fontSize: 12, color: "#854d0e" }}>Why: Caesar dressing may contain egg, dairy, or anchovies</div>
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Grilled Salmon</div>
                <span style={{ fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: "#f9fafb", color: "#6b7280", border: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>Low</span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#15803d" }}>✓ Likely Safe</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
