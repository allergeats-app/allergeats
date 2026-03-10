"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { use } from "react";
import { SettingsButton } from "@/components/SettingsButton";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { loadProfileAllergens } from "@/lib/allergenProfile";
import { scoreRestaurant, coverageTier, coverageTierLabel, coverageTierColor } from "@/lib/scoring";
import { fitLevel, fitBadge, fitExplanation, fitReasoningBullets } from "@/lib/fitLevel";
import { recordView } from "@/lib/recentlyViewed";
import { useFavorites } from "@/lib/favoritesContext";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CameraScanButton } from "@/components/CameraScanButton";
import { EmptyState } from "@/components/EmptyState";
import { trackEvent } from "@/lib/analytics";
import { logRestaurantAnalysis } from "@/lib/learning/analysisLog";
import { fitLevel as fitLevelFn } from "@/lib/fitLevel";
import type { Restaurant, ScoredRestaurant, ScoredMenuItem, Risk, AllergenId } from "@/lib/types";

type RiskFilter = "all" | Risk;

const RISK_ORDER: Risk[] = ["avoid", "ask", "likely-safe", "unknown"];
const SESSION_KEY = "allegeats_live_restaurants";
const CONF_RANK: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

const RISK_META: Record<Risk, { label: string; mark: string; color: string; bg: string; border: string }> = {
  "avoid":       { label: "Avoid",       mark: "!", color: "#b91c1c", bg: "#fff1f0", border: "#f3c5c0" },
  "ask":         { label: "Ask Staff",   mark: "?", color: "#854d0e", bg: "#fff7db", border: "#f4dd8d" },
  "likely-safe": { label: "Likely Safe", mark: "✓", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  "unknown":     { label: "Unknown",     mark: "–", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb" },
};

function coverGradient(cuisine: string, name: string): string {
  const c = cuisine.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes("mcdonald") || c.includes("burger") || n.includes("burger"))
    return "linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)";
  if (c.includes("mexican") || c.includes("tex-mex") || n.includes("chipotle"))
    return "linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)";
  if (c.includes("chicken") || n.includes("chick-fil") || n.includes("popeyes"))
    return "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)";
  if (c.includes("coffee") || c.includes("café") || c.includes("cafe") || c.includes("bakery"))
    return "linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)";
  if (c.includes("pizza"))
    return "linear-gradient(135deg, #fca5a5 0%, #fb923c 100%)";
  if (c.includes("sandwich") || c.includes("sub") || n.includes("subway"))
    return "linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%)";
  if (c.includes("asian") || c.includes("chinese") || c.includes("sushi") || c.includes("japanese"))
    return "linear-gradient(135deg, #fde68a 0%, #86efac 100%)";
  if (c.includes("italian") || c.includes("pasta"))
    return "linear-gradient(135deg, #fca5a5 0%, #fde68a 100%)";
  return "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)";
}

function findRestaurant(id: string): Restaurant | undefined {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const list: Restaurant[] = JSON.parse(raw);
      const found = list.find((r) => r.id === id);
      if (found) return found;
    }
  } catch { /* ignore */ }
  return MOCK_RESTAURANTS.find((r) => r.id === id);
}

export default function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [scored, setScored]             = useState<ScoredRestaurant | null>(null);
  const [userAllergens, setUserAllergens] = useState<AllergenId[]>([]);
  const [notFound, setNotFound]         = useState(false);
  const [riskFilter, setRiskFilter]     = useState<RiskFilter>("all");
  const [photoFailed, setPhotoFailed]   = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  const { isFavorite, toggleFavorite } = useFavorites();

  useEffect(() => {
    const restaurant = findRestaurant(id);
    if (!restaurant) { setNotFound(true); return; } // eslint-disable-line react-hooks/set-state-in-effect
    const allergens = loadProfileAllergens();
    setUserAllergens(allergens);
    const sr = scoreRestaurant(restaurant, allergens);
    setScored(sr);
    recordView({
      id: restaurant.id, name: restaurant.name, cuisine: restaurant.cuisine,
      lat: restaurant.lat ?? undefined, lng: restaurant.lng ?? undefined,
      distance: restaurant.distance ?? undefined,
    });
    trackEvent("restaurant_detail_viewed", { id });
    // Log analysis summary for outcome tracking
    const { summary } = sr;
    const safeP = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
    logRestaurantAnalysis({
      id:             `log_${Date.now()}`,
      createdAt:      Date.now(),
      restaurantId:   restaurant.id,
      restaurantName: restaurant.name,
      cuisine:        restaurant.cuisine,
      userAllergens:  allergens,
      totalItems:     summary.total,
      safeCount:      summary.likelySafe,
      askCount:       summary.ask,
      avoidCount:     summary.avoid,
      fitLevel:       fitLevelFn(safeP, summary.avoid, summary.ask, summary.total),
    });
  }, [id]);

  // Categories sorted by safe-item count descending (safest sections first)
  const categories = useMemo<string[]>(() => {
    if (!scored) return [];
    const safeBycat: Record<string, number> = {};
    const order: string[] = [];
    for (const item of scored.scoredItems) {
      const cat = item.category;
      if (!cat) continue;
      if (!(cat in safeBycat)) { safeBycat[cat] = 0; order.push(cat); }
      if (item.risk === "likely-safe") safeBycat[cat]++;
    }
    return [...order].sort((a, b) => (safeBycat[b] ?? 0) - (safeBycat[a] ?? 0));
  }, [scored]);

  // Top 5 likely-safe items sorted by confidence descending
  const bestOptions = useMemo<ScoredMenuItem[]>(() => {
    if (!scored) return [];
    return scored.scoredItems
      .filter((i) => i.risk === "likely-safe")
      .sort((a, b) => (CONF_RANK[b.confidence] ?? 1) - (CONF_RANK[a.confidence] ?? 1))
      .slice(0, 5);
  }, [scored]);

  // Unique staff questions from all ask-risk items
  const aggregatedQuestions = useMemo<string[]>(() => {
    if (!scored) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of scored.scoredItems) {
      if (item.risk !== "ask") continue;
      for (const q of item.staffQuestions) {
        const key = q.toLowerCase().trim();
        if (!seen.has(key)) { seen.add(key); out.push(q); }
      }
    }
    return out.slice(0, 8);
  }, [scored]);

  // Items matching the current risk filter
  const filteredItems = useMemo<ScoredMenuItem[]>(() => {
    if (!scored) return [];
    return riskFilter === "all"
      ? scored.scoredItems
      : scored.scoredItems.filter((i) => i.risk === riskFilter);
  }, [scored, riskFilter]);

  const hasCategories = categories.length > 1;

  // When categories exist: group filtered items by category, sort by risk within each
  const byCategory = useMemo<Map<string, ScoredMenuItem[]>>(() => {
    if (!hasCategories) return new Map();
    const map = new Map<string, ScoredMenuItem[]>();
    for (const item of filteredItems) {
      const cat = item.category ?? "Other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    for (const items of map.values()) {
      items.sort((a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk));
    }
    return map;
  }, [filteredItems, hasCategories]);

  // When no categories: group by risk
  const byRisk = useMemo<Record<Risk, ScoredMenuItem[]>>(() => {
    const groups: Record<Risk, ScoredMenuItem[]> = { avoid: [], ask: [], "likely-safe": [], unknown: [] };
    if (hasCategories) return groups;
    for (const item of filteredItems) groups[item.risk].push(item);
    return groups;
  }, [filteredItems, hasCategories]);

  if (notFound) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <EmptyState
          title="Restaurant not found"
          subtitle="This restaurant isn't in our database."
          action={<Link href="/" style={{ padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Browse restaurants</Link>}
        />
      </main>
    );
  }

  if (!scored) {
    return <main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>Loading…</main>;
  }

  const { summary } = scored;
  const safePercent  = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const askPercent   = summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0;
  const level      = fitLevel(safePercent, summary.avoid, summary.ask, summary.total);
  const badge      = fitBadge(level);
  const oneliner   = fitExplanation(level, summary.avoid, summary.ask, summary.likelySafe);
  const reasoning  = fitReasoningBullets(level, summary);
  const tier       = coverageTier(summary.total);
  const tierLabel  = coverageTierLabel(summary.total);
  const tierColor  = coverageTierColor(tier);
  const favorited  = isFavorite(scored.id);
  const hasNoMenu  = scored.scoredItems.length === 0;
  const noAllergens = userAllergens.length === 0;

  // Cover photo from Google Places (falls back to gradient)
  const photoSrc = !photoFailed && scored.lat != null && scored.lng != null
    ? `/api/places-photo?name=${encodeURIComponent(scored.name)}&lat=${scored.lat}&lng=${scored.lng}`
    : null;

  const RISK_CHIPS: { value: RiskFilter; label: string }[] = [
    { value: "all",         label: `All (${summary.total})` },
    { value: "avoid",       label: `Avoid (${summary.avoid})` },
    { value: "ask",         label: `Ask (${summary.ask})` },
    { value: "likely-safe", label: `Safe (${summary.likelySafe})` },
    ...(summary.unknown > 0 ? [{ value: "unknown" as RiskFilter, label: `Unknown (${summary.unknown})` }] : []),
  ];

  async function copyQuestions() {
    const text = aggregatedQuestions.map((q) => `• ${q}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setQuestionsCopied(true);
    setTimeout(() => setQuestionsCopied(false), 2000);
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 60 }}>

      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--c-border)", padding: "12px 16px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Restaurants</Link>
          <SettingsButton />
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {/* ── 1. Hero card ── */}
        <div style={{
          background: "var(--c-card)", border: "1px solid var(--c-border)",
          borderRadius: 20, margin: "16px 0",
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}>
          {/* Cover photo / gradient strip */}
          <div style={{
            height: 110,
            background: photoSrc ? "#e5e7eb" : coverGradient(scored.cuisine, scored.name),
            position: "relative", overflow: "hidden",
          }}>
            {photoSrc && (
              <img
                src={photoSrc}
                alt={scored.name}
                onError={() => setPhotoFailed(true)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            )}
            {/* Fit badge overlaid top-right */}
            {!hasNoMenu && (
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: badge.bg, color: badge.color,
                padding: "5px 12px", borderRadius: 999,
                fontSize: 12, fontWeight: 800, lineHeight: 1.2,
                textAlign: "center",
              }}>
                {level}
                {summary.total >= 5 && (
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.8, marginTop: 1 }}>
                    {Math.round(safePercent)}% safe
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card content */}
          <div style={{ padding: 20 }}>
            {/* Name + save button */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: "var(--c-text)", lineHeight: 1.2 }}>{scored.name}</div>
                <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 3 }}>
                  {scored.cuisine}{scored.distance != null && ` · ${scored.distance} mi`}
                </div>
              </div>
              <button
                onClick={() => { trackEvent(favorited ? "place_unsaved" : "place_saved", { name: scored.name }); toggleFavorite(scored.id); }}
                title={favorited ? "Remove from saved" : "Save restaurant"}
                style={{
                  flexShrink: 0, width: 40, height: 40, borderRadius: 999,
                  background: favorited ? "#eb1700" : "var(--c-muted)",
                  border: `1.5px solid ${favorited ? "#eb1700" : "var(--c-border)"}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={favorited ? "#fff" : "none"} stroke={favorited ? "#fff" : "var(--c-sub)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>

            {/* One-liner explanation */}
            {!hasNoMenu && (
              <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 16, lineHeight: 1.4 }}>
                {oneliner}
              </div>
            )}

            {hasNoMenu ? (
              <div style={{ padding: 16, borderRadius: 14, background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 6 }}>No menu data available</div>
                <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5, marginBottom: 14 }}>
                  We found this restaurant but don&apos;t have allergen information yet. Scan the menu to get personalized results.
                </div>
                <CameraScanButton style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "10px 18px", background: "#eb1700", color: "#fff",
                  borderRadius: 12, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                }}>
                  Scan Menu →
                </CameraScanButton>
              </div>
            ) : (
              <>
                {/* Safety bar */}
                <div style={{ height: 7, borderRadius: 999, background: "var(--c-muted)", overflow: "hidden", display: "flex", marginBottom: 12 }}>
                  <div style={{ width: `${safePercent}%`,  background: "#22c55e", transition: "width 0.5s" }} />
                  <div style={{ width: `${askPercent}%`,   background: "#f59e0b", transition: "width 0.5s" }} />
                  <div style={{ width: `${avoidPercent}%`, background: "#ef4444", transition: "width 0.5s" }} />
                </div>

                {/* ── 2. Quick stats row ── */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <StatPill count={summary.likelySafe} label="Safe"  color="#15803d" bg="#f0fdf4" />
                  <StatPill count={summary.ask}        label="Ask"   color="#854d0e" bg="#fefce8" />
                  <StatPill count={summary.avoid}      label="Avoid" color="#b91c1c" bg="#fff1f0" />
                </div>

                {/* Coverage */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: 999, background: tierColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{tierLabel}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── 3. Best Options for You ── */}
        {!hasNoMenu && (
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label="Best Options for You" count={noAllergens ? undefined : bestOptions.length} />
            {noAllergens ? (
              <div style={{
                background: "var(--c-card)", border: "1px solid var(--c-border)",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5 }}>
                  Set your allergies to see which dishes are safe for you.
                </div>
                <Link href="/allergies" style={{
                  flexShrink: 0, padding: "8px 14px", borderRadius: 10,
                  background: "#eb1700", color: "#fff",
                  fontSize: 13, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
                }}>
                  Set Allergies
                </Link>
              </div>
            ) : bestOptions.length === 0 ? (
              <div style={{
                background: "var(--c-card)", border: "1px solid var(--c-border)",
                borderRadius: 14, padding: "14px 16px",
                fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5,
              }}>
                No items in our analysis are flagged safe for your allergy profile at this restaurant.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {bestOptions.map((item) => (
                  <BestOptionCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── 4. Why this rating ── */}
        {!hasNoMenu && (
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label="Why this rating" />
            <div style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 16, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {reasoning.map((bullet, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: badge.color, fontWeight: 900, fontSize: 13, lineHeight: "1.5", flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 13, color: "var(--c-text)", lineHeight: 1.5 }}>{bullet}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--c-sub)", lineHeight: 1.4 }}>
                Always confirm with staff before ordering.
              </div>
            </div>
          </section>
        )}

        {/* ── 4b. Questions to ask staff ── */}
        {!hasNoMenu && aggregatedQuestions.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label="Questions to ask staff" count={aggregatedQuestions.length} />
            <div style={{
              background: "#fff7db", border: "1px solid #f4dd8d",
              borderRadius: 16, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
                {aggregatedQuestions.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#854d0e", fontWeight: 700, fontSize: 13, lineHeight: "1.5", flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{q}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={copyQuestions}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 10,
                  border: "1px solid #f4dd8d", background: "#fff",
                  color: "#374151", fontSize: 13, fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {questionsCopied ? "Copied!" : "Copy all questions"}
              </button>
            </div>
          </section>
        )}

        {/* ── 5. Full menu ── */}
        {!hasNoMenu && (
          <section>
            <SectionHeader label="Full Menu" count={summary.total} />

            {/* Sticky risk filter chips */}
            <div style={{
              position: "sticky", top: 48, zIndex: 40,
              background: "var(--c-bg)",
              marginLeft: -16, marginRight: -16,
              paddingLeft: 16, paddingRight: 16,
              paddingTop: 8, paddingBottom: 8,
              borderBottom: "1px solid var(--c-border)",
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {RISK_CHIPS.map((c) => (
                  <button key={c.value} onClick={() => setRiskFilter(c.value)} style={{
                    padding: "8px 14px", borderRadius: 999,
                    border: `1.5px solid ${riskFilter === c.value ? "#eb1700" : "var(--c-border)"}`,
                    background: riskFilter === c.value ? "#eb1700" : "var(--c-card)",
                    color: riskFilter === c.value ? "#fff" : "var(--c-text)",
                    fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                    cursor: "pointer", flexShrink: 0,
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredItems.length === 0 ? (
              <EmptyState title="No items match" subtitle="Try a different filter." />
            ) : hasCategories ? (
              /* Grouped by menu section (safest categories first) */
              <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingBottom: 8 }}>
                {categories.map((cat) => {
                  const items = byCategory.get(cat);
                  if (!items?.length) return null;
                  const safeCount = items.filter((i) => i.risk === "likely-safe").length;
                  return (
                    <div key={cat}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{cat}</span>
                        <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{items.length}</span>
                        {safeCount > 0 && riskFilter === "all" && (
                          <span style={{ fontSize: 11, color: "#15803d", fontWeight: 700 }}>{safeCount} safe</span>
                        )}
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {items.map((item) => <MenuItemCard key={item.id} item={item} restaurantId={scored.id} restaurantName={scored.name} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Grouped by risk */
              <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 8 }}>
                {RISK_ORDER.map((risk) => {
                  const items = byRisk[risk];
                  if (!items.length) return null;
                  const meta = RISK_META[risk];
                  return (
                    <div key={risk}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 9,
                          background: meta.bg, border: `1px solid ${meta.border}`,
                          display: "grid", placeItems: "center",
                          fontSize: 12, fontWeight: 900, color: meta.color, flexShrink: 0,
                        }}>
                          {meta.mark}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-text)" }}>{meta.label}</div>
                          <div style={{ fontSize: 11, color: "var(--c-sub)" }}>{items.length} item{items.length === 1 ? "" : "s"}</div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {items.map((item) => <MenuItemCard key={item.id} item={item} restaurantId={scored.id} restaurantName={scored.name} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── 6. Scan CTA ── */}
        <div style={{
          marginTop: 32, padding: 20,
          background: "var(--c-card)", border: "1px solid var(--c-border)",
          borderRadius: 18,
        }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>
            {hasNoMenu ? "Scan this restaurant's menu" : "Don't see your order?"}
          </div>
          <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5, marginBottom: 14 }}>
            {hasNoMenu
              ? "Take a photo of the menu and we'll analyze it for your allergy profile."
              : "Scan the physical menu for a fresh analysis based on today's items."}
          </div>
          <CameraScanButton style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "12px 20px", borderRadius: 14,
            background: "#eb1700", color: "#fff",
            fontSize: 14, fontWeight: 800, border: "none", cursor: "pointer",
          }}>
            Scan Menu →
          </CameraScanButton>
        </div>

      </div>
    </main>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatPill({ count, label, color, bg }: { count: number; label: string; color: string; bg: string }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      padding: "10px 8px", borderRadius: 12, background: bg,
    }}>
      <span style={{ fontWeight: 900, fontSize: 22, color, lineHeight: 1 }}>{count}</span>
      <span style={{ fontSize: 11, color, opacity: 0.8, marginTop: 3, fontWeight: 600 }}>{label}</span>
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "0 0 12px" }}>
      <span style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</span>
      {count != null && <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{count}</span>}
    </div>
  );
}

function BestOptionCard({ item }: { item: ScoredMenuItem }) {
  return (
    <div style={{
      background: "#f0fdf4", border: "1px solid #bbf7d0",
      borderRadius: 14, padding: "12px 14px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-text)", lineHeight: 1.3 }}>{item.name}</div>
        {item.explanation && (
          <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 3, lineHeight: 1.4 }}>
            {item.explanation}
          </div>
        )}
      </div>
      <span style={{
        flexShrink: 0, padding: "3px 10px", borderRadius: 999,
        background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 700,
      }}>
        Safe
      </span>
    </div>
  );
}
