"use client";

import { useState } from "react";
import type { AnalyzedMenuItem } from "@/lib/analysis";
import type { AllergenId } from "@/lib/types";
import type { FeedbackParams } from "@/lib/learning/useRestaurantMemory";
import type { FeedbackType } from "@/lib/learning/types";

const QUICK_FEEDBACK: { type: FeedbackType; label: string }[] = [
  { type: "confirmed-safe",           label: "Was safe for me ✓" },
  { type: "found-unsafe",             label: "Had my allergen ✗" },
  { type: "false-positive",           label: "App wrongly flagged" },
  { type: "needs-staff-confirmation", label: "Ask staff ?" },
];

export function FeedbackRow({
  item,
  userAllergens,
  onSubmit,
}: {
  item: AnalyzedMenuItem;
  userAllergens: AllergenId[];
  onSubmit: (params: Omit<FeedbackParams, "dishName" | "menuItemId">) => void;
}) {
  const [expanded,  setExpanded]  = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div style={{ fontSize: 13, color: "#15803d", padding: "6px 4px 8px", textAlign: "right" }}>
        Thanks for your report ✓
      </div>
    );
  }

  if (!expanded) {
    return (
      <div style={{ textAlign: "right" }}>
        <button
          onClick={() => setExpanded(true)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "#6b7280", padding: "8px 4px",
            minHeight: 44, display: "inline-flex", alignItems: "center",
            textDecoration: "underline", textUnderlineOffset: "2px",
          }}
        >
          &#9873; Report issue
        </button>
      </div>
    );
  }

  const defaultAllergen = item.userAllergenHits[0] ?? userAllergens[0];

  return (
    <div style={{
      background: "var(--c-muted)", borderRadius: "0 0 12px 12px",
      padding: "12px 14px 14px", marginTop: -2,
      border: "1px solid var(--c-border)", borderTop: "none",
    }}>
      <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 10, fontWeight: 600 }}>
        What happened with <strong style={{ color: "var(--c-text)" }}>{item.name}</strong>?
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {QUICK_FEEDBACK.map((opt) => (
          <button
            key={opt.type}
            onClick={() => {
              onSubmit({
                type:               opt.type,
                allergen:           defaultAllergen,
                originalRisk:       item.risk,
                originalConfidence: item.confidence,
              });
              setSubmitted(true);
            }}
            style={{
              padding: "9px 14px", borderRadius: 10,
              border: "1px solid var(--c-border)",
              background: "var(--c-card)", color: "var(--c-text)",
              fontSize: 13, fontWeight: 600, cursor: "pointer", minHeight: 44,
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 13, color: "var(--c-sub)", padding: "9px 8px", minHeight: 44,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
