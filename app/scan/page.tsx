"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { detectAllergensFromLine } from "@/lib/detectAllergens";
import { inferFromDishName } from "@/lib/inferFromDish";
import { TEXT_MENUS } from "@/data/textMenus";
import { buildScanInput } from "@/lib/buildScanInput";
import { inferAllergensFromKeywords } from "@/lib/allergenDictionary";
import { scoreRisk } from "@/lib/scoreRisk";
import { useAuth } from "@/lib/authContext";
import { AllergySelector } from "@/components/AllergySelector";
import type { Confidence, Row, AvoidRow, Results, SavedScan, LearnedRule, SourceType } from "@/lib/types";
import type { AllergenId } from "@/lib/types";

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

type ActiveTab = "scan" | "saved" | "history";
type MenuSourceKey = "preloaded" | "url" | "manual";

const STORAGE_SAVED   = "allegeats_saved_scans";
const STORAGE_LEARNED = "allegeats_learned_rules";
const VAGUE_WORDS = ["sauce","seasoning","blend","secret","marinade","glaze","dressing","rub","may contain"];

function formatDate(ts: number) { return new Date(ts).toLocaleString(); }
function makeId() { return Math.random().toString(36).slice(2) + "_" + Date.now().toString(36); }
function toSourceType(s: MenuSourceKey): SourceType {
  return s === "preloaded" ? "verified-dataset" : s === "url" ? "scraped" : "user-input";
}

export default function ScanPage() {
  const { allergens: profileAllergens } = useAuth();

  const [activeTab, setActiveTab]               = useState<ActiveTab>("scan");
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenId[]>([]);
  const [menu, setMenu]                         = useState("Grilled Chicken Sandwich - brioche bun, aioli\nGarden Salad - mixed greens, vinaigrette\nTempura Shrimp Taco - battered shrimp, spicy mayo\nHouse Sauce Wings\nMac & Cheese - cheddar, milk, butter");
  const [selectedMenuId, setSelectedMenuId]     = useState(TEXT_MENUS[0]?.id ?? "");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [analyzed, setAnalyzed]                 = useState(false);
  const [menuUrl, setMenuUrl]                   = useState("");
  const [menuSource, setMenuSource]             = useState<MenuSourceKey>("manual");
  const [isFetching, setIsFetching]             = useState(false);
  const [fetchError, setFetchError]             = useState<string | null>(null);
  const [savedScans, setSavedScans]             = useState<SavedScan[]>([]);
  const [saveTitle, setSaveTitle]               = useState("");
  const [learnedRules, setLearnedRules]         = useState<LearnedRule[]>([]);

  // Load from auth profile, then localStorage fallback
  useEffect(() => {
    if (profileAllergens.length > 0) {
      setSelectedAllergens(profileAllergens);
    }
  }, [profileAllergens]);

  useEffect(() => {
    try { const r = localStorage.getItem(STORAGE_SAVED);   if (r) setSavedScans(JSON.parse(r)); } catch { /* */ }
    try { const r = localStorage.getItem(STORAGE_LEARNED); if (r) setLearnedRules(JSON.parse(r)); } catch { /* */ }
  }, []);

  function persistSaved(next: SavedScan[]) { setSavedScans(next); localStorage.setItem(STORAGE_SAVED, JSON.stringify(next)); }
  function persistLearned(next: LearnedRule[]) { setLearnedRules(next); localStorage.setItem(STORAGE_LEARNED, JSON.stringify(next)); }
  function deleteSaved(id: string) { persistSaved(savedScans.filter((s) => s.id !== id)); }

  function loadSaved(scan: SavedScan) {
    setMenuUrl(scan.menuUrl); setMenu(scan.menu);
    setMenuSource(scan.menuUrl ? "url" : "manual");
    setAnalyzed(true); setActiveTab("scan"); setSaveTitle(scan.title);
  }

  function upsertLearnedRule(outcome: "safe" | "avoid" | "unsure", item: string, allergen?: string) {
    const n = normalize(item);
    persistLearned([{ id: makeId(), item, normalizedItem: n, outcome, allergen, createdAt: Date.now() }, ...learnedRules.filter((r) => r.normalizedItem !== n)]);
  }
  function findLearnedRule(item: string) { return learnedRules.find((r) => r.normalizedItem === normalize(item)); }

  const avoidAllergens = useMemo(() => selectedAllergens as string[], [selectedAllergens]);
  const menuItems = useMemo(() => menu.split("\n").map((m) => m.trim()).filter(Boolean), [menu]);

  const filteredMenus = useMemo(() => {
    const q = normalize(restaurantSearch);
    return q ? TEXT_MENUS.filter((m) => normalize(`${m.restaurant} ${m.category} ${m.items.join(" ")}`).includes(q)) : TEXT_MENUS;
  }, [restaurantSearch]);

  useEffect(() => {
    if (filteredMenus.length && !filteredMenus.some((m) => m.id === selectedMenuId)) setSelectedMenuId(filteredMenus[0].id);
  }, [filteredMenus, selectedMenuId]);

  const selectedMenu = useMemo(() =>
    filteredMenus.find((m) => m.id === selectedMenuId) ?? TEXT_MENUS.find((m) => m.id === selectedMenuId) ?? null,
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
      setMenu(lines.join("\n")); setMenuSource("url"); setAnalyzed(false); setSaveTitle("Menu from URL");
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : "Network error"); }
    finally { setIsFetching(false); }
  }

  function loadSelectedRestaurant() {
    if (!selectedMenu) return;
    setMenu(buildScanInput(selectedMenu)); setMenuSource("preloaded");
    setMenuUrl(selectedMenu.url ?? ""); setAnalyzed(false); setFetchError(null); setSaveTitle(selectedMenu.restaurant);
  }
  function quickLoad(id: string) {
    const t = TEXT_MENUS.find((m) => m.id === id);
    if (!t) return;
    setSelectedMenuId(t.id); setRestaurantSearch(t.restaurant);
    setMenu(buildScanInput(t)); setMenuSource("preloaded");
    setMenuUrl(t.url ?? ""); setAnalyzed(false); setFetchError(null); setSaveTitle(t.restaurant);
  }
  function clearMenu() { setMenu(""); setMenuUrl(""); setMenuSource("manual"); setAnalyzed(false); setFetchError(null); }

  function buildStaffQs(hitAllergens: string[], inferredHits: string[], triggers: string[], vague: boolean) {
    const list = [...new Set([...hitAllergens, ...inferredHits])].length ? [...new Set([...hitAllergens, ...inferredHits])] : avoidAllergens;
    const qs = [`Can you confirm if this contains any of: ${list.join(", ")}?`];
    if (triggers.length) qs.push(`The menu mentions: ${triggers.join(", ")} — can you confirm ingredients?`);
    if (vague) qs.push("It has a sauce/seasoning listed — can the kitchen check what's in it?");
    qs.push("Is there risk of cross-contact (shared fryer/grill, shared utensils)?");
    qs.push("If unsure, could the kitchen check the ingredient list or recipe card?");
    return qs;
  }

  function confFor(p: { hasExplicit: boolean; hasTrigger: boolean; hasInferred: boolean; isVague: boolean }): Confidence {
    if (p.hasExplicit || p.hasTrigger) return "High";
    if (p.hasInferred) return "Medium";
    return "Low";
  }

  async function copyText(text: string) { try { await navigator.clipboard.writeText(text); } catch { /* */ } }
  function questionsText(item: string, qs: string[]) { return `Hi! I have food allergies (${avoidAllergens.join(", ") || "none"}).\n\nItem: "${item}"\n\n${qs.map((q) => `• ${q}`).join("\n")}`; }

  const results: Results = useMemo(() => {
    const safe: Row[] = [], ask: Row[] = [], avoid: AvoidRow[] = [];
    const srcType = toSourceType(menuSource);
    for (const item of menuItems) {
      const { allergens: detected, hits } = detectAllergensFromLine(item);
      const guesses = inferFromDishName(item);
      const keywordAllergens = inferAllergensFromKeywords(item);
      const inferredAllergens = [...new Set([...guesses.flatMap((g) => g.inferredAllergens), ...keywordAllergens])];
      const inferredReasons = guesses.map((g) => g.reason);
      const hitsAllergens = avoidAllergens.filter((a) => (detected as string[]).includes(a));
      const inferredHits = avoidAllergens.filter((a) => inferredAllergens.includes(a));
      const vague = VAGUE_WORDS.some((v) => normalize(item).includes(v));
      const learned = findLearnedRule(item);

      if (learned) {
        const learnedReason = learned.outcome === "safe" ? "Previously confirmed safe by you" : learned.outcome === "unsure" ? "Previously marked unsure" : `Previously confirmed to contain ${learned.allergen ?? "an allergen"}`;
        const lc: Confidence = learned.outcome === "safe" ? "Medium" : "High";
        if (learned.outcome === "safe") { safe.push({ item, detected, hits, inferredAllergens, inferredReasons: [learnedReason], confidence: lc, staffQuestions: [], learned: true }); continue; }
        if (learned.outcome === "unsure") { ask.push({ item, detected, hits, inferredAllergens, inferredReasons: [learnedReason], confidence: lc, staffQuestions: buildStaffQs([], [], hits, true), learned: true }); continue; }
        avoid.push({ item, detected, hits, hitsAllergens: learned.allergen ? [learned.allergen] : ["avoid"], inferredAllergens, inferredReasons: [learnedReason], confidence: lc, staffQuestions: buildStaffQs(learned.allergen ? [learned.allergen] : [], [], hits, vague), learned: true });
        continue;
      }

      const conf = confFor({ hasExplicit: hitsAllergens.length > 0, hasTrigger: hits.length > 0, hasInferred: inferredHits.length > 0, isVague: vague });
      const staffQs = buildStaffQs(hitsAllergens, inferredHits, hits, vague);

      if (hitsAllergens.length) {
        avoid.push({ item, detected, hits, hitsAllergens, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: staffQs });
      } else if (vague || inferredHits.length) {
        ask.push({ item, detected, hits, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: staffQs });
      } else {
        const risk = scoreRisk(detected, avoidAllergens, srcType, false);
        if (risk === "unknown") ask.push({ item, detected, hits, inferredAllergens, inferredReasons: ["Unverified source — no official ingredient data", ...inferredReasons], confidence: "Low", staffQuestions: staffQs });
        else if (risk === "ask") ask.push({ item, detected, hits, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: staffQs });
        else safe.push({ item, detected, hits, inferredAllergens, inferredReasons, confidence: conf, staffQuestions: [] });
      }
    }
    return { safe, ask, avoid };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuItems, avoidAllergens, learnedRules, menuSource]);

  function saveCurrentScan() {
    if (!analyzed) return;
    const allergiesStr = selectedAllergens.join(", ");
    const title = saveTitle.trim() || selectedMenu?.restaurant || (menuUrl.trim() ? "Menu from URL" : "Saved scan");
    persistSaved([{ id: makeId(), createdAt: Date.now(), title, allergies: allergiesStr, menuUrl, menu, results }, ...savedScans].slice(0, 50));
    setActiveTab("saved");
  }

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

  const TAB_META: { id: ActiveTab; label: string }[] = [
    { id: "scan",    label: "Scan"    },
    { id: "saved",   label: "Saved"   },
    { id: "history", label: "History" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", paddingBottom: 80 }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--c-hdr)", backdropFilter: "blur(12px)", borderBottom: "1px solid #e5e7eb", padding: "12px 16px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "#6b7280", textDecoration: "none" }}>← Home</Link>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#111" }}>Manual Scan</span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>{menuItems.length} items</span>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "16px 16px 0" }}>

        {activeTab === "scan" && (
          <div style={{ display: "grid", gap: 14 }}>

            {/* Allergy profile */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 4 }}>Your Allergens</div>
              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14 }}>Synced from your profile.</div>
              <AllergySelector selected={selectedAllergens} onChange={setSelectedAllergens} limit={4} />
            </div>

            {/* Load restaurant */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 14 }}>Load a Restaurant</div>
              <input
                value={restaurantSearch}
                onChange={(e) => setRestaurantSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && selectedMenu) loadSelectedRestaurant(); }}
                placeholder="Search restaurants…"
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, color: "#111", background: "#fafafa", outline: "none", marginBottom: 10 }}
              />
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                disabled={!filteredMenus.length}
                style={{ width: "100%", padding: "11px 14px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, color: "#111", background: "#fafafa", outline: "none", marginBottom: 10 }}
              >
                {filteredMenus.length ? filteredMenus.map((m) => <option key={m.id} value={m.id}>{m.restaurant} — {m.category}</option>) : <option value="">No restaurants found</option>}
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 12 }}>
                <button onClick={loadSelectedRestaurant} disabled={!selectedMenu} style={{ padding: "12px 0", borderRadius: 12, border: "none", background: selectedMenu ? "#eb1700" : "#e5e7eb", color: selectedMenu ? "#fff" : "#9ca3af", fontWeight: 800, fontSize: 14, cursor: selectedMenu ? "pointer" : "not-allowed" }}>Load Menu</button>
                <button onClick={clearMenu} style={{ padding: "12px 18px", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Clear</button>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
                {TEXT_MENUS.slice(0, 6).map((m) => (
                  <button key={m.id} onClick={() => quickLoad(m.id)} style={{ padding: "7px 12px", borderRadius: 999, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{m.restaurant}</button>
                ))}
              </div>
            </div>

            {/* URL fetch */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#111", marginBottom: 14 }}>Fetch from URL</div>
              <input
                value={menuUrl}
                onChange={(e) => setMenuUrl(e.target.value)}
                placeholder="https://restaurant.com/menu"
                style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, color: "#111", background: "#fafafa", outline: "none", marginBottom: 10 }}
              />
              <button onClick={fetchMenuFromUrl} disabled={isFetching} style={{ width: "100%", padding: "12px 0", borderRadius: 12, border: "none", background: isFetching ? "#9ca3af" : "#eb1700", color: "#fff", fontWeight: 800, fontSize: 14, cursor: isFetching ? "not-allowed" : "pointer" }}>
                {isFetching ? "Fetching…" : "Fetch Menu"}
              </button>
              {fetchError && <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>{fetchError}</div>}
            </div>

            {/* Menu text */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#111" }}>Menu Text</div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#6b7280" }}>{menuItems.length} items</span>
              </div>
              <textarea
                value={menu}
                onChange={(e) => { setMenu(e.target.value); setMenuSource("manual"); }}
                placeholder="Paste menu items, one per line…"
                style={{ width: "100%", boxSizing: "border-box", minHeight: 180, resize: "vertical", border: "1px solid #e5e7eb", background: "#fafafa", color: "#111", borderRadius: 14, padding: 14, fontSize: 14, lineHeight: 1.6, outline: "none" }}
              />
            </div>

            {/* Analyze */}
            <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <button
                onClick={() => setAnalyzed(true)}
                style={{ width: "100%", padding: "15px 0", borderRadius: 14, border: "none", background: "#eb1700", color: "#fff", fontSize: 16, fontWeight: 900, cursor: "pointer" }}
              >
                Analyze Menu
              </button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginTop: 10 }}>
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Scan title (optional)"
                  style={{ padding: "11px 14px", border: "1px solid #e5e7eb", borderRadius: 12, fontSize: 14, color: "#111", background: "#fafafa", outline: "none" }}
                />
                <button
                  onClick={saveCurrentScan}
                  disabled={!analyzed}
                  style={{ padding: "11px 18px", borderRadius: 12, border: "1px solid #e5e7eb", background: analyzed ? "#111" : "#f9fafb", color: analyzed ? "#fff" : "#9ca3af", fontSize: 14, fontWeight: 700, cursor: analyzed ? "pointer" : "not-allowed" }}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Results */}
            {analyzed && (
              <>
                {/* Summary bar */}
                <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                  <div style={{ height: 8, borderRadius: 999, background: "#f3f4f6", overflow: "hidden", display: "flex" }}>
                    <div style={{ width: `${menuItems.length ? (results.safe.length / menuItems.length) * 100 : 0}%`,  background: "#22c55e", transition: "width 0.5s" }} />
                    <div style={{ width: `${menuItems.length ? (results.ask.length  / menuItems.length) * 100 : 0}%`,  background: "#f59e0b", transition: "width 0.5s" }} />
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

                <p style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", lineHeight: 1.5, marginTop: 4 }}>
                  Always confirm allergens with restaurant staff before ordering.
                </p>
              </>
            )}
          </div>
        )}

        {activeTab === "saved" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#111", marginBottom: 4 }}>Saved Scans</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Quick access to menus you already checked.</div>
            <div style={{ display: "grid", gap: 10 }}>
              {savedScans.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af" }}>No saved scans yet.</div>}
              {savedScans.map((s) => (
                <div key={s.id} style={{ border: "1px solid #e5e7eb", borderRadius: 16, padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{formatDate(s.createdAt)}</div>
                  <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 4 }}>Safe: {s.results.safe.length} · Ask: {s.results.ask.length} · Avoid: {s.results.avoid.length}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                    <button onClick={() => loadSaved(s)} style={{ padding: "11px 0", borderRadius: 12, border: "none", background: "#eb1700", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Open</button>
                    <button onClick={() => deleteSaved(s.id)} style={{ padding: "11px 0", borderRadius: 12, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <div style={{ fontWeight: 900, fontSize: 18, color: "#111", marginBottom: 4 }}>Learned History</div>
            <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 16 }}>Dishes you've confirmed safe, unsafe, or unsure.</div>
            <div style={{ display: "grid", gap: 10 }}>
              {learnedRules.length === 0 && <div style={{ fontSize: 13, color: "#9ca3af" }}>No history yet. Mark items after analyzing a menu.</div>}
              {learnedRules.map((rule) => (
                <div key={rule.id} style={{ border: "1px solid #e5e7eb", borderRadius: 14, padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 14, color: "#111" }}>{rule.item}</div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                    {rule.outcome === "safe" ? "Confirmed safe" : rule.outcome === "unsure" ? "Marked unsure" : `Contains ${rule.allergen ?? "allergen"}`}
                  </div>
                  <button onClick={() => persistLearned(learnedRules.filter((r) => r.id !== rule.id))} style={{ marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 10, border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", left: 12, right: 12, bottom: 12, background: "rgba(255,255,255,0.96)", border: "1px solid #e5e7eb", backdropFilter: "blur(14px)", borderRadius: 22, padding: "6px 10px", display: "flex", zIndex: 100, maxWidth: 568, margin: "0 auto" }}>
        {TAB_META.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, border: "none", background: "transparent", color: activeTab === id ? "#eb1700" : "var(--c-sub)", padding: "10px 6px", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            {label}
          </button>
        ))}
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
