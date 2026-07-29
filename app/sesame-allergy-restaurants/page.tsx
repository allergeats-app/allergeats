import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sesame Allergy Restaurants Near Me | AllergEats",
  description:
    "Find sesame-free restaurants near you. AllergEats scans menus for sesame seeds, tahini, hummus, sesame oil, and hidden sesame in buns, dressings, and sauces — now a required FDA-labeled allergen.",
  keywords: [
    "sesame allergy restaurants near me",
    "sesame free restaurants",
    "sesame allergy menu scanner",
    "tahini allergy restaurant",
    "sesame oil allergy eating out",
    "hidden sesame in restaurant food",
    "sesame seed allergy restaurant",
    "FDA sesame allergen restaurant",
    "hummus allergy restaurant",
    "sesame bun allergy",
  ],
  alternates: { canonical: "https://www.allergeats.com/sesame-allergy-restaurants" },
  openGraph: {
    title: "Sesame Allergy Restaurants Near Me | AllergEats",
    description:
      "Find sesame-free restaurants near you. AllergEats flags sesame seeds, tahini, hummus, sesame oil, and hidden sesame in buns and sauces.",
    url: "https://www.allergeats.com/sesame-allergy-restaurants",
  },
};

export default function SesameAllergyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>← AllergEats</Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Sesame Allergy Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        Sesame became the 9th major FDA-recognized allergen in 2023, but it remains one of the hardest to avoid — it appears in burger buns, dressings, dipping sauces, and Middle Eastern and Asian cuisines under many names. AllergEats catches them all.
      </p>

      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none", marginBottom: 48 }}>
        Find Sesame-Free Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Sesame sources AllergEats detects</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Sesame seeds — on burger buns, flatbreads, bagels, and sushi rice",
            "Tahini — in hummus, baba ganoush, and Middle Eastern dressings",
            "Sesame oil — in stir-fries, noodles, and Asian dipping sauces",
            "Sesame paste (zhima jiang) in Chinese and Korean dishes",
            "Til and gingelly oil — regional names for sesame oil",
            "Gomashio — Japanese sesame salt seasoning",
            "Halvah and other sesame-based confections",
            "Za'atar spice blends (often contain sesame)",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.5 }}>
              <span style={{ color: "#22c55e", fontWeight: 900, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48, padding: "20px", background: "var(--c-card)", borderRadius: 14, border: "1.5px solid var(--c-border)" }}>
        <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--c-sub)", margin: 0 }}>
          <strong style={{ color: "var(--c-text)" }}>Why sesame is tricky:</strong> Sesame was added to the FDA's major allergen list in 2023 under FASTER Act. Unlike older allergens, restaurant staff awareness is still catching up. AllergEats uses extra vigilance for sesame — flagging anything ambiguous as "Ask Staff" rather than safe.
        </p>
      </section>

      <div style={{ background: "var(--c-brand-bg)", border: "1.5px solid var(--c-brand)", borderRadius: 16, padding: "28px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Ready to eat out safely?</p>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "12px 24px", borderRadius: 12, fontSize: 15, fontWeight: 800, textDecoration: "none" }}>
          Open AllergEats — it's free →
        </Link>
      </div>
    </main>
  );
}
