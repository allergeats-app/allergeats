"use client";

import { useState } from "react";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

type Props = {
  selected: AllergenId[];
  onChange: (next: AllergenId[]) => void;
  limit?: number;
};

export function AllergySelector({ selected, onChange, limit }: Props) {
  const [expanded, setExpanded] = useState(false);

  function toggle(id: AllergenId) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  }

  const top = limit ? ALLERGEN_LIST.slice(0, limit) : ALLERGEN_LIST;
  const rest = limit ? ALLERGEN_LIST.slice(limit) : [];
  // Always show rest items that are already selected, even when collapsed
  const visibleRest = expanded ? rest : rest.filter((a) => selected.includes(a.id));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {[...top, ...visibleRest].map(({ id, label }) => {
        const active = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            style={{
              padding: "11px 16px",
              borderRadius: 999,
              border: `1.5px solid ${active ? "transparent" : "var(--c-border)"}`,
              background: active ? "#eb1700" : "var(--c-muted)",
              color: active ? "#fff" : "var(--c-text)",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
              minHeight: 44,
            }}
          >
            {label}
          </button>
        );
      })}

      {rest.length > 0 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            padding: "11px 16px",
            borderRadius: 999,
            border: "1.5px dashed var(--c-border)",
            background: "transparent",
            color: "var(--c-sub)",
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            minHeight: 44,
          }}
        >
          {expanded ? "Show Less" : "+ Add More"}
        </button>
      )}
    </div>
  );
}
