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
      {ALLERGEN_LIST.map(({ id, label, emoji }) => {
        const active = selected.includes(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "9px 13px",
              borderRadius: 999,
              border: `1.5px solid ${active ? "transparent" : "#e5e7eb"}`,
              background: active ? "#eb1700" : "#f5f5f5",
              color: active ? "#fff" : "#191919",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
            }}
          >
            <span>{emoji}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
