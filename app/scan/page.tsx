"use client";

import Link from "next/link";
import { SettingsButton } from "@/components/SettingsButton";
import { recordScan } from "@/lib/scanHistory";
import { useEffect, useMemo, useRef, useState } from "react";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { buildScanInput } from "@/lib/buildScanInput";
import { useAuth } from "@/lib/authContext";
import { analyzeMenu } from "@/lib/engine/analyzerPipeline";
import { AllergySelector } from "@/components/AllergySelector";
import { fetchCommunityScores, getCommunitySignal, submitDishReport, normalizeDish } from "@/lib/community";
import type { CommunityScoreMap } from "@/lib/community";
import type { Confidence, Row, AvoidRow, Results, LearnedRule, SourceType, MenuSource, RawMenuItem } from "@/lib/types";
import type { AllergenId } from "@/lib/types";
import type { AnalyzedItem } from "@/lib/engine/types";

type EnrichedMenuSource = MenuSource & { fullItems: RawMenuItem[] };

// Auto-derived from MOCK_RESTAURANTS — updates automatically when new restaurants are added
const ALL_MENUS: EnrichedMenuSource[] = MOCK_RESTAURANTS.map((r) => ({
  id: r.id,
  restaurant: r.name,
  category: r.cuisine,
  items: r.menuItems.map((item) => item.name),
  fullItems: r.menuItems,
}));

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

type MenuSourceKey = "preloaded" | "url" | "manual";

const STORAGE_LEARNED = "allegeats_learned_rules";

function makeId() { return Math.random().toString(36).slice(2) + "_" + Date.now().toString(36); }
function toSourceType(s: MenuSourceKey): SourceType {
  return s === "preloaded" ? "verified-dataset" : s === "url" ? "scraped" : "user-input";
}

export default function ScanPage() {
  const { allergens: profileAllergens } = useAuth();

  const [step, setStep]                         = useState<1 | 2 | 3>(1);
  const [activeInput, setActiveInput]           = useState<"preloaded" | "url" | "manual" | null>(null);
  const [loadedRestaurant, setLoadedRestaurant] = useState<string | null>(null);
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenId[]>([]);
  const [menu, setMenu]                         = useState("");
  const [selectedMenuId, setSelectedMenuId]     = useState(ALL_MENUS[0]?.id ?? "");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [analyzed, setAnalyzed]                 = useState(false);
  const [menuUrl, setMenuUrl]                   = useState("");
  const [menuSource, setMenuSource]             = useState<MenuSourceKey>("manual");
  const [isFetching, setIsFetching]             = useState(false);
  const [fetchError, setFetchError]             = useState<string | null>(null);
  const [isScanning, setIsScanning]             = useState(false);
  const [photoPreview, setPhotoPreview]         = useState<string | null>(null);
  const [scanStep, setScanStep]                 = useState(0); // 0=idle 1=uploading 2=reading 3=analyzing
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [learnedRules, setLearnedRules]         = useState<LearnedRule[]>([]);
  const [communityScores, setCommunityScores]   = useState<CommunityScoreMap>(new Map());
  // Track which dishes the user has already reported: "dish_normalized::allergen" → outcome
  const [myReports, setMyReports]               = useState<Map<string, string>>(new Map());

  // Load from auth profile, then localStorage fallback
  useEffect(() => {
    if (profileAllergens.length > 0) {
      setSelectedAllergens(profileAllergens);
    }
  }, [profileAllergens]);

  useEffect(() => {
    try { const r = localStorage.getItem(STORAGE_LEARNED); if (r) setLearnedRules(JSON.parse(r)); } catch { /* */ }
  }, []);

  // Pick up camera scan result passed from home page via sessionStorage
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("allegeats_camera_scan");
      if (raw) {
        sessionStorage.removeItem("allegeats_camera_scan");
        const lines: string[] = JSON.parse(raw);
        if (lines.length > 0) {
          setMenu(lines.join("\n"));
          setMenuSource("manual");
          setAnalyzed(true);
          setStep(3);
        }
      }
    } catch { /* */ }
  }, []);

  function persistLearned(next: LearnedRule[]) { setLearnedRules(next); localStorage.setItem(STORAGE_LEARNED, JSON.stringify(next)); }

  function upsertLearnedRule(outcome: "safe" | "avoid" | "unsure", item: string, allergen?: string) {
    const n = normalize(item);
    persistLearned([{ id: makeId(), item, normalizedItem: n, outcome, allergen, createdAt: Date.now() }, ...learnedRules.filter((r) => r.normalizedItem !== n)]);
  }
  function findLearnedRule(item: string) { return learnedRules.find((r) => r.normalizedItem === normalize(item)); }

  const avoidAllergens = useMemo(() => selectedAllergens as string[], [selectedAllergens]);
  const menuItems = useMemo(() => menu.split("\n").map((m) => m.trim()).filter(Boolean), [menu]);

  // Fetch community scores whenever results are ready
  useEffect(() => {
    if (step !== 3 || menuItems.length === 0 || selectedAllergens.length === 0) return;
    fetchCommunityScores(menuItems, selectedAllergens as string[], loadedRestaurant ?? undefined)
      .then(setCommunityScores)
      .catch(() => { /* community scores are non-critical — fail silently */ });
  }, [step, menuItems, selectedAllergens, loadedRestaurant]);

  // Record scan to history when results are first ready
  useEffect(() => {
    if (step !== 3 || menuItems.length === 0) return;
    recordScan({
      restaurantName: loadedRestaurant ?? "Manual scan",
      source:         menuSource,
      totalItems:     menuItems.length,
      safeCount:      results.safe.length,
      askCount:       results.ask.length,
      avoidCount:     results.avoid.length,
      allergens:      selectedAllergens as string[],
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]); // fire once when step becomes 3

  const filteredMenus = useMemo(() => {
    const q = normalize(restaurantSearch);
    return q ? ALL_MENUS.filter((m) => normalize(`${m.restaurant} ${m.category}`).includes(q)) : ALL_MENUS;
  }, [restaurantSearch]);

  useEffect(() => {
    if (filteredMenus.length && !filteredMenus.some((m) => m.id === selectedMenuId)) setSelectedMenuId(filteredMenus[0].id);
  }, [filteredMenus, selectedMenuId]);

  const selectedMenu = useMemo(() =>
    filteredMenus.find((m) => m.id === selectedMenuId) ?? ALL_MENUS.find((m) => m.id === selectedMenuId) ?? null,
    [filteredMenus, selectedMenuId]
  );

  async function fetchMenuFromUrl() {
    setFetchError(null);
    const url = menuUrl.trim();
    if (!url) { setFetchError("Paste a menu URL first."); return; }
    setIsFetching(true);
    try {
      const res = await fetch("/api/fetch-menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json();
      if (!res.ok) { setFetchError(data?.error ?? "Fetch failed"); return; }
      const lines: string[] = data.menuLines ?? [];
      if (!lines.length) { setFetchError("Couldn't detect menu lines on that page."); return; }
      setMenu(lines.join("\n")); setMenuSource("url"); setAnalyzed(false); setActiveInput(null);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : "Network error"); }
    finally { setIsFetching(false); }
  }

  async function handlePhotoScan(file: File) {
    setIsScanning(true);
    setScanStep(1);
    setFetchError(null);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("image", file);
      setScanStep(2);
      const res = await fetch("/api/scan-photo", { method: "POST", body: fd });
      setScanStep(3);
      const data = await res.json();
      if (!res.ok) { setFetchError(data?.error ?? "Scan failed"); setPhotoPreview(null); return; }
      const lines: string[] = data.menuLines ?? [];
      if (!lines.length) { setFetchError("Couldn't read any menu items from that photo."); setPhotoPreview(null); return; }
      setMenu(lines.join("\n")); setMenuSource("manual"); setAnalyzed(false); setActiveInput(null);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : "Network error"); setPhotoPreview(null); }
    finally { setIsScanning(false); setScanStep(0); }
  }

  function loadSelectedRestaurant() {
    if (!selectedMenu) return;
    setMenu(buildScanInput(selectedMenu)); setMenuSource("preloaded");
    setMenuUrl(selectedMenu.url ?? ""); setAnalyzed(false); setFetchError(null);
    setLoadedRestaurant(selectedMenu.restaurant);
    setActiveInput(null);
  }
  function clearMenu() { setMenu(""); setMenuUrl(""); setMenuSource("manual"); setAnalyzed(false); setFetchError(null); setLoadedRestaurant(null); setPhotoPreview(null); setStep(2); }

  async function copyText(text: string) { try { await navigator.clipboard.writeText(text); } catch { /* */ } }
  function questionsText(item: string, qs: string[]) { return `Hi! I have food allergies (${avoidAllergens.join(", ") || "none"}).\n\nItem: "${item}"\n\n${qs.map((q) => `• ${q}`).join("\n")}`; }

  /** Map engine confidence to legacy Confidence type */
  function toConfidence(c: AnalyzedItem["confidence"]): Confidence {
    if (c === "high") return "High";
    if (c === "medium") return "Medium";
    return "Low";
  }

  const results: Results = useMemo(() => {
    const safe: Row[] = [], ask: Row[] = [], avoid: AvoidRow[] = [];
    const cuisineContext = selectedMenu?.category ?? "";
    const srcType = toSourceType(menuSource);

    // For preloaded restaurants, build a map of official allergen data
    const officialMap = new Map<string, string[]>();
    if (menuSource === "preloaded" && selectedMenu) {
      for (const fi of (selectedMenu as EnrichedMenuSource).fullItems) {
        if (fi.allergens?.length) officialMap.set(fi.name, fi.allergens);
      }
    }

    // Run the new engine on all items at once
    const engineResult = analyzeMenu(menuItems, selectedAllergens, cuisineContext, srcType);

    for (const analyzed of engineResult.items) {
      const item = analyzed.raw;

      // Merge official allergen data for preloaded restaurants
      const officialAllergens = officialMap.get(analyzed.name) ?? [];
      const allDetected = [...new Set([...(analyzed.allDetectedAllergens as string[]), ...officialAllergens])];

      // Signals → legacy hit/inferred terms
      const hits = [...new Set(analyzed.signals.map((s) => s.trigger))];
      const inferredAllergens = analyzed.signals
        .filter((s) => ["dish", "sauce", "cuisine", "prep"].includes(s.source))
        .map((s) => s.allergen as string);
      const inferredReasons = [...new Set(
        analyzed.signals
          .filter((s) => s.source !== "direct" && s.source !== "synonym")
          .map((s) => s.reason)
      )];

      // Learned rule overrides engine output
      const learned = findLearnedRule(item);
      if (learned) {
        const learnedReason =
          learned.outcome === "safe"   ? "Previously confirmed safe by you"
          : learned.outcome === "unsure" ? "Previously marked unsure"
          : `Previously confirmed to contain ${learned.allergen ?? "an allergen"}`;
        const lc: Confidence = learned.outcome === "safe" ? "Medium" : "High";
        if (learned.outcome === "safe") {
          safe.push({ item, detected: allDetected, hits, inferredAllergens, inferredReasons: [learnedReason], confidence: lc, staffQuestions: [], learned: true });
          continue;
        }
        if (learned.outcome === "unsure") {
          ask.push({ item, detected: allDetected, hits, inferredAllergens, inferredReasons: [learnedReason], confidence: lc, staffQuestions: analyzed.staffQuestions, learned: true });
          continue;
        }
        avoid.push({ item, detected: allDetected, hits, hitsAllergens: learned.allergen ? [learned.allergen] : ["avoid"], inferredAllergens, inferredReasons: [learnedReason], confidence: lc, staffQuestions: analyzed.staffQuestions, learned: true });
        continue;
      }

      // Check if official allergens (not in engine output) hit user profile
      const officialHits = officialAllergens.filter((a) => avoidAllergens.includes(a));
      const conf = toConfidence(analyzed.confidence);

      if (analyzed.risk === "avoid" || officialHits.length > 0) {
        const hitsAllergens = officialHits.length > 0
          ? [...new Set([...analyzed.matchedAllergens, ...officialHits])]
          : analyzed.matchedAllergens as string[];
        avoid.push({ item, detected: allDetected, hits, hitsAllergens, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: analyzed.staffQuestions });
      } else if (analyzed.risk === "ask") {
        ask.push({ item, detected: allDetected, hits, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: analyzed.staffQuestions });
      } else {
        safe.push({ item, detected: allDetected, hits, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: [] });
      }
    }
    return { safe, ask, avoid };
  }, [menuItems, avoidAllergens, selectedAllergens, learnedRules, menuSource, selectedMenu]);

function StaffBlock({ row }: { row: Row }) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 6 }}>Ask staff</div>
        <div style={{ display: "grid", gap: 4 }}>{row.staffQuestions.slice(0, 3).map((q, i) => <div key={i} style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>• {q}</div>)}</div>
        <button onClick={() => copyText(questionsText(row.item, row.staffQuestions))} style={{ width: "100%", marginTop: 10, padding: "11px 14px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Copy Questions</button>
      </div>
    );
  }

  function LearnBlock({ row }: { row: Row }) {
    return (
      <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button onClick={() => upsertLearnedRule("safe", row.item)} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark safe</button>
        <button onClick={() => upsertLearnedRule("unsure", row.item)} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #f4dd8d", background: "#fff7db", color: "#854d0e", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Mark unsure</button>
        {avoidAllergens.map((a) => <button key={a} onClick={() => upsertLearnedRule("avoid", row.item, a)} style={{ padding: "8px 12px", borderRadius: 999, border: "1px solid #f3c5c0", background: "#fff1f0", color: "#b91c1c", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Contains {a}</button>)}
      </div>
    );
  }

  function CommunityBadge({ item }: { item: string }) {
    const signal = getCommunitySignal(item, avoidAllergens, communityScores);
    if (signal.total === 0) return null;
    const dominantlySafe = signal.safeTotal > signal.reactionTotal && signal.safeTotal >= 3;
    const hasReactions = signal.reactionTotal > 0;
    return (
      <div style={{
        marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 999,
        background: dominantlySafe ? "#dcfce7" : hasReactions ? "#fee2e2" : "#f3f4f6",
        border: `1px solid ${dominantlySafe ? "#bbf7d0" : hasReactions ? "#f3c5c0" : "#e5e7eb"}`,
        fontSize: 11, fontWeight: 700,
        color: dominantlySafe ? "#15803d" : hasReactions ? "#b91c1c" : "#6b7280",
      }}>
        👥 {dominantlySafe
          ? `${signal.safeTotal} ate safely`
          : hasReactions
            ? `${signal.reactionTotal} had reaction${signal.reactionTotal > 1 ? "s" : ""}`
            : `${signal.total} report${signal.total > 1 ? "s" : ""}`}
      </div>
    );
  }

  function ReportBlock({ item }: { item: string }) {
    const norm = normalizeDish(item);
    // Use first allergen as the report key; report covers all active allergens
    const allergen = avoidAllergens[0] ?? "unknown";
    const key = `${norm}::${allergen}`;
    const alreadyReported = myReports.get(key);

    async function report(outcome: "safe" | "reaction") {
      // Optimistic local update
      const next = new Map(myReports);
      next.set(key, outcome);
      setMyReports(next);

      // Submit for each allergen
      for (const a of (avoidAllergens.length > 0 ? avoidAllergens : [allergen])) {
        await submitDishReport({
          dishName: item,
          restaurantName: loadedRestaurant ?? undefined,
          allergen: a,
          outcome,
        });
      }

      // Refresh community scores
      const updated = await fetchCommunityScores(menuItems, selectedAllergens as string[], loadedRestaurant ?? undefined);
      setCommunityScores(updated);
    }

    if (alreadyReported) {
      return (
        <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280", fontWeight: 600 }}>
          {alreadyReported === "safe" ? "✓ You reported this safe" : "⚠ You reported a reaction"} · <button onClick={() => { const n = new Map(myReports); n.delete(key); setMyReports(n); }} style={{ background: "none", border: "none", color: "#9ca3af", fontSize: 11, cursor: "pointer", padding: 0 }}>Undo</button>
        </div>
      );
    }

    return (
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600 }}>Did you eat this?</span>
        <button
          onClick={() => report("safe")}
          style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#15803d", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
        >✓ Safe</button>
        <button
          onClick={() => report("reaction")}
          style={{ padding: "5px 10px", borderRadius: 999, border: "1px solid #f3c5c0", background: "#fff1f0", color: "#b91c1c", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
        >⚠ Reaction</button>
      </div>
    );
  }

  const SECTION_META = {
    safe:  { label: "Likely Safe",  subtitle: "No allergen signals found for your profile", mark: "✓", bg: "#f0fdf4", border: "#bbf7d0", textColor: "#15803d" },
    ask:   { label: "Check First",  subtitle: "May contain your allergens — verify with staff", mark: "?", bg: "#fff7db", border: "#f4dd8d", textColor: "#854d0e" },
    avoid: { label: "Avoid",        subtitle: "Contains or likely contains your allergens", mark: "!", bg: "#fff1f0", border: "#f3c5c0", textColor: "#b91c1c" },
  };

  function DishName({ item }: { item: string }) {
    const parts = item.split("—");
    const name = parts[0].trim();
    const desc = parts.length > 1 ? parts.slice(1).join("—").trim() : null;
    return (
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#111", lineHeight: 1.3 }}>{name}</div>
        {desc && <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
    );
  }

  function TriggerPills({ hits, color }: { hits: string[]; color: string }) {
    if (!hits.length) return null;
    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
        {hits.slice(0, 6).map((h) => (
          <span key={h} style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: `${color}22`, color, border: `1px solid ${color}44` }}>
            {h}
          </span>
        ))}
      </div>
    );
  }

  const SAFE_COLLAPSE_LIMIT = 3;

  function ResultSection({ tone, rows }: { tone: "safe" | "ask" | "avoid"; rows: Array<Row | AvoidRow> }) {
    const [safeExpanded, setSafeExpanded] = useState(false);
    if (!rows.length) return null;
    const meta = SECTION_META[tone];
    const isSafe = tone === "safe";
    const visibleRows = isSafe && !safeExpanded ? rows.slice(0, SAFE_COLLAPSE_LIMIT) : rows;
    const hiddenCount = rows.length - SAFE_COLLAPSE_LIMIT;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, display: "grid", placeItems: "center", fontSize: 14, fontWeight: 900, color: meta.textColor }}>{meta.mark}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{meta.label} <span style={{ fontWeight: 600, color: "#6b7280" }}>({rows.length})</span></div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{meta.subtitle}</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {visibleRows.map((r, i) => (
            <div key={i} style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <DishName item={r.item} />
                {r.learned && <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 999, background: "#e0e7ff", color: "#4338ca", flexShrink: 0 }}>YOUR HISTORY</span>}
              </div>
              <CommunityBadge item={r.item} />
              {tone === "avoid" && "hitsAllergens" in r && (
                <>
                  <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 8, fontWeight: 700 }}>Contains: {r.hitsAllergens.join(", ")}</div>
                  <TriggerPills hits={r.hits} color="#b91c1c" />
                </>
              )}
              {tone === "ask" && r.inferredReasons.length > 0 && (
                <>
                  <div style={{ fontSize: 12, color: "#854d0e", marginTop: 6, lineHeight: 1.4 }}>Why: {r.inferredReasons.join(" · ")}</div>
                  <TriggerPills hits={r.hits} color="#854d0e" />
                </>
              )}
              {tone === "safe" && r.hits.length > 0 && (
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 6 }}>Scanned for: {r.hits.slice(0, 4).join(", ")}{r.hits.length > 4 ? "…" : ""}</div>
              )}
              {tone !== "safe" && <StaffBlock row={r} />}
              {tone === "ask" && <LearnBlock row={r} />}
              <ReportBlock item={r.item} />
            </div>
          ))}
        </div>
        {isSafe && hiddenCount > 0 && (
          <button
            onClick={() => setSafeExpanded((v) => !v)}
            style={{
              marginTop: 8, width: "100%", padding: "11px 0",
              background: "none", border: "1.5px solid var(--c-border)",
              borderRadius: 12, fontSize: 13, fontWeight: 700,
              color: "var(--c-sub)", cursor: "pointer",
            }}
          >
            {safeExpanded ? `Show fewer` : `Show all ${rows.length} safe items →`}
          </button>
        )}
      </div>
    );
  }

  const menuReady = menuItems.length > 0;

  // Step labels for the indicator
  const STEPS = ["Your Allergies", "Load Menu", "Results"];

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 40 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--c-hdr)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--c-border)", padding: "12px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {step > 1 ? (
            <button onClick={() => { if (step === 3) { clearMenu(); } else { setStep((s) => (s - 1) as 1 | 2 | 3); } }} style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>← Back</button>
          ) : (
            <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Home</Link>
          )}
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Menu Scan</span>
          <SettingsButton />
        </div>
      </div>

      {/* Step indicator */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0", display: "flex", alignItems: "center", gap: 0 }}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} style={{ display: "flex", alignItems: "center", flex: i < 2 ? 1 : "none" }}>
              <button
                onClick={() => { if (done) setStep(n as 1 | 2 | 3); }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  background: "none", border: "none", cursor: done ? "pointer" : "default", padding: 0,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 900,
                  background: done ? "#22c55e" : active ? "#eb1700" : "var(--c-muted)",
                  color: done || active ? "#fff" : "var(--c-sub)",
                  transition: "background 0.2s",
                }}>
                  {done ? "✓" : n}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: active ? "var(--c-text)" : "var(--c-sub)", whiteSpace: "nowrap" }}>{label}</div>
              </button>
              {i < 2 && (
                <div style={{ flex: 1, height: 2, background: done ? "#22c55e" : "var(--c-border)", margin: "0 6px 16px", transition: "background 0.2s" }} />
              )}
            </div>
          );
        })}
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px 0" }}>
        <div style={{ display: "grid", gap: 14 }}>

          {/* ── Step 1: Choose allergens ── */}
          {step === 1 && (
            <>
              <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text)", marginBottom: 4 }}>What are you allergic to?</div>
                <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 16 }}>We&apos;ll flag anything that could be a problem for you.</div>
                <AllergySelector selected={selectedAllergens} onChange={setSelectedAllergens} limit={4} />
              </div>
              <button
                onClick={() => setStep(2)}
                style={{ padding: "15px 0", borderRadius: 14, border: "none", background: "#eb1700", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" }}
              >
                Continue →
              </button>
              {selectedAllergens.length === 0 && (
                <button
                  onClick={() => setStep(2)}
                  style={{ padding: "12px 0", borderRadius: 14, border: "none", background: "none", color: "var(--c-sub)", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  Skip — I just want to browse
                </button>
              )}
            </>
          )}

          {/* ── Step 2: Load menu ── */}
          {step === 2 && (
            <>
              {/* ── Primary CTA: Camera scan ── */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                disabled={isScanning}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoScan(f); e.target.value = ""; }}
                style={{ display: "none" }}
              />
              <button
                onClick={() => { if (!isScanning) cameraInputRef.current?.click(); }}
                disabled={isScanning}
                style={{
                  width: "100%", padding: "20px", textAlign: "left",
                  background: isScanning ? "var(--c-card)" : "#eb1700",
                  border: `1.5px solid ${isScanning ? "var(--c-border)" : "#eb1700"}`,
                  borderRadius: 20, cursor: isScanning ? "default" : "pointer",
                  boxShadow: isScanning ? "none" : "0 4px 14px rgba(235,23,0,0.25)",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36 }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={isScanning ? "var(--c-text)" : "#fff"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: isScanning ? "var(--c-text)" : "#fff" }}>
                      {isScanning ? "Scanning menu…" : "Scan Menu with Camera"}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 2, color: isScanning ? "var(--c-sub)" : "rgba(255,255,255,0.82)" }}>
                      {isScanning
                        ? (["Uploading photo", "Reading menu items", "Extracting ingredients"][scanStep - 1] ?? "Processing…")
                        : "Point your camera at any menu for instant analysis"}
                    </div>
                  </div>
                  {!isScanning && <span style={{ fontSize: 22, color: "#fff", flexShrink: 0 }}>→</span>}
                </div>
                {isScanning && (
                  <div style={{ marginTop: 14, display: "flex", gap: 6 }}>
                    {["Upload", "Read", "Extract"].map((label, i) => (
                      <div key={i} style={{ flex: 1 }}>
                        <div style={{ height: 3, borderRadius: 999, background: scanStep > i ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.25)", transition: "background 0.4s" }} />
                        <div style={{ fontSize: 10, fontWeight: 700, marginTop: 3, textAlign: "center", color: scanStep > i ? "var(--c-text)" : "var(--c-sub)" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </button>
              {photoPreview && isScanning && (
                <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--c-border)" }}>
                  <img src={photoPreview} alt="Menu preview" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
                </div>
              )}
              {fetchError && !isScanning && (
                <div style={{ padding: "10px 14px", borderRadius: 12, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>{fetchError}</div>
              )}

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
                <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>or choose another way</span>
                <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
              </div>

              {/* ── Secondary options ── */}
              <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 20, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                {/* Option: Load a Restaurant */}
                <div style={{ borderBottom: `1px solid ${activeInput === "preloaded" ? "#eb1700" : "var(--c-border)"}`, transition: "border-color 0.15s" }}>
                  <button
                    onClick={() => setActiveInput(v => v === "preloaded" ? null : "preloaded")}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: activeInput === "preloaded" ? "#eb1700" : "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "background 0.15s" }}>🏪</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Load a Restaurant</div>
                      <div style={{ fontSize: 12, color: "var(--c-sub)" }}>Pick from our database</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--c-sub)" }}>{activeInput === "preloaded" ? "▲" : "▼"}</div>
                  </button>
                  {activeInput === "preloaded" && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <input
                        value={restaurantSearch}
                        onChange={(e) => setRestaurantSearch(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && selectedMenu) loadSelectedRestaurant(); }}
                        placeholder="Search restaurants…"
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 10, color: "var(--c-text)", background: "var(--c-input)", outline: "none", marginBottom: 8 }}
                      />
                      <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        disabled={!filteredMenus.length}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 10, color: "var(--c-text)", background: "var(--c-input)", outline: "none", marginBottom: 8 }}
                      >
                        {filteredMenus.length ? filteredMenus.map((m) => <option key={m.id} value={m.id}>{m.restaurant} — {m.category}</option>) : <option value="">No restaurants found</option>}
                      </select>
                      <button
                        onClick={loadSelectedRestaurant}
                        disabled={!selectedMenu}
                        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: selectedMenu ? "#eb1700" : "#e5e7eb", color: selectedMenu ? "#fff" : "#9ca3af", fontWeight: 800, fontSize: 14, cursor: selectedMenu ? "pointer" : "not-allowed" }}
                      >
                        Load Menu
                      </button>
                    </div>
                  )}
                </div>

                {/* Option: Fetch From URL */}
                <div style={{ borderBottom: `1px solid ${activeInput === "url" ? "#eb1700" : "var(--c-border)"}`, transition: "border-color 0.15s" }}>
                  <button
                    onClick={() => setActiveInput(v => v === "url" ? null : "url")}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: activeInput === "url" ? "#eb1700" : "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "background 0.15s" }}>🔗</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Fetch From URL</div>
                      <div style={{ fontSize: 12, color: "var(--c-sub)" }}>Paste a restaurant menu link</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--c-sub)" }}>{activeInput === "url" ? "▲" : "▼"}</div>
                  </button>
                  {activeInput === "url" && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <input
                        value={menuUrl}
                        onChange={(e) => setMenuUrl(e.target.value)}
                        placeholder="https://restaurant.com/menu"
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 10, color: "var(--c-text)", background: "var(--c-input)", outline: "none", marginBottom: 8 }}
                      />
                      <button
                        onClick={fetchMenuFromUrl}
                        disabled={isFetching}
                        style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: isFetching ? "#9ca3af" : "#eb1700", color: "#fff", fontWeight: 800, fontSize: 14, cursor: isFetching ? "not-allowed" : "pointer" }}
                      >
                        {isFetching ? "Fetching…" : "Fetch Menu"}
                      </button>
                      {fetchError && <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>{fetchError}</div>}
                    </div>
                  )}
                </div>

                {/* Option: Paste Menu Text */}
                <div>
                  <button
                    onClick={() => setActiveInput(v => v === "manual" ? null : "manual")}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: activeInput === "manual" ? "#eb1700" : "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={activeInput === "manual" ? "#fff" : "var(--c-sub)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                      </svg>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>Paste Menu Text</div>
                      <div style={{ fontSize: 12, color: "var(--c-sub)" }}>Type or paste items manually</div>
                    </div>
                    <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--c-sub)" }}>{activeInput === "manual" ? "▲" : "▼"}</div>
                  </button>
                  {activeInput === "manual" && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <textarea
                        value={menu}
                        onChange={(e) => { setMenu(e.target.value); setMenuSource("manual"); setLoadedRestaurant(null); }}
                        placeholder="Paste menu items, one per line…"
                        style={{ width: "100%", boxSizing: "border-box", minHeight: 140, resize: "vertical", border: "1px solid var(--c-border)", background: "var(--c-input)", color: "var(--c-text)", borderRadius: 10, padding: 12, lineHeight: 1.6, outline: "none" }}
                      />
                      <div style={{ fontSize: 11, color: "var(--c-sub)", marginTop: 4, textAlign: "right" }}>{menuItems.length} items</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Ready to analyze */}
              {menuReady && (
                <>
                  {loadedRestaurant && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>✓</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{loadedRestaurant}</span>
                        <span style={{ fontSize: 12, color: "var(--c-sub)" }}>— {menuItems.length} items</span>
                      </div>
                      <button onClick={clearMenu} style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear</button>
                    </div>
                  )}
                  {!loadedRestaurant && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 12, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>✓</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{menuItems.length} items ready</span>
                      </div>
                      <button onClick={clearMenu} style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", background: "none", border: "none", cursor: "pointer", padding: 0 }}>Clear</button>
                    </div>
                  )}
                  <button
                    onClick={() => { setAnalyzed(true); setStep(3); }}
                    style={{ padding: "15px 0", borderRadius: 14, border: "none", background: "#eb1700", color: "#fff", fontSize: 15, fontWeight: 900, cursor: "pointer" }}
                  >
                    Analyze Menu →
                  </button>
                </>
              )}
            </>
          )}

          {/* ── Step 3: Results ── */}
          {step === 3 && analyzed && (
            <>
              {/* Summary bar */}
              <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>
                    {loadedRestaurant ? loadedRestaurant : "Scan Results"} — {menuItems.length} items
                  </div>
                  {communityScores.size > 0 && (
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280" }}>👥 Community data</div>
                  )}
                </div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--c-muted)", overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${menuItems.length ? (results.safe.length / menuItems.length) * 100 : 0}%`, background: "#22c55e", transition: "width 0.5s" }} />
                  <div style={{ width: `${menuItems.length ? (results.ask.length  / menuItems.length) * 100 : 0}%`, background: "#f59e0b", transition: "width 0.5s" }} />
                  <div style={{ width: `${menuItems.length ? (results.avoid.length / menuItems.length) * 100 : 0}%`, background: "#ef4444", transition: "width 0.5s" }} />
                </div>
                <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                  <SummaryPill count={results.safe.length}  label="Likely Safe" color="#15803d" bg="#f0fdf4" />
                  <SummaryPill count={results.ask.length}   label="Ask Staff"   color="#854d0e" bg="#fefce8" />
                  <SummaryPill count={results.avoid.length} label="Avoid"       color="#b91c1c" bg="#fff1f0" />
                </div>
              </div>

              <ResultSection tone="avoid" rows={results.avoid} />
              <ResultSection tone="ask"   rows={results.ask} />
              <ResultSection tone="safe"  rows={results.safe} />

              <button
                onClick={clearMenu}
                style={{ padding: "14px 0", borderRadius: 14, border: "1px solid var(--c-border)", background: "var(--c-card)", color: "var(--c-text)", fontSize: 14, fontWeight: 800, cursor: "pointer" }}
              >
                ← Scan Another Menu
              </button>
            </>
          )}

        </div>
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
