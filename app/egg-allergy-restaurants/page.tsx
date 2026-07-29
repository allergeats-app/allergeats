import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Egg Allergy Restaurants Near Me | AllergEats",
  description:
    "Find egg-free restaurants near you. AllergEats scans menus for eggs, albumin, mayonnaise, aioli, Caesar dressing, egg wash, and other hidden egg sources.",
  keywords: [
    "egg allergy restaurants near me",
    "egg free restaurants",
    "egg allergy menu scanner",
    "hidden egg in restaurant food",
    "egg allergy eating out",
    "albumin allergy restaurant",
    "mayonnaise allergy restaurant",
    "egg free fast food",
    "egg allergy app",
  ],
  alternates: { canonical: "https://www.allergeats.com/egg-allergy-restaurants" },
  openGraph: {
    title: "Egg Allergy Restaurants Near Me | AllergEats",
    description:
      "Find egg-free restaurants near you. AllergEats flags eggs, albumin, mayo, aioli, Caesar dressing, and egg wash across all menu items.",
    url: "https://www.allergeats.com/egg-allergy-restaurants",
  },
};

export default function EggAllergyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>← AllergEats</Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Egg Allergy Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats scans restaurant menus for eggs and egg derivatives — including many hidden sources that don't obviously contain "egg" in the item name.
      </p>

      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none", marginBottom: 48 }}>
        Find Egg-Free Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Hidden egg sources AllergEats catches</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Albumin, globulin, lysozyme, and other egg protein names",
            "Mayonnaise, aioli, and remoulade in sauces and sandwiches",
            "Caesar dressing (traditionally made with raw egg yolk)",
            "Egg wash on pastries, breaded items, and burger buns",
            "Hollandaise and béarnaise sauce",
            "Meringue in desserts",
            "Pasta (many fresh pastas contain egg)",
            "Battered and breaded coatings on fried items",
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
