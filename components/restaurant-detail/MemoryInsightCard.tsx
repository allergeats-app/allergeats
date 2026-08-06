"use client";

import type { MemoryInsight } from "@/lib/learning/types";

export function MemoryInsightCard({ insight }: { insight: MemoryInsight }) {
  return (
    <div style={{
      background: "var(--c-card)", border: "1px solid var(--c-border)",
      borderRadius: 14, padding: "12px 14px",
      display: "flex", alignItems: "flex-start", gap: 12,
    }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: "var(--c-text)", lineHeight: 1.3 }}>
          {insight.title}
        </div>
        <div style={{ fontSize: 14, color: "var(--c-sub)", marginTop: 4, lineHeight: 1.5 }}>
          {insight.description}
        </div>
      </div>
      <span style={{
        flexShrink: 0, padding: "3px 9px", borderRadius: 999,
        background: `${insight.badgeColor}20`,
        color: insight.badgeColor,
        border: `1px solid ${insight.badgeColor}40`,
        fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
      }}>
        {insight.badgeLabel}
      </span>
    </div>
  );
}
