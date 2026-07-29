import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tree Nut Allergy Restaurants Near Me | AllergEats",
  description:
    "Find tree nut-free restaurants near you. AllergEats scans menus for almonds, cashews, walnuts, pecans, pistachios, macadamia, hazelnuts, and cross-contamination risks.",
  keywords: [
    "tree nut allergy restaurants near me",
    "nut allergy restaurant app",
    "almond allergy restaurant",
    "cashew allergy eating out",
    "walnut allergy restaurant",
    "pistachio allergy menu",
    "hazelnut allergy restaurant",
    "nut free restaurants near me",
    "tree nut cross contamination restaurant",
  ],
  alternates: { canonical: "https://www.allergeats.com/nut-allergy-restaurants" },
  openGraph: {
    title: "Tree Nut Allergy Restaurants Near Me | AllergEats",
    description:
      "Find tree nut-free restaurants. AllergEats flags almonds, cashews, walnuts, pecans, pistachios, hazelnuts, and shared-equipment risks.",
    url: "https://www.allergeats.com/nut-allergy-restaurants",
  },
};

const TREE_NUTS = ["Almonds", "Cashews", "Walnuts", "Pecans", "Pistachios", "Macadamia nuts", "Hazelnuts / Filberts", "Brazil nuts", "Pine nuts", "Chestnuts", "Coconut (FDA-classified)", "Praline and marzipan"];

export default function NutAllergyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>← AllergEats</Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Tree Nut Allergy Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats scans restaurant menus for all major tree nuts and their derivatives — not just "nuts" as a broad category, but each specific variety by name.
      </p>

      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none", marginBottom: 48 }}>
        Find Nut-Free Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Tree nuts AllergEats detects</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TREE_NUTS.map((n) => (
            <span key={n} style={{ fontSize: 14, fontWeight: 600, padding: "6px 14px", borderRadius: 999, background: "var(--c-card)", border: "1.5px solid var(--c-border)" }}>{n}</span>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Hidden sources of tree nuts</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Pesto (typically contains pine nuts)",
            "Mole sauce (sometimes contains almonds or pecans)",
            "Baklava and other Middle Eastern pastries",
            "Pralines, nougat, and marzipan (almonds)",
            "Nut-based milk alternatives in sauces (almond milk, cashew cream)",
            "Shared kitchen equipment with dedicated nut stations",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.5 }}>
              <span style={{ color: "#22c55e", fontWeight: 900, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
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
