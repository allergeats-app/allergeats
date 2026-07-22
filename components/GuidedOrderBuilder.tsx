"use client";

import { useState, useRef, useEffect } from "react";
import type { BuilderStep } from "@/lib/types";
import type { AnalyzedMenuSection, AnalyzedMenuItem } from "@/lib/analysis";
import { useTheme } from "@/lib/themeContext";
import { RISK_COLOR } from "@/lib/riskColors";

const RISK_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  "likely-safe": { bg: "rgba(22,163,74,0.12)",  color: "#16a34a", label: "Safe"      },
  "ask":         { bg: "rgba(217,119,6,0.12)",  color: "#d97706", label: "Ask staff" },
  "avoid":       { bg: "rgba(220,38,38,0.1)",   color: "#dc2626", label: "Avoid"     },
  "unknown":     { bg: "rgba(156,163,175,0.12)", color: "#9ca3af", label: "Unknown"   },
};

function stepSummaryLabel(label: string): string {
  return label
    .replace(/^Choose your /i, "")
    .replace(/^Add /i, "")
    .replace(/^Pick /i, "");
}

type Props = {
  steps: BuilderStep[];
  sections: AnalyzedMenuSection[];
  orderedItemIds: Set<string>;
  onToggleOrder: (id: string) => void;
  onOpenOrder: () => void;
  onBrowse: () => void;
};

export function GuidedOrderBuilder({ steps, sections, orderedItemIds, onToggleOrder, onOpenOrder, onBrowse }: Props) {
  const { isDark } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone]               = useState(false);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current); }, []);

  const step = steps[currentStep];

  function getStepItems(s: BuilderStep): AnalyzedMenuItem[] {
    if (s.categories) {
      return sections.filter((sec) => s.categories!.includes(sec.sectionName)).flatMap((sec) => sec.items);
    }
    return sections.find((sec) => sec.sectionName === s.category)?.items ?? [];
  }

  const stepItems = step ? getStepItems(step) : [];

  const RISK_RANK: Record<string, number> = { "likely-safe": 0, ask: 1, unknown: 2, avoid: 3 };
  const sortedItems = [...stepItems].sort((a, b) => (RISK_RANK[a.risk] ?? 2) - (RISK_RANK[b.risk] ?? 2));

  const isSingle     = step?.maxSelect === 1;
  const allAvoid     = sortedItems.length > 0 && sortedItems.every((i) => i.risk === "avoid");
  const picksForStep = stepItems.filter((i) => orderedItemIds.has(i.id));

  const totalBuilderItems = steps.reduce((n, s) => {
    return n + getStepItems(s).filter((i) => orderedItemIds.has(i.id)).length;
  }, 0);

  function selectItem(item: AnalyzedMenuItem) {
    if (item.risk === "avoid") return;
    if (isSingle) {
      for (const stepItem of stepItems) {
        if (stepItem.id !== item.id && orderedItemIds.has(stepItem.id)) onToggleOrder(stepItem.id);
      }
      if (!orderedItemIds.has(item.id)) onToggleOrder(item.id);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = setTimeout(() => {
        if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
        else setDone(true);
      }, 280);
    } else {
      onToggleOrder(item.id);
    }
  }

  function advance() {
    if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1);
    else setDone(true);
  }

  function goBack() {
    if (done) { setDone(false); return; }
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function startOver() {
    for (const id of Array.from(orderedItemIds)) onToggleOrder(id);
    setCurrentStep(0);
    setDone(false);
  }

  // Shared glass card style
  const glass = {
    background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.82)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)"}`,
    borderRadius: 20,
    boxShadow: isDark
      ? "0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
      : "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
  } as React.CSSProperties;

  // ── Done / review state ───────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Success header */}
        <div style={{ ...glass, padding: "24px 20px", textAlign: "center" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 999, margin: "0 auto 14px",
            background: "rgba(22,163,74,0.12)",
            border: "1.5px solid rgba(22,163,74,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--c-text)", marginBottom: 4, letterSpacing: "-0.02em" }}>Order built!</div>
          <div style={{ fontSize: 13, color: "var(--c-sub)" }}>
            {totalBuilderItems} item{totalBuilderItems !== 1 ? "s" : ""} selected
          </div>
        </div>

        {/* Summary */}
        <div style={{ ...glass, overflow: "hidden" }}>
          {steps.map((s, i) => {
            const pickedItems = getStepItems(s).filter((item) => orderedItemIds.has(item.id));
            if (!pickedItems.length) return null;
            const isLast = i === steps.length - 1;
            return (
              <div key={i} style={{
                padding: "14px 18px",
                borderBottom: isLast ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)"}`,
              }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  {stepSummaryLabel(s.label)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pickedItems.map((item) => {
                    const badge = RISK_BADGE[item.risk] ?? RISK_BADGE["unknown"];
                    return (
                      <span key={item.id} style={{
                        fontSize: 13, fontWeight: 700, color: "var(--c-text)",
                        background: badge.bg, borderRadius: 999,
                        padding: "5px 11px", display: "inline-flex", alignItems: "center", gap: 6,
                        border: `1px solid ${badge.bg}`,
                      }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: RISK_COLOR[item.risk] ?? "#9ca3af", flexShrink: 0 }} />
                        {item.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTAs */}
        <button onClick={onOpenOrder} style={{
          width: "100%", padding: "15px 0", borderRadius: 16, border: "none",
          background: "var(--c-brand)", color: "var(--c-brand-fg)",
          fontSize: 16, fontWeight: 800, cursor: "pointer", minHeight: 54,
          letterSpacing: "-0.01em",
        }}>
          View order →
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={startOver} style={{ background: "none", border: "none", fontSize: 13, color: "var(--c-sub)", cursor: "pointer", padding: "8px 0", fontWeight: 600 }}>
            ← Start over
          </button>
          <button onClick={onBrowse} style={{ background: "none", border: "none", fontSize: 13, color: "var(--c-sub)", cursor: "pointer", padding: "8px 0", fontWeight: 600 }}>
            Browse full menu →
          </button>
        </div>
      </div>
    );
  }

  // ── Step state ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

      {/* ── Progress bar ── */}
      <div style={{ display: "flex", gap: 5 }}>
        {steps.map((_, i) => {
          const isComplete = i < currentStep;
          const isCurrent  = i === currentStep;
          return (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 999,
              background: isComplete
                ? "var(--c-brand)"
                : isCurrent
                  ? isDark ? "rgba(31,189,204,0.45)" : "rgba(31,189,204,0.35)"
                  : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
              transition: "all 0.3s ease",
            }} />
          );
        })}
      </div>

      {/* ── Step header ── */}
      <div style={{ ...glass, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{
            fontSize: 11, fontWeight: 900, letterSpacing: "0.08em",
            color: "var(--c-brand)", textTransform: "uppercase",
          }}>
            Step {currentStep + 1} of {steps.length}
          </span>
          {!step?.required && (
            <span style={{
              fontSize: 10, fontWeight: 700, color: "var(--c-sub)",
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              borderRadius: 999, padding: "2px 8px", letterSpacing: "0.04em", textTransform: "uppercase",
            }}>
              Optional
            </span>
          )}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: "var(--c-text)", letterSpacing: "-0.02em", lineHeight: 1.15, marginBottom: 6 }}>
          {step?.label}
        </div>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontSize: 12, fontWeight: 700, color: "var(--c-sub)",
          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
          borderRadius: 999, padding: "4px 10px",
        }}>
          {isSingle
            ? "Pick one"
            : step?.maxSelect && step.maxSelect < 99
              ? `Pick up to ${step.maxSelect}`
              : "Pick as many as you like"}
        </div>
      </div>

      {/* ── All-avoid banner ── */}
      {allAvoid && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "14px 18px", borderRadius: 16,
          background: isDark ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.06)",
          border: `1.5px solid rgba(220,38,38,${isDark ? "0.3" : "0.2"})`,
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: "rgba(220,38,38,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#dc2626", lineHeight: 1.3 }}>
              No safe options here
            </div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(220,38,38,0.7)" : "rgba(185,28,28,0.65)", marginTop: 2 }}>
              All items contain your allergens — skip this step.
            </div>
          </div>
        </div>
      )}

      {/* ── Item list ── */}
      <div style={{ ...glass, overflow: "hidden" }}>
        {sortedItems.length === 0 ? (
          <div style={{ padding: "24px 18px", color: "var(--c-sub)", fontSize: 14, textAlign: "center" }}>
            No items available
          </div>
        ) : sortedItems.map((item, idx) => {
          const isSelected = orderedItemIds.has(item.id);
          const isAvoid    = item.risk === "avoid";
          const badge      = RISK_BADGE[item.risk] ?? RISK_BADGE["unknown"];
          const riskColor  = RISK_COLOR[item.risk] ?? "#9ca3af";
          const isLast     = idx === sortedItems.length - 1;
          const comboNum   = step?.showAsCombo ? idx + 1 : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item)}
              disabled={isAvoid}
              style={{
                display: "flex", alignItems: "center",
                width: "100%", textAlign: "left",
                padding: 0,
                background: isSelected
                  ? isDark ? "rgba(31,189,204,0.1)" : "rgba(31,189,204,0.06)"
                  : "transparent",
                border: "none",
                borderBottom: isLast ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                cursor: isAvoid ? "not-allowed" : "pointer",
                opacity: isAvoid ? 0.4 : 1,
                transition: "background 0.15s",
                minHeight: 62,
              }}
            >
              {/* Risk color strip */}
              <div style={{
                width: 3, alignSelf: "stretch",
                background: riskColor,
                flexShrink: 0,
                borderRadius: "0",
              }} />

              {/* Content */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, padding: "14px 16px" }}>
                {/* Combo badge OR risk dot */}
                {comboNum ? (
                  <div style={{
                    width: 34, height: 34, borderRadius: 12, flexShrink: 0,
                    background: isSelected ? "var(--c-brand)" : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s",
                    border: `1px solid ${isSelected ? "transparent" : isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: isSelected ? "#fff" : "var(--c-sub)" }}>
                      #{comboNum}
                    </span>
                  </div>
                ) : (
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: riskColor, flexShrink: 0,
                    boxShadow: `0 0 6px ${riskColor}66`,
                  }} />
                )}

                {/* Name + allergen hits */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: isAvoid ? "var(--c-sub)" : "var(--c-text)", lineHeight: 1.3, letterSpacing: "-0.01em" }}>
                    {item.name}
                  </div>
                  {item.userAllergenHits.length > 0 && (
                    <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginTop: 3, letterSpacing: "0.01em" }}>
                      Contains: {item.userAllergenHits.map((a) => a.replace(/-/g, " ")).join(", ")}
                    </div>
                  )}
                </div>

                {/* Safety badge */}
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "4px 10px", borderRadius: 999,
                  background: badge.bg, color: badge.color, flexShrink: 0,
                  letterSpacing: "0.02em", border: `1px solid ${badge.bg}`,
                }}>
                  {badge.label}
                </span>

                {/* Check/radio indicator */}
                {!isAvoid && (
                  <div style={{
                    width: 22, height: 22, borderRadius: isSingle ? 999 : 7, flexShrink: 0,
                    border: isSelected ? "none" : `2px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.15)"}`,
                    background: isSelected ? "var(--c-brand)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s",
                    boxShadow: isSelected ? "0 2px 8px rgba(31,189,204,0.4)" : "none",
                  }}>
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Navigation ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {currentStep > 0 ? (
          <button onClick={goBack} style={{
            padding: "13px 18px", borderRadius: 14,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            fontSize: 14, fontWeight: 700, color: "var(--c-sub)", cursor: "pointer", minHeight: 48,
            backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
          }}>
            ← Back
          </button>
        ) : <div />}

        {isSingle ? (
          (allAvoid || !step?.required) && (
            <button onClick={advance} style={{
              flex: 1, padding: "13px 0", borderRadius: 14, minHeight: 48,
              border: allAvoid
                ? "1.5px solid rgba(220,38,38,0.25)"
                : `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
              background: allAvoid
                ? isDark ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.06)"
                : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              fontSize: 14, fontWeight: 700,
              color: allAvoid ? "#dc2626" : "var(--c-sub)",
              cursor: "pointer",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            }}>
              {allAvoid ? "Skip this step →" : "Skip →"}
            </button>
          )
        ) : (
          <button
            onClick={advance}
            disabled={step?.required && !allAvoid && picksForStep.length === 0}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 14, minHeight: 48,
              border: allAvoid ? "1.5px solid rgba(220,38,38,0.25)" : "none",
              background: allAvoid
                ? isDark ? "rgba(220,38,38,0.1)" : "rgba(220,38,38,0.06)"
                : picksForStep.length > 0
                  ? "var(--c-brand)"
                  : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              color: allAvoid
                ? "#dc2626"
                : picksForStep.length > 0 ? "var(--c-brand-fg)" : "var(--c-sub)",
              fontSize: 15, fontWeight: 800,
              cursor: allAvoid || picksForStep.length > 0 ? "pointer" : "default",
              transition: "all 0.15s",
              boxShadow: picksForStep.length > 0 && !allAvoid ? "0 4px 16px rgba(31,189,204,0.35)" : "none",
              letterSpacing: "-0.01em",
            }}
          >
            {allAvoid
              ? "Skip this step →"
              : picksForStep.length > 0
                ? `Continue with ${picksForStep.length} item${picksForStep.length !== 1 ? "s" : ""} →`
                : step?.required ? "Select at least one" : "Skip this step →"}
          </button>
        )}
      </div>

    </div>
  );
}
