"use client";

export function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 12px" }}>
      <span style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)", letterSpacing: "-0.02em" }}>{label}</span>
      {count != null && (
        <span style={{
          fontSize: 12, fontWeight: 700, color: "var(--c-sub)",
          background: "var(--c-muted)", borderRadius: 999,
          padding: "2px 8px",
        }}>
          {count}
        </span>
      )}
    </div>
  );
}
