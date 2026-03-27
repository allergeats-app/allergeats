"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { use } from "react";
import { SettingsButton } from "@/components/SettingsButton";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { loadProfileAllergens } from "@/lib/allergenProfile";
import { coverageTierColor } from "@/lib/scoring";
import { fitLevel } from "@/lib/fitLevel";
import { recordView } from "@/lib/recentlyViewed";
import { bumpInteraction, registerForCrawl, markCrawled } from "@/lib/menu-crawl";
import { toRawMenuItems } from "@/lib/menu-ingestion";
import type { NormalizedMenu } from "@/lib/menu-ingestion";
import { useFavorites } from "@/lib/favoritesContext";
import { MenuItemCard } from "@/components/MenuItemCard";
import { GuidedOrderBuilder } from "@/components/GuidedOrderBuilder";
import { CameraScanButton } from "@/components/CameraScanButton";
import { EmptyState } from "@/components/EmptyState";
import { ShowStaffCard } from "@/components/ShowStaffCard";
import { trackEvent } from "@/lib/analytics";
import { logRestaurantAnalysis } from "@/lib/learning/analysisLog";
import { useTheme } from "@/lib/themeContext";
import { analyzeRestaurant, buildDetailViewModel } from "@/lib/analysis";
import type {
  RestaurantMenuAnalysis,
  RestaurantDetailViewModel,
  SafeOrderRecommendation,
  AnalyzedMenuItem,
  MemoryInsight,
} from "@/lib/analysis";
import { applyMemoryToAnalysis } from "@/lib/learning/memoryIntegration";
import { useRestaurantMemory } from "@/lib/learning/useRestaurantMemory";
import type { FeedbackParams } from "@/lib/learning/useRestaurantMemory";
import type { FeedbackType } from "@/lib/learning/types";
import type { Restaurant, Risk, AllergenId, AllergenSeverity } from "@/lib/types";
import { loadProfileSeverities } from "@/lib/allergenProfile";
import { coverGradient } from "@/lib/coverGradient";
import { chainLogoUrl } from "@/lib/chainLogos";

type RiskFilter = "all" | Risk;

const RISK_ORDER: Risk[] = ["avoid", "ask", "likely-safe", "unknown"];
const SESSION_KEY = "allegeats_live_restaurants";

const RISK_META: Record<Risk, { label: string; mark: string; color: string; bg: string; border: string; badgeBg: string }> = {
  "avoid":       { label: "Avoid",       mark: "!", color: "var(--c-risk-avoid)", bg: "rgba(220,38,38,0.07)",  border: "rgba(220,38,38,0.18)",  badgeBg: "rgba(220,38,38,0.1)"  },
  "ask":         { label: "Ask Staff",   mark: "?", color: "var(--c-risk-ask)",   bg: "rgba(217,119,6,0.08)",  border: "rgba(217,119,6,0.22)",  badgeBg: "rgba(217,119,6,0.1)"  },
  "likely-safe": { label: "Likely Safe", mark: "✓", color: "var(--c-risk-safe)",  bg: "rgba(22,163,74,0.07)",  border: "rgba(22,163,74,0.18)",  badgeBg: "rgba(22,163,74,0.1)"  },
  "unknown":     { label: "Unknown",     mark: "–", color: "var(--c-sub)",         bg: "var(--c-muted)",         border: "var(--c-border)",        badgeBg: "var(--c-muted)"        },
};

const QUICK_FEEDBACK: { type: FeedbackType; label: string }[] = [
  { type: "confirmed-safe",           label: "Was safe for me ✓" },
  { type: "found-unsafe",             label: "Had my allergen ✗" },
  { type: "false-positive",           label: "App wrongly flagged" },
  { type: "needs-staff-confirmation", label: "Ask staff ?" },
];


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

export function RestaurantDetailClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // ── Base state ──────────────────────────────────────────────────────────────
  const [baseAnalysis, setBaseAnalysis]   = useState<RestaurantMenuAnalysis | null>(null);
  const [restaurant, setRestaurant]       = useState<Restaurant | null>(null);
  const [userAllergens, setUserAllergens] = useState<AllergenId[]>([]);
  const [notFound, setNotFound]           = useState(false);
  const [riskFilter, setRiskFilter]       = useState<RiskFilter>("likely-safe");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [photoFailed, setPhotoFailed]     = useState(false);
  const [photoLoaded, setPhotoLoaded]     = useState(false);
  const [questionsCopied, setQuestionsCopied] = useState(false);
  // Incremented after each feedback submission — forces memory re-application
  const [memoryVersion, setMemoryVersion] = useState(0);
  const [crawlStatus, setCrawlStatus] = useState<"idle" | "fetching" | "done" | "empty" | "failed">("idle");
  const [severities, setSeverities]   = useState<Partial<Record<AllergenId, AllergenSeverity>>>(() => loadProfileSeverities());
  const [showDrinks, setShowDrinks]   = useState(false);
  const [orderedItemIds, setOrderedItemIds] = useState<Set<string>>(new Set());
  const [showOrderSheet, setShowOrderSheet] = useState(false);
  const [orderCopied, setOrderCopied]       = useState(false);
  const [showStaffCard, setShowStaffCard]   = useState(false);
  const [builderBrowseMode, setBuilderBrowseMode] = useState(false);

  const { isFavorite, toggleFavorite } = useFavorites();

  // ── Load restaurant + base analysis ────────────────────────────────────────
  useEffect(() => {
    const found = findRestaurant(id);
    if (!found) { setNotFound(true); return; }

    const allergens  = loadProfileAllergens();
    const sevs       = loadProfileSeverities();
    setUserAllergens(allergens);
    setSeverities(sevs);

    const analysis = analyzeRestaurant(found, allergens, sevs);
    setBaseAnalysis(analysis);
    setRestaurant(found);

    recordView({
      id: found.id, name: found.name, cuisine: found.cuisine,
      lat: found.lat ?? undefined, lng: found.lng ?? undefined,
      distance: found.distance ?? undefined,
    });
    trackEvent("restaurant_detail_viewed", { id });

    // Register in crawl queue (idempotent) and bump interaction count
    // so frequently viewed restaurants are refreshed more often.
    registerForCrawl(found.id, { sourceUrl: found.website ?? undefined });
    bumpInteraction(found.id);

    // Cache minimal record server-side so generateMetadata can produce
    // per-restaurant <title> tags for Google Places results.
    // Fire-and-forget — metadata degrades gracefully if this fails.
    fetch("/api/restaurants/cache", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id:      found.id,
        name:    found.name,
        cuisine: found.cuisine,
        address: found.address,
        lat:     found.lat ?? undefined,
        lng:     found.lng ?? undefined,
      }),
    }).catch(() => { /* non-fatal */ });

    // Log analysis summary (uses base analysis — before memory overlay)
    const { summary } = analysis;
    const safeP = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
    logRestaurantAnalysis({
      id:             `log_${Date.now()}`,
      createdAt:      Date.now(),
      restaurantId:   found.id,
      restaurantName: found.name,
      cuisine:        found.cuisine,
      userAllergens:  allergens,
      totalItems:     summary.total,
      safeCount:      summary.likelySafe,
      askCount:       summary.ask,
      avoidCount:     summary.avoid,
      fitLevel:       fitLevel(safeP, summary.avoid, summary.ask, summary.total),
    });
  }, [id]);

  // ── Auto-crawl: fetch menu from restaurant website when no menu data ────────
  // Fires when the restaurant loads with 0 menu items. Uses the response body
  // directly so the analysis updates immediately without a Supabase read.
  useEffect(() => {
    if (!restaurant) return;
    if (restaurant.menuItems.length > 0) return;     // already have data
    if (restaurant.menuIsGenericChainTemplate) return; // template counts as data
    if (!restaurant.website) return;                  // nothing to crawl

    let cancelled = false;
    setCrawlStatus("fetching");

    fetch("/api/fetch-menu", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        url:            restaurant.website,
        restaurantId:   restaurant.id,
        restaurantName: restaurant.name,
      }),
    })
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) { setCrawlStatus("failed"); return; }

        let data: { menu?: NormalizedMenu };
        try {
          data = await res.json() as { menu?: NormalizedMenu };
        } catch {
          setCrawlStatus("failed");
          return;
        }
        if (!data.menu) { setCrawlStatus("empty"); return; }

        const items = toRawMenuItems(data.menu);
        if (items.length === 0) { setCrawlStatus("empty"); return; }

        const enriched  = { ...restaurant, menuItems: items };
        const allergens = loadProfileAllergens();
        const analysis  = analyzeRestaurant(enriched, allergens, severities);

        if (!cancelled) {
          setRestaurant(enriched);
          setBaseAnalysis(analysis);
          setCrawlStatus("done");
          markCrawled(restaurant.id, "updated");
        }
      })
      .catch(() => { if (!cancelled) setCrawlStatus("failed"); });

    return () => { cancelled = true; };
  }, [restaurant?.id, restaurant?.website]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Memory-enhanced analysis ────────────────────────────────────────────────
  // Re-computes when baseAnalysis loads, allergens change, or feedback is submitted.
  // memoryVersion intentionally included: forces a fresh localStorage read after submitFeedback.
  const enhancedAnalysis = useMemo(
    () => (baseAnalysis ? applyMemoryToAnalysis(baseAnalysis, userAllergens) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [baseAnalysis, userAllergens, memoryVersion],
  );

  // Items with memory signals attached — passed to the hook so insights reflect actual signals
  const enhancedItems = useMemo(
    () => enhancedAnalysis?.allItems ?? [],
    [enhancedAnalysis],
  );

  // ── Memory hook (insights, warnings, feedback submission) ───────────────────
  const {
    warnings,
    insights,
    submitFeedback: _submitMemoryFeedback,
  } = useRestaurantMemory(id, restaurant?.name ?? "", enhancedItems);

  // Wrap hook's submitFeedback to also bump memoryVersion (triggering re-analysis)
  // and bump crawl interaction count so actively-used restaurants refresh more often.
  const handleFeedback = useCallback(
    (params: FeedbackParams) => {
      _submitMemoryFeedback(params);
      setMemoryVersion((v) => v + 1);
      bumpInteraction(id);
    },
    [_submitMemoryFeedback, id],
  );

  // ── Final view model ────────────────────────────────────────────────────────
  const vm = useMemo(
    (): RestaurantDetailViewModel | null => {
      if (!enhancedAnalysis || !restaurant) return null;
      return buildDetailViewModel(enhancedAnalysis, {
        distance:           restaurant.distance ?? undefined,
        isSaved:            isFavorite(restaurant.id),
        restaurantWarnings: warnings,
        memoryInsights:     insights,
      });
    },
    [enhancedAnalysis, restaurant, warnings, insights, isFavorite],
  );

  // ── Derived display state ───────────────────────────────────────────────────
  const allItems = useMemo(
    () => (vm ? vm.sections.flatMap((s) => s.items) : []),
    [vm],
  );

  const orderedItems = useMemo(
    () => allItems.filter((i) => orderedItemIds.has(i.id)),
    [allItems, orderedItemIds],
  );

  const filteredItems = useMemo(
    () => (riskFilter === "all" ? allItems : allItems.filter((i) => i.risk === riskFilter)),
    [allItems, riskFilter],
  );

  const hasCategories = (vm?.sections.length ?? 0) > 1;

  const bySectionFiltered = useMemo(() => {
    if (!vm || !hasCategories) return new Map<string, typeof allItems>();
    const map = new Map<string, typeof allItems>();
    for (const section of vm.sections) {
      const items = section.items.filter((i) => riskFilter === "all" || i.risk === riskFilter);
      if (items.length > 0) map.set(section.sectionName, [...items].sort(
        (a, b) => RISK_ORDER.indexOf(a.risk) - RISK_ORDER.indexOf(b.risk),
      ));
    }
    return map;
  }, [vm, hasCategories, riskFilter]);

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (notFound) {
    return (
      <main style={{ minHeight: "100dvh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <EmptyState
          title="Restaurant not found"
          subtitle="This restaurant isn't in our database."
          action={<Link href="/" style={{ padding: "12px 20px", background: "#eb1700", color: "#fff", borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: "none" }}>Browse restaurants</Link>}
        />
      </main>
    );
  }

  if (!vm || !restaurant) {
    return <main style={{ minHeight: "100dvh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>Loading…</main>;
  }

  const { hero, summary, coverage, whyThisWorks, aggregatedStaffQuestions, bestOptions } = vm;
  const badge        = { bg: hero.fitBadgeBg, color: hero.fitBadgeColor };
  const safePercent  = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const askPercent   = summary.total > 0 ? (summary.ask        / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid      / summary.total) * 100 : 0;
  const tierColor    = coverageTierColor(coverage.tier);
  const favorited    = isFavorite(restaurant.id);
  const hasNoMenu    = summary.total === 0;
  const noAllergens  = userAllergens.length === 0;

  const wikiUrl  = chainLogoUrl(restaurant.name);
  const photoSrc = !photoFailed
    ? (restaurant.imageUrl ?? wikiUrl
        ?? (restaurant.googlePlaceId
          ? `/api/places-photo?placeId=${encodeURIComponent(restaurant.googlePlaceId)}`
          : restaurant.lat != null && restaurant.lng != null
            ? `/api/places-photo?name=${encodeURIComponent(restaurant.name)}&lat=${restaurant.lat}&lng=${restaurant.lng}`
            : null))
    : null;
  const isLogo = (() => {
    if (!photoSrc) return false;
    if (photoSrc.startsWith("/api/wiki-thumb?url=")) {
      return /\.svg\.png/i.test(decodeURIComponent(photoSrc));
    }
    return photoSrc.startsWith("/api/wiki-thumb") || /\.svg\.png(\?|$)/i.test(photoSrc);
  })();

  const RISK_CHIPS: { value: RiskFilter; label: string }[] = [
    { value: "all",         label: `All (${summary.total})` },
    { value: "avoid",       label: `Avoid (${summary.avoid})` },
    { value: "ask",         label: `Ask (${summary.ask})` },
    { value: "likely-safe", label: `Safe (${summary.likelySafe})` },
    ...(summary.unknown > 0 ? [{ value: "unknown" as RiskFilter, label: `Unknown (${summary.unknown})` }] : []),
  ];

  async function copyQuestions() {
    const text = aggregatedStaffQuestions.map((q) => `• ${q}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setQuestionsCopied(true);
    setTimeout(() => setQuestionsCopied(false), 2000);
  }

  function toggleOrderItem(itemId: string) {
    setOrderedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  async function copyOrderToClipboard() {
    const safeItems = orderedItems.filter((i) => i.risk === "likely-safe");
    const askItems  = orderedItems.filter((i) => i.risk === "ask");
    const questions = [...new Set(askItems.flatMap((i) => i.staffQuestions))];
    let text = `My order at ${restaurant!.name}:\n\n`;
    safeItems.forEach((i) => { text += `✓ ${i.name}\n`; });
    askItems.forEach((i)  => { text += `? ${i.name}\n`; });
    if (questions.length > 0) {
      text += `\nQuestions for staff:\n`;
      questions.slice(0, 6).forEach((q) => { text += `• ${q}\n`; });
    }
    await navigator.clipboard.writeText(text.trim()).catch(() => {});
    setOrderCopied(true);
    setTimeout(() => setOrderCopied(false), 2500);
  }

  // Shared item renderer — wraps MenuItemCard with the feedback row
  function renderItem(item: AnalyzedMenuItem) {
    return (
      <div key={item.id}>
        <MenuItemCard
          item={item}
          restaurantId={restaurant!.id}
          restaurantName={restaurant!.name}
          inOrder={orderedItemIds.has(item.id)}
          onToggleOrder={() => toggleOrderItem(item.id)}
        />
        <FeedbackRow
          item={item}
          userAllergens={userAllergens}
          onSubmit={(params) =>
            handleFeedback({ ...params, dishName: item.name, menuItemId: item.itemId })
          }
        />
      </div>
    );
  }

  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: orderedItemIds.size > 0 ? 140 : 60 }}>

      {showStaffCard && (
        <ShowStaffCard
          allergens={userAllergens}
          severities={severities}
          onClose={() => setShowStaffCard(false)}
        />
      )}

      {/* ── Sticky header ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "var(--c-hdr)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--c-border)", padding: "12px 16px",
      }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 15, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none", padding: "8px 0", minHeight: 44, display: "flex", alignItems: "center" }}>← Restaurants</Link>
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
            height: 148,
            background: isLogo && photoLoaded ? "#fff" : coverGradient(hero.cuisine, hero.restaurantName),
            position: "relative", overflow: "hidden",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.3s ease",
          }}>
            {photoSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc}
                alt={hero.restaurantName}
                onLoad={() => setPhotoLoaded(true)}
                onError={() => setPhotoFailed(true)}
                loading="lazy"
                style={{
                  position: "absolute", inset: 0,
                  width: "100%", height: "100%",
                  objectFit: isLogo ? "contain" : "cover",
                  objectPosition: "center",
                  padding: isLogo ? "20px 32px" : 0,
                  opacity: photoLoaded ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
              />
            )}
            {!isLogo && photoLoaded && (
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.32) 100%)",
                pointerEvents: "none",
              }} />
            )}
            {!hasNoMenu && (
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: badge.bg, color: badge.color,
                padding: "5px 12px", borderRadius: 999,
                fontSize: 12, fontWeight: 800, lineHeight: 1.2,
                textAlign: "center",
              }}>
                {hero.fitLabel}
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
              <div style={{ minWidth: 0 }}>
                <h1 style={{ fontWeight: 900, fontSize: 22, color: "var(--c-text)", lineHeight: 1.2, margin: 0 }}>{hero.restaurantName}</h1>
                <div style={{ fontSize: 15, color: "var(--c-sub)", marginTop: 4 }}>
                  {hero.cuisine}{hero.distance != null && ` · ${hero.distance} mi`}
                </div>
                {(restaurant.address || (restaurant.lat != null && restaurant.lng != null)) && (() => {
                  const mapsUrl = restaurant.lat != null && restaurant.lng != null
                    ? `https://www.google.com/maps/search/?api=1&query=${restaurant.lat},${restaurant.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address!)}`;
                  return (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        marginTop: 6, fontSize: 13, color: "#eb1700",
                        fontWeight: 600, textDecoration: "none",
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {restaurant.address ?? "Get directions"}
                    </a>
                  );
                })()}
              </div>
              <button
                onClick={() => { trackEvent(favorited ? "place_unsaved" : "place_saved", { id: restaurant.id, name: hero.restaurantName, fit: hero.fitLevel, coverage: coverage.tier }); toggleFavorite(restaurant.id); }}
                aria-label={favorited ? `Remove ${hero.restaurantName} from saved` : `Save ${hero.restaurantName}`}
                title={favorited ? "Remove from saved" : "Save restaurant"}
                style={{
                  flexShrink: 0, width: 48, height: 48, borderRadius: 999,
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

            {!hasNoMenu && (
              <div style={{ fontSize: 15, color: "var(--c-sub)", marginBottom: 18, lineHeight: 1.6 }}>
                {hero.fitExplanation}
              </div>
            )}

            {hasNoMenu ? (
              <div style={{ padding: 16, borderRadius: 14, background: "var(--c-muted)", border: "1px solid var(--c-border)" }}>
                {crawlStatus === "fetching" ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 6 }}>Checking restaurant website…</div>
                    <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5 }}>
                      Fetching menu data in the background.
                    </div>
                  </>
                ) : crawlStatus === "failed" || crawlStatus === "empty" ? (
                  <>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)", marginBottom: 6 }}>
                      {crawlStatus === "empty" ? "Menu not found on website" : "Couldn't fetch menu"}
                    </div>
                    <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5, marginBottom: 14 }}>
                      Scan the physical menu to get personalized allergen results.
                    </div>
                    <CameraScanButton style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "10px 18px", background: "#eb1700", color: "#fff",
                      borderRadius: 12, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                    }}>
                      Scan Menu →
                    </CameraScanButton>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Safety bar */}
                {(() => {
                  const glowRgb = avoidPercent > 40 ? "239,68,68" : askPercent > 40 ? "245,158,11" : "34,197,94";
                  return (
                    <div style={{
                      height: 8, borderRadius: 999,
                      background: "var(--c-muted)",
                      overflow: "hidden", display: "flex", marginBottom: 12,
                      boxShadow: `0 0 10px 2px rgba(${glowRgb},0.35), inset 0 1px 3px rgba(0,0,0,0.15)`,
                    }}>
                      {safePercent > 0  && <div style={{ width: `${safePercent}%`,  background: "linear-gradient(90deg,#16a34a,#22c55e)", transition: "width 0.5s" }} />}
                      {askPercent > 0   && <div style={{ width: `${askPercent}%`,   background: "linear-gradient(90deg,#d97706,#f59e0b)", transition: "width 0.5s" }} />}
                      {avoidPercent > 0 && <div style={{ width: `${avoidPercent}%`, background: "linear-gradient(90deg,#dc2626,#ef4444)", transition: "width 0.5s" }} />}
                    </div>
                  );
                })()}

                {/* ── 2. Quick stats row ── */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <StatPill count={summary.likelySafe} label="Safe"  color="#15803d" bg="#f0fdf4" rgb="21,128,61"  active={riskFilter === "likely-safe"} onClick={() => { setRiskFilter("likely-safe"); document.getElementById("full-menu")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
                  <StatPill count={summary.ask}        label="Ask"   color="#854d0e" bg="#fefce8" rgb="133,77,14"  active={riskFilter === "ask"}         onClick={() => { setRiskFilter("ask");          document.getElementById("full-menu")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
                  <StatPill count={summary.avoid}      label="Avoid" color="#b91c1c" bg="#fff1f0" rgb="185,28,28"  active={riskFilter === "avoid"}       onClick={() => { setRiskFilter("avoid");        document.getElementById("full-menu")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
                </div>

                {/* Coverage trust signal */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: tierColor, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{coverage.coverageLine}</span>
                </div>
              </>
            )}

            {/* Show Staff Card button — visible whenever user has allergens */}
            {userAllergens.length > 0 && (
              <button
                onClick={() => setShowStaffCard(true)}
                style={{
                  marginTop: hasNoMenu ? 0 : 16,
                  width: "100%", padding: "13px 0",
                  borderRadius: 14,
                  border: "1px solid #b8962e",
                  background: "linear-gradient(135deg, #f5d060 0%, #e8b923 30%, #fce97a 50%, #d4a017 70%, #f5d060 100%)",
                  backgroundSize: "200% 200%",
                  color: "#5c3d00",
                  fontSize: 14, fontWeight: 800, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  minHeight: 48,
                  boxShadow: "0 1px 4px rgba(180,130,0,0.35), inset 0 1px 0 rgba(255,255,255,0.45)",
                  textShadow: "0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                Show Allergy Card to Staff
              </button>
            )}
          </div>
        </div>

        {/* ── 3. Best Options for You ── */}
        {!hasNoMenu && (
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label="Best Options for You" />
            {noAllergens ? (
              <div style={{
                background: "var(--c-card)", border: "1px solid var(--c-border)",
                borderRadius: 14, padding: "14px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              }}>
                <div style={{ fontSize: 15, color: "var(--c-sub)", lineHeight: 1.6 }}>
                  Set your allergies to see which dishes are safe for you.
                </div>
                <Link href="/allergies" style={{
                  flexShrink: 0, padding: "11px 18px", borderRadius: 12,
                  background: "#eb1700", color: "#fff",
                  fontSize: 15, fontWeight: 700, textDecoration: "none", whiteSpace: "nowrap",
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
                {bestOptions.map((rec) => (
                  <BestOptionCard key={rec.item.id} rec={rec} />
                ))}
              </div>
            )}
          </section>
        )}


        {/* ── 4b. Questions to ask staff ── */}
        {!hasNoMenu && aggregatedStaffQuestions.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label="Questions to ask staff" count={aggregatedStaffQuestions.length} />
            <div style={{
              background: "#fff7db", border: "1px solid #f4dd8d",
              borderRadius: 16, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 12 }}>
                {aggregatedStaffQuestions.map((q, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "#854d0e", fontWeight: 700, fontSize: 15, lineHeight: "1.6", flexShrink: 0 }}>•</span>
                    <span style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>{q}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={copyQuestions}
                style={{
                  width: "100%", padding: "13px 16px", borderRadius: 12,
                  border: "1px solid #f4dd8d", background: "#fff",
                  color: "#374151", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", minHeight: 48,
                }}
              >
                {questionsCopied ? "Copied!" : "Copy all questions"}
              </button>
            </div>
          </section>
        )}

        {/* ── 4c. Community Knowledge (memory insights from the learning system) ── */}
        {!hasNoMenu && vm.memoryInsights.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <SectionHeader label="Community Knowledge" count={vm.memoryInsights.length} />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {vm.memoryInsights.map((insight, i) => (
                <MemoryInsightCard key={i} insight={insight} />
              ))}
            </div>
          </section>
        )}

        {/* ── 5. Full menu ── */}
        {!hasNoMenu && (
          <section id="full-menu">
            {/* ── Guided builder mode ── */}
            {restaurant?.builderConfig && !builderBrowseMode ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "var(--c-text)", letterSpacing: "-0.01em" }}>Build Your Order</div>
                  <button
                    onClick={() => setBuilderBrowseMode(true)}
                    style={{
                      background: "none", border: `1px solid var(--c-border)`,
                      borderRadius: 10, padding: "8px 14px",
                      fontSize: 13, fontWeight: 700, color: "var(--c-sub)", cursor: "pointer",
                    }}
                  >
                    Full menu
                  </button>
                </div>
                <GuidedOrderBuilder
                  steps={restaurant.builderConfig.steps}
                  sections={vm.sections}
                  orderedItemIds={orderedItemIds}
                  onToggleOrder={toggleOrderItem}
                  onOpenOrder={() => setShowOrderSheet(true)}
                  onBrowse={() => setBuilderBrowseMode(true)}
                />
              </>
            ) : (
              <>
                {restaurant?.builderConfig && builderBrowseMode && (
                  <button
                    onClick={() => setBuilderBrowseMode(false)}
                    style={{
                      background: "none", border: "none", padding: "0 0 16px",
                      fontSize: 14, fontWeight: 700, color: "#eb1700", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
                    Back to order builder
                  </button>
                )}
                <SectionHeader label="Menu" count={summary.total} />

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
                      <button key={c.value} onClick={() => { setRiskFilter(c.value); setCategoryFilter("all"); }} style={{
                        padding: "11px 18px", borderRadius: 999,
                        border: `1.5px solid ${riskFilter === c.value ? "#eb1700" : "var(--c-border)"}`,
                        background: riskFilter === c.value ? "#eb1700" : "var(--c-card)",
                        color: riskFilter === c.value ? "#fff" : "var(--c-text)",
                        fontSize: 15, fontWeight: 700, whiteSpace: "nowrap",
                        cursor: "pointer", flexShrink: 0, minHeight: 44,
                      }}>
                        {c.label}
                      </button>
                    ))}
                  </div>
                  {/* Category sub-filter */}
                  {vm.sections.filter((s) => !isDrinkSection(s.sectionName)).length > 1 && (
                    <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, marginTop: 8 }}>
                      {[{ key: "all", label: "All" }, ...vm.sections.filter((s) => !isDrinkSection(s.sectionName)).map((s) => ({ key: s.sectionName, label: s.sectionName }))].map((c) => (
                        <button key={c.key} onClick={() => setCategoryFilter(c.key)} style={{
                          padding: "6px 13px", borderRadius: 999,
                          border: `1px solid ${categoryFilter === c.key ? "var(--c-text)" : "var(--c-border)"}`,
                          background: categoryFilter === c.key ? "var(--c-text)" : "transparent",
                          color: categoryFilter === c.key ? "var(--c-bg)" : "var(--c-sub)",
                          fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
                          cursor: "pointer", flexShrink: 0,
                        }}>
                          {c.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {filteredItems.length === 0 ? (
                  <EmptyState title="No items match" subtitle="Try a different filter." />
                ) : hasCategories ? (() => {
              const foodSections = vm.sections.filter((s) => !isDrinkSection(s.sectionName));
              const drinkSections = vm.sections.filter((s) => isDrinkSection(s.sectionName));
              const drinkItems = drinkSections.flatMap((s) => bySectionFiltered.get(s.sectionName) ?? []);
              return (
                <>
                  {/* ── Food sections ── */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 8 }}>
                    {foodSections.map((section) => {
                      const items = bySectionFiltered.get(section.sectionName);
                      if (!items?.length) return null;
                      if (categoryFilter !== "all" && section.sectionName !== categoryFilter) return null;
                      return (
                        <div key={section.sectionName}>
                          <div style={{ marginBottom: 8 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)", margin: "0 0 2px", letterSpacing: "-0.01em" }}>{section.sectionName}</h2>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: 12, color: "var(--c-sub)" }}>{items.length} item{items.length === 1 ? "" : "s"}</span>
                              {section.safeCount > 0 && riskFilter === "all" && (
                                <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700 }}>· {section.safeCount} safe for you</span>
                              )}
                            </div>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {items.map(renderItem)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* ── Drinks collapsible ── */}
                  {drinkItems.length > 0 && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowDrinks((v) => !v)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", borderRadius: 14,
                          background: "var(--c-card)", border: "1px solid var(--c-border)",
                          cursor: "pointer", marginBottom: showDrinks ? 12 : 0,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--c-sub)" }} aria-hidden="true">
                            <path d="M8 2h8l1 7H7L8 2z"/><path d="M7 9c0 6 2 11 5 11s5-5 5-11"/>
                          </svg>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)" }}>Drinks</span>
                          <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{drinkItems.length} item{drinkItems.length === 1 ? "" : "s"}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>
                          {showDrinks ? "Hide ▲" : "Show ▼"}
                        </span>
                      </button>
                      {showDrinks && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                          {drinkSections.map((section) => {
                            const items = bySectionFiltered.get(section.sectionName);
                            if (!items?.length) return null;
                            return (
                              <div key={section.sectionName}>
                                <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 12 }}>
                                  <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{section.sectionName}</h2>
                                  <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{items.length}</span>
                                </div>
                                <div style={{ display: "grid", gap: 8 }}>
                                  {items.map(renderItem)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })() : (() => {
              /* Grouped by risk — separate drinks from food */
              const foodByRisk: Record<Risk, typeof allItems> = { avoid: [], ask: [], "likely-safe": [], unknown: [] };
              const drinkItems: typeof allItems = [];
              for (const item of filteredItems) {
                const cat = item.category ?? item.sectionName ?? "";
                if (isDrinkSection(cat)) drinkItems.push(item);
                else foodByRisk[item.risk].push(item);
              }
              return (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14, paddingBottom: 8 }}>
                    {RISK_ORDER.map((risk) => {
                      const items = foodByRisk[risk];
                      if (!items.length) return null;
                      const meta = RISK_META[risk];
                      return (
                        <div key={risk}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 9,
                              background: meta.bg, border: `1px solid ${meta.border}`,
                              display: "grid", placeItems: "center",
                              fontSize: 13, fontWeight: 900, color: meta.color, flexShrink: 0,
                            }}>
                              {meta.mark}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 15, color: "var(--c-text)" }}>{meta.label}</div>
                              <div style={{ fontSize: 12, color: "var(--c-sub)" }}>{items.length} item{items.length === 1 ? "" : "s"}</div>
                            </div>
                          </div>
                          <div style={{ display: "grid", gap: 6 }}>
                            {items.map(renderItem)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {drinkItems.length > 0 && (
                    <div style={{ marginTop: 8, marginBottom: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowDrinks((v) => !v)}
                        style={{
                          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 16px", borderRadius: 14,
                          background: "var(--c-card)", border: "1px solid var(--c-border)",
                          cursor: "pointer", marginBottom: showDrinks ? 12 : 0,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--c-sub)" }} aria-hidden="true">
                            <path d="M8 2h8l1 7H7L8 2z"/><path d="M7 9c0 6 2 11 5 11s5-5 5-11"/>
                          </svg>
                          <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-text)" }}>Drinks</span>
                          <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{drinkItems.length} item{drinkItems.length === 1 ? "" : "s"}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>
                          {showDrinks ? "Hide ▲" : "Show ▼"}
                        </span>
                      </button>
                      {showDrinks && (
                        <div style={{ display: "grid", gap: 8 }}>
                          {drinkItems.map(renderItem)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
              </>
            )}
          </section>
        )}

        {/* ── Why this rating ── */}
        {!hasNoMenu && (
          <section style={{ marginTop: 32, marginBottom: 28 }}>
            <SectionHeader label="Why this rating" />
            <div style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 16, padding: "14px 16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                {whyThisWorks.map((bullet, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: badge.color, fontWeight: 900, fontSize: 15, lineHeight: "1.5", flexShrink: 0 }}>·</span>
                    <span style={{ fontSize: 15, color: "var(--c-text)", lineHeight: 1.6 }}>{bullet}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5 }}>
                {coverage.trustSignal} · Always confirm with staff before ordering.
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── Order bar ── */}
      {orderedItemIds.size > 0 && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 198,
          background: "var(--c-bg)", borderTop: "1px solid var(--c-border)",
          padding: "10px 16px",
          paddingBottom: "max(10px, calc(env(safe-area-inset-bottom) + 6px))",
        }}>
          <button
            type="button"
            onClick={() => setShowOrderSheet(true)}
            style={{
              width: "100%", height: 54, borderRadius: 16, padding: "0 6px",
              background: "#eb1700", border: "none", cursor: "pointer",
              position: "relative", display: "flex", alignItems: "center",
            }}
          >
            {/* Count badge */}
            <div style={{
              position: "absolute", left: 14,
              width: 30, height: 30, borderRadius: 8,
              background: "rgba(255,255,255,0.22)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#fff" }}>{orderedItemIds.size}</span>
            </div>
            {/* Label */}
            <span style={{
              position: "absolute", left: "50%", transform: "translateX(-50%)",
              fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}>
              View Order
            </span>
            {/* Status pill */}
            <div style={{
              position: "absolute", right: 14,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 999, padding: "4px 10px",
            }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
                {orderedItems.every((i) => i.risk === "likely-safe")
                  ? "All safe ✓"
                  : `${orderedItems.filter((i) => i.risk === "ask").length} to confirm`}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* ── Order sheet backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => setShowOrderSheet(false)}
        style={{
          position: "fixed", inset: 0, zIndex: 199,
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
          opacity: showOrderSheet ? 1 : 0,
          pointerEvents: showOrderSheet ? "auto" : "none",
          transition: "opacity 0.25s ease",
        }}
      />

      {/* ── Order sheet ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your Order"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
          background: "var(--c-card)",
          borderTopLeftRadius: 24, borderTopRightRadius: 24,
          boxShadow: "0 -8px 48px rgba(0,0,0,0.22)",
          transform: showOrderSheet ? "translateY(0)" : "translateY(100%)",
          transition: showOrderSheet
            ? "transform 0.36s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.26s cubic-bezier(0.4,0,1,1)",
          maxHeight: "min(88dvh, calc(100dvh - 52px))",
          display: "flex", flexDirection: "column",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
          <div style={{ width: 40, height: 4, borderRadius: 999, background: "var(--c-border)" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 20px 14px", flexShrink: 0,
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--c-text)", margin: 0, letterSpacing: "-0.02em" }}>
                Your Order
              </h2>
              {orderedItems.length > 0 && (
                <div style={{
                  background: "#eb1700", borderRadius: 999,
                  minWidth: 22, height: 22, padding: "0 6px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                    {orderedItems.length}
                  </span>
                </div>
              )}
            </div>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 2 }}>{restaurant!.name}</div>
          </div>
          <button
            type="button"
            onClick={() => setShowOrderSheet(false)}
            aria-label="Close order"
            style={{
              width: 36, height: 36, borderRadius: 999,
              background: "var(--c-muted)", border: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: "var(--c-sub)", flexShrink: 0,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1 }}>

          {orderedItems.length === 0 ? (
            /* Empty state */
            <div style={{ padding: "52px 24px 40px", textAlign: "center" }}>
              <div style={{
                width: 60, height: 60, borderRadius: 18,
                background: "var(--c-muted)", border: "1px solid var(--c-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 16px",
              }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--c-sub)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>
                Your order is empty
              </div>
              <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.6, maxWidth: 240, margin: "0 auto" }}>
                Tap + on any menu item to build your order
              </div>
            </div>
          ) : (
            <>
              {/* Items section */}
              <div style={{ borderTop: "1px solid var(--c-border)" }}>
                <div style={{ padding: "10px 20px 6px" }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "var(--c-sub)",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    {restaurant?.builderConfig ? "Your Order" : `Your Items · ${orderedItems.length}`}
                  </span>
                </div>

                <div style={{ padding: "0 20px" }}>
                  {restaurant?.builderConfig ? (() => {
                    // Builder restaurants: group into one cohesive meal card
                    const steps = restaurant.builderConfig!.steps;
                    const builderItemIds = new Set(steps.flatMap((step) => {
                      const sec = vm.sections.find((s) => s.sectionName === step.category);
                      return sec?.items.map((i) => i.id) ?? [];
                    }));

                    // Group selected items by step
                    const stepGroups = steps.map((step) => {
                      const sec = vm.sections.find((s) => s.sectionName === step.category);
                      const items = sec?.items.filter((i) => orderedItemIds.has(i.id)) ?? [];
                      return { step, items };
                    }).filter((g) => g.items.length > 0);

                    // The first group's item is the "main" (vessel/base)
                    const [mainGroup, ...modifierGroups] = stepGroups;
                    const mainItem = mainGroup?.items[0];

                    // Items added from regular menu, not through builder
                    const extraItems = orderedItems.filter((i) => !builderItemIds.has(i.id));

                    // Worst risk across all builder items
                    const RISK_RANK2: Record<string, number> = { avoid: 0, ask: 1, unknown: 2, "likely-safe": 3 };
                    const worstItem = [...orderedItems].sort((a, b) => (RISK_RANK2[a.risk] ?? 2) - (RISK_RANK2[b.risk] ?? 2))[0];
                    const worstMeta = worstItem ? RISK_META[worstItem.risk] : null;

                    return (
                      <>
                        {stepGroups.length > 0 && (
                          <div style={{
                            background: "var(--c-muted)", borderRadius: 14,
                            border: "1px solid var(--c-border)",
                            padding: "14px 16px", marginBottom: extraItems.length > 0 ? 10 : 0,
                          }}>
                            {/* Main item row */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: modifierGroups.length > 0 ? 10 : 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                {worstMeta && <div style={{ width: 9, height: 9, borderRadius: "50%", background: worstMeta.color, flexShrink: 0 }} />}
                                <span style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text)" }}>
                                  {mainItem?.name ?? "Custom Order"}
                                </span>
                              </div>
                              {/* Clear all builder items */}
                              <button
                                type="button"
                                onClick={() => orderedItems.filter((i) => builderItemIds.has(i.id)).forEach((i) => toggleOrderItem(i.id))}
                                style={{
                                  fontSize: 12, fontWeight: 700, color: "var(--c-sub)",
                                  background: "none", border: "none", cursor: "pointer", padding: "2px 0",
                                }}
                              >
                                Clear
                              </button>
                            </div>

                            {/* Modifier rows */}
                            {modifierGroups.map(({ step, items }) => (
                              <div key={step.category} style={{
                                display: "flex", alignItems: "baseline", gap: 6,
                                paddingTop: 6, borderTop: "1px solid var(--c-border)",
                                marginTop: 6,
                              }}>
                                <span style={{
                                  fontSize: 11, fontWeight: 800, color: "var(--c-sub)",
                                  textTransform: "uppercase", letterSpacing: "0.05em",
                                  flexShrink: 0, minWidth: 70,
                                }}>
                                  {step.label.replace(/^(Choose your |Choose |Pick |Add )/i, "")}
                                </span>
                                <span style={{ fontSize: 13, color: "var(--c-text)", fontWeight: 600 }}>
                                  {items.map((i) => i.name).join(", ")}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Extra non-builder items as flat list */}
                        {extraItems.map((item, idx) => {
                          const meta = RISK_META[item.risk];
                          return (
                            <div key={item.id} style={{
                              display: "flex", alignItems: "center", gap: 12,
                              padding: "13px 0",
                              borderBottom: idx < extraItems.length - 1 ? "1px solid var(--c-border)" : "none",
                            }}>
                              <div style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                              </div>
                              <button type="button" onClick={() => toggleOrderItem(item.id)} aria-label={`Remove ${item.name}`} style={{ width: 34, height: 34, borderRadius: 999, background: "var(--c-muted)", border: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--c-sub)", flexShrink: 0 }}>
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                              </button>
                            </div>
                          );
                        })}
                      </>
                    );
                  })() : (
                    // Regular restaurants: flat list
                    orderedItems.map((item, idx) => {
                      const meta = RISK_META[item.risk];
                      return (
                        <div key={item.id} style={{
                          display: "flex", alignItems: "center", gap: 12,
                          padding: "13px 0",
                          borderBottom: idx < orderedItems.length - 1 ? "1px solid var(--c-border)" : "none",
                        }}>
                          <div style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                              {item.category && <span style={{ fontSize: 12, color: "var(--c-sub)" }}>{item.category}</span>}
                              <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.badgeBg, borderRadius: 999, padding: "2px 7px" }}>{meta.mark} {meta.label}</span>
                            </div>
                          </div>
                          <button type="button" onClick={() => toggleOrderItem(item.id)} aria-label={`Remove ${item.name} from order`} style={{ width: 34, height: 34, borderRadius: 999, background: "var(--c-muted)", border: "1px solid var(--c-border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--c-sub)", flexShrink: 0 }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Order summary (DoorDash-style breakdown) */}
              <div style={{
                margin: "12px 20px 0",
                borderRadius: 14, overflow: "hidden",
                border: "1px solid var(--c-border)",
              }}>
                <div style={{
                  padding: "10px 16px 8px",
                  background: "var(--c-muted)",
                  borderBottom: "1px solid var(--c-border)",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 800, color: "var(--c-sub)",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                  }}>
                    Order Summary
                  </span>
                </div>
                <div style={{ background: "var(--c-card)", padding: "4px 16px 10px" }}>
                  {[
                    { label: "Total items",       value: `${orderedItems.length}`,                                                                          color: "var(--c-text)"       },
                    ...(orderedItems.filter(i => i.risk === "likely-safe").length > 0 ? [{ label: "Safe to order",      value: `${orderedItems.filter(i => i.risk === "likely-safe").length} ✓`, color: "var(--c-risk-safe)"  }] : []),
                    ...(orderedItems.filter(i => i.risk === "ask").length > 0         ? [{ label: "Need confirmation",  value: `${orderedItems.filter(i => i.risk === "ask").length} ?`,         color: "var(--c-risk-ask)"   }] : []),
                    ...(orderedItems.filter(i => i.risk === "avoid").length > 0       ? [{ label: "Contains allergens", value: `${orderedItems.filter(i => i.risk === "avoid").length} !`,        color: "var(--c-risk-avoid)" }] : []),
                  ].map(({ label, value, color }, i, arr) => (
                    <div key={label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 0",
                      borderBottom: i < arr.length - 1 ? "1px solid var(--c-border)" : "none",
                    }}>
                      <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff questions (like "Special Instructions" in DoorDash) */}
              {(() => {
                const askQuestions = [...new Set(
                  orderedItems.filter((i) => i.risk === "ask").flatMap((i) => i.staffQuestions)
                )];
                if (askQuestions.length === 0) return null;
                return (
                  <div style={{
                    margin: "12px 20px 0",
                    padding: "14px 16px", borderRadius: 14,
                    background: "rgba(251,191,36,0.1)",
                    border: "1px solid rgba(251,191,36,0.28)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <span style={{
                        fontSize: 10, fontWeight: 800, color: "#d97706",
                        textTransform: "uppercase", letterSpacing: "0.1em",
                      }}>
                        Ask staff before ordering
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {askQuestions.slice(0, 6).map((q, i) => (
                        <div key={i} style={{
                          fontSize: 13, color: "var(--c-text)", lineHeight: 1.5,
                          display: "flex", gap: 8, alignItems: "flex-start",
                        }}>
                          <span style={{ color: "#d97706", fontWeight: 800, flexShrink: 0 }}>•</span>
                          <span>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Action buttons */}
              <div style={{ padding: "16px 20px 28px", display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Primary CTA */}
                <button
                  type="button"
                  onClick={copyOrderToClipboard}
                  style={{
                    width: "100%", height: 54, borderRadius: 16,
                    background: orderCopied ? "#16a34a" : "#eb1700",
                    color: "#fff", border: "none",
                    fontSize: 16, fontWeight: 800, letterSpacing: "-0.01em",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    transition: "background 0.2s ease",
                  }}
                >
                  {orderCopied ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Copied to clipboard!
                    </>
                  ) : (
                    <>
                      Copy order to show staff
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                      </svg>
                    </>
                  )}
                </button>
                {/* Secondary: Clear */}
                <button
                  type="button"
                  onClick={() => { setOrderedItemIds(new Set()); setShowOrderSheet(false); }}
                  style={{
                    width: "100%", height: 44,
                    background: "transparent", border: "1.5px solid var(--c-border)",
                    borderRadius: 13, fontSize: 13, fontWeight: 700,
                    color: "var(--c-sub)", cursor: "pointer",
                  }}
                >
                  Clear order
                </button>
              </div>
            </>
          )}
        </div>
      </div>

    </main>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function StatPill({ count, label, color, bg, rgb, active, onClick }: {
  count: number; label: string; color: string; bg: string; rgb: string;
  active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Show ${label.toLowerCase()} items`}
      style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "12px 8px", borderRadius: 14, background: bg,
        border: active ? `2px solid ${color}` : `1.5px solid rgba(${rgb},0.25)`,
        cursor: onClick ? "pointer" : "default",
        boxShadow: count > 0 ? `0 2px 12px rgba(${rgb},0.2)` : "none",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <span style={{ fontWeight: 900, fontSize: 26, color, lineHeight: 1, letterSpacing: "-0.03em" }}>{count}</span>
      <span style={{ fontSize: 13, color, opacity: 0.85, marginTop: 4, fontWeight: 800 }}>{label}</span>
      {onClick && <span style={{ fontSize: 11, color, opacity: 0.55, marginTop: 2, fontWeight: 600 }}>tap to filter</span>}
    </button>
  );
}

const DRINK_KEYWORDS = [
  "beverage", "drink", "coffee", "tea", "frappuccino", "shake", "smoothie",
  "juice", "soda", "beer", "wine", "cocktail", "spirit", "mocktail",
  "latte", "cappuccino", "espresso", "brew", "water", "frozen", "slushie",
];

function isDrinkSection(name: string): boolean {
  const lower = name.toLowerCase();
  return DRINK_KEYWORDS.some((k) => new RegExp(`\\b${k}s?\\b`).test(lower));
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "0 0 14px" }}>
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      {count != null && <span style={{ fontSize: 13, color: "var(--c-sub)" }}>{count}</span>}
    </div>
  );
}

function BestOptionCard({ rec }: { rec: SafeOrderRecommendation }) {
  const { isDark } = useTheme();
  return (
    <div style={{
      background: isDark ? "var(--c-card)" : "#f0fdf4",
      border: isDark ? "1px solid #166534" : "1px solid #bbf7d0",
      borderRadius: 14, padding: "12px 14px",
      display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "var(--c-text)", lineHeight: 1.3 }}>{rec.item.name}</div>
        {rec.item.category && (
          <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 3 }}>{rec.item.category}</div>
        )}
        <div style={{ fontSize: 14, color: "var(--c-sub)", marginTop: 4, lineHeight: 1.5 }}>
          {rec.explanation}
        </div>
        {rec.askNotes.length > 0 && (
          <div style={{ fontSize: 13, color: isDark ? "#86efac" : "#854d0e", marginTop: 5 }}>
            Ask: {rec.askNotes[0]}
          </div>
        )}
      </div>
      <span style={{
        flexShrink: 0, padding: "4px 12px", borderRadius: 999,
        background: isDark ? "#14532d" : "#dcfce7",
        color: isDark ? "#86efac" : "#15803d",
        fontSize: 13, fontWeight: 700,
      }}>
        {rec.reasonLabel}
      </span>
    </div>
  );
}

/** Renders one memory insight card in the Community Knowledge section. */
function MemoryInsightCard({ insight }: { insight: MemoryInsight }) {
  return (
    <div style={{
      background: "var(--c-card)", border: "1px solid var(--c-border)",
      borderRadius: 14, padding: "12px 14px",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text)", lineHeight: 1.3 }}>
          {insight.title}
        </div>
        <div style={{ fontSize: 14, color: "var(--c-sub)", marginTop: 4, lineHeight: 1.5 }}>
          {insight.description}
        </div>
      </div>
      <span style={{
        flexShrink: 0, padding: "3px 9px", borderRadius: 999,
        background: `${insight.badgeColor}20`,
        color: insight.badgeColor,
        border: `1px solid ${insight.badgeColor}40`,
        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
      }}>
        {insight.badgeLabel}
      </span>
    </div>
  );
}

/**
 * Per-item feedback trigger shown below each MenuItemCard.
 * Collapsed by default ("Report" link). Expands to 4 quick-feedback buttons.
 * Collapses to a confirmation message after submission.
 */
function FeedbackRow({
  item,
  userAllergens,
  onSubmit,
}: {
  item: AnalyzedMenuItem;
  userAllergens: AllergenId[];
  onSubmit: (params: Omit<FeedbackParams, "dishName" | "menuItemId">) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ fontSize: 13, color: "#15803d", padding: "6px 4px 8px", textAlign: "right" }}>
        Thanks for your report ✓
      </div>
    );
  }

  if (!expanded) {
    return (
      <div style={{ textAlign: "right" }}>
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--c-sub)", padding: "8px 4px", minHeight: 40,
          }}
        >
          Report
        </button>
      </div>
    );
  }

  // Pre-fill allergen: prefer what caused the flag, fallback to first user allergen
  const defaultAllergen = item.userAllergenHits[0] ?? userAllergens[0];

  return (
    <div style={{
      background: "var(--c-muted)", borderRadius: "0 0 12px 12px",
      padding: "12px 14px 14px", marginTop: -2,
      border: "1px solid var(--c-border)", borderTop: "none",
    }}>
      <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 10, fontWeight: 600 }}>
        What happened with <strong style={{ color: "var(--c-text)" }}>{item.name}</strong>?
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_FEEDBACK.map((opt) => (
          <button
            key={opt.type}
            onClick={() => {
              onSubmit({
                type:               opt.type,
                allergen:           defaultAllergen,
                originalRisk:       item.risk,
                originalConfidence: item.confidence,
              });
              setSubmitted(true);
            }}
            style={{
              padding: "9px 14px", borderRadius: 10,
              border: "1px solid var(--c-border)",
              background: "var(--c-card)", color: "var(--c-text)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44,
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--c-sub)", padding: "9px 8px", minHeight: 44,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
