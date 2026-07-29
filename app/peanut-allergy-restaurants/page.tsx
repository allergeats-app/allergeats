import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Peanut Allergy Restaurants Near Me | Safe Menu Finder",
  description:
    "Find peanut-free restaurants near you. AllergEats scans menus for peanuts, peanut oil, peanut butter, satay sauce, and cross-contamination risks — critical for people with severe peanut allergy.",
  keywords: [
    "peanut allergy restaurants near me",
    "peanut free restaurants",
    "peanut allergy menu scanner",
    "restaurants safe for peanut allergy",
    "anaphylaxis peanut allergy restaurant",
    "peanut free eating out app",
    "groundnut allergy restaurant",
    "peanut oil allergy restaurant",
    "severe peanut allergy eating out",
    "kids peanut allergy restaurant",
    "peanut cross contamination restaurant",
  ],
  alternates: { canonical: "https://www.allergeats.com/peanut-allergy-restaurants" },
  openGraph: {
    title: "Peanut Allergy Restaurants Near Me | AllergEats",
    description:
      "Find peanut-free restaurants near you. AllergEats scans menus for peanuts, peanut oil, satay, and cross-contamination warnings.",
    url: "https://www.allergeats.com/peanut-allergy-restaurants",
  },
};

export default function PeanutAllergyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>
          ← AllergEats
        </Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Peanut Allergy Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats scans restaurant menus for peanuts, peanut oil, groundnuts, peanut butter, satay, and cross-contamination warnings — so you know what's safe before you sit down.
      </p>

      <Link
        href="/"
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--c-brand)", color: "#fff",
          padding: "14px 28px", borderRadius: 14,
          fontSize: 16, fontWeight: 800, textDecoration: "none",
          marginBottom: 56,
        }}
      >
        Find Peanut-Free Restaurants Near Me →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>What AllergEats checks for</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "Peanuts, peanut butter, peanut oil, and groundnuts in all menu items",
            "Satay sauce, gado-gado, and other peanut-based condiments",
            "Mixed nut dishes where peanuts may be present",
            "Thai, Chinese, Indonesian, and West African dishes commonly containing peanuts",
            "Cross-contamination warnings: shared fryers, woks, and prep surfaces",
            "Severity escalation — anaphylactic risk items are always marked Avoid",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.5, color: "var(--c-text)" }}>
              <span style={{ color: "#22c55e", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Who this is for</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Adults and children with IgE-mediated peanut allergy and anaphylaxis risk",
            "Parents managing a child's severe peanut allergy at restaurants",
            "People who carry an epinephrine auto-injector (EpiPen) and need to pre-screen menus",
            "Anyone avoiding peanuts by preference or intolerance",
          ].map((item) => (
            <li key={item} style={{ fontSize: 16, lineHeight: 1.5, paddingLeft: 20, position: "relative", color: "var(--c-text)" }}>
              <span style={{ position: "absolute", left: 0, color: "var(--c-brand)" }}>•</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Common questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            {
              q: "Does AllergEats detect peanut oil in restaurant menus?",
              a: "Yes. AllergEats flags refined peanut oil and peanut-derived oils mentioned in menu descriptions. Note: highly refined peanut oil is generally considered safe for most peanut-allergic individuals, but cold-pressed or expeller-pressed peanut oil is not — AllergEats flags both and recommends confirming with staff.",
            },
            {
              q: "How does AllergEats handle ethnic cuisines with common peanut use?",
              a: "AllergEats has specific detection for cuisines where peanuts appear frequently: Thai (peanut sauce, pad thai), Chinese (kung pao, gong bao), Indonesian (satay, gado-gado), and West African dishes. These items are flagged even when 'peanut' isn't explicitly in the item name.",
            },
            {
              q: "Can I use AllergEats if my child has a severe peanut allergy?",
              a: "Yes. Set your child's profile to include peanut allergy at anaphylactic severity, and AllergEats will escalate any 'ask staff' risk to 'avoid' for that allergen — the safest default for severe reactions.",
            },
          ].map(({ q, a }) => (
            <div key={q}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{q}</h3>
              <p style={{ fontSize: 15, color: "var(--c-sub)", lineHeight: 1.6, margin: 0 }}>{a}</p>
            </div>
          ))}
        </div>
      </section>

      <div style={{
        background: "var(--c-brand-bg)",
        border: "1.5px solid var(--c-brand)",
        borderRadius: 16, padding: "28px 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Ready to eat out safely?</p>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--c-brand)", color: "#fff",
            padding: "12px 24px", borderRadius: 12,
            fontSize: 15, fontWeight: 800, textDecoration: "none",
          }}
        >
          Open AllergEats — it's free →
        </Link>
      </div>
    </main>
  );
}
