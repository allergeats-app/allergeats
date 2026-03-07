"use client";

import { useState } from "react";
import type { ScoredMenuItem } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { ConfidenceBadge } from "./ConfidenceBadge";

const RISK_BG: Record<string, string> = {
  "avoid":       "#fff1f0",
  "ask":         "#fff7db",
  "likely-safe": "#f0fdf4",
  "unknown":     "#f9fafb",
};
const RISK_BORDER: Record<string, string> = {
  "avoid":       "#f3c5c0",
  "ask":         "#f4dd8d",
  "likely-safe": "#bbf7d0",
  "unknown":     "#e5e7eb",
};

type Props = { item: ScoredMenuItem };

export function MenuItemCard({ item }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const bg = RISK_BG[item.risk] ?? "#f9fafb";
  const border = RISK_BORDER[item.risk] ?? "#e5e7eb";

  async function copyQuestions() {
    const text = item.staffQuestions.map((q) => `• ${q}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: 14,
        display: "grid",
        gap: 8,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.3, color: "#111" }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3, lineHeight: 1.4 }}>
              {item.description}
            </div>
          )}
        </div>
        <RiskBadge risk={item.risk} />
      </div>

      {/* Explanation */}
      <div style={{ fontSize: 12, color: "#374151", lineHeight: 1.5 }}>{item.explanation}</div>

      {/* User's allergens — shown prominently */}
      {item.userAllergenHits.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af" }}>Contains:</span>
          {item.userAllergenHits.map((a) => (
            <span key={a} style={{ padding: "3px 9px", borderRadius: 999, background: "#fde8e8", border: "1px solid #fca5a5", color: "#b91c1c", fontSize: 11, fontWeight: 800 }}>
              {a}
            </span>
          ))}
        </div>
      )}

      {/* Other allergens not in user's profile */}
      {(() => {
        const others = item.detectedAllergens.filter((a) => !item.userAllergenHits.includes(a));
        const otherInferred = item.inferredAllergens.filter((a) => !item.userAllergenHits.includes(a));
        if (!others.length && !otherInferred.length) return null;
        return (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {others.map((a) => (
              <span key={a} style={{ padding: "3px 8px", borderRadius: 999, background: "#f3f4f6", color: "#6b7280", fontSize: 11, fontWeight: 600 }}>
                {a}
              </span>
            ))}
            {otherInferred.map((a) => (
              <span key={a} style={{ padding: "3px 8px", borderRadius: 999, background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 600 }}>
                ~{a}
              </span>
            ))}
          </div>
        );
      })()}

      {/* Confidence + expand toggle */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <ConfidenceBadge confidence={item.confidence} />
        {item.staffQuestions.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#6b7280",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {expanded ? "Hide questions" : "What to ask →"}
          </button>
        )}
      </div>

      {/* Staff questions */}
      {expanded && item.staffQuestions.length > 0 && (
        <div style={{ marginTop: 4, padding: 12, background: "rgba(255,255,255,0.6)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6b7280", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Ask staff
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {item.staffQuestions.slice(0, 4).map((q, i) => (
              <div key={i} style={{ fontSize: 12, color: "#374151", lineHeight: 1.45 }}>• {q}</div>
            ))}
          </div>
          <button
            onClick={copyQuestions}
            style={{
              marginTop: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {copied ? "Copied!" : "Copy questions"}
          </button>
        </div>
      )}
    </div>
  );
}
