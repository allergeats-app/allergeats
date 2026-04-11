"use client";

import { useState } from "react";
import type { BuilderStep } from "@/lib/types";
import type { AnalyzedMenuSection, AnalyzedMenuItem } from "@/lib/analysis";
import { useTheme } from "@/lib/themeContext";

const RISK_DOT: Record<string, string> = {
  "likely-safe": "#16a34a",
  "ask":         "#d97706",
  "avoid":       "#dc2626",
  "unknown":     "#9ca3af",
};

const RISK_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  "likely-safe": { bg: "rgba(22,163,74,0.1)",  color: "var(--c-risk-safe)",  label: "Safe"      },
  "ask":         { bg: "rgba(217,119,6,0.1)",  color: "var(--c-risk-ask)",   label: "Ask staff" },
  "avoid":       { bg: "rgba(220,38,38,0.08)", color: "var(--c-risk-avoid)", label: "Avoid"     },
  "unknown":     { bg: "var(--c-muted)",        color: "var(--c-sub)",        label: "Unknown"   },
};

// Label cleanup for the review summary
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

  const step    = steps[currentStep];
  // Support multi-category steps (sit-down restaurants: "Choose your entrée" spans Steaks + Seafood + Chicken)
  const stepItems = step
    ? step.categories
      ? sections.filter((s) => step.categories!.includes(s.sectionName)).flatMap((s) => s.items)
      : (sections.find((s) => s.sectionName === step.category)?.items ?? [])
    : [];

  // Always derive selection state directly from orderedItemIds — never from local state.
  // This prevents stale-closure bugs and keeps the UI in sync with the order at all times.
  const RISK_RANK: Record<string, number> = { "likely-safe": 0, ask: 1, unknown: 2, avoid: 3 };
  const sortedItems = [...stepItems].sort((a, b) => (RISK_RANK[a.risk] ?? 2) - (RISK_RANK[b.risk] ?? 2));

  const isSingle = step?.maxSelect === 1;
  // Items in this step that are currently in the order
  const picksForStep = stepItems.filter((i) => orderedItemIds.has(i.id));

  // Helper: get all items for a step (handles both single-category and multi-category steps)
  function getStepItems(s: BuilderStep): AnalyzedMenuItem[] {
    if (s.categories) {
      return sections.filter((sec) => s.categories!.includes(sec.sectionName)).flatMap((sec) => sec.items);
    }
    return sections.find((sec) => sec.sectionName === s.category)?.items ?? [];
  }

  // Count total builder-selected items (items from any step that are in the order)
  const totalBuilderItems = steps.reduce((n, s) => {
    return n + getStepItems(s).filter((i) => orderedItemIds.has(i.id)).length;
  }, 0);

  function selectItem(item: AnalyzedMenuItem) {
    if (item.risk === "avoid") return;

    if (isSingle) {
      // Remove any other item from this step currently in the order
      for (const stepItem of stepItems) {
        if (stepItem.id !== item.id && orderedItemIds.has(stepItem.id)) {
          onToggleOrder(stepItem.id);
        }
      }
      // Add new item (if not already selected)
      if (!orderedItemIds.has(item.id)) {
        onToggleOrder(item.id);
      }
      // Auto-advance
      setTimeout(() => {
        if (currentStep < steps.length - 1) {
          setCurrentStep((s) => s + 1);
        } else {
          setDone(true);
        }
      }, 280);
    } else {
      // Multi-select: simple toggle
      onToggleOrder(item.id);
    }
  }

  function advance() {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setDone(true);
    }
  }

  function goBack() {
    if (done) { setDone(false); return; }
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }

  function startOver() {
    // Remove every builder item from the order (across all steps, including multi-category)
    for (const s of steps) {
      for (const item of getStepItems(s)) {
        if (orderedItemIds.has(item.id)) onToggleOrder(item.id);
      }
    }
    setCurrentStep(0);
    setDone(false);
  }

  const cardBg     = isDark ? "var(--c-card)" : "#fff";
  const cardBorder = isDark ? "var(--c-border)" : "#f0f0f0";

  // ── Done / review state ────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Header */}
        <div style={{ textAlign: "center", paddingBottom: 4 }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>✓</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: "var(--c-text)", marginBottom: 4 }}>Your order is built!</div>
          <div style={{ fontSize: 14, color: "var(--c-sub)" }}>
            {totalBuilderItems} item{totalBuilderItems !== 1 ? "s" : ""} added to your order
          </div>
        </div>

        {/* Summary by step — derived from orderedItemIds, always accurate */}
        <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: "hidden" }}>
          {steps.map((s, i) => {
            const pickedItems = getStepItems(s).filter((item) => orderedItemIds.has(item.id));
            if (!pickedItems.length) return null;
            const isLast = i === steps.length - 1;
            return (
              <div key={i} style={{
                padding: "14px 16px",
                borderBottom: isLast ? "none" : `1px solid ${cardBorder}`,
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {stepSummaryLabel(s.label)}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {pickedItems.map((item) => {
                    const badge = RISK_BADGE[item.risk] ?? RISK_BADGE["unknown"];
                    return (
                      <span key={item.id} style={{
                        fontSize: 13, fontWeight: 700, color: "var(--c-text)",
                        background: badge.bg, borderRadius: 999,
                        padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: 5,
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: RISK_DOT[item.risk] ?? "#9ca3af", flexShrink: 0 }} />
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
        <button
          onClick={onOpenOrder}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
            background: "#eb1700", color: "#fff",
            fontSize: 16, fontWeight: 800, cursor: "pointer", minHeight: 54,
          }}
        >
          View order →
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 4 }}>
          <button onClick={startOver} style={{ background: "none", border: "none", fontSize: 14, color: "var(--c-sub)", cursor: "pointer", padding: "8px 0", fontWeight: 600 }}>
            ← Start over
          </button>
          <button onClick={onBrowse} style={{ background: "none", border: "none", fontSize: 14, color: "var(--c-sub)", cursor: "pointer", padding: "8px 0", fontWeight: 600 }}>
            Browse full menu →
          </button>
        </div>
      </div>
    );
  }

  // ── Step state ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* ── Progress dots ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
        {steps.map((_, i) => {
          const isActive  = i === currentStep;
          const isStepDone = i < currentStep;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center" }}>
              <div style={{
                width: isActive ? 32 : 10, height: 10, borderRadius: 999,
                background: isActive ? "#eb1700" : isStepDone ? "#eb1700" : (isDark ? "rgba(255,255,255,0.15)" : "#e5e7eb"),
                transition: "all 0.25s ease",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isStepDone && (
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              {i < steps.length - 1 && (
                <div style={{
                  width: 18, height: 2,
                  background: isStepDone ? "#eb1700" : (isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"),
                  transition: "background 0.25s ease",
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step header ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Step {currentStep + 1} of {steps.length}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: "var(--c-text)", letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: 4 }}>
          {step?.label}
        </div>
        <div style={{ fontSize: 13, color: "var(--c-sub)" }}>
          {isSingle ? "Pick one" : step?.maxSelect && step.maxSelect < 99 ? `Pick up to ${step.maxSelect}` : "Pick as many as you'd like"}
          {!step?.required && " · optional"}
        </div>
      </div>

      {/* ── Item list ── */}
      <div style={{ background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: 16, overflow: "hidden" }}>
        {sortedItems.length === 0 ? (
          <div style={{ padding: "20px 16px", color: "var(--c-sub)", fontSize: 14, textAlign: "center" }}>
            No items available
          </div>
        ) : sortedItems.map((item, idx) => {
          const isSelected = orderedItemIds.has(item.id);
          const isAvoid    = item.risk === "avoid";
          const badge      = RISK_BADGE[item.risk] ?? RISK_BADGE["unknown"];
          const dot        = RISK_DOT[item.risk] ?? "#9ca3af";
          const isLast     = idx === sortedItems.length - 1;
          // Combo number = 1-based position in the original (unsorted) step items list
          const comboNum   = step?.showAsCombo
            ? (stepItems.findIndex((i) => i.id === item.id) + 1)
            : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectItem(item)}
              disabled={isAvoid}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", textAlign: "left",
                padding: "14px 16px",
                background: isSelected
                  ? (isDark ? "rgba(235,23,0,0.1)" : "rgba(235,23,0,0.04)")
                  : isAvoid
                    ? (isDark ? "rgba(255,255,255,0.02)" : "#fafafa")
                    : "transparent",
                border: "none",
                borderBottom: isLast ? "none" : `1px solid ${cardBorder}`,
                cursor: isAvoid ? "not-allowed" : "pointer",
                opacity: isAvoid ? 0.45 : 1,
                transition: "background 0.15s",
                minHeight: 56,
              }}
            >
              {/* Combo number badge OR safety dot */}
              {comboNum ? (
                <div style={{
                  width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                  background: isSelected ? "#eb1700" : (isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"),
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 900, lineHeight: 1,
                    color: isSelected ? "#fff" : "var(--c-sub)",
                  }}>
                    #{comboNum}
                  </span>
                </div>
              ) : (
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: dot, flexShrink: 0 }} />
              )}

              {/* Name + allergen hits */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: isAvoid ? "var(--c-sub)" : "var(--c-text)", lineHeight: 1.3 }}>
                  {item.name}
                </div>
                {item.userAllergenHits.length > 0 && (
                  <div style={{ fontSize: 12, color: "var(--c-risk-avoid)", fontWeight: 600, marginTop: 2 }}>
                    Contains: {item.userAllergenHits.map((a) => a.replace(/-/g, " ")).join(", ")}
                  </div>
                )}
              </div>

              {/* Safety badge */}
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "4px 9px", borderRadius: 999,
                background: badge.bg, color: badge.color,
                flexShrink: 0, letterSpacing: "0.01em",
              }}>
                {badge.label}
              </span>

              {/* Check indicator */}
              {!isAvoid && (
                <div style={{
                  width: 22, height: 22, borderRadius: isSingle ? 999 : 6, flexShrink: 0,
                  border: isSelected ? "none" : `2px solid ${isDark ? "rgba(255,255,255,0.2)" : "#d1d5db"}`,
                  background: isSelected ? "#eb1700" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}>
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Navigation ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        {currentStep > 0 ? (
          <button onClick={goBack} style={{
            background: "none", border: `1px solid ${cardBorder}`,
            borderRadius: 12, padding: "11px 18px",
            fontSize: 14, fontWeight: 700, color: "var(--c-text)", cursor: "pointer", minHeight: 44,
          }}>
            ← Back
          </button>
        ) : <div />}

        {isSingle ? (
          !step?.required && (
            <button onClick={advance} style={{
              background: "none", border: "none",
              fontSize: 14, fontWeight: 600, color: "var(--c-sub)", cursor: "pointer", padding: "8px 0",
            }}>
              Skip →
            </button>
          )
        ) : (
          <button
            onClick={advance}
            style={{
              flex: 1, padding: "13px 0", borderRadius: 12, border: "none",
              background: picksForStep.length > 0 ? "#eb1700" : (isDark ? "rgba(255,255,255,0.08)" : "#f3f4f6"),
              color: picksForStep.length > 0 ? "#fff" : "var(--c-sub)",
              fontSize: 15, fontWeight: 800, cursor: "pointer", minHeight: 48,
              transition: "background 0.15s, color 0.15s",
            }}
          >
            {picksForStep.length > 0
              ? `Continue with ${picksForStep.length} item${picksForStep.length !== 1 ? "s" : ""} →`
              : step?.required ? "Select at least one" : "Skip this step →"}
          </button>
        )}
      </div>

      {/* Browse button */}
      <div style={{ paddingTop: 8 }}>
        <button onClick={onBrowse} style={{
          width: "100%", padding: "13px 0",
          borderRadius: 14, border: "1.5px solid var(--c-border)",
          background: "var(--c-card)",
          fontSize: 15, fontWeight: 700, color: "var(--c-text)",
          cursor: "pointer", letterSpacing: "-0.01em",
        }}>
          Browse Full Menu
        </button>
      </div>
    </div>
  );
}
