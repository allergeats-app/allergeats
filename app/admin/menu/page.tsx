"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import {
  getCorrectionForItem,
  saveCorrection,
  removeCorrection,
  getAllCorrections,
  exportCorrections,
} from "@/lib/adminCorrections";
import type { AllergenId } from "@/lib/types";

const SESSION_KEY = "allegeats_admin_authed";

export default function AdminMenuPage() {
  const params = useSearchParams();
  const router = useRouter();
  const restaurantId = params.get("id") ?? "";

  const [authed, setAuthed] = useState(false);
  const [search, setSearch] = useState("");
  const [filterUncorrected, setFilterUncorrected] = useState(false);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") setAuthed(true);
    else router.replace("/admin");
  }, [router]);

  const restaurant = MOCK_RESTAURANTS.find((r) => r.id === restaurantId);

  const [itemState, setItemState] = useState<
    Record<string, { allergens: Set<AllergenId>; notes: string; dirty: boolean }>
  >({});

  useEffect(() => {
    if (!restaurant) return;
    const init: typeof itemState = {};
    for (const item of restaurant.menuItems) {
      const correction = getCorrectionForItem(restaurant.id, item.id);
      const base = correction
        ? correction.allergens
        : ((item.allergens ?? []) as AllergenId[]);
      init[item.id] = { allergens: new Set(base), notes: correction?.auditNotes ?? "", dirty: false };
    }
    setItemState(init);
  }, [restaurant]);

  const toggleAllergen = useCallback((itemId: string, allergenId: AllergenId) => {
    setItemState((prev) => {
      const cur = prev[itemId];
      if (!cur) return prev;
      const next = new Set(cur.allergens);
      if (next.has(allergenId)) next.delete(allergenId); else next.add(allergenId);
      return { ...prev, [itemId]: { ...cur, allergens: next, dirty: true } };
    });
  }, []);

  const setNotes = useCallback((itemId: string, notes: string) => {
    setItemState((prev) => {
      const cur = prev[itemId];
      if (!cur) return prev;
      return { ...prev, [itemId]: { ...cur, notes, dirty: true } };
    });
  }, []);

  function saveItem(itemId: string) {
    if (!restaurant) return;
    const state = itemState[itemId];
    if (!state) return;
    const item = restaurant.menuItems.find((i) => i.id === itemId);
    if (!item) return;
    saveCorrection({
      restaurantId: restaurant.id,
      itemId,
      allergens: [...state.allergens],
      auditNotes: state.notes || undefined,
      verifiedAt: new Date().toISOString().slice(0, 10),
    });
    setItemState((prev) => ({ ...prev, [itemId]: { ...prev[itemId], dirty: false } }));
    setSaved((prev) => ({ ...prev, [itemId]: true }));
    setTimeout(() => setSaved((prev) => ({ ...prev, [itemId]: false })), 1500);
  }

  function resetItem(itemId: string) {
    if (!restaurant) return;
    const item = restaurant.menuItems.find((i) => i.id === itemId);
    if (!item) return;
    removeCorrection(restaurant.id, itemId);
    const base = (item.allergens ?? []) as AllergenId[];
    setItemState((prev) => ({ ...prev, [itemId]: { allergens: new Set(base), notes: "", dirty: false } }));
  }

  function download() {
    const blob = new Blob([exportCorrections()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `allergeats-corrections-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!authed || !restaurant) return null;

  const allCorrections = getAllCorrections();
  const correctedIds = new Set(
    Object.keys(allCorrections).filter((k) => k.startsWith(restaurant.id + "::")).map((k) => k.split("::")[1])
  );

  const items = restaurant.menuItems.filter((item) => {
    const q = search.toLowerCase();
    const match = !q || item.name.toLowerCase().includes(q) || (item.category ?? "").toLowerCase().includes(q);
    const uncorrectedOnly = !filterUncorrected || !correctedIds.has(item.id);
    return match && uncorrectedOnly;
  });

  const verifiedCount = correctedIds.size;
  const totalCount = restaurant.menuItems.length;
  const pct = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;

  return (
    <div style={{ minHeight: "100dvh", background: "#0f0f0f", color: "#f2f2f7", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(15,15,15,0.97)", borderBottom: "1px solid #2c2c2e", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link href="/admin" style={{ color: "#8e8e93", textDecoration: "none", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>← Admin</Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 17, fontWeight: 900, color: "#f2f2f7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{restaurant.name}</div>
            <div style={{ fontSize: 12, color: "#8e8e93" }}>{verifiedCount}/{totalCount} verified · {pct}%</div>
          </div>
        </div>
        <button onClick={download} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #3c3c3e", background: "transparent", color: "#f2f2f7", fontSize: 13, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>
          Export JSON
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#2c2c2e" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "#1fbdcc", transition: "width 0.3s" }} />
      </div>

      {/* Filters */}
      <div style={{ padding: "14px 20px", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search items…"
          style={{ flex: 1, minWidth: 160, padding: "9px 12px", borderRadius: 10, border: "1px solid #3c3c3e", background: "#1c1c1e", color: "#f2f2f7", fontSize: 14, outline: "none" }}
        />
        <button
          onClick={() => setFilterUncorrected(v => !v)}
          style={{ padding: "9px 14px", borderRadius: 10, border: `1px solid ${filterUncorrected ? "#1fbdcc" : "#3c3c3e"}`, background: filterUncorrected ? "rgba(31,189,204,0.1)" : "transparent", color: filterUncorrected ? "#1fbdcc" : "#8e8e93", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
        >
          {filterUncorrected ? "Showing unverified" : "Show unverified only"}
        </button>
      </div>

      {/* Item list */}
      <div style={{ padding: "0 16px", display: "grid", gap: 12 }}>
        {items.map((item) => {
          const state = itemState[item.id];
          if (!state) return null;
          const isVerified = correctedIds.has(item.id);
          const originalAllergens = new Set((item.allergens ?? []) as AllergenId[]);

          return (
            <div key={item.id} style={{
              background: "#1c1c1e",
              border: `1px solid ${isVerified ? "rgba(31,189,204,0.35)" : "#2c2c2e"}`,
              borderRadius: 16,
              padding: 16,
            }}>
              {/* Item header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#f2f2f7" }}>{item.name}</span>
                    {isVerified && <span style={{ fontSize: 11, fontWeight: 700, color: "#1fbdcc", background: "rgba(31,189,204,0.12)", border: "1px solid rgba(31,189,204,0.3)", padding: "2px 8px", borderRadius: 999 }}>Verified</span>}
                    {state.dirty && <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", padding: "2px 8px", borderRadius: 999 }}>Unsaved</span>}
                  </div>
                  {item.category && <div style={{ fontSize: 12, color: "#8e8e93", marginTop: 2 }}>{item.category}</div>}
                  {item.description && <div style={{ fontSize: 12, color: "#636366", marginTop: 3, lineHeight: 1.4 }}>{item.description}</div>}
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {isVerified && (
                    <button onClick={() => resetItem(item.id)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #3c3c3e", background: "transparent", color: "#8e8e93", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => saveItem(item.id)}
                    disabled={!state.dirty && isVerified}
                    style={{
                      padding: "6px 12px", borderRadius: 8, border: "none",
                      background: saved[item.id] ? "#22c55e" : state.dirty ? "#1fbdcc" : "#2c2c2e",
                      color: saved[item.id] || state.dirty ? "#001f26" : "#636366",
                      fontSize: 12, fontWeight: 800, cursor: state.dirty ? "pointer" : "default",
                      transition: "background 0.2s",
                    }}
                  >
                    {saved[item.id] ? "✓ Saved" : isVerified && !state.dirty ? "Verified" : "Save"}
                  </button>
                </div>
              </div>

              {/* Allergen grid */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                {ALLERGEN_LIST.map(({ id, label }) => {
                  const checked = state.allergens.has(id);
                  const wasOriginal = originalAllergens.has(id);
                  const changed = checked !== wasOriginal;
                  return (
                    <button
                      key={id}
                      onClick={() => toggleAllergen(item.id, id)}
                      style={{
                        padding: "6px 12px", borderRadius: 999,
                        border: `1.5px solid ${checked ? (changed ? "#fbbf24" : "#1fbdcc") : "#3c3c3e"}`,
                        background: checked ? (changed ? "rgba(251,191,36,0.15)" : "rgba(31,189,204,0.15)") : "transparent",
                        color: checked ? (changed ? "#fbbf24" : "#1fbdcc") : "#636366",
                        fontSize: 12, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.1s",
                      }}
                    >
                      {checked ? "✓ " : ""}{label}
                    </button>
                  );
                })}
              </div>

              {/* Notes */}
              <input
                value={state.notes}
                onChange={e => setNotes(item.id, e.target.value)}
                placeholder="Audit notes (e.g. 'sesame in bun confirmed Apr 2026')…"
                style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 8, border: "1px solid #3c3c3e", background: "#252528", color: "#f2f2f7", fontSize: 12, outline: "none" }}
              />
            </div>
          );
        })}

        {items.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#636366", fontSize: 14 }}>
            {filterUncorrected ? "All items in this restaurant have been verified." : "No items match your search."}
          </div>
        )}
      </div>
    </div>
  );
}
