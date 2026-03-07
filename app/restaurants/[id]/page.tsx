"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { loadProfileAllergens, profileToDetectorAllergens } from "@/lib/allergenProfile";
import { scoreRestaurant } from "@/lib/scoring";
import { MenuItemCard } from "@/components/MenuItemCard";
import { SourceBadge } from "@/components/SourceBadge";
import { EmptyState } from "@/components/EmptyState";
import type { ScoredRestaurant, ScoredMenuItem, Risk } from "@/lib/types";

type RiskFilter = "all" | Risk;

const RISK_ORDER: Risk[] = ["avoid", "ask", "unknown", "likely-safe"];

const SECTION_META: Record<Risk, { label: string; icon: string; bg: string; border: string }> = {
  "avoid":       { label: "Avoid",       icon: "❌", bg: "#fff1f0", border: "#f3c5c0" },
  "ask":         { label: "Ask Staff",   icon: "⚠️", bg: "#fff7db", border: "#f4dd8d" },
  "unknown":     { label: "Unknown",     icon: "❓", bg: "#f9fafb", border: "#e5e7eb" },
  "likely-safe": { label: "Likely Safe", icon: "✅", bg: "#f0fdf4", border: "#bbf7d0" },
};

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scored, setScored]       = useState<ScoredRestaurant | null>(null);
  const [filter, setFilter]       = useState<RiskFilter>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  useEffect(() => {
    const restaurant = MOCK_RESTAURANTS.find((r) => r.id === id);
    if (!restaurant) return;

    const profileAllergens = loadProfileAllergens();
    const userAllergens = profileToDetectorAllergens(profileAllergens);
    setScored(scoreRestaurant(restaurant, userAllergens));
  }, [id]);

  const categories = useMemo(() => {
    if (!scored) return [];
    const cats = [...new Set(scored.scoredItems.map((i) => i.category).filter(Boolean))];
    return cats as string[];
  }, [scored]);

  const filtered = useMemo<ScoredMenuItem[]>(() => {
    if (!scored) return [];
    return scored.scoredItems.filter((item) => {
      if (filter !== "all" && item.risk !== filter) return false;
      if (catFilter !== "all" && item.category !== catFilter) return false;
      return true;
    });
  }, [scored, filter, catFilter]);

  // Group filtered items by risk in priority order
  const grouped = useMemo(() => {
    const groups: Record<Risk, ScoredMenuItem[]> = { avoid: [], ask: [], unknown: [], "likely-safe": [] };
    for (const item of filtered) groups[item.risk].push(item);
    return groups;
  }, [filtered]);

  if (!scored) {
    const exists = MOCK_RESTAURANTS.some((r) => r.id === id);
    if (!exists) {
      return (
        <main style={{ minHeight: "100vh", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmptyState icon="🔍" title="Restaurant not found" subtitle="This restaurant isn't in our database." action={<Link href="/restaurants" style={{ padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Browse restaurants</Link>} />
        </main>
      );
    }
    return <main style={{ minHeight: "100vh", background: "#f7f7f7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>Loading…</main>;
  }

  const { summary } = scored;
  const safePercent  = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const askPercent   = summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0;

  const RISK_CHIPS: { value: RiskFilter; label: string }[] = [
    { value: "all",         label: `All (${summary.total})` },
    { value: "avoid",       label: `Avoid (${summary.avoid})` },
    { value: "ask",         label: `Ask (${summary.ask})` },
    { value: "likely-safe", label: `Safe (${summary.likelySafe})` },
    { value: "unknown",     label: `Unknown (${summary.unknown})` },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f7f7f7", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 40 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(247,247,247,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <Link href="/restaurants" style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textDecoration: "none" }}>← Restaurants</Link>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
        {/* Restaurant header card */}
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, margin: "16px 0", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontWeight: 900, fontSize: 22, color: "#111", lineHeight: 1.2 }}>{scored.name}</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                {scored.cuisine}
                {scored.distance != null && ` · ${scored.distance} mi`}
              </div>
              {scored.address && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{scored.address}</div>}
            </div>
            <SourceBadge sourceType={scored.sourceType} />
          </div>

          {/* Safety bar */}
          <div style={{ marginTop: 16 }}>
            <div style={{ height: 8, borderRadius: 999, background: "#f3f4f6", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${safePercent}%`,  background: "#22c55e", transition: "width 0.5s" }} />
              <div style={{ width: `${askPercent}%`,   background: "#f59e0b", transition: "width 0.5s" }} />
              <div style={{ width: `${avoidPercent}%`, background: "#ef4444", transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
              <SummaryPill count={summary.likelySafe} label="Likely Safe" color="#15803d" bg="#f0fdf4" />
              <SummaryPill count={summary.ask}        label="Ask Staff"   color="#854d0e" bg="#fefce8" />
              <SummaryPill count={summary.avoid}      label="Avoid"       color="#b91c1c" bg="#fff1f0" />
              {summary.unknown > 0 && <SummaryPill count={summary.unknown} label="Unknown" color="#6b7280" bg="#f9fafb" />}
            </div>
          </div>

          <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 12, lineHeight: 1.4 }}>
            Scored against your saved allergy profile. Always confirm with staff before ordering.
          </p>
        </div>

        {/* Filter chips */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2, marginBottom: 8 }}>
            {RISK_CHIPS.map((c) => (
              <button key={c.value} onClick={() => setFilter(c.value)} style={{ padding: "8px 14px", borderRadius: 999, border: `1.5px solid ${filter === c.value ? "#eb1700" : "#e5e7eb"}`, background: filter === c.value ? "#eb1700" : "#fff", color: filter === c.value ? "#fff" : "#374151", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 }}>
                {c.label}
              </button>
            ))}
          </div>

          {categories.length > 1 && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              <button onClick={() => setCatFilter("all")} style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${catFilter === "all" ? "#374151" : "#e5e7eb"}`, background: catFilter === "all" ? "#111" : "#fff", color: catFilter === "all" ? "#fff" : "#374151", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 }}>All categories</button>
              {categories.map((cat) => (
                <button key={cat} onClick={() => setCatFilter(cat)} style={{ padding: "6px 12px", borderRadius: 999, border: `1px solid ${catFilter === cat ? "#374151" : "#e5e7eb"}`, background: catFilter === cat ? "#111" : "#fff", color: catFilter === cat ? "#fff" : "#374151", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 }}>{cat}</button>
              ))}
            </div>
          )}
        </div>

        {/* Menu items grouped by risk */}
        {filtered.length === 0 ? (
          <EmptyState icon="🍽️" title="No items match" subtitle="Try a different filter." />
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {RISK_ORDER.map((risk) => {
              const items = grouped[risk];
              if (!items.length) return null;
              const meta = SECTION_META[risk];
              return (
                <div key={risk}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, display: "grid", placeItems: "center", fontSize: 15 }}>{meta.icon}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{meta.label}</div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{items.length} item{items.length === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {items.map((item) => <MenuItemCard key={item.id} item={item} />)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryPill({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 999, background: bg }}>
      <span style={{ fontWeight: 800, fontSize: 13, color }}>{count}</span>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>{label}</span>
    </div>
  );
}
