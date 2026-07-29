import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Allergy-Friendly Restaurants Near Me | AllergEats",
  description:
    "Find allergy-friendly restaurants near you. AllergEats checks menus for all 9 major food allergens — peanut, tree nut, dairy, egg, wheat, soy, fish, shellfish, sesame — and shows you what's safe to order.",
  keywords: [
    "allergy friendly restaurants near me",
    "allergy safe restaurants",
    "restaurant allergen filter",
    "food allergy restaurant guide",
    "eating out with allergies",
    "allergy conscious restaurants",
    "restaurants accommodating food allergies",
    "best restaurants for food allergies",
    "allergy aware restaurant finder",
    "multiple allergy restaurants",
    "food allergy dining guide",
  ],
  alternates: { canonical: "https://www.allergeats.com/allergy-friendly-restaurants" },
  openGraph: {
    title: "Allergy-Friendly Restaurants Near Me | AllergEats",
    description:
      "Find allergy-friendly restaurants near you. AllergEats checks every menu item against all 9 major allergens so you know what's safe.",
    url: "https://www.allergeats.com/allergy-friendly-restaurants",
  },
};

export default function AllergyFriendlyRestaurantsPage() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px", color: "var(--c-text)" }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/" style={{ fontSize: 14, color: "var(--c-brand)", textDecoration: "none", fontWeight: 600 }}>
          ← AllergEats
        </Link>
      </div>

      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.02em" }}>
        Allergy-Friendly Restaurants Near You
      </h1>
      <p style={{ fontSize: 18, color: "var(--c-sub)", lineHeight: 1.6, marginBottom: 36, maxWidth: 600 }}>
        AllergEats finds nearby restaurants and checks every menu item against your specific allergen profile — so you can dine confidently no matter which food allergies you're managing.
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
        Find Allergy-Friendly Restaurants →
      </Link>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Every menu item rated for your allergies</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c-sub)", marginBottom: 20 }}>
          Unlike generic "allergy-friendly" labels, AllergEats gives every individual menu item one of three ratings based on your exact allergen profile:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "Safe", color: "#22c55e", desc: "No detected allergens for your profile. Likely safe to order." },
            { label: "Ask Staff", color: "#f59e0b", desc: "Possible allergen source detected, or preparation risk. Confirm before ordering." },
            { label: "Avoid", color: "#ef4444", desc: "Contains one or more of your allergens. Do not order." },
          ].map(({ label, color, desc }) => (
            <div key={label} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <span style={{
                fontSize: 12, fontWeight: 800, color, padding: "3px 10px",
                borderRadius: 999, border: `1.5px solid ${color}`,
                flexShrink: 0, marginTop: 2,
              }}>
                {label}
              </span>
              <p style={{ fontSize: 15, color: "var(--c-sub)", margin: 0, lineHeight: 1.5 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>What makes a restaurant allergy-friendly?</h2>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c-sub)", marginBottom: 12 }}>
          A restaurant being "allergy-friendly" depends entirely on which allergens you're avoiding. A gluten-free restaurant might be full of peanuts. A peanut-free kitchen might serve dairy everywhere. AllergEats personalizes the answer to your profile.
        </p>
        <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--c-sub)", margin: 0 }}>
          AllergEats also surfaces the percentage of menu items that are safe for you at each restaurant — so you can quickly compare which nearby spots offer the most options.
        </p>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>Supported allergens</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Peanuts", "Tree Nuts", "Dairy / Milk", "Eggs", "Wheat / Gluten", "Soy", "Fish", "Shellfish", "Sesame"].map((a) => (
            <span key={a} style={{
              fontSize: 14, fontWeight: 600,
              padding: "6px 14px", borderRadius: 999,
              background: "var(--c-card)", border: "1.5px solid var(--c-border)",
            }}>
              {a}
            </span>
          ))}
        </div>
      </section>

      <div style={{
        background: "var(--c-brand-bg)",
        border: "1.5px solid var(--c-brand)",
        borderRadius: 16, padding: "28px 24px", textAlign: "center",
      }}>
        <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Find your safest nearby restaurant</p>
        <p style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 16 }}>Free · Works on any device · No download needed</p>
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
