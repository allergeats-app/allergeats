import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Best Food Allergy App for Restaurants | AllergEats",
  description:
    "AllergEats is the free food allergy app for eating out safely. Set your allergy profile, find nearby restaurants, and scan menus for peanut, gluten, dairy, egg, shellfish, soy, and all 9 major allergens.",
  keywords: [
    "best food allergy app",
    "food allergy restaurant app",
    "restaurant allergen checker app",
    "allergy menu scanner app",
    "eating out with food allergies app",
    "food allergy app free",
    "restaurant food allergy filter",
    "allergy safe restaurant app",
    "food allergy app for iPhone",
    "food allergy app Android",
    "top 9 allergen app",
    "multiple food allergy app",
    "allergy mom restaurant app",
  ],
  alternates: { canonical: "https://www.allergeats.com/food-allergy-app" },
  openGraph: {
    title: "Best Food Allergy App for Restaurants | AllergEats",
    description:
      "Free food allergy app for eating out. Set your allergy profile, find safe restaurants nearby, and scan menus for all 9 major allergens.",
    url: "https://www.allergeats.com/food-allergy-app",
  },
};

const ALLERGENS = [
  { name: "Peanuts", emoji: "🥜" },
  { name: "Tree Nuts", emoji: "🌰" },
  { name: "Dairy / Milk", emoji: "🥛" },
  { name: "Eggs", emoji: "🥚" },
  { name: "Wheat / Gluten", emoji: "🌾" },
  { name: "Soy", emoji: "🫘" },
  { name: "Fish", emoji: "🐟" },
  { name: "Shellfish", emoji: "🦐" },
  { name: "Sesame", emoji: "🫙" },
];

const STEPS = [
  { n: "1", title: "Set your allergen profile", desc: "Select any combination of the 9 major FDA allergens — takes under 30 seconds." },
  { n: "2", title: "Find nearby restaurants", desc: "AllergEats shows restaurants near your location, ranked by how well their menu fits your profile." },
  { n: "3", title: "See every item scored", desc: "Each menu item is labeled Safe, Ask Staff, or Avoid — based on your specific allergies." },
];

export default function FoodAllergyAppPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>
          ← Back to AllergEats
        </Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        The Food Allergy App for Eating Out
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats is a free web app that helps people with food allergies find safe restaurants and scan menus — for all 9 FDA major allergens, alone or in any combination.
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
        Try AllergEats Free →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Supports all 9 major allergens</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
          {ALLERGENS.map(({ name, emoji }) => (
            <div
              key={name}
              style={{
                padding: "12px 14px", borderRadius: 12,
                border: "1.5px solid var(--c-border)",
                background: "var(--c-card)",
                fontSize: 14, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 18 }}>{emoji}</span>
              {name}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>How it works</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 999,
                background: "var(--c-brand)", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 900, flexShrink: 0,
              }}>
                {n}
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{title}</p>
                <p style={{ fontSize: 15, color: "var(--c-sub)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Who uses AllergEats</h2>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Parents managing a child's food allergies at restaurants",
            "Adults with celiac disease or non-celiac gluten sensitivity",
            "People with lactose intolerance or dairy allergy",
            "Anyone with multiple food allergies who needs to cross-check menus",
            "People with IgE-mediated (anaphylactic) food allergies who need to pre-screen menus",
            "Travelers and college students eating out frequently",
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
              q: "Is AllergEats free?",
              a: "Yes, completely free. No subscription, no in-app purchases, no account required to use the core features.",
            },
            {
              q: "Does AllergEats work on iPhone and Android?",
              a: "Yes. AllergEats is a Progressive Web App (PWA) — open it in any mobile browser and add it to your home screen. It works on iPhone Safari, Android Chrome, and any desktop browser.",
            },
            {
              q: "How accurate is the allergen detection?",
              a: "AllergEats uses a 7-layer detection engine covering direct ingredients, synonyms (e.g. 'casein' for dairy), dish-pattern inference (e.g. Alfredo = dairy), cross-contamination language, and cuisine-level context. Official allergen data from major chains is sourced directly. For items where uncertainty exists, the app shows 'Ask Staff' rather than a false safe rating.",
            },
            {
              q: "Can I use it for multiple food allergies at once?",
              a: "Yes. Select any combination of allergens in your profile and AllergEats will flag menu items containing any of them. If a dish contains one of your allergens it's flagged — regardless of which one.",
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
        <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Start finding safe restaurants now</p>
        <p style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 16 }}>Free · No download required · Works on any device</p>
        <Link
          href="/"
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--c-brand)", color: "#fff",
            padding: "12px 24px", borderRadius: 12,
            fontSize: 15, fontWeight: 800, textDecoration: "none",
          }}
        >
          Open AllergEats →
        </Link>
      </div>
    </main>
  );
}
