"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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

const RISK_STRIP: Record<string, string> = {
  "likely-safe": "#16a34a",
  "ask":         "#d97706",
  "avoid":       "#dc2626",
  "unknown":     "#9ca3af",
};

function getSafety(risk: string, isDark: boolean) {
  const map: Record<string, { label: string; bg: string; color: string; border: string }> = {
    "likely-safe": {
      label: "Safe",
      bg:     isDark ? "rgba(22,163,74,0.15)"  : "#f0fdf4",
      color:  isDark ? "#4ade80"               : "#15803d",
      border: isDark ? "rgba(22,163,74,0.35)"  : "#bbf7d0",
    },
    "ask": {
      label: "Ask Staff",
      bg:     isDark ? "rgba(217,119,6,0.15)"  : "#fffbeb",
      color:  isDark ? "#fbbf24"               : "#92400e",
      border: isDark ? "rgba(217,119,6,0.35)"  : "#fde68a",
    },
    "avoid": {
      label: "Avoid",
      bg:     isDark ? "rgba(220,38,38,0.15)"  : "#fff1f0",
      color:  isDark ? "#f87171"               : "#b91c1c",
      border: isDark ? "rgba(220,38,38,0.35)"  : "#fca5a5",
    },
    "unknown": {
      label: "Unknown",
      bg:     isDark ? "rgba(156,163,175,0.12)" : "#f9fafb",
      color:  "var(--c-sub)",
      border: isDark ? "rgba(156,163,175,0.2)"  : "#e5e7eb",
    },
  };
  return map[risk] ?? map["unknown"];
}

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
  const [submitting, setSubmitting]       = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) cardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [open]);

  const safety       = getSafety(item.risk, isDark);
  const stripColor   = RISK_STRIP[item.risk] ?? "#9ca3af";
  const primaryAllergen = item.userAllergenHits[0] ?? item.detectedAllergens[0];

  const hasExpandable = item.staffQuestions.length > 0 || !!(
    item.detectedAllergens.some((a) => !item.userAllergenHits.includes(a)) ||
    item.inferredAllergens.some((a) => !item.userAllergenHits.includes(a)) ||
    (item.substitutions && item.substitutions.length > 0) ||
    (item.userAllergenHits.length > 0)
  );

  const copyQuestions = useCallback(async () => {
    const text = item.staffQuestions.map((q) => `• ${q}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Copy failed. Please copy the questions manually.");
    }
  }, [item.staffQuestions]);

  const feedbackOptions: FeedbackOption[] = item.risk === "likely-safe"
    ? [
        { label: primaryAllergen ? `Had my allergen (${aLabel(primaryAllergen)})` : "Actually contained an allergen", type: "found-unsafe", allergen: primaryAllergen },
        { label: "Cross-contact / shared fryer",  type: "shared-fryer",           allergen: primaryAllergen },
        { label: "Staff confirmed it's unsafe",   type: "staff-confirmed-unsafe",  allergen: primaryAllergen },
      ]
    : [
        { label: primaryAllergen ? `No ${aLabel(primaryAllergen)} — was safe` : "Was actually safe", type: "false-positive", allergen: primaryAllergen },
        { label: "Staff confirmed it's safe", type: "staff-confirmed-safe", allergen: primaryAllergen },
      ];

  const handleFeedback = useCallback((option: FeedbackOption) => {
    if (!restaurantId || !restaurantName || submitting) return;
    setSubmitting(true);
    submitFeedback({ restaurantId, restaurantName, dishName: item.name, type: option.type, allergen: option.allergen, originalRisk: item.risk, originalConfidence: item.confidence });
    setFeedbackState("done");
  }, [restaurantId, restaurantName, item.name, item.risk, item.confidence, submitting]);

  const handleConfirm = useCallback(() => {
    if (!restaurantId || !restaurantName || submitting) return;
    setSubmitting(true);
    const type: FeedbackType = item.risk === "avoid" || item.risk === "ask" ? "found-unsafe" : "confirmed-safe";
    submitFeedback({ restaurantId, restaurantName, dishName: item.name, type, allergen: primaryAllergen, originalRisk: item.risk, originalConfidence: item.confidence });
    setFeedbackState("done");
  }, [restaurantId, restaurantName, item.name, item.risk, item.confidence, primaryAllergen, submitting]);

  const panelBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const panelBg     = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)";

  return (
    <div ref={cardRef} style={{
      display: "flex", alignItems: "stretch",
      background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`,
      borderRadius: 16, overflow: "hidden",
      boxShadow: isDark
        ? "0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)"
        : "0 2px 12px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
    }}>
      {/* Left risk strip */}
      <div style={{ width: 3, background: stripColor, flexShrink: 0 }} />

      {/* Card body */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* ── Main row ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 12px 13px 12px" }}>

          {/* Name + allergen chips — tappable expand area */}
          <button
            type="button"
            onClick={() => hasExpandable && setOpen((v) => !v)}
            style={{
              flex: 1, minWidth: 0, textAlign: "left",
              background: "none", border: "none", padding: 0,
              cursor: hasExpandable ? "pointer" : "default",
            }}
          >
            <div style={{
              fontWeight: 800, fontSize: 15, color: "var(--c-text)",
              lineHeight: 1.3, letterSpacing: "-0.01em",
              marginBottom: item.userAllergenHits.length > 0 ? 5 : 0,
            }}>
              {item.name}
            </div>

            {/* Allergen chips */}
            {item.userAllergenHits.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {item.userAllergenHits.map((a) => {
                  const isSevere = item.severityHits?.[a] === "anaphylactic";
                  const isPrecautionary = item.allergenCertainty === "precautionary";
                  return (
                    <span key={a} style={{
                      fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                      display: "inline-flex", alignItems: "center", gap: 3,
                      background: isSevere
                        ? (isDark ? "rgba(220,38,38,0.2)"  : "#fde8e8")
                        : isPrecautionary
                          ? (isDark ? "rgba(234,179,8,0.15)"  : "#fef9c3")
                          : (isDark ? "rgba(220,38,38,0.12)" : "#fef3c7"),
                      color: isSevere
                        ? (isDark ? "#f87171" : "#b91c1c")
                        : (isDark ? "#fbbf24" : "#92400e"),
                      border: `1px solid ${isSevere
                        ? (isDark ? "rgba(220,38,38,0.35)" : "#fca5a5")
                        : isPrecautionary
                          ? (isDark ? "rgba(234,179,8,0.3)"  : "#fde68a")
                          : (isDark ? "rgba(220,38,38,0.25)" : "#fcd34d")}`,
                    }}>
                      {isSevere && !isPrecautionary && (
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        </svg>
                      )}
                      {aLabel(a)}
                    </span>
                  );
                })}
                {item.allergenCertainty === "precautionary" && (
                  <span style={{ fontSize: 10, color: "var(--c-sub)", fontStyle: "italic", alignSelf: "center" }}>
                    may contain
                  </span>
                )}
              </div>
            )}
          </button>

          {/* Right controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            {/* Safety badge */}
            <span style={{
              fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999,
              background: safety.bg, color: safety.color, border: `1px solid ${safety.border}`,
              letterSpacing: "0.01em", whiteSpace: "nowrap",
            }}>
              {safety.label}
            </span>

            {/* Add to order */}
            {canOrder && onToggleOrder !== undefined && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleOrder(); }}
                aria-label={inOrder ? "Remove from order" : "Add to order"}
                style={{
                  width: 34, height: 34, borderRadius: 999, border: "none",
                  background: inOrder ? "#22c55e" : "var(--c-brand)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0,
                  boxShadow: inOrder
                    ? "0 2px 8px rgba(34,197,94,0.4)"
                    : "0 2px 8px rgba(31,189,204,0.35)",
                  transition: "background 0.15s",
                }}
              >
                {inOrder ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                )}
              </button>
            )}

            {/* Expand chevron */}
            {hasExpandable && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Collapse" : "Expand"}
                style={{
                  background: "none", border: "none", padding: "4px",
                  cursor: "pointer", color: "var(--c-sub)",
                  display: "flex", alignItems: "center",
                }}
              >
                <svg
                  width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  aria-hidden="true"
                  style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* ── Expanded panel ── */}
        {open && (
          <div style={{
            borderTop: `1px solid ${panelBorder}`,
            padding: "14px 14px 16px",
            background: panelBg,
            display: "grid", gap: 12,
          }}>
            {/* Explanation */}
            {item.userAllergenHits.length > 0 && item.explanation && (
              <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.6 }}>{item.explanation}</div>
            )}

            {/* Generic ask fallback */}
            {item.risk === "ask" && item.staffQuestions.length === 0 && item.userAllergenHits.length > 0 && (
              <div style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.6 }}>
                Ask staff whether this item contains {item.userAllergenHits.map((a) => aLabel(a)).join(" or ")}.
              </div>
            )}

            {/* Staff questions */}
            {item.staffQuestions.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 900, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Ask staff
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {item.staffQuestions.slice(0, 4).map((q, i) => (
                    <div key={i} style={{ fontSize: 13, color: "var(--c-sub)", lineHeight: 1.55, display: "flex", gap: 7 }}>
                      <span style={{ color: stripColor, flexShrink: 0, fontWeight: 700 }}>·</span>{q}
                    </div>
                  ))}
                </div>
                <button onClick={copyQuestions} style={{
                  marginTop: 10, width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: `1px solid ${panelBorder}`,
                  background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                  color: "var(--c-text)", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", minHeight: 42,
                }}>
                  {copied ? "Copied!" : "Copy questions"}
                </button>
              </div>
            )}

            {/* Other allergens */}
            {(() => {
              const others = item.detectedAllergens.filter((a) => !item.userAllergenHits.includes(a));
              const otherInferred = item.inferredAllergens.filter((a) => !item.userAllergenHits.includes(a));
              if (!others.length && !otherInferred.length) return null;
              return (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
                    Also contains
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {others.map((a) => (
                      <span key={a} style={{ padding: "3px 9px", borderRadius: 999, background: isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6", color: "var(--c-sub)", fontSize: 12, fontWeight: 600 }}>
                        {aLabel(a)}
                      </span>
                    ))}
                    {otherInferred.map((a) => (
                      <span key={a} style={{ padding: "3px 9px", borderRadius: 999, background: isDark ? "rgba(234,179,8,0.12)" : "#fef9c3", color: isDark ? "#fbbf24" : "#854d0e", fontSize: 12, fontWeight: 600 }}>
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
                background: isDark ? "rgba(14,165,233,0.08)" : "#f0f9ff",
                border: `1px solid ${isDark ? "rgba(14,165,233,0.2)" : "#bae6fd"}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: isDark ? "#7dd3fc" : "#0369a1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
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
              <div style={{ paddingTop: 8, borderTop: `1px solid ${panelBorder}` }}>
                {feedbackState === "idle" ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>Was this right?</span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={handleConfirm} title="Yes" style={{
                        width: 40, height: 40, borderRadius: 999, cursor: "pointer",
                        border: isDark ? "1px solid rgba(22,163,74,0.3)" : "1.5px solid #d1fae5",
                        background: isDark ? "rgba(22,163,74,0.1)" : "#f0fdf4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isDark ? "#4ade80" : "#15803d",
                      }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button onClick={() => setFeedbackState("open")} title="No" style={{
                        width: 40, height: 40, borderRadius: 999, cursor: "pointer",
                        border: isDark ? "1px solid rgba(220,38,38,0.3)" : "1.5px solid #fecaca",
                        background: isDark ? "rgba(220,38,38,0.1)" : "#fff1f0",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: isDark ? "#f87171" : "#b91c1c",
                      }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 700, marginBottom: 2 }}>What was wrong?</div>
                    {feedbackOptions.map((opt) => (
                      <button key={opt.type} onClick={() => handleFeedback(opt)} style={{
                        width: "100%", padding: "10px 14px", borderRadius: 10,
                        border: `1px solid ${panelBorder}`,
                        background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)",
                        color: "var(--c-text)", fontSize: 13, fontWeight: 600,
                        cursor: "pointer", textAlign: "left", minHeight: 42,
                      }}>
                        {opt.label}
                      </button>
                    ))}
                    <button onClick={() => setFeedbackState("idle")} style={{ background: "none", border: "none", fontSize: 12, color: "var(--c-sub)", cursor: "pointer", padding: "4px 0", textAlign: "left" }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
            {!!restaurantId && feedbackState === "done" && (
              <div style={{ paddingTop: 8, borderTop: `1px solid ${panelBorder}`, fontSize: 13, color: isDark ? "#4ade80" : "#15803d", fontWeight: 700 }}>
                Thanks — we&apos;ll use this to improve.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
