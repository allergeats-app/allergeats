import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Shellfish Allergy Restaurants Near Me | AllergEats",
  description:
    "Find shellfish-free restaurants near you. AllergEats scans menus for shrimp, crab, lobster, clams, oysters, scallops, and cross-contamination from shared fryers and cooking surfaces.",
  keywords: [
    "shellfish allergy restaurants near me",
    "shrimp allergy restaurant",
    "crab allergy restaurant",
    "lobster allergy eating out",
    "shellfish free restaurants",
    "crustacean allergy restaurant",
    "shellfish allergy menu scanner",
    "seafood allergy restaurant app",
    "shellfish cross contamination restaurant",
    "clam allergy restaurant",
  ],
  alternates: { canonical: "https://www.allergeats.com/shellfish-allergy-restaurants" },
  openGraph: {
    title: "Shellfish Allergy Restaurants Near Me | AllergEats",
    description:
      "Find shellfish-free restaurants near you. AllergEats flags shrimp, crab, lobster, scallops, oysters, clams, and shared-fryer cross-contamination.",
    url: "https://www.allergeats.com/shellfish-allergy-restaurants",
  },
};

export default function ShellfishAllergyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>← AllergEats</Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Shellfish Allergy Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats scans restaurant menus for all shellfish — crustaceans and mollusks — including hidden sources in broths, sauces, and dishes that don't obviously feature seafood.
      </p>

      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none", marginBottom: 48 }}>
        Find Shellfish-Free Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Shellfish AllergEats detects</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          {["Shrimp / Prawns", "Crab", "Lobster", "Scallops", "Clams", "Oysters", "Mussels", "Squid / Calamari", "Octopus", "Barnacles", "Crayfish / Crawfish"].map((n) => (
            <span key={n} style={{ fontSize: 14, fontWeight: 600, padding: "6px 14px", borderRadius: 999, background: "var(--c-card)", border: "1.5px solid var(--c-border)" }}>{n}</span>
          ))}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10 }}>Hidden shellfish sources</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "XO sauce (made with dried shrimp and scallop)",
            "Worcestershire sauce (traditionally contains anchovies — also a fish allergen flag)",
            "Shrimp paste in Thai and Southeast Asian dishes",
            "Seafood stock or bouillabaisse base in soups",
            "Shared fryers used for both shellfish and other proteins",
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
