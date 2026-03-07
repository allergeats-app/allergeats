"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { detectAllergensFromLine } from "@/lib/detectAllergens";
import { inferFromDishName } from "@/lib/inferFromDish";
import { TEXT_MENUS } from "@/data/textMenus";
import { buildScanInput } from "@/lib/buildScanInput";
import { inferAllergensFromKeywords } from "@/lib/allergenDictionary";
import { scoreRisk } from "@/lib/scoreRisk";
import type { Confidence, Row, AvoidRow, Results, SavedScan, LearnedRule, SourceType } from "@/lib/types";

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

type ActiveTab = "home" | "saved" | "profile";
type MenuSourceKey = "preloaded" | "url" | "manual";

const STORAGE_ALLERGIES = "allegeats_allergies";
const STORAGE_THEME     = "allegeats_theme";
const STORAGE_SAVED     = "allegeats_saved_scans";
const STORAGE_LEARNED   = "allegeats_learned_rules";
const VAGUE_WORDS = ["sauce","seasoning","blend","secret","marinade","glaze","dressing","rub","may contain"];

function formatDate(ts: number) { return new Date(ts).toLocaleString(); }
function makeId() { return Math.random().toString(36).slice(2) + "_" + Date.now().toString(36); }
function toSourceType(s: MenuSourceKey): SourceType {
  return s === "preloaded" ? "verified-dataset" : s === "url" ? "scraped" : "user-input";
}

export default function ScanPage() {
  const [darkMode, setDarkMode]                 = useState(false);
  const [activeTab, setActiveTab]               = useState<ActiveTab>("home");
  const [allergies, setAllergies]               = useState("dairy, egg, soy");
  const [menu, setMenu]                         = useState("Grilled Chicken Sandwich - brioche bun, aioli\nGarden Salad - mixed greens, vinaigrette\nTempura Shrimp Taco - battered shrimp, spicy mayo\nHouse Sauce Wings\nMac & Cheese - cheddar, milk, butter");
  const [selectedMenuId, setSelectedMenuId]     = useState(TEXT_MENUS[0]?.id ?? "");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [clicked, setClicked]                   = useState(false);
  const [menuUrl, setMenuUrl]                   = useState("");
  const [menuSource, setMenuSource]             = useState<MenuSourceKey>("manual");
  const [isFetching, setIsFetching]             = useState(false);
  const [fetchError, setFetchError]             = useState<string | null>(null);
  const [savedScans, setSavedScans]             = useState<SavedScan[]>([]);
  const [saveTitle, setSaveTitle]               = useState("");
  const [learnedRules, setLearnedRules]         = useState<LearnedRule[]>([]);

  useEffect(() => {
    const theme = localStorage.getItem(STORAGE_THEME);
    if (theme === "dark") setDarkMode(true);
    const saved = localStorage.getItem(STORAGE_ALLERGIES);
    if (saved) setAllergies(saved);
    try { const r = localStorage.getItem(STORAGE_SAVED); if (r) setSavedScans(JSON.parse(r)); } catch { /* */ }
    try { const r = localStorage.getItem(STORAGE_LEARNED); if (r) setLearnedRules(JSON.parse(r)); } catch { /* */ }
  }, []);

  useEffect(() => { localStorage.setItem(STORAGE_THEME, darkMode ? "dark" : "light"); }, [darkMode]);
  useEffect(() => { localStorage.setItem(STORAGE_ALLERGIES, allergies); }, [allergies]);

  function persistSaved(next: SavedScan[]) { setSavedScans(next); localStorage.setItem(STORAGE_SAVED, JSON.stringify(next)); }
  function persistLearned(next: LearnedRule[]) { setLearnedRules(next); localStorage.setItem(STORAGE_LEARNED, JSON.stringify(next)); }
  function deleteSaved(id: string) { persistSaved(savedScans.filter((s) => s.id !== id)); }

  function loadSaved(scan: SavedScan) {
    setAllergies(scan.allergies); setMenuUrl(scan.menuUrl); setMenu(scan.menu);
    setMenuSource(scan.menuUrl ? "url" : "manual");
    setClicked(true); setActiveTab("home"); setSaveTitle(scan.title);
  }

  function upsertLearnedRule(outcome: "safe" | "avoid" | "unsure", item: string, allergen?: string) {
    const n = normalize(item);
    persistLearned([{ id: makeId(), item, normalizedItem: n, outcome, allergen, createdAt: Date.now() }, ...learnedRules.filter((r) => r.normalizedItem !== n)]);
  }
  function findLearnedRule(item: string) { return learnedRules.find((r) => r.normalizedItem === normalize(item)); }

  const avoidAllergens = useMemo(() => allergies.split(",").map((a) => normalize(a)).filter(Boolean), [allergies]);
  const menuItems = useMemo(() => menu.split("\n").map((m) => m.trim()).filter(Boolean), [menu]);
  const filteredMenus = useMemo(() => {
    const q = normalize(restaurantSearch);
    return q ? TEXT_MENUS.filter((m) => normalize(`${m.restaurant} ${m.category} ${m.items.join(" ")}`).includes(q)) : TEXT_MENUS;
  }, [restaurantSearch]);
  useEffect(() => { if (filteredMenus.length && !filteredMenus.some((m) => m.id === selectedMenuId)) setSelectedMenuId(filteredMenus[0].id); }, [filteredMenus, selectedMenuId]);
  const selectedMenu = useMemo(() => filteredMenus.find((m) => m.id === selectedMenuId) ?? TEXT_MENUS.find((m) => m.id === selectedMenuId) ?? null, [filteredMenus, selectedMenuId]);

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
      setMenu(lines.join("\n")); setMenuSource("url"); setClicked(false); setSaveTitle("Menu from URL");
    } catch (err: unknown) { setFetchError(err instanceof Error ? err.message : "Network error"); }
    finally { setIsFetching(false); }
  }

  function loadSelectedRestaurant() {
    if (!selectedMenu) return;
    setMenu(buildScanInput(selectedMenu)); setMenuSource("preloaded");
    setMenuUrl(selectedMenu.url ?? ""); setClicked(false); setFetchError(null); setSaveTitle(selectedMenu.restaurant);
  }
  function quickLoad(id: string) {
    const t = TEXT_MENUS.find((m) => m.id === id);
    if (!t) return;
    setSelectedMenuId(t.id); setRestaurantSearch(t.restaurant);
    setMenu(buildScanInput(t)); setMenuSource("preloaded");
    setMenuUrl(t.url ?? ""); setClicked(false); setFetchError(null); setSaveTitle(t.restaurant);
  }
  function clearMenu() { setMenu(""); setMenuUrl(""); setMenuSource("manual"); setClicked(false); setFetchError(null); }

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
    if (!clicked) return;
    const title = saveTitle.trim() || selectedMenu?.restaurant || (menuUrl.trim() ? "Menu from URL" : "Saved scan");
    persistSaved([{ id: makeId(), createdAt: Date.now(), title, allergies, menuUrl, menu, results }, ...savedScans].slice(0, 50));
    setActiveTab("saved");
  }

  const th = useMemo(() => {
    const dk = darkMode;
    return {
      bg: dk ? "#101010" : "#f7f7f7", card: dk ? "#181818" : "#ffffff", soft: dk ? "#222222" : "#f2f2f2",
      border: dk ? "#2b2b2b" : "#ececec", text: dk ? "#fafafa" : "#191919", sub: dk ? "#b9b9b9" : "#6b6b6b",
      accent: "#eb1700", accentSoft: dk ? "rgba(235,23,0,0.16)" : "#fff1ef",
      yellow: dk ? "#2d2613" : "#fff7db", yellowBorder: dk ? "#58481f" : "#f4dd8d",
      redSoft: dk ? "#311716" : "#fff1f0", redBorder: dk ? "#63302d" : "#f3c5c0",
    };
  }, [darkMode]);

  function card(children: React.ReactNode) {
    return <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 20, padding: 16, boxShadow: darkMode ? "none" : "0 1px 2px rgba(0,0,0,0.03)" }}>{children}</div>;
  }

  function confBadge(c: Confidence) {
    const m: Record<Confidence, { bg: string; color: string; border: string }> = { High: { bg: th.redSoft, color: "#d93025", border: th.redBorder }, Medium: { bg: th.yellow, color: darkMode ? "#f6d365" : "#8a6700", border: th.yellowBorder }, Low: { bg: th.soft, color: th.sub, border: th.border } };
    const s = m[c];
    return <span style={{ whiteSpace: "nowrap", fontSize: 11, fontWeight: 900, padding: "5px 9px", borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{c}</span>;
  }

  function StaffBlock({ row }: { row: Row }) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: th.sub, marginBottom: 8 }}>What to ask staff</div>
        <div style={{ display: "grid", gap: 6 }}>{row.staffQuestions.slice(0, 3).map((q, i) => <div key={i} style={{ fontSize: 12, color: th.sub, lineHeight: 1.4 }}>• {q}</div>)}</div>
        <button onClick={() => copyText(questionsText(row.item, row.staffQuestions))} style={{ width: "100%", marginTop: 10, padding: "12px 14px", borderRadius: 14, border: `1px solid ${th.border}`, background: darkMode ? th.soft : "#fff", color: th.text, fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Copy Questions</button>
      </div>
    );
  }

  function LearnBlock({ row }: { row: Row }) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: th.sub, marginBottom: 8 }}>Learn from this result</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button onClick={() => upsertLearnedRule("safe", row.item)} style={{ padding: "10px 12px", borderRadius: 999, border: `1px solid ${th.border}`, background: darkMode ? "#183122" : "#eefbf3", color: darkMode ? "#8be2ab" : "#166534", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Safe</button>
          <button onClick={() => upsertLearnedRule("unsure", row.item)} style={{ padding: "10px 12px", borderRadius: 999, border: `1px solid ${th.border}`, background: th.yellow, color: darkMode ? "#f6d365" : "#8a6700", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>Unsure</button>
          {avoidAllergens.map((a) => <button key={a} onClick={() => upsertLearnedRule("avoid", row.item, a)} style={{ padding: "10px 12px", borderRadius: 999, border: `1px solid ${th.border}`, background: th.redSoft, color: "#d93025", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{a}</button>)}
        </div>
      </div>
    );
  }

  function ResultSection({ title, emoji, rows, tone }: { title: string; emoji: string; rows: Array<Row | AvoidRow>; tone: "safe" | "ask" | "avoid" }) {
    const bg = tone === "ask" ? th.yellow : tone === "avoid" ? th.redSoft : th.card;
    const border = tone === "ask" ? th.yellowBorder : tone === "avoid" ? th.redBorder : th.border;
    return card(
      <>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: 12, background: tone === "safe" ? th.soft : bg, display: "grid", placeItems: "center", fontSize: 16 }}>{emoji}</div>
          <div><div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div><div style={{ fontSize: 12, color: th.sub }}>{rows.length} items</div></div>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {rows.length === 0 && <div style={{ fontSize: 13, color: th.sub }}>No items here.</div>}
          {rows.map((r, i) => (
            <div key={i} style={{ border: `1px solid ${border}`, background: tone === "safe" ? th.soft : bg, borderRadius: 18, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, lineHeight: 1.35 }}>{r.item}</div>{confBadge(r.confidence)}
              </div>
              {r.learned && <div style={{ fontSize: 11, color: th.sub, marginTop: 6, fontWeight: 800 }}>Learned from your history</div>}
              {tone === "ask" && <div style={{ fontSize: 12, color: darkMode ? "#f6d365" : "#8a6700", marginTop: 8, lineHeight: 1.4 }}>Reason: {r.inferredReasons.length ? r.inferredReasons.join(" | ") : "Vague ingredients"}</div>}
              {tone === "avoid" && "hitsAllergens" in r && <div style={{ fontSize: 12, color: "#d93025", marginTop: 8, fontWeight: 900 }}>Contains: {r.hitsAllergens.join(", ")}</div>}
              <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                <div style={{ fontSize: 12, color: th.sub }}>Detected: {r.detected.length ? r.detected.join(", ") : "none"}</div>
                <div style={{ fontSize: 12, color: th.sub }}>Triggers: {r.hits.length ? r.hits.join(", ") : "none"}</div>
                <div style={{ fontSize: 12, color: th.sub }}>Inferred: {r.inferredAllergens.length ? r.inferredAllergens.join(", ") : "none"}</div>
              </div>
              {tone !== "safe" && <StaffBlock row={r} />}
              {tone === "ask" && <LearnBlock row={r} />}
            </div>
          ))}
        </div>
      </>
    );
  }

  const QUICK = ["dairy","egg","soy","wheat","fish","shellfish","nuts","sesame","corn","mustard"];

  return (
    <main style={{ minHeight: "100vh", background: th.bg, color: th.text, fontFamily: "Inter, Arial, sans-serif", paddingBottom: 90 }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 14 }}>

        {/* Header */}
        <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 24, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <Link href="/" style={{ fontSize: 12, color: th.sub, fontWeight: 700, textDecoration: "none" }}>← Discover</Link>
              <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, marginTop: 8 }}>Manual Scan</div>
              <div style={{ fontSize: 13, color: th.sub, marginTop: 8, lineHeight: 1.45 }}>Paste a URL, load a restaurant, or type menu items.</div>
            </div>
            <button onClick={() => setDarkMode((v) => !v)} style={{ border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 999, padding: "10px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{darkMode ? "Dark" : "Light"}</button>
          </div>
        </div>

        {activeTab === "home" && (
          <>
            {card(<>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Your allergies</div>
              <input value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="dairy, egg, soy" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 16, padding: 14, fontSize: 15, outline: "none" }} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                {QUICK.map((a) => { const active = avoidAllergens.includes(a); return <button key={a} onClick={() => { const s = new Set(avoidAllergens); if (active) s.delete(a); else s.add(a); setAllergies([...s].join(", ")); }} style={{ border: `1px solid ${active ? "transparent" : th.border}`, background: active ? th.accent : th.soft, color: active ? "#fff" : th.text, borderRadius: 999, padding: "10px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer" }}>{active ? "✓ " : ""}{a}</button>; })}
              </div>
            </>)}
            <div style={{ height: 14 }} />
            {card(<>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Find a restaurant</div>
              <input value={restaurantSearch} onChange={(e) => setRestaurantSearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && selectedMenu) loadSelectedRestaurant(); }} placeholder="Search restaurants..." style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 16, padding: 14, fontSize: 15, outline: "none" }} />
              <div style={{ marginTop: 10, fontSize: 12, color: th.sub }}>{filteredMenus.length} match{filteredMenus.length === 1 ? "" : "es"} found</div>
              <select value={selectedMenuId} onChange={(e) => setSelectedMenuId(e.target.value)} disabled={!filteredMenus.length} style={{ width: "100%", marginTop: 10, boxSizing: "border-box", border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 16, padding: 14, fontSize: 15, outline: "none" }}>
                {filteredMenus.length ? filteredMenus.map((m) => <option key={m.id} value={m.id}>{m.restaurant} — {m.category}</option>) : <option value="">No restaurants found</option>}
              </select>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <button onClick={loadSelectedRestaurant} disabled={!selectedMenu} style={{ border: "none", background: selectedMenu ? th.accent : "#9f9f9f", color: "#fff", borderRadius: 16, padding: "14px 12px", fontWeight: 900, fontSize: 14, cursor: selectedMenu ? "pointer" : "not-allowed" }}>Load menu</button>
                <button onClick={clearMenu} style={{ border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 16, padding: "14px 12px", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Clear</button>
              </div>
              <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 12, marginTop: 4 }}>
                {TEXT_MENUS.slice(0, 6).map((m) => <button key={m.id} onClick={() => quickLoad(m.id)} style={{ border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 999, padding: "10px 12px", fontSize: 12, fontWeight: 800, cursor: "pointer", whiteSpace: "nowrap" }}>{m.restaurant}</button>)}
              </div>
            </>)}
            <div style={{ height: 14 }} />
            {card(<>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Paste a menu URL</div>
              <input value={menuUrl} onChange={(e) => setMenuUrl(e.target.value)} placeholder="https://restaurant.com/menu" style={{ width: "100%", boxSizing: "border-box", border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 16, padding: 14, fontSize: 15, outline: "none" }} />
              <button onClick={fetchMenuFromUrl} disabled={isFetching} style={{ width: "100%", marginTop: 10, border: "none", background: isFetching ? "#9f9f9f" : th.accent, color: "#fff", borderRadius: 16, padding: "14px 12px", fontWeight: 900, fontSize: 14, cursor: isFetching ? "not-allowed" : "pointer" }}>{isFetching ? "Fetching..." : "Fetch menu"}</button>
              {fetchError && <div style={{ marginTop: 10, padding: 12, borderRadius: 14, border: `1px solid ${th.redBorder}`, background: th.redSoft, color: "#d93025", fontSize: 13 }}>{fetchError}</div>}
            </>)}
            <div style={{ height: 14 }} />
            {card(<>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div><div style={{ fontSize: 18, fontWeight: 900 }}>Menu text</div><div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>Paste or edit menu lines here.</div></div>
                <span style={{ padding: "8px 12px", borderRadius: 999, background: th.accentSoft, color: th.accent, fontSize: 12, fontWeight: 800 }}>{menuItems.length} items</span>
              </div>
              <textarea value={menu} onChange={(e) => { setMenu(e.target.value); setMenuSource("manual"); }} style={{ width: "100%", boxSizing: "border-box", minHeight: 220, resize: "vertical", border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 18, padding: 14, fontSize: 15, lineHeight: 1.5, outline: "none" }} />
            </>)}
            <div style={{ height: 14 }} />
            {card(<>
              <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Analyze</div>
              <div style={{ fontSize: 13, color: th.sub, marginBottom: 12 }}>Sort menu items into safe, ask staff, and avoid.</div>
              <button onClick={() => setClicked(true)} style={{ width: "100%", border: "none", background: th.accent, color: "#fff", borderRadius: 18, padding: "16px 14px", fontWeight: 900, fontSize: 16, cursor: "pointer" }}>Analyze menu</button>
              <input value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} placeholder="Optional title" style={{ width: "100%", boxSizing: "border-box", marginTop: 10, border: `1px solid ${th.border}`, background: th.soft, color: th.text, borderRadius: 16, padding: 14, fontSize: 15, outline: "none" }} />
              <button onClick={saveCurrentScan} disabled={!clicked} style={{ width: "100%", marginTop: 10, border: `1px solid ${th.border}`, background: clicked ? th.soft : th.card, color: clicked ? th.text : th.sub, borderRadius: 16, padding: "14px 12px", fontWeight: 900, fontSize: 14, cursor: clicked ? "pointer" : "not-allowed" }}>Save scan</button>
            </>)}
            {clicked && (
              <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                <ResultSection title="Safe" emoji="✅" rows={results.safe} tone="safe" />
                <ResultSection title="Ask Staff" emoji="⚠️" rows={results.ask} tone="ask" />
                <ResultSection title="Avoid" emoji="❌" rows={results.avoid} tone="avoid" />
              </div>
            )}
            <p style={{ marginTop: 16, fontSize: 12, color: th.sub, textAlign: "center", lineHeight: 1.5 }}>Always confirm allergens with restaurant staff.</p>
          </>
        )}

        {activeTab === "saved" && card(<>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Saved scans</div>
          <div style={{ fontSize: 13, color: th.sub, marginBottom: 12 }}>Quick access to menus you already checked.</div>
          <div style={{ display: "grid", gap: 10 }}>
            {savedScans.length === 0 && <div style={{ fontSize: 13, color: th.sub }}>No saved scans yet.</div>}
            {savedScans.map((s) => (
              <div key={s.id} style={{ border: `1px solid ${th.border}`, borderRadius: 18, background: th.soft, padding: 14 }}>
                <div style={{ fontWeight: 900 }}>{s.title}</div>
                <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>{formatDate(s.createdAt)}</div>
                <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>✅ {s.results.safe.length} · ⚠️ {s.results.ask.length} · ❌ {s.results.avoid.length}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                  <button onClick={() => loadSaved(s)} style={{ border: "none", background: th.accent, color: "#fff", borderRadius: 14, padding: "12px 10px", fontWeight: 900, cursor: "pointer" }}>Open</button>
                  <button onClick={() => deleteSaved(s.id)} style={{ border: `1px solid ${th.border}`, background: th.card, color: th.text, borderRadius: 14, padding: "12px 10px", fontWeight: 900, cursor: "pointer" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>)}

        {activeTab === "profile" && card(<>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Profile</div>
          <div style={{ fontSize: 13, color: th.sub, marginBottom: 12 }}>Your learned dish history and preferences.</div>
          <div style={{ display: "grid", gap: 10 }}>
            {learnedRules.length === 0 && <div style={{ fontSize: 13, color: th.sub }}>No learned rules yet.</div>}
            {learnedRules.map((rule) => (
              <div key={rule.id} style={{ border: `1px solid ${th.border}`, borderRadius: 18, background: th.soft, padding: 14 }}>
                <div style={{ fontWeight: 900 }}>{rule.item}</div>
                <div style={{ fontSize: 12, color: th.sub, marginTop: 4 }}>Outcome: {rule.outcome}{rule.allergen ? ` (${rule.allergen})` : ""}</div>
                <button onClick={() => persistLearned(learnedRules.filter((r) => r.id !== rule.id))} style={{ width: "100%", marginTop: 12, border: `1px solid ${th.border}`, background: th.card, color: th.text, borderRadius: 14, padding: "12px 10px", fontWeight: 900, cursor: "pointer" }}>Delete rule</button>
              </div>
            ))}
          </div>
        </>)}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", left: 12, right: 12, bottom: 12, background: darkMode ? "rgba(24,24,24,0.96)" : "rgba(255,255,255,0.96)", border: `1px solid ${th.border}`, backdropFilter: "blur(14px)", borderRadius: 22, padding: "6px 10px", display: "flex", zIndex: 100 }}>
        {(["home","saved","profile"] as const).map((id) => {
          const meta = { home: ["🔍","Scan"], saved: ["🧾","Saved"], profile: ["👤","Profile"] }[id];
          const active = activeTab === id;
          return <button key={id} onClick={() => setActiveTab(id)} style={{ flex: 1, border: "none", background: "transparent", color: active ? "#eb1700" : th.sub, padding: "8px 6px", fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}><span style={{ fontSize: 18 }}>{meta[0]}</span><span>{meta[1]}</span></button>;
        })}
      </div>
    </main>
  );
}
