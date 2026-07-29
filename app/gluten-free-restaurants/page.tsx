import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gluten-Free Restaurants Near Me | Celiac-Safe Menu Scanner",
  description:
    "Find gluten-free and celiac-safe restaurants near you. AllergEats scans every menu item for wheat, barley, malt, spelt, and hidden gluten — including cross-contamination warnings from shared fryers.",
  keywords: [
    "gluten free restaurants near me",
    "celiac safe restaurants",
    "gluten intolerance restaurant finder",
    "wheat allergy restaurants",
    "celiac disease eating out app",
    "gluten free menu scanner",
    "NCGS restaurant guide",
    "non celiac gluten sensitivity restaurants",
    "hidden gluten in restaurant food",
    "cross contamination gluten restaurant",
    "gluten free fast food",
    "celiac restaurant app",
  ],
  alternates: { canonical: "https://www.allergeats.com/gluten-free-restaurants" },
  openGraph: {
    title: "Gluten-Free Restaurants Near Me | AllergEats",
    description:
      "Find celiac-safe restaurants near you. Scan menus for wheat, barley, malt, and hidden gluten — including cross-contamination risks.",
    url: "https://www.allergeats.com/gluten-free-restaurants",
  },
};

export default function GlutenFreeRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>
          ← AllergEats
        </Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Gluten-Free Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats scans restaurant menus for wheat, barley, malt, spelt, and hidden gluten sources — then tells you which items are safe, which need clarification, and which to avoid entirely.
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
        Find Gluten-Free Restaurants Near Me →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>What AllergEats checks for</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "Wheat, barley, rye, malt, spelt, kamut, farro, and triticale",
            "Hidden gluten: soy sauce, teriyaki sauce, breaded coatings, modified food starch",
            "Cross-contamination warnings — shared fryers, grills, and prep surfaces",
            "Gluten in sauces, dressings, and marinades (not just the main ingredient)",
            "Items marked 'gluten-friendly' vs. genuinely gluten-free",
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
            "People diagnosed with celiac disease who can't tolerate even trace gluten",
            "Those with non-celiac gluten sensitivity (NCGS) or wheat intolerance",
            "Parents finding safe meals for a gluten-free child",
            "People with wheat allergy (separate from celiac — still needs careful menu review)",
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
              q: "Does AllergEats detect hidden gluten in sauces and marinades?",
              a: "Yes. AllergEats flags gluten in sauces (soy sauce, teriyaki, Worcestershire), marinades, dressings, and gravies — not just the main protein or starch on a menu item.",
            },
            {
              q: "Does it flag cross-contamination warnings for shared fryers?",
              a: "Yes. AllergEats detects cross-contamination language like 'cooked in the same fryer as wheat products' and marks those items as 'Ask Staff' or 'Avoid' depending on your sensitivity level.",
            },
            {
              q: "Can I use AllergEats for celiac disease specifically?",
              a: "Yes. Select 'gluten' (wheat) in your allergen profile and AllergEats will flag every potential source — including trace amounts and shared preparation. For celiac disease, always confirm with restaurant staff for items marked 'Ask Staff.'",
            },
            {
              q: "What gluten-free restaurant chains does AllergEats cover?",
              a: "AllergEats covers McDonald's, Chipotle, Chick-fil-A, Wendy's, Burger King, Taco Bell, Subway, and more — plus any local restaurant whose menu you paste into the app.",
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
