import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Soy-Free Restaurants Near Me | Soy Allergy Menu Finder",
  description:
    "Find soy-free restaurants near you. AllergEats scans menus for soy, soybean, tofu, edamame, miso, tempeh, soy sauce, tamari, and hidden soy in sauces and protein products.",
  keywords: [
    "soy free restaurants near me",
    "soy allergy restaurant app",
    "soy allergy eating out",
    "soy free menu scanner",
    "hidden soy in restaurant food",
    "soy sauce allergy restaurant",
    "tofu allergy restaurant",
    "edamame allergy eating out",
    "miso allergy restaurant",
    "soybean allergy restaurant",
  ],
  alternates: { canonical: "https://www.allergeats.com/soy-free-restaurants" },
  openGraph: {
    title: "Soy-Free Restaurants Near Me | AllergEats",
    description:
      "Find soy-free restaurants near you. AllergEats flags soy, tofu, edamame, miso, tamari, soy sauce, and hidden soy protein across all menu items.",
    url: "https://www.allergeats.com/soy-free-restaurants",
  },
};

export default function SoyFreeRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>← AllergEats</Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Soy-Free Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        Soy is one of the most widely used ingredients in restaurant cooking — and one of the hardest to avoid. AllergEats scans menus for soy in all its forms, including many that don't appear on the surface.
      </p>

      <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--c-brand)", color: "#fff", padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 800, textDecoration: "none", marginBottom: 48 }}>
        Find Soy-Free Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Hidden soy sources AllergEats catches</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Soy sauce, tamari, and teriyaki — found in marinades, stir-fries, and dipping sauces",
            "Doubanjiang and toban djan (Sichuan fermented bean paste) — soy + wheat",
            "Miso paste in soups, dressings, and glazes",
            "Tofu, edamame, and tempeh in bowls and sides",
            "Textured vegetable protein (TVP) in veggie burgers and meat substitutes",
            "Soy lecithin in sauces, dressings, and baked goods",
            "Hydrolyzed soy protein in marinades and flavor enhancers",
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
