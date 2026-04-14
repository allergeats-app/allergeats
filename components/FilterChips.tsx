"use client";

type Chip<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  chips: Chip<T>[];
  active: T;
  onChange: (value: T) => void;
};

export function FilterChips<T extends string>({ chips, active, onChange }: Props<T>) {
  return (
    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
      {chips.map((chip) => {
        const isActive = chip.value === active;
        return (
          <button
            key={chip.value}
            onClick={() => onChange(chip.value)}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1.5px solid ${isActive ? "#1fbdcc" : "#e5e7eb"}`,
              background: isActive ? "#1fbdcc" : "#fff",
              color: isActive ? "#fff" : "#374151",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "background 0.15s",
              flexShrink: 0,
            }}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
