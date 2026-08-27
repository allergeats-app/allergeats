import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Fish Allergy Restaurants Near Me | AllergEats",
  description:
    "Find fish-free restaurants near you. AllergEats scans menus for fish and hidden fish sources like Worcestershire sauce, Caesar dressing, fish sauce, and imitation crab.",
  keywords: [
    "fish allergy restaurants near me",
    "fish free restaurants",
    "fish allergy menu scanner",
    "hidden fish in restaurant food",
    "fish allergy eating out",
    "Worcestershire sauce fish allergy",
    "fish sauce allergy restaurant",
    "Caesar dressing fish allergy",
    "fish allergy app",
    "finfish allergy restaurants",
  ],
  alternates: { canonical: "https://www.allergeats.com/fish-allergy-restaurants" },
  openGraph: {
    title: "Fish Allergy Restaurants Near Me | AllergEats",
    description:
      "Find fish-free restaurants near you. AllergEats flags fish, anchovies, Worcestershire sauce, fish sauce, Caesar dressing, and imitation crab across all menu items.",
    url: "https://www.allergeats.com/fish-allergy-restaurants",
  },
};

export default function FishAllergyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>← AllergEats</Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Fish Allergy Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats scans restaurant menus for fish and fish derivatives — including many hidden sources that don't obviously contain "fish" in the item name.
      </p>

      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none", marginBottom: 48 }}>
        Find Fish-Free Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Hidden fish sources AllergEats catches</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Worcestershire sauce (traditionally made with anchovies)",
            "Caesar dressing (contains anchovies)",
            "Fish sauce in Asian dishes, marinades, and dipping sauces",
            "Anchovies in pasta sauces, pizza toppings, and tapenades",
            "Imitation crab (surimi) — made from processed fish",
            "Bouillabaisse, bisque, and other seafood-based broths",
            "Caponata and some Italian sauces with anchovy paste",
            "Certain vitamins and supplements added to foods (fish-derived gelatin)",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.5 }}>
              <span style={{ color: "#22c55e", fontWeight: 900, flexShrink: 0 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>Fish allergy vs. shellfish allergy</h2>
        <p style={{ fontSize: 16, color: "var(--c-sub)", lineHeight: 1.7 }}>
          Fish and shellfish are two separate FDA-recognized allergens. Having a fish allergy does not necessarily mean you are allergic to shellfish (shrimp, crab, lobster), and vice versa. AllergEats tracks them separately — you can set just fish, just shellfish, or both in your allergen profile.
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
