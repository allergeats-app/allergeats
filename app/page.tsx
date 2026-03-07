"use client";

import { useEffect, useMemo, useState } from "react";
import { detectAllergensFromLine } from "../lib/detectAllergens";
import { inferFromDishName } from "../lib/inferFromDish";
import { TEXT_MENUS } from "../data/textMenus";
import { buildScanInput } from "../lib/buildScanInput";
import { inferAllergensFromKeywords } from "../lib/allergenDictionary";

function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type Confidence = "High" | "Medium" | "Low";
type ActiveTab = "home" | "saved" | "profile";

type Row = {
  item: string;
  detected: string[];
  hits: string[];
  inferredAllergens: string[];
  inferredReasons: string[];
  confidence: Confidence;
  staffQuestions: string[];
  learned?: boolean;
};

type AvoidRow = Row & {
  hitsAllergens: string[];
};

type Results = {
  safe: Row[];
  ask: Row[];
  avoid: AvoidRow[];
};

type SavedScan = {
  id: string;
  createdAt: number;
  title: string;
  allergies: string;
  menuUrl: string;
  menu: string;
  results: Results;
};

type LearnedRule = {
  id: string;
  item: string;
  normalizedItem: string;
  outcome: "safe" | "avoid" | "unsure";
  allergen?: string;
  createdAt: number;
};

const STORAGE_ALLERGIES = "allegeats_allergies";
const STORAGE_THEME = "allegeats_theme";
const STORAGE_SAVED = "allegeats_saved_scans";
const STORAGE_LEARNED = "allegeats_learned_rules";

const VAGUE_WORDS = [
  "sauce",
  "seasoning",
  "blend",
  "secret",
  "marinade",
  "glaze",
  "dressing",
  "rub",
  "may contain",
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function makeId() {
  return Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
}

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("home");
  const [allergies, setAllergies] = useState("dairy, egg, soy");
  const [menu, setMenu] = useState(
    `Grilled Chicken Sandwich - brioche bun, aioli
Garden Salad - mixed greens, vinaigrette
Tempura Shrimp Taco - battered shrimp, spicy mayo
House Sauce Wings
Mac & Cheese - cheddar, milk, butter`
  );
  const [selectedMenuId, setSelectedMenuId] = useState(TEXT_MENUS[0]?.id ?? "");
  const [restaurantSearch, setRestaurantSearch] = useState("");
  const [clicked, setClicked] = useState(false);
  const [menuUrl, setMenuUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savedScans, setSavedScans] = useState<SavedScan[]>([]);
  const [saveTitle, setSaveTitle] = useState("");
  const [learnedRules, setLearnedRules] = useState<LearnedRule[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_THEME);
    if (savedTheme === "dark") setDarkMode(true);

    const savedAllergies = localStorage.getItem(STORAGE_ALLERGIES);
    if (savedAllergies) setAllergies(savedAllergies);

    try {
      const rawSaved = localStorage.getItem(STORAGE_SAVED);
      if (rawSaved) setSavedScans(JSON.parse(rawSaved));
    } catch {
      setSavedScans([]);
    }

    try {
      const rawLearned = localStorage.getItem(STORAGE_LEARNED);
      if (rawLearned) setLearnedRules(JSON.parse(rawLearned));
    } catch {
      setLearnedRules([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_THEME, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_ALLERGIES, allergies);
  }, [allergies]);

  function persistSaved(next: SavedScan[]) {
    setSavedScans(next);
    localStorage.setItem(STORAGE_SAVED, JSON.stringify(next));
  }

  function persistLearned(next: LearnedRule[]) {
    setLearnedRules(next);
    localStorage.setItem(STORAGE_LEARNED, JSON.stringify(next));
  }

  function deleteSaved(id: string) {
    persistSaved(savedScans.filter((s) => s.id !== id));
  }

  function loadSaved(scan: SavedScan) {
    setAllergies(scan.allergies);
    setMenuUrl(scan.menuUrl);
    setMenu(scan.menu);
    setClicked(true);
    setActiveTab("home");
    setSaveTitle(scan.title);
  }

  function upsertLearnedRule(
    outcome: "safe" | "avoid" | "unsure",
    item: string,
    allergen?: string
  ) {
    const normalizedItem = normalize(item);

    const nextRule: LearnedRule = {
      id: makeId(),
      item,
      normalizedItem,
      outcome,
      allergen,
      createdAt: Date.now(),
    };

    const filtered = learnedRules.filter((r) => r.normalizedItem !== normalizedItem);
    persistLearned([nextRule, ...filtered]);
  }

  function findLearnedRule(item: string) {
    return learnedRules.find((r) => r.normalizedItem === normalize(item));
  }

  const avoidAllergens = useMemo(() => {
    return allergies.split(",").map((a) => normalize(a)).filter(Boolean);
  }, [allergies]);

  const menuItems = useMemo(() => {
    return menu.split("\n").map((m) => m.trim()).filter(Boolean);
  }, [menu]);

  const filteredMenus = useMemo(() => {
    const q = normalize(restaurantSearch);
    if (!q) return TEXT_MENUS;

    return TEXT_MENUS.filter((m) => {
      const haystack = normalize(`${m.restaurant} ${m.category} ${m.items.join(" ")}`);
      return haystack.includes(q);
    });
  }, [restaurantSearch]);

  useEffect(() => {
    if (!filteredMenus.length) return;
    if (!filteredMenus.some((m) => m.id === selectedMenuId)) {
      setSelectedMenuId(filteredMenus[0].id);
    }
  }, [filteredMenus, selectedMenuId]);

  const selectedMenu = useMemo(() => {
    return (
      filteredMenus.find((m) => m.id === selectedMenuId) ??
      TEXT_MENUS.find((m) => m.id === selectedMenuId) ??
      null
    );
  }, [filteredMenus, selectedMenuId]);

  async function fetchMenuFromUrl() {
    setFetchError(null);
    const url = menuUrl.trim();

    if (!url) {
      setFetchError("Paste a menu URL first.");
      return;
    }

    setIsFetching(true);
    try {
      const res = await fetch("/api/fetch-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFetchError(data?.error ?? "Fetch failed");
        return;
      }

      const lines: string[] = data.menuLines ?? [];
      if (!lines.length) {
        setFetchError("Couldn’t detect menu lines on that page. Try another page.");
        return;
      }

      setMenu(lines.join("\n"));
      setClicked(false);
      setSaveTitle(url ? "Menu from URL" : "");
    } catch (err: any) {
      setFetchError(err?.message ?? "Network error");
    } finally {
      setIsFetching(false);
    }
  }

  function loadSelectedRestaurant() {
    if (!selectedMenu) return;
    setMenu(buildScanInput(selectedMenu));
    setMenuUrl(selectedMenu.url ?? "");
    setClicked(false);
    setFetchError(null);
    setSaveTitle(selectedMenu.restaurant);
  }

  function quickLoadRestaurant(menuSourceId: string) {
    const target = TEXT_MENUS.find((m) => m.id === menuSourceId);
    if (!target) return;

    setSelectedMenuId(target.id);
    setRestaurantSearch(target.restaurant);
    setMenu(buildScanInput(target));
    setMenuUrl(target.url ?? "");
    setClicked(false);
    setFetchError(null);
    setSaveTitle(target.restaurant);
  }

  function clearMenu() {
    setMenu("");
    setMenuUrl("");
    setClicked(false);
    setFetchError(null);
  }

  function buildStaffQuestions(params: {
    item: string;
    myAllergies: string[];
    hitAllergens: string[];
    inferredHitAllergens: string[];
    triggers: string[];
    vague: boolean;
  }): string[] {
    const { myAllergies, hitAllergens, inferredHitAllergens, triggers, vague } = params;

    const relevant = Array.from(
      new Set([...hitAllergens, ...inferredHitAllergens].filter(Boolean))
    );

    const list = relevant.length ? relevant : myAllergies;
    const qs: string[] = [];

    qs.push(`Can you confirm if this contains any of: ${list.join(", ")}?`);
    if (triggers.length) {
      qs.push(`The menu mentions: ${triggers.join(", ")} — can you confirm ingredients for those?`);
    }
    if (vague) {
      qs.push("It has a sauce/seasoning listed — can the kitchen check what’s in it?");
    }
    qs.push("Is there risk of cross-contact (shared fryer/grill, shared utensils, butter on grill)?");
    qs.push("If unsure, could the kitchen check the ingredient list or recipe card?");

    return qs;
  }

  function confidenceFor(params: {
    hasExplicitAllergen: boolean;
    hasExplicitTrigger: boolean;
    hasInferredAllergen: boolean;
    isVague: boolean;
  }): Confidence {
    if (params.hasExplicitAllergen || params.hasExplicitTrigger) return "High";
    if (params.hasInferredAllergen) return "Medium";
    if (params.isVague) return "Low";
    return "Low";
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  }

  function questionsText(item: string, qs: string[]) {
    const allergyLine = avoidAllergens.length ? avoidAllergens.join(", ") : "(none)";
    return `Hi! I have food allergies (${allergyLine}).\n\nItem: "${item}"\n\n${qs.map((q) => `• ${q}`).join("\n")}`;
  }

  const results: Results = useMemo(() => {
    const safe: Row[] = [];
    const ask: Row[] = [];
    const avoid: AvoidRow[] = [];

    for (const item of menuItems) {
      const { allergens, hits } = detectAllergensFromLine(item);
      const detected = allergens.map((a) => String(a));

      const guesses = inferFromDishName(item);
      const keywordAllergens = inferAllergensFromKeywords(item);
      const inferredAllergens = Array.from(
        new Set([
          ...guesses.flatMap((g) => g.inferredAllergens),
          ...keywordAllergens,
        ])
      );
      const inferredReasons = guesses.map((g) => g.reason);

      const hitsAllergens = avoidAllergens.filter((a) => detected.includes(a));
      const inferredHitsAllergens = avoidAllergens.filter((a) => inferredAllergens.includes(a));
      const vague = VAGUE_WORDS.some((v) => normalize(item).includes(v));
      const learned = findLearnedRule(item);

      if (learned) {
        const learnedReason =
          learned.outcome === "safe"
            ? "Previously confirmed safe by you"
            : learned.outcome === "unsure"
            ? "Previously marked as not sure by you"
            : `Previously confirmed by you to contain ${learned.allergen ?? "an allergen"}`;

        const learnedConfidence: Confidence = learned.outcome === "safe" ? "Medium" : "High";

        if (learned.outcome === "safe") {
          safe.push({
            item,
            detected,
            hits,
            inferredAllergens,
            inferredReasons: [learnedReason, ...inferredReasons],
            confidence: learnedConfidence,
            staffQuestions: [],
            learned: true,
          });
          continue;
        }

        if (learned.outcome === "unsure") {
          ask.push({
            item,
            detected,
            hits,
            inferredAllergens,
            inferredReasons: [learnedReason, ...inferredReasons],
            confidence: learnedConfidence,
            staffQuestions: buildStaffQuestions({
              item,
              myAllergies: avoidAllergens,
              hitAllergens: [],
              inferredHitAllergens: [],
              triggers: hits,
              vague: true,
            }),
            learned: true,
          });
          continue;
        }

        avoid.push({
          item,
          detected,
          hits,
          hitsAllergens: learned.allergen ? [learned.allergen] : ["avoid"],
          inferredAllergens,
          inferredReasons: [learnedReason, ...inferredReasons],
          confidence: learnedConfidence,
          staffQuestions: buildStaffQuestions({
            item,
            myAllergies: avoidAllergens,
            hitAllergens: learned.allergen ? [learned.allergen] : [],
            inferredHitAllergens: [],
            triggers: hits,
            vague,
          }),
          learned: true,
        });
        continue;
      }

      const conf = confidenceFor({
        hasExplicitAllergen: hitsAllergens.length > 0,
        hasExplicitTrigger: hits.length > 0,
        hasInferredAllergen: inferredHitsAllergens.length > 0,
        isVague: vague,
      });

      const staffQuestions = buildStaffQuestions({
        item,
        myAllergies: avoidAllergens,
        hitAllergens: hitsAllergens,
        inferredHitAllergens: inferredHitsAllergens,
        triggers: hits,
        vague,
      });

      if (hitsAllergens.length) {
        avoid.push({
          item,
          detected,
          hits,
          hitsAllergens,
          inferredAllergens,
          inferredReasons,
          confidence: conf,
          staffQuestions,
        });
      } else if (vague || inferredHitsAllergens.length) {
        ask.push({
          item,
          detected,
          hits,
          inferredAllergens,
          inferredReasons,
          confidence: conf,
          staffQuestions,
        });
      } else {
        safe.push({
          item,
          detected,
          hits,
          inferredAllergens,
          inferredReasons,
          confidence: conf,
          staffQuestions,
        });
      }
    }

    return { safe, ask, avoid };
  }, [menuItems, avoidAllergens, learnedRules]);

  function saveCurrentScan() {
    if (!clicked) return;

    const title =
      saveTitle.trim() ||
      selectedMenu?.restaurant ||
      (menuUrl.trim() ? "Menu from URL" : "Saved scan");

    const scan: SavedScan = {
      id: makeId(),
      createdAt: Date.now(),
      title,
      allergies,
      menuUrl,
      menu,
      results,
    };

    persistSaved([scan, ...savedScans].slice(0, 50));
    setActiveTab("saved");
  }

  const t = useMemo(() => {
    const bg = darkMode ? "#101010" : "#f7f7f7";
    const card = darkMode ? "#181818" : "#ffffff";
    const soft = darkMode ? "#222222" : "#f2f2f2";
    const border = darkMode ? "#2b2b2b" : "#ececec";
    const text = darkMode ? "#fafafa" : "#191919";
    const sub = darkMode ? "#b9b9b9" : "#6b6b6b";
    const accent = "#eb1700";
    const accentSoft = darkMode ? "rgba(235,23,0,0.16)" : "#fff1ef";
    const yellow = darkMode ? "#2d2613" : "#fff7db";
    const yellowBorder = darkMode ? "#58481f" : "#f4dd8d";
    const redSoft = darkMode ? "#311716" : "#fff1f0";
    const redBorder = darkMode ? "#63302d" : "#f3c5c0";
    return { bg, card, soft, border, text, sub, accent, accentSoft, yellow, yellowBorder, redSoft, redBorder };
  }, [darkMode]);

  function shell(children: React.ReactNode) {
    return (
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.border}`,
          borderRadius: 20,
          padding: 16,
          boxShadow: darkMode ? "none" : "0 1px 2px rgba(0,0,0,0.03)",
        }}
      >
        {children}
      </div>
    );
  }

  function pill(label: string, active?: boolean) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          borderRadius: 999,
          background: active ? t.accentSoft : t.soft,
          color: active ? t.accent : t.text,
          fontSize: 12,
          fontWeight: 800,
          border: `1px solid ${active ? "transparent" : t.border}`,
        }}
      >
        {label}
      </span>
    );
  }

  function navButton(id: ActiveTab, label: string, emoji: string) {
    const active = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          background: "transparent",
          color: active ? t.accent : t.sub,
          padding: "8px 6px",
          fontWeight: 800,
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span style={{ fontSize: 18 }}>{emoji}</span>
        <span>{label}</span>
      </button>
    );
  }

  function confidenceBadge(c: Confidence) {
    const styleMap: Record<Confidence, { bg: string; color: string; border: string }> = {
      High: { bg: t.redSoft, color: "#d93025", border: t.redBorder },
      Medium: { bg: t.yellow, color: darkMode ? "#f6d365" : "#8a6700", border: t.yellowBorder },
      Low: { bg: t.soft, color: t.sub, border: t.border },
    };

    const s = styleMap[c];

    return (
      <span
        style={{
          whiteSpace: "nowrap",
          fontSize: 11,
          fontWeight: 900,
          padding: "5px 9px",
          borderRadius: 999,
          background: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
        }}
      >
        {c}
      </span>
    );
  }

  function StaffQuestionsBlock({ row }: { row: Row }) {
    const qs = row.staffQuestions;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: t.sub, marginBottom: 8 }}>What to ask staff</div>
        <div style={{ display: "grid", gap: 6 }}>
          {qs.slice(0, 3).map((q, idx) => (
            <div key={idx} style={{ fontSize: 12, color: t.sub, lineHeight: 1.4 }}>
              • {q}
            </div>
          ))}
        </div>
        <button
          onClick={() => copyText(questionsText(row.item, qs))}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "12px 14px",
            borderRadius: 14,
            border: `1px solid ${t.border}`,
            background: darkMode ? t.soft : "#fff",
            color: t.text,
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Copy Questions
        </button>
      </div>
    );
  }

  function LearnModeBlock({ row }: { row: Row }) {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: t.sub, marginBottom: 8 }}>Learn from this result</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button
            onClick={() => upsertLearnedRule("safe", row.item)}
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              border: `1px solid ${t.border}`,
              background: darkMode ? "#183122" : "#eefbf3",
              color: darkMode ? "#8be2ab" : "#166534",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Safe
          </button>
          <button
            onClick={() => upsertLearnedRule("unsure", row.item)}
            style={{
              padding: "10px 12px",
              borderRadius: 999,
              border: `1px solid ${t.border}`,
              background: t.yellow,
              color: darkMode ? "#f6d365" : "#8a6700",
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            Unsure
          </button>
          {avoidAllergens.map((a) => (
            <button
              key={a}
              onClick={() => upsertLearnedRule("avoid", row.item, a)}
              style={{
                padding: "10px 12px",
                borderRadius: 999,
                border: `1px solid ${t.border}`,
                background: t.redSoft,
                color: "#d93025",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
    );
  }

  function ResultSection({
    title,
    emoji,
    rows,
    tone,
  }: {
    title: string;
    emoji: string;
    rows: Array<Row | AvoidRow>;
    tone: "safe" | "ask" | "avoid";
  }) {
    const toneBg =
      tone === "ask" ? t.yellow : tone === "avoid" ? t.redSoft : t.card;
    const toneBorder =
      tone === "ask" ? t.yellowBorder : tone === "avoid" ? t.redBorder : t.border;

    return shell(
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: tone === "safe" ? t.soft : toneBg,
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              {emoji}
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
              <div style={{ fontSize: 12, color: t.sub }}>{rows.length} items</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {rows.length === 0 && <div style={{ fontSize: 13, color: t.sub }}>No items here yet.</div>}
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${toneBorder}`,
                background: tone === "safe" ? t.soft : toneBg,
                borderRadius: 18,
                padding: 14,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 900, lineHeight: 1.35 }}>{r.item}</div>
                {confidenceBadge(r.confidence)}
              </div>

              {r.learned && (
                <div style={{ fontSize: 11, color: t.sub, marginTop: 6, fontWeight: 800 }}>
                  Learned from your history
                </div>
              )}

              {tone === "ask" && (
                <div style={{ fontSize: 12, color: darkMode ? "#f6d365" : "#8a6700", marginTop: 8, lineHeight: 1.4 }}>
                  Reason: {r.inferredReasons.length ? r.inferredReasons.join(" | ") : "Vague ingredients"}
                </div>
              )}

              {tone === "avoid" && "hitsAllergens" in r && (
                <div style={{ fontSize: 12, color: "#d93025", marginTop: 8, fontWeight: 900 }}>
                  Contains: {r.hitsAllergens.join(", ")}
                </div>
              )}

              <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                <div style={{ fontSize: 12, color: t.sub }}>Detected: {r.detected.length ? r.detected.join(", ") : "none"}</div>
                <div style={{ fontSize: 12, color: t.sub }}>Triggers: {r.hits.length ? r.hits.join(", ") : "none"}</div>
                <div style={{ fontSize: 12, color: t.sub }}>Inferred: {r.inferredAllergens.length ? r.inferredAllergens.join(", ") : "none"}</div>
              </div>

              {tone !== "safe" && <StaffQuestionsBlock row={r} />}
              {tone === "ask" && <LearnModeBlock row={r} />}
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 90,
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", padding: 14 }}>
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.border}`,
            borderRadius: 24,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: t.sub, fontWeight: 700 }}>AllergEats</div>
              <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.05, marginTop: 6 }}>
                Allergy-Safe
                <br />
                Food Finder
              </div>
              <div style={{ fontSize: 13, color: t.sub, marginTop: 10, lineHeight: 1.45 }}>
                Search a restaurant, load a menu, and sort dishes into safe, ask, and avoid.
              </div>
            </div>

            <button
              onClick={() => setDarkMode((v) => !v)}
              style={{
                border: `1px solid ${t.border}`,
                background: t.soft,
                color: t.text,
                borderRadius: 999,
                padding: "10px 12px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              {darkMode ? "Dark" : "Light"}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
            {pill(`${avoidAllergens.length || 0} allergens`, true)}
            {pill(`${TEXT_MENUS.length} restaurants`)}
            {pill(clicked ? "Analysis ready" : "Ready to scan")}
          </div>
        </div>

        {activeTab === "home" && (
          <>
            {shell(
              <>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Your allergies</div>
                <input
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="dairy, egg, soy"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${t.border}`,
                    background: t.soft,
                    color: t.text,
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
                  {["dairy", "egg", "soy", "wheat", "fish", "shellfish", "nuts", "sesame", "corn", "mustard"].map((a) => {
                    const active = avoidAllergens.includes(a);
                    return (
                      <button
                        key={a}
                        onClick={() => {
                          const set = new Set(avoidAllergens);
                          if (active) set.delete(a);
                          else set.add(a);
                          setAllergies(Array.from(set).join(", "));
                        }}
                        style={{
                          border: `1px solid ${active ? "transparent" : t.border}`,
                          background: active ? t.accent : t.soft,
                          color: active ? "#fff" : t.text,
                          borderRadius: 999,
                          padding: "10px 12px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {active ? "✓ " : ""}
                        {a}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{ height: 14 }} />

            {shell(
              <>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Find a restaurant</div>
                <input
                  value={restaurantSearch}
                  onChange={(e) => setRestaurantSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedMenu) loadSelectedRestaurant();
                  }}
                  placeholder="Search Chipotle, Subway, McDonald's..."
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${t.border}`,
                    background: t.soft,
                    color: t.text,
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 15,
                    outline: "none",
                  }}
                />

                <div style={{ marginTop: 10, fontSize: 12, color: t.sub }}>
                  {filteredMenus.length} match{filteredMenus.length === 1 ? "" : "es"} found
                </div>

                <select
                  value={selectedMenuId}
                  onChange={(e) => setSelectedMenuId(e.target.value)}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    boxSizing: "border-box",
                    border: `1px solid ${t.border}`,
                    background: t.soft,
                    color: t.text,
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 15,
                    outline: "none",
                  }}
                  disabled={!filteredMenus.length}
                >
                  {filteredMenus.length ? (
                    filteredMenus.map((menuOption) => (
                      <option key={menuOption.id} value={menuOption.id}>
                        {menuOption.restaurant} — {menuOption.category}
                      </option>
                    ))
                  ) : (
                    <option value="">No restaurants found</option>
                  )}
                </select>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                  <button
                    onClick={loadSelectedRestaurant}
                    disabled={!selectedMenu}
                    style={{
                      border: "none",
                      background: selectedMenu ? t.accent : "#9f9f9f",
                      color: "#fff",
                      borderRadius: 16,
                      padding: "14px 12px",
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: selectedMenu ? "pointer" : "not-allowed",
                    }}
                  >
                    Load menu
                  </button>
                  <button
                    onClick={clearMenu}
                    style={{
                      border: `1px solid ${t.border}`,
                      background: t.soft,
                      color: t.text,
                      borderRadius: 16,
                      padding: "14px 12px",
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingTop: 12, marginTop: 4 }}>
                  {TEXT_MENUS.slice(0, 6).map((menuOption) => (
                    <button
                      key={menuOption.id}
                      onClick={() => quickLoadRestaurant(menuOption.id)}
                      style={{
                        border: `1px solid ${t.border}`,
                        background: t.soft,
                        color: t.text,
                        borderRadius: 999,
                        padding: "10px 12px",
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {menuOption.restaurant}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div style={{ height: 14 }} />

            {shell(
              <>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 10 }}>Paste a menu URL</div>
                <input
                  value={menuUrl}
                  onChange={(e) => setMenuUrl(e.target.value)}
                  placeholder="https://restaurant.com/menu"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    border: `1px solid ${t.border}`,
                    background: t.soft,
                    color: t.text,
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <button
                  onClick={fetchMenuFromUrl}
                  disabled={isFetching}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    border: "none",
                    background: isFetching ? "#9f9f9f" : t.accent,
                    color: "#fff",
                    borderRadius: 16,
                    padding: "14px 12px",
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: isFetching ? "not-allowed" : "pointer",
                  }}
                >
                  {isFetching ? "Fetching..." : "Fetch menu"}
                </button>

                {fetchError && (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 12,
                      borderRadius: 14,
                      border: `1px solid ${t.redBorder}`,
                      background: t.redSoft,
                      color: "#d93025",
                      fontSize: 13,
                    }}
                  >
                    {fetchError}
                  </div>
                )}
              </>
            )}

            <div style={{ height: 14 }} />

            {shell(
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900 }}>Menu text</div>
                    <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>Paste or edit menu lines here.</div>
                  </div>
                  {pill(`${menuItems.length} items`, true)}
                </div>
                <textarea
                  value={menu}
                  onChange={(e) => setMenu(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    minHeight: 220,
                    resize: "vertical",
                    border: `1px solid ${t.border}`,
                    background: t.soft,
                    color: t.text,
                    borderRadius: 18,
                    padding: 14,
                    fontSize: 15,
                    lineHeight: 1.5,
                    outline: "none",
                  }}
                />
              </>
            )}

            <div style={{ height: 14 }} />

            {shell(
              <>
                <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>Analyze</div>
                <div style={{ fontSize: 13, color: t.sub, marginBottom: 12 }}>
                  We’ll sort the menu into safe, ask staff, and avoid.
                </div>
                <button
                  onClick={() => setClicked(true)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: t.accent,
                    color: "#fff",
                    borderRadius: 18,
                    padding: "16px 14px",
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                  }}
                >
                  Analyze menu
                </button>
                <input
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="Optional title"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    marginTop: 10,
                    border: `1px solid ${t.border}`,
                    background: t.soft,
                    color: t.text,
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <button
                  onClick={saveCurrentScan}
                  disabled={!clicked}
                  style={{
                    width: "100%",
                    marginTop: 10,
                    border: `1px solid ${t.border}`,
                    background: clicked ? t.soft : t.card,
                    color: clicked ? t.text : t.sub,
                    borderRadius: 16,
                    padding: "14px 12px",
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: clicked ? "pointer" : "not-allowed",
                  }}
                >
                  Save scan
                </button>
              </>
            )}

            {clicked && (
              <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
                <ResultSection title="Safe" emoji="✅" rows={results.safe} tone="safe" />
                <ResultSection title="Ask Staff" emoji="⚠️" rows={results.ask} tone="ask" />
                <ResultSection title="Avoid" emoji="❌" rows={results.avoid} tone="avoid" />
              </div>
            )}

            <p style={{ marginTop: 16, fontSize: 12, color: t.sub, textAlign: "center", lineHeight: 1.5 }}>
              Always confirm allergens with restaurant staff.
            </p>
          </>
        )}

        {activeTab === "saved" &&
          shell(
            <>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Saved scans</div>
              <div style={{ fontSize: 13, color: t.sub, marginBottom: 12 }}>Quick access to menus you already checked.</div>
              <div style={{ display: "grid", gap: 10 }}>
                {savedScans.length === 0 && <div style={{ fontSize: 13, color: t.sub }}>No saved scans yet.</div>}
                {savedScans.map((s) => (
                  <div key={s.id} style={{ border: `1px solid ${t.border}`, borderRadius: 18, background: t.soft, padding: 14 }}>
                    <div style={{ fontWeight: 900 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>{formatDate(s.createdAt)}</div>
                    <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>
                      Results: ✅ {s.results.safe.length} • ⚠️ {s.results.ask.length} • ❌ {s.results.avoid.length}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                      <button
                        onClick={() => loadSaved(s)}
                        style={{ border: "none", background: t.accent, color: "#fff", borderRadius: 14, padding: "12px 10px", fontWeight: 900, cursor: "pointer" }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => deleteSaved(s.id)}
                        style={{ border: `1px solid ${t.border}`, background: t.card, color: t.text, borderRadius: 14, padding: "12px 10px", fontWeight: 900, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

        {activeTab === "profile" &&
          shell(
            <>
              <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>Profile</div>
              <div style={{ fontSize: 13, color: t.sub, marginBottom: 12 }}>Your learned dish history and saved preferences.</div>
              <div style={{ display: "grid", gap: 10 }}>
                {learnedRules.length === 0 && <div style={{ fontSize: 13, color: t.sub }}>No learned rules yet.</div>}
                {learnedRules.map((rule) => (
                  <div key={rule.id} style={{ border: `1px solid ${t.border}`, borderRadius: 18, background: t.soft, padding: 14 }}>
                    <div style={{ fontWeight: 900 }}>{rule.item}</div>
                    <div style={{ fontSize: 12, color: t.sub, marginTop: 4 }}>
                      Outcome: {rule.outcome}
                      {rule.allergen ? ` (${rule.allergen})` : ""}
                    </div>
                    <button
                      onClick={() => persistLearned(learnedRules.filter((r) => r.id !== rule.id))}
                      style={{
                        width: "100%",
                        marginTop: 12,
                        border: `1px solid ${t.border}`,
                        background: t.card,
                        color: t.text,
                        borderRadius: 14,
                        padding: "12px 10px",
                        fontWeight: 900,
                        cursor: "pointer",
                      }}
                    >
                      Delete rule
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
      </div>

      <div
        style={{
          position: "fixed",
          left: 12,
          right: 12,
          bottom: 12,
          background: darkMode ? "rgba(24,24,24,0.96)" : "rgba(255,255,255,0.96)",
          border: `1px solid ${t.border}`,
          backdropFilter: "blur(14px)",
          borderRadius: 22,
          display: "flex",
          padding: 8,
          zIndex: 20,
        }}
      >
        {navButton("home", "Home", "🏠")}
        {navButton("saved", "Saved", "🧾")}
        {navButton("profile", "Profile", "👤")}
      </div>
    </main>
  );
}
