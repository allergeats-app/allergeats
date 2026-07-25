"use client";

import { useState } from "react";
import Link from "next/link";

type AllergenId = string;

interface MenuItem {
  id: string;
  name: string;
  category: string;
  allergens: AllergenId[];
}

interface RestaurantData {
  id: string;
  name: string;
  cuisine: string;
  tags: string[];
  facilityAllergens: AllergenId[];
  menuItems: MenuItem[];
}

const ALLERGEN_COLORS: Record<string, string> = {
  dairy: "#60a5fa", egg: "#fbbf24", wheat: "#f59e0b", gluten: "#f59e0b",
  soy: "#34d399", peanut: "#ef4444", "tree-nut": "#f97316", sesame: "#a78bfa",
  fish: "#06b6d4", shellfish: "#0891b2", mustard: "#eab308",
  corn: "#84cc16", legumes: "#10b981", oats: "#d97706",
};

function allergenBadge(a: string) {
  const color = ALLERGEN_COLORS[a] ?? "#9ca3af";
  return (
    <span key={a} style={{
      fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 999,
      background: `${color}22`, color, border: `1px solid ${color}44`,
    }}>
      {a}
    </span>
  );
}

function toTypeScript(r: RestaurantData): string {
  const today = new Date().toISOString().slice(0, 10);
  const items = r.menuItems.map(item => {
    const allergens = item.allergens.length
      ? `[${item.allergens.map(a => `"${a}"`).join(", ")}]`
      : "[]";
    return `      { id: "${item.id}", name: "${item.name}", category: "${item.category}", sourceType: "scraped", allergens: ${allergens} },`;
  }).join("\n");

  const facility = r.facilityAllergens.length
    ? `\n    facilityAllergens: [${r.facilityAllergens.map(a => `"${a}"`).join(", ")}],`
    : "";

  return `  // ─── ${r.name} ${"─".repeat(Math.max(0, 60 - r.name.length))}
  {
    id: "${r.id}",
    name: "${r.name}",
    cuisine: "${r.cuisine}",
    tags: [${r.tags.map(t => `"${t}"`).join(", ")}],
    distance: 0.5,
    sourceType: "scraped",
    dataVerifiedDate: "${today}",${facility}
    menuItems: [
${items}
    ],
  }`;
}

export default function RestaurantManagerPage() {
  const [name, setName]         = useState("");
  const [url, setUrl]           = useState("");
  const [cuisine, setCuisine]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [status, setStatus]     = useState("");
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [saved, setSaved]       = useState(false);
  const [copied, setCopied]     = useState(false);
  const [saveError, setSaveError] = useState("");

  async function analyze() {
    if (!name.trim()) return;
    setLoading(true);
    setRestaurant(null);
    setSaved(false);
    setSaveError("");
    setStatus(url ? "Fetching menu from website…" : "Analyzing with AI…");

    try {
      const res = await fetch("/api/restaurant-manager/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantName: name, menuUrl: url, cuisineType: cuisine }),
      });
      setStatus("Analyzing allergens with AI…");
      const data = await res.json() as { restaurant?: RestaurantData; error?: string };
      if (!res.ok || !data.restaurant) throw new Error(data.error ?? "Unknown error");
      setRestaurant(data.restaurant);
      setStatus("");
    } catch (e: unknown) {
      setStatus(`Error: ${(e as Error).message}`);
    } finally {
      setLoading(false);
    }
  }

  async function addToApp() {
    if (!restaurant) return;
    setSaveError("");
    const tsCode = toTypeScript(restaurant);
    const res = await fetch("/api/restaurant-manager/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tsCode }),
    });
    const data = await res.json() as { ok?: boolean; error?: string };
    if (data.ok) {
      setSaved(true);
    } else {
      setSaveError(data.error ?? "Save failed");
    }
  }

  function copyCode() {
    if (!restaurant) return;
    navigator.clipboard.writeText(toTypeScript(restaurant)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const byCategory = restaurant
    ? restaurant.menuItems.reduce<Record<string, MenuItem[]>>((acc, item) => {
        const cat = item.category || "Other";
        (acc[cat] = acc[cat] ?? []).push(item);
        return acc;
      }, {})
    : {};

  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--c-hdr)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--c-border)",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Home</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)" }}>Restaurant Data Manager</div>
            <div style={{ fontSize: 11, color: "var(--c-sub)" }}>Add restaurants to AllergEats using AI</div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px 48px" }}>

        {/* Form */}
        <div style={{ background: "var(--c-card)", borderRadius: 16, border: "1px solid var(--c-border)", padding: "20px" }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", marginBottom: 16 }}>Add a Restaurant</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", display: "block", marginBottom: 5 }}>Restaurant Name *</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && analyze()}
                placeholder="e.g. Taco Bell"
                style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text)", outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--c-brand)")}
                onBlur={e  => (e.currentTarget.style.borderColor = "var(--c-border)")}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", display: "block", marginBottom: 5 }}>Menu URL <span style={{ fontWeight: 400 }}>(optional — boosts accuracy)</span></label>
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.tacobell.com/nutrition/info"
                style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text)", outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--c-brand)")}
                onBlur={e  => (e.currentTarget.style.borderColor = "var(--c-border)")}
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", display: "block", marginBottom: 5 }}>Cuisine Type <span style={{ fontWeight: 400 }}>(optional)</span></label>
              <input
                value={cuisine}
                onChange={e => setCuisine(e.target.value)}
                placeholder="e.g. Fast Food · Mexican"
                style={{ width: "100%", boxSizing: "border-box", height: 42, padding: "0 14px", borderRadius: 10, fontSize: 14, border: "1.5px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text)", outline: "none" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--c-brand)")}
                onBlur={e  => (e.currentTarget.style.borderColor = "var(--c-border)")}
              />
            </div>

            <button
              onClick={analyze}
              disabled={loading || !name.trim()}
              style={{
                height: 46, borderRadius: 12, border: "none",
                background: loading || !name.trim() ? "var(--c-border)" : "var(--c-brand)",
                color: loading || !name.trim() ? "var(--c-sub)" : "var(--c-brand-fg)",
                fontSize: 14, fontWeight: 800, cursor: loading || !name.trim() ? "default" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {loading ? status || "Analyzing…" : "Fetch & Analyze with AI"}
            </button>
          </div>
        </div>

        {/* Preview */}
        {restaurant && (
          <div style={{ marginTop: 24 }}>

            {/* Restaurant header */}
            <div style={{ background: "var(--c-card)", borderRadius: 16, border: "1px solid var(--c-border)", padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)" }}>{restaurant.name}</div>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2 }}>{restaurant.cuisine}</div>
                  <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 4 }}>
                    {restaurant.menuItems.length} items · ID: <code style={{ fontSize: 11 }}>{restaurant.id}</code>
                  </div>
                  {restaurant.facilityAllergens.length > 0 && (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--c-sub)", fontWeight: 600 }}>Facility: </span>
                      {restaurant.facilityAllergens.map(a => allergenBadge(a))}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button onClick={copyCode} style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--c-border)", background: copied ? "#22c55e" : "var(--c-card)", color: copied ? "#fff" : "var(--c-text)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    {copied ? "✓ Copied" : "Copy Code"}
                  </button>
                  {!saved ? (
                    <button onClick={addToApp} style={{ padding: "8px 16px", borderRadius: 10, border: "none", background: "var(--c-brand)", color: "var(--c-brand-fg)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                      Add to App ✦
                    </button>
                  ) : (
                    <div style={{ padding: "8px 16px", borderRadius: 10, background: "#22c55e22", color: "#22c55e", fontSize: 13, fontWeight: 700 }}>
                      ✓ Added!
                    </div>
                  )}
                </div>
              </div>
              {saveError && (
                <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "#ef444422", color: "#ef4444", fontSize: 12, fontWeight: 600 }}>
                  {saveError}
                </div>
              )}
            </div>

            {/* Menu items by category */}
            {Object.entries(byCategory).map(([cat, items]) => (
              <div key={cat} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", letterSpacing: "0.06em", textTransform: "uppercase", padding: "0 4px", marginBottom: 8 }}>
                  {cat} ({items.length})
                </div>
                <div style={{ background: "var(--c-card)", borderRadius: 14, border: "1px solid var(--c-border)", overflow: "hidden" }}>
                  {items.map((item, i) => (
                    <div key={item.id} style={{
                      padding: "11px 16px",
                      borderBottom: i < items.length - 1 ? "1px solid var(--c-border)" : "none",
                      display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)", flex: 1, minWidth: 140 }}>{item.name}</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {item.allergens.length
                          ? item.allergens.map(a => allergenBadge(a))
                          : <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 600 }}>✓ No allergens</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
