"use client";

import { useState } from "react";
import type { ScoredMenuItem } from "@/lib/types";
import { RiskBadge } from "./RiskBadge";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { submitFeedback } from "@/lib/learning/learningEngine";
import type { FeedbackType } from "@/lib/learning/types";

const ALLERGEN_LABEL: Record<string, string> = {
  dairy: "Dairy", egg: "Egg", wheat: "Wheat", gluten: "Gluten",
  soy: "Soy", peanut: "Peanut", "tree-nut": "Tree Nuts", nuts: "Nuts",
  sesame: "Sesame", fish: "Fish", shellfish: "Shellfish",
  mustard: "Mustard", corn: "Corn", legumes: "Legumes", oats: "Oats",
};
function aLabel(id: string): string {
  return ALLERGEN_LABEL[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

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

type FeedbackOption = {
  label: string;
  type: FeedbackType;
  allergen?: string;
};

type Props = {
  item: ScoredMenuItem;
  /** When provided, enables the feedback UI for this item */
  restaurantId?: string;
  restaurantName?: string;
  /** Order builder — whether this item is currently in the order */
  inOrder?: boolean;
  onToggleOrder?: () => void;
};

export function MenuItemCard({ item, restaurantId, restaurantName, inOrder, onToggleOrder }: Props) {
  const canOrder = item.risk === "likely-safe" || item.risk === "ask";
  const orderColor = item.risk === "likely-safe" ? "#15803d" : "#854d0e";
  const [expanded, setExpanded]           = useState(false);
  const [copied, setCopied]               = useState(false);
  const [feedbackState, setFeedbackState] = useState<"idle" | "open" | "done">("idle");

  const bg     = RISK_BG[item.risk]     ?? "#f9fafb";
  const border = RISK_BORDER[item.risk] ?? "#e5e7eb";

  async function copyQuestions() {
    const text = item.staffQuestions.map((q) => `• ${q}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Build correction options based on the current risk level
  const primaryAllergen = item.userAllergenHits[0] ?? item.detectedAllergens[0];
  const feedbackOptions: FeedbackOption[] = item.risk === "likely-safe"
    ? [
        {
          label: primaryAllergen
            ? `Had my allergen (${aLabel(primaryAllergen)})`
            : "Actually contained an allergen",
          type:     "found-unsafe",
          allergen: primaryAllergen,
        },
        { label: "Cross-contact / shared fryer",  type: "shared-fryer",          allergen: primaryAllergen },
        { label: "Staff confirmed it's unsafe",   type: "staff-confirmed-unsafe", allergen: primaryAllergen },
      ]
    : [
        {
          label: primaryAllergen
            ? `No ${aLabel(primaryAllergen)} — was safe`
            : "Was actually safe",
          type:     "false-positive",
          allergen: primaryAllergen,
        },
        { label: "Staff confirmed it's safe", type: "staff-confirmed-safe", allergen: primaryAllergen },
      ];

  function handleFeedback(option: FeedbackOption) {
    if (!restaurantId || !restaurantName) return;
    submitFeedback({
      restaurantId,
      restaurantName,
      dishName:           item.name,
      type:               option.type,
      allergen:           option.allergen,
      originalRisk:       item.risk,
      originalConfidence: item.confidence,
    });
    setFeedbackState("done");
  }

  function handleConfirm() {
    if (!restaurantId || !restaurantName) return;
    // Positive signal: user confirms the app's prediction was right
    const type: FeedbackType =
      item.risk === "avoid" || item.risk === "ask"
        ? "found-unsafe"
        : "confirmed-safe";
    submitFeedback({
      restaurantId,
      restaurantName,
      dishName:           item.name,
      type,
      allergen:           primaryAllergen,
      originalRisk:       item.risk,
      originalConfidence: item.confidence,
    });
    setFeedbackState("done");
  }

  const showFeedback = !!restaurantId;

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 18,
        padding: 18,
        display: "grid",
        gap: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, color: "#111" }}>{item.name}</div>
          {item.description && (
            <div style={{ fontSize: 14, color: "var(--c-sub)", marginTop: 4, lineHeight: 1.5 }}>
              {item.description}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <RiskBadge risk={item.risk} />
          {canOrder && onToggleOrder !== undefined && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleOrder(); }}
              aria-label={inOrder ? "Remove from order" : "Add to order"}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 13px", borderRadius: 999,
                border: `1.5px solid ${inOrder ? orderColor : "var(--c-border)"}`,
                background: inOrder ? orderColor : "transparent",
                color: inOrder ? "#fff" : orderColor,
                fontSize: 13, fontWeight: 800,
                cursor: "pointer", transition: "all 0.15s",
                minHeight: 36,
              }}
            >
              {inOrder ? (
                <>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Added
                </>
              ) : (
                <>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Explanation */}
      <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{item.explanation}</div>

      {/* User's allergens — shown prominently */}
      {item.userAllergenHits.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)" }}>Contains:</span>
          {item.userAllergenHits.map((a) => (
            <span key={a} style={{ padding: "5px 11px", borderRadius: 999, background: "#fde8e8", border: "1px solid #fca5a5", color: "#b91c1c", fontSize: 13, fontWeight: 800 }}>
              {aLabel(a)}
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
              <span key={a} style={{ padding: "4px 10px", borderRadius: 999, background: "#f3f4f6", color: "var(--c-sub)", fontSize: 13, fontWeight: 600 }}>
                {aLabel(a)}
              </span>
            ))}
            {otherInferred.map((a) => (
              <span key={a} style={{ padding: "4px 10px", borderRadius: 999, background: "#fef9c3", color: "#854d0e", fontSize: 13, fontWeight: 600 }}>
                ~{aLabel(a)}
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
              fontSize: 14,
              fontWeight: 700,
              color: "var(--c-sub)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "12px 0 12px 14px",
              margin: "-12px 0 -12px -14px",
              minHeight: 44,
            }}
          >
            {expanded ? "Hide questions" : "What to ask →"}
          </button>
        )}
      </div>

      {/* Staff questions */}
      {expanded && item.staffQuestions.length > 0 && (
        <div style={{ marginTop: 4, padding: 12, background: "rgba(255,255,255,0.6)", borderRadius: 12, border: "1px solid rgba(0,0,0,0.07)" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--c-sub)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Ask staff
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {item.staffQuestions.slice(0, 4).map((q, i) => (
              <div key={i} style={{ fontSize: 14, color: "#374151", lineHeight: 1.55 }}>• {q}</div>
            ))}
          </div>
          <button
            onClick={copyQuestions}
            style={{
              marginTop: 12,
              width: "100%",
              padding: "13px 14px",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
              color: "#374151",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              minHeight: 48,
            }}
          >
            {copied ? "Copied!" : "Copy questions"}
          </button>
        </div>
      )}

      {/* ── Feedback row ─────────────────────────────────────────────────────── */}
      {showFeedback && feedbackState !== "done" && (
        <div style={{
          marginTop: 4,
          paddingTop: 10,
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}>
          {feedbackState === "idle" ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: "var(--c-sub)", fontWeight: 600 }}>Was this right?</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleConfirm}
                  title="Yes, correct"
                  style={{
                    width: 44, height: 44, borderRadius: 999,
                    border: "1.5px solid #d1fae5", background: "#f0fdf4",
                    fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#15803d",
                  }}
                >
                  ✓
                </button>
                <button
                  onClick={() => setFeedbackState("open")}
                  title="No, something's wrong"
                  style={{
                    width: 44, height: 44, borderRadius: 999,
                    border: "1.5px solid #fecaca", background: "#fff1f0",
                    fontSize: 16, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#b91c1c",
                  }}
                >
                  ✗
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 13, color: "var(--c-sub)", fontWeight: 700, marginBottom: 4 }}>
                What was wrong?
              </div>
              {feedbackOptions.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleFeedback(opt)}
                  style={{
                    width: "100%", padding: "13px 14px", borderRadius: 12,
                    border: "1px solid #e5e7eb", background: "#fff",
                    color: "#374151", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", textAlign: "left", minHeight: 48,
                  }}
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setFeedbackState("idle")}
                style={{
                  background: "none", border: "none",
                  fontSize: 13, color: "var(--c-sub)", cursor: "pointer",
                  padding: "8px 0", textAlign: "left", minHeight: 40,
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Feedback confirmed */}
      {showFeedback && feedbackState === "done" && (
        <div style={{
          marginTop: 4, paddingTop: 10,
          borderTop: "1px solid rgba(0,0,0,0.06)",
          fontSize: 13, color: "#15803d", fontWeight: 700,
        }}>
          Thanks — we&apos;ll use this to improve.
        </div>
      )}
    </div>
  );
}
