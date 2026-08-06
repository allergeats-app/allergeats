"use client";

import { trackEvent } from "@/lib/analytics";
import type { TypeFilter } from "@/app/restaurants/types";

const CHIPS: { value: TypeFilter; label: string }[] = [
  { value: "all",        label: "All" },
  { value: "burgers",    label: "Burgers" },
  { value: "chicken",    label: "Chicken" },
  { value: "mexican",    label: "Mexican" },
  { value: "pizza",      label: "Pizza" },
  { value: "asian",      label: "Asian" },
  { value: "sandwiches", label: "Sandwiches" },
  { value: "seafood",    label: "Seafood" },
  { value: "italian",    label: "Italian" },
  { value: "coffee",     label: "Coffee" },
];

export function CuisineChipRow({
  typeFilter,
  setTypeFilter,
}: {
  typeFilter: TypeFilter;
  setTypeFilter: (v: TypeFilter) => void;
}) {
  return (
    <div className="chip-row" style={{
      margin: "12px -16px 0",
      padding: "2px 16px 4px",
      display: "flex", gap: 8,
    }}>
      {CHIPS.map(({ value, label }) => {
        const active = typeFilter === value;
        return (
          <button
            key={value}
            onClick={() => { trackEvent("cuisine_chip_tap", { cuisine: value }); setTypeFilter(value); }}
            aria-pressed={active}
            style={{
              flexShrink: 0, height: 44,
              padding: "0 14px",
              borderRadius: 999, border: "none",
              background: active ? "var(--c-brand)" : "var(--c-card)",
              color: active ? "var(--c-brand-fg)" : "var(--c-text)",
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              boxShadow: active ? "none" : "0 1px 3px rgba(0,0,0,0.07)",
              outline: active ? "none" : "1px solid var(--c-border)",
              transition: "background 0.15s, color 0.15s",
              WebkitTapHighlightColor: "transparent",
              touchAction: "manipulation",
            }}
          >
            {label}
          </button>
        );
      })}
      <div style={{ flexShrink: 0, width: 8 }} />
    </div>
  );
}
