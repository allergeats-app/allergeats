import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dairy-Free Restaurants Near Me | Lactose Intolerance & Milk Allergy",
  description:
    "Find dairy-free restaurants near you. AllergEats scans menus for milk, cheese, butter, cream, whey, casein, and hidden dairy — for both dairy allergy and lactose intolerance.",
  keywords: [
    "dairy free restaurants near me",
    "lactose intolerance restaurant app",
    "milk allergy restaurant finder",
    "dairy free menu scanner",
    "casein free restaurants",
    "whey allergy restaurant",
    "hidden dairy in restaurant food",
    "lactose free restaurants near me",
    "dairy allergy eating out",
    "vegan restaurant allergen checker",
    "butter allergy restaurant",
    "cream allergy menu",
  ],
  alternates: { canonical: "https://www.allergeats.com/dairy-free-restaurants" },
  openGraph: {
    title: "Dairy-Free Restaurants Near Me | AllergEats",
    description:
      "Find dairy-free restaurants near you. AllergEats flags milk, cheese, butter, cream, whey, casein, and hidden dairy — for allergy or intolerance.",
    url: "https://www.allergeats.com/dairy-free-restaurants",
  },
};

export default function DairyFreeRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>
          ← AllergEats
        </Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Dairy-Free Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats finds restaurants with dairy-free options and scans every menu item for milk, cheese, butter, cream, yogurt, whey, casein, lactose, and hidden dairy ingredients — whether you have a dairy allergy or lactose intolerance.
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
        Find Dairy-Free Restaurants Near Me →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>What AllergEats checks for</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "Milk, cream, butter, cheese, yogurt, sour cream, ghee, and ice cream",
            "Casein, caseinate, whey, and lactose — common hidden dairy proteins",
            "Labneh, clotted cream, crème fraîche, and other specialty dairy",
            "Butter-flavored oils, butter solids, and dry milk powder",
            "Dairy in sauces: Alfredo, béchamel, cheese sauce, ranch, and cream-based soups",
            "Desserts and baked goods containing dairy",
          ].map((item) => (
            <li key={item} style={{ display: "flex", gap: 12, alignItems: "flex-start", fontSize: 16, lineHeight: 1.5, color: "var(--c-text)" }}>
              <span style={{ color: "#22c55e", fontWeight: 900, flexShrink: 0, marginTop: 1 }}>✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Dairy allergy vs. lactose intolerance</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c-sub)", marginBottom: 12 }}>
          <strong style={{ color: "var(--c-text)" }}>Dairy allergy</strong> is an immune response to milk proteins (casein and whey). Even tiny amounts can cause serious reactions, including anaphylaxis in severe cases.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c-sub)", margin: 0 }}>
          <strong style={{ color: "var(--c-text)" }}>Lactose intolerance</strong> is a digestive issue — the inability to break down lactose (milk sugar). The same allergen profile in AllergEats works for both, flagging all dairy sources regardless of whether the concern is immune or digestive.
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Common questions</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {[
            {
              q: "Does AllergEats detect dairy in sauces and dressings?",
              a: "Yes. AllergEats flags dairy in Alfredo, béchamel, ranch, Caesar (often contains anchovies and Parmesan), cream-based soups, and butter-basted proteins — not just items that obviously contain cheese.",
            },
            {
              q: "Does it work for vegan diners too?",
              a: "Yes. Selecting 'dairy' (and 'egg' if needed) in your profile works perfectly for vegan diners. AllergEats will flag any animal-derived dairy ingredient across all menu categories.",
            },
            {
              q: "Can I use AllergEats to find dairy-free options at fast food chains?",
              a: "Yes. AllergEats covers McDonald's, Chipotle, Burger King, Taco Bell, Wendy's, Chick-fil-A, Subway, and more — showing which specific menu items are dairy-free at each chain.",
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
