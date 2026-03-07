"use client";

import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

type Props = {
  selected: AllergenId[];
  onChange: (next: AllergenId[]) => void;
};

export function AllergySelector({ selected, onChange }: Props) {
  function toggle(id: AllergenId) {
    const set = new Set(selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange([...set]);
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {ALLERGEN_LIST.map(({ id, label }) => {
        const active = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            style={{
              padding: "9px 13px",
              borderRadius: 999,
              border: `1.5px solid ${active ? "transparent" : "var(--c-border)"}`,
              background: active ? "#eb1700" : "var(--c-muted)",
              color: active ? "#fff" : "var(--c-text)",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
