"use client";

import { useEffect } from "react";
import { FilterChips } from "@/components/FilterChips";
import type { SortOption, TypeFilter } from "@/app/restaurants/types";

const SORT_CHIPS = [
  { value: "best-match"  as SortOption, label: "Best Match" },
  { value: "distance"    as SortOption, label: "Nearest" },
  { value: "most-safe"   as SortOption, label: "Most Allergy-Friendly" },
  { value: "least-avoid" as SortOption, label: "Lowest Risk" },
  { value: "coverage"    as SortOption, label: "Most Menu Data" },
];

const TYPE_CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "casual",      label: "Casual Dining" },
  { value: "fine-dining", label: "Fine Dining" },
  { value: "steakhouse",  label: "Steakhouse" },
  { value: "seafood",     label: "Seafood" },
  { value: "italian",     label: "Italian" },
  { value: "asian",       label: "Asian" },
  { value: "mexican",     label: "Mexican" },
  { value: "burgers",     label: "Burgers" },
  { value: "chicken",     label: "Chicken" },
  { value: "pizza",       label: "Pizza" },
  { value: "breakfast",   label: "Breakfast" },
  { value: "sandwiches",  label: "Sandwiches" },
  { value: "coffee",      label: "Coffee & Café" },
  { value: "sports-bar",  label: "Sports Bar" },
];

// ── Internal primitives ──────────────────────────────────────────────────────

function DrawerSection({ title, hint, last, action, children }: {
  title: string; hint?: string; last?: boolean; action?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div style={{ paddingBottom: 24, marginBottom: 24, borderBottom: last ? "none" : "1px solid var(--c-border)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {title}
          </div>
          {hint && <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 3 }}>{hint}</div>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      style={{
        width: 46, height: 28, borderRadius: 999, flexShrink: 0,
        background: checked ? "#1fbdcc" : "var(--c-border)",
        border: "none", cursor: "pointer", padding: 0,
        position: "relative", transition: "background 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 4, left: checked ? 22 : 4,
        width: 20, height: 20, borderRadius: 999,
        background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.22)",
        transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
      }} />
    </button>
  );
}

// ── Public component ─────────────────────────────────────────────────────────

export function RestaurantsFilterDrawer({
  open, onClose,
  activeFilterCount, loading, filteredCount,
  sort, setSort,
  typeFilter, setTypeFilter,
  radiusMiles, setRadiusMiles, clearSearchCenter,
  onlyWithMenu, setOnlyWithMenu,
  onlySaved, setOnlySaved,
  onReset,
}: {
  open: boolean; onClose: () => void;
  activeFilterCount: number; loading: boolean; filteredCount: number;
  sort: SortOption; setSort: (v: SortOption) => void;
  typeFilter: TypeFilter; setTypeFilter: (v: TypeFilter) => void;
  radiusMiles: number; setRadiusMiles: (v: number) => void; clearSearchCenter: () => void;
  onlyWithMenu: boolean; setOnlyWithMenu: (v: boolean) => void;
  onlySaved: boolean; setOnlySaved: (v: boolean) => void;
  onReset: () => void;
}) {
  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const toggleRows = [
    { checked: onlyWithMenu, onChange: setOnlyWithMenu, label: "Available Menus Only", hint: "Only restaurants with scored menu items" },
    { checked: onlySaved,    onChange: setOnlySaved,    label: "Saved restaurants",    hint: "Only places you've hearted" },
  ];

  return (
    <>
      {/* Backdrop — always in DOM, opacity animated */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.28s ease",
        }}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 101,
          background: "var(--c-card)",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          boxShadow: "0 -16px 56px rgba(0,0,0,0.2)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: open
            ? "transform 0.38s cubic-bezier(0.22,1,0.36,1)"
            : "transform 0.28s cubic-bezier(0.4,0,1,1)",
          maxHeight: "min(90dvh, calc(100dvh - 60px))",
          display: "flex", flexDirection: "column",
          paddingBottom: "max(16px, env(safe-area-inset-bottom))",
        }}
      >
        {/* Scrollable body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "0 20px", WebkitOverflowScrolling: "touch" } as React.CSSProperties}>

          {/* Drag handle */}
          <div style={{ display: "flex", justifyContent: "center", paddingTop: 14, marginBottom: 2 }}>
            <div style={{ width: 36, height: 4, borderRadius: 999, background: "var(--c-border)" }} />
          </div>

          {/* Sticky inner header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 0 18px",
            position: "sticky", top: 0, zIndex: 1,
            background: "var(--c-card)",
            borderBottom: "1px solid var(--c-border)",
            marginBottom: 24,
          }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)", lineHeight: 1 }}>Filters</div>
              {activeFilterCount > 0 && (
                <div style={{ fontSize: 12, color: "#1fbdcc", fontWeight: 700, marginTop: 3 }}>
                  {activeFilterCount} active
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              style={{
                width: 32, height: 32, borderRadius: 999,
                background: "var(--c-muted)", border: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "var(--c-sub)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Sort */}
          <DrawerSection title="Sort by">
            <FilterChips chips={SORT_CHIPS} active={sort} onChange={setSort} />
          </DrawerSection>

          {/* Cuisine */}
          <DrawerSection title="Cuisine type">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TYPE_CHIPS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setTypeFilter(c.value)}
                  aria-pressed={typeFilter === c.value}
                  style={{
                    padding: "8px 16px", borderRadius: 999,
                    border: `1.5px solid ${typeFilter === c.value ? "var(--c-text)" : "var(--c-border)"}`,
                    background: typeFilter === c.value ? "var(--c-text)" : "transparent",
                    color: typeFilter === c.value ? "var(--c-bg)" : "var(--c-sub)",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Radius */}
          <DrawerSection title="Search radius" hint="Larger radius searches more of the map">
            <div style={{ display: "flex", gap: 8 }} role="group" aria-label="Search radius in miles">
              {[5, 10, 25, 50].map((mi) => (
                <button
                  key={mi}
                  type="button"
                  onClick={() => { clearSearchCenter(); setRadiusMiles(mi); }}
                  aria-pressed={radiusMiles === mi}
                  style={{
                    flex: 1, padding: "12px 0", borderRadius: 14,
                    border: `1.5px solid ${radiusMiles === mi ? "#1fbdcc" : "var(--c-border)"}`,
                    background: radiusMiles === mi ? "#fef2f2" : "transparent",
                    color: radiusMiles === mi ? "#1fbdcc" : "var(--c-sub)",
                    fontSize: 14, fontWeight: 800, cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {mi}
                  <span style={{ fontSize: 11, fontWeight: 600, display: "block", marginTop: 1, opacity: 0.75 }}>mi</span>
                </button>
              ))}
            </div>
          </DrawerSection>

          {/* Show only toggles */}
          <DrawerSection title="Show only" last>
            <div>
              {toggleRows.map(({ checked, onChange, label, hint }, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onChange(!checked)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 12, padding: "14px 0", width: "100%",
                    background: "none", border: "none", textAlign: "left", cursor: "pointer",
                    borderBottom: i < toggleRows.length - 1 ? "1px solid var(--c-border)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "var(--c-text)" }}>{label}</div>
                    <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 2 }}>{hint}</div>
                  </div>
                  <ToggleSwitch checked={checked} onChange={onChange} label={label} />
                </button>
              ))}
            </div>
          </DrawerSection>

        </div>

        {/* Sticky footer */}
        <div style={{
          padding: "14px 20px 36px",
          borderTop: "1px solid var(--c-border)",
          background: "var(--c-card)",
          display: "flex", gap: 10,
        }}>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              style={{
                flex: "0 0 auto", padding: "0 18px", height: 52,
                background: "transparent", border: "1.5px solid var(--c-border)",
                borderRadius: 14, fontSize: 13, fontWeight: 700,
                color: "var(--c-sub)", cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1, padding: "0 20px", height: 52,
              background: "var(--c-text)", color: "var(--c-bg)",
              border: "none", borderRadius: 14,
              cursor: "pointer", display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 1,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>Done</span>
            {!loading && (
              <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.7, lineHeight: 1 }}>
                {filteredCount} restaurant{filteredCount === 1 ? "" : "s"}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
