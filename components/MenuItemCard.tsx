"use client";

import { useState, useCallback } from "react";
import type { ScoredMenuItem } from "@/lib/types";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { submitFeedback } from "@/lib/learning/learningEngine";
import type { FeedbackType } from "@/lib/learning/types";
import { useTheme } from "@/lib/themeContext";

const ALLERGEN_LABEL: Record<string, string> = {
  dairy: "Dairy", egg: "Egg", wheat: "Wheat", gluten: "Gluten",
  soy: "Soy", peanut: "Peanut", "tree-nut": "Tree Nuts", nuts: "Nuts",
  sesame: "Sesame", fish: "Fish", shellfish: "Shellfish",
  mustard: "Mustard", corn: "Corn", legumes: "Legumes", oats: "Oats",
};
function aLabel(id: string): string {
  return ALLERGEN_LABEL[id] ?? id.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

// Safety badge config — compact pill shown on the card
const SAFETY: Record<string, { label: string; bg: string; color: string; border: string }> = {
  "likely-safe": { label: "Safe",       bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
  "ask":         { label: "Ask Staff",  bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  "avoid":       { label: "Avoid",      bg: "#fff1f0", color: "#b91c1c", border: "#fca5a5" },
  "unknown":     { label: "Unknown",    bg: "#f9fafb", color: "#6b7280", border: "#e5e7eb" },
};

type FeedbackOption = { label: string; type: FeedbackType; allergen?: string };

type Props = {
  item: ScoredMenuItem;
  restaurantId?: string;
  restaurantName?: string;
  inOrder?: boolean;
  onToggleOrder?: () => void;
};

export function MenuItemCard({ item, restaurantId, restaurantName, inOrder, onToggleOrder }: Props) {
  const { isDark } = useTheme();
  const canOrder = item.risk === "likely-safe" || item.risk === "ask";
  const [open, setOpen]                   = useState(false);
  const [copied, setCopied]               = useState(false);
  const [feedbackState, setFeedbackState] = useState<"idle" | "open" | "done">("idle");

  const safety = SAFETY[item.risk] ?? SAFETY["unknown"];

  const copyQuestions = useCallback(async () => {
    const text = item.staffQuestions.map((q) => `• ${q}`).join("\n");
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [item.staffQuestions]);

  const primaryAllergen = item.userAllergenHits[0] ?? item.detectedAllergens[0];

  const feedbackOptions: FeedbackOption[] = item.risk === "likely-safe"
    ? [
        { label: primaryAllergen ? `Had my allergen (${aLabel(primaryAllergen)})` : "Actually contained an allergen", type: "found-unsafe", allergen: primaryAllergen },
        { label: "Cross-contact / shared fryer",  type: "shared-fryer",          allergen: primaryAllergen },
        { label: "Staff confirmed it's unsafe",   type: "staff-confirmed-unsafe", allergen: primaryAllergen },
      ]
    : [
        { label: primaryAllergen ? `No ${aLabel(primaryAllergen)} — was safe` : "Was actually safe", type: "false-positive", allergen: primaryAllergen },
        { label: "Staff confirmed it's safe", type: "staff-confirmed-safe", allergen: primaryAllergen },
      ];

  const handleFeedback = useCallback((option: FeedbackOption) => {
    if (!restaurantId || !restaurantName) return;
    submitFeedback({ restaurantId, restaurantName, dishName: item.name, type: option.type, allergen: option.allergen, originalRisk: item.risk, originalConfidence: item.confidence });
    setFeedbackState("done");
  }, [restaurantId, restaurantName, item.name, item.risk, item.confidence]);

  const handleConfirm = useCallback(() => {
    if (!restaurantId || !restaurantName) return;
    const type: FeedbackType = item.risk === "avoid" || item.risk === "ask" ? "found-unsafe" : "confirmed-safe";
    submitFeedback({ restaurantId, restaurantName, dishName: item.name, type, allergen: primaryAllergen, originalRisk: item.risk, originalConfidence: item.confidence });
    setFeedbackState("done");
  }, [restaurantId, restaurantName, item.name, item.risk, item.confidence, primaryAllergen]);

  const hasAllergenDetail = !!(
    item.detectedAllergens.some((a) => !item.userAllergenHits.includes(a)) ||
    item.inferredAllergens.some((a) => !item.userAllergenHits.includes(a)) ||
    (item.substitutions && item.substitutions.length > 0)
  );

  const cardBg     = isDark ? "var(--c-card)" : "#fff";
  const cardBorder = isDark ? "var(--c-border)" : "#f0f0f0";

  return (
    <div style={{
      background: cardBg,
      border: `1px solid ${cardBorder}`,
      borderRadius: 16,
      overflow: "hidden",
      boxShadow: isDark ? "none" : "0 1px 4px rgba(0,0,0,0.07)",
    }}>
      {/* ── Main tap area ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "block", width: "100%", textAlign: "left",
          background: "none", border: "none", padding: "16px 16px 14px",
          cursor: "pointer",
        }}
      >
        {/* Name row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 6 }}>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, color: "var(--c-text)", flex: 1, minWidth: 0 }}>
            {item.name}
          </div>
          {/* Safety pill */}
          <span style={{
            flexShrink: 0, fontSize: 12, fontWeight: 800,
            padding: "4px 10px", borderRadius: 999,
            background: safety.bg, color: safety.color, border: `1.5px solid ${safety.border}`,
            letterSpacing: "0.01em", lineHeight: 1,
          }}>
            {safety.label}
          </span>
        </div>

        {/* Description */}
        {item.description && (
          <div style={{
            fontSize: 13, color: "var(--c-sub)", lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: open ? undefined : 2,
            WebkitBoxOrient: "vertical", overflow: open ? "visible" : "hidden",
            marginBottom: 10,
          }}>
            {item.description}
          </div>
        )}

        {/* Allergen hits */}
        {item.userAllergenHits.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: item.description ? 0 : 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-sub)", alignSelf: "center" }}>
              {item.allergenCertainty === "precautionary" ? "May contain:" : "Contains:"}
            </span>
            {item.userAllergenHits.map((a) => {
              const isAnaphylactic = item.severityHits?.[a] === "anaphylactic";
              const isPrecautionary = item.allergenCertainty === "precautionary";
              return (
                <span key={a} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: isPrecautionary ? "#fef9c3" : isAnaphylactic ? "#fde8e8" : "#fef3c7",
                  border: `1px solid ${isPrecautionary ? "#fde68a" : isAnaphylactic ? "#fca5a5" : "#fcd34d"}`,
                  color: isPrecautionary ? "#92400e" : isAnaphylactic ? "#b91c1c" : "#92400e",
                }}>
                  {isAnaphylactic && !isPrecautionary && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                    </svg>
                  )}
                  {aLabel(a)}
                  {isAnaphylactic && !isPrecautionary && (
                    <span style={{ fontSize: 9, fontWeight: 900, background: "#b91c1c", color: "#fff", borderRadius: 3, padding: "1px 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      SEVERE
                    </span>
                  )}
                </span>
              );
            })}
            {item.allergenCertainty === "precautionary" && (
              <span style={{ fontSize: 11, color: "var(--c-sub)", fontStyle: "italic", alignSelf: "center" }}>
                cross-contact risk
              </span>
            )}
          </div>
        )}

        {/* No-allergen explanation when no hits */}
        {item.userAllergenHits.length === 0 && item.risk !== "unknown" && (
          <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.5, marginTop: item.description ? 4 : 0 }}>
            {item.explanation}
          </div>
        )}
      </button>

      {/* ── Bottom action row ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px 14px", gap: 8,
      }}>
        {/* Staff questions / details toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            background: "none", border: "none", padding: "8px 0",
            fontSize: 13, fontWeight: 600, color: "var(--c-sub)",
            cursor: "pointer", minHeight: 40,
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          {open ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
              Less
            </>
          ) : (item.staffQuestions.length > 0 ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              What to ask
            </>
          ) : hasAllergenDetail ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              Details
            </>
          ) : null)}
        </button>

        {/* Add to order button */}
        {canOrder && onToggleOrder !== undefined && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleOrder(); }}
            aria-label={inOrder ? "Remove from order" : "Add to order"}
            style={{
              width: 40, height: 40, borderRadius: 999, border: "none",
              background: inOrder ? "#22c55e" : "#eb1700",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", transition: "background 0.15s",
              flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {inOrder ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            )}
          </button>
        )}
      </div>

      {/* ── Expanded panel ── */}
      {open && (
        <div style={{
          borderTop: `1px solid ${cardBorder}`,
          padding: "14px 16px 16px",
          background: isDark ? "rgba(255,255,255,0.03)" : "#fafafa",
          display: "grid", gap: 12,
        }}>
          {/* Full explanation if there were hits */}
          {item.userAllergenHits.length > 0 && (
            <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.6 }}>{item.explanation}</div>
          )}

          {/* Staff questions */}
          {item.staffQuestions.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>
                Ask staff
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {item.staffQuestions.slice(0, 4).map((q, i) => (
                  <div key={i} style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.55, display: "flex", gap: 7 }}>
                    <span style={{ color: "var(--c-border)", flexShrink: 0 }}>•</span>{q}
                  </div>
                ))}
              </div>
              <button onClick={copyQuestions} style={{
                marginTop: 10, width: "100%", padding: "11px 14px", borderRadius: 10,
                border: `1px solid ${cardBorder}`, background: cardBg,
                color: "var(--c-text)", fontSize: 13, fontWeight: 700,
                cursor: "pointer", minHeight: 44,
              }}>
                {copied ? "Copied!" : "Copy questions"}
              </button>
            </div>
          )}

          {/* Other detected allergens */}
          {(() => {
            const others = item.detectedAllergens.filter((a) => !item.userAllergenHits.includes(a));
            const otherInferred = item.inferredAllergens.filter((a) => !item.userAllergenHits.includes(a));
            if (!others.length && !otherInferred.length) return null;
            return (
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                  Also contains
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {others.map((a) => (
                    <span key={a} style={{ padding: "3px 9px", borderRadius: 999, background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6", color: "var(--c-sub)", fontSize: 12, fontWeight: 600 }}>
                      {aLabel(a)}
                    </span>
                  ))}
                  {otherInferred.map((a) => (
                    <span key={a} style={{ padding: "3px 9px", borderRadius: 999, background: "#fef9c3", color: "#854d0e", fontSize: 12, fontWeight: 600 }}>
                      ~{aLabel(a)}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Substitutions */}
          {item.substitutions && item.substitutions.length > 0 && (
            <div style={{
              padding: "10px 12px", borderRadius: 10,
              background: isDark ? "rgba(255,255,255,0.05)" : "#f0f9ff",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#bae6fd"}`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#7dd3fc" : "#0369a1", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
                Try instead
              </div>
              {item.substitutions.map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: isDark ? "#e0f2fe" : "#0c4a6e", lineHeight: 1.5 }}>· {s}</div>
              ))}
            </div>
          )}

          <ConfidenceBadge confidence={item.confidence} />

          {/* Feedback */}
          {!!restaurantId && feedbackState !== "done" && (
            <div style={{ paddingTop: 8, borderTop: `1px solid ${cardBorder}` }}>
              {feedbackState === "idle" ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "var(--c-sub)", fontWeight: 600 }}>Was this right?</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={handleConfirm} title="Yes" style={{ width: 40, height: 40, borderRadius: 999, border: "1.5px solid #d1fae5", background: "#f0fdf4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803d" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button onClick={() => setFeedbackState("open")} title="No" style={{ width: 40, height: 40, borderRadius: 999, border: "1.5px solid #fecaca", background: "#fff1f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b91c1c" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", fontWeight: 700, marginBottom: 2 }}>What was wrong?</div>
                  {feedbackOptions.map((opt) => (
                    <button key={opt.type} onClick={() => handleFeedback(opt)} style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${cardBorder}`, background: cardBg, color: "var(--c-text)", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left", minHeight: 44 }}>
                      {opt.label}
                    </button>
                  ))}
                  <button onClick={() => setFeedbackState("idle")} style={{ background: "none", border: "none", fontSize: 13, color: "var(--c-sub)", cursor: "pointer", padding: "6px 0", textAlign: "left" }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          {!!restaurantId && feedbackState === "done" && (
            <div style={{ paddingTop: 8, borderTop: `1px solid ${cardBorder}`, fontSize: 13, color: "#15803d", fontWeight: 700 }}>
              Thanks — we&apos;ll use this to improve.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
