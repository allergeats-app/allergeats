"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { buildScanInput } from "@/lib/buildScanInput";
import { useAuth } from "@/lib/authContext";
import { analyzeMenu } from "@/lib/engine/analyzerPipeline";
import { AllergySelector } from "@/components/AllergySelector";
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
  const [learnedRules, setLearnedRules]         = useState<LearnedRule[]>([]);

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
    setFetchError(null);
    setPhotoPreview(URL.createObjectURL(file));
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/scan-photo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setFetchError(data?.error ?? "Scan failed"); setPhotoPreview(null); return; }
      const lines: string[] = data.menuLines ?? [];
      if (!lines.length) { setFetchError("Couldn't read any menu items from that photo."); setPhotoPreview(null); return; }
      setMenu(lines.join("\n")); setMenuSource("manual"); setAnalyzed(false); setActiveInput(null);
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : "Network error"); setPhotoPreview(null); }
    finally { setIsScanning(false); }
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

  function confBadge(c: Confidence) {
    const styles: Record<Confidence, { bg: string; color: string; border: string }> = {
      High:   { bg: "#fff1f0", color: "#b91c1c", border: "#f3c5c0" },
      Medium: { bg: "#fff7db", color: "#854d0e", border: "#f4dd8d" },
      Low:    { bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
    };
    const s = styles[c];
    return <span style={{ whiteSpace: "nowrap", fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{c}</span>;
  }

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

  const SECTION_META = {
    safe:  { label: "Likely Safe", mark: "+", bg: "#f0fdf4", border: "#bbf7d0", textColor: "#15803d" },
    ask:   { label: "Ask Staff",   mark: "?", bg: "#fff7db", border: "#f4dd8d", textColor: "#854d0e" },
    avoid: { label: "Avoid",       mark: "!", bg: "#fff1f0", border: "#f3c5c0", textColor: "#b91c1c" },
  };

  function ResultSection({ tone, rows }: { tone: "safe" | "ask" | "avoid"; rows: Array<Row | AvoidRow> }) {
    if (!rows.length) return null;
    const meta = SECTION_META[tone];
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900, color: meta.textColor }}>{meta.mark}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>{meta.label}</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>{rows.length} item{rows.length === 1 ? "" : "s"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ background: meta.bg, border: `1px solid ${meta.border}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#111", lineHeight: 1.3 }}>{r.item}</div>
                {confBadge(r.confidence)}
              </div>
              {r.learned && <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4, fontWeight: 700 }}>From your history</div>}
              {tone === "ask" && r.inferredReasons.length > 0 && (
                <div style={{ fontSize: 12, color: "#854d0e", marginTop: 6, lineHeight: 1.4 }}>Why: {r.inferredReasons.join(" · ")}</div>
              )}
              {tone === "avoid" && "hitsAllergens" in r && (
                <div style={{ fontSize: 12, color: "#b91c1c", marginTop: 6, fontWeight: 700 }}>Contains: {r.hitsAllergens.join(", ")}</div>
              )}
              {tone !== "safe" && <StaffBlock row={r} />}
              {tone === "ask" && <LearnBlock row={r} />}
            </div>
          ))}
        </div>
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
          <span style={{ fontSize: 13, color: "var(--c-sub)" }}>Step {step} of 3</span>
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
                <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 16 }}>We'll flag anything that could be a problem for you.</div>
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
              <div style={{ background: "var(--c-card)", border: "1px solid var(--c-border)", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text)", marginBottom: 4 }}>How do you want to scan?</div>
                <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 16 }}>Choose a restaurant, paste a link, or type the menu yourself.</div>

                {/* Option: Take a Photo */}
                <label style={{ display: "block", border: `1.5px solid ${isScanning ? "#eb1700" : "var(--c-border)"}`, borderRadius: 14, marginBottom: 10, overflow: "hidden", cursor: isScanning ? "default" : "pointer", transition: "border-color 0.15s" }}>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={isScanning}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoScan(f); e.target.value = ""; }}
                    style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: isScanning ? "#eb1700" : "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "background 0.15s" }}>
                      {isScanning ? "⏳" : "📷"}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>{isScanning ? "Reading menu…" : "Scan with Camera"}</div>
                      <div style={{ fontSize: 12, color: "var(--c-sub)" }}>{isScanning ? "Claude is extracting menu items" : "Take a photo of any menu"}</div>
                    </div>
                    {!isScanning && <div style={{ marginLeft: "auto", fontSize: 12, fontWeight: 700, color: "#eb1700" }}>Tap →</div>}
                  </div>
                  {photoPreview && isScanning && (
                    <div style={{ padding: "0 16px 16px" }}>
                      <img src={photoPreview} alt="Menu preview" style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 10 }} />
                    </div>
                  )}
                  {fetchError && !isScanning && (
                    <div style={{ margin: "0 16px 12px", padding: "10px 12px", borderRadius: 10, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>{fetchError}</div>
                  )}
                </label>

                {/* Option: Load a Restaurant */}
                <div style={{ border: `1.5px solid ${activeInput === "preloaded" ? "#eb1700" : "var(--c-border)"}`, borderRadius: 14, marginBottom: 10, overflow: "hidden", transition: "border-color 0.15s" }}>
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
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 10, fontSize: 14, color: "var(--c-text)", background: "var(--c-input)", outline: "none", marginBottom: 8 }}
                      />
                      <select
                        value={selectedMenuId}
                        onChange={(e) => setSelectedMenuId(e.target.value)}
                        disabled={!filteredMenus.length}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 10, fontSize: 14, color: "var(--c-text)", background: "var(--c-input)", outline: "none", marginBottom: 8 }}
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
                <div style={{ border: `1.5px solid ${activeInput === "url" ? "#eb1700" : "var(--c-border)"}`, borderRadius: 14, marginBottom: 10, overflow: "hidden", transition: "border-color 0.15s" }}>
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
                        style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid var(--c-border)", borderRadius: 10, fontSize: 14, color: "var(--c-text)", background: "var(--c-input)", outline: "none", marginBottom: 8 }}
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
                <div style={{ border: `1.5px solid ${activeInput === "manual" ? "#eb1700" : "var(--c-border)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.15s" }}>
                  <button
                    onClick={() => setActiveInput(v => v === "manual" ? null : "manual")}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: activeInput === "manual" ? "#eb1700" : "var(--c-muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, transition: "background 0.15s" }}>📋</div>
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
                        style={{ width: "100%", boxSizing: "border-box", minHeight: 140, resize: "vertical", border: "1px solid var(--c-border)", background: "var(--c-input)", color: "var(--c-text)", borderRadius: 10, padding: 12, fontSize: 14, lineHeight: 1.6, outline: "none" }}
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
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)", marginBottom: 12 }}>
                  {loadedRestaurant ? loadedRestaurant : "Scan Results"} — {menuItems.length} items
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
