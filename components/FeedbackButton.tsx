"use client";

import { useState } from "react";
import { useTheme } from "@/lib/themeContext";

type FeedbackType = "incorrect_allergen" | "missing_item" | "other";

export function FeedbackButton() {
  const { isDark } = useTheme();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("incorrect_allergen");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          message: message.trim(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      });
    } catch {
      // Fail silently — feedback is best-effort
    }

    setSending(false);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setOpen(false);
      setMessage("");
      setType("incorrect_allergen");
    }, 2000);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        style={{
          position: "fixed",
          bottom: "max(108px, calc(80px + env(safe-area-inset-bottom)))",
          right: 16,
          zIndex: 900,
          width: 44, height: 44,
          borderRadius: "50%",
          background: isDark ? "#2c2c2e" : "#fff",
          border: "1.5px solid var(--c-border)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: 18,
        }}
      >
        💬
      </button>

      {/* Sheet */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9998,
            background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            background: "var(--c-card)",
            borderRadius: "24px 24px 0 0",
            width: "100%", maxWidth: 520,
            padding: "24px 20px",
            paddingBottom: "max(28px, calc(16px + env(safe-area-inset-bottom)))",
            boxShadow: "0 -4px 32px rgba(0,0,0,0.14)",
          }}>
            {sent ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--c-text)" }}>Thanks for the feedback!</div>
                <div style={{ fontSize: 13, color: "var(--c-sub)", marginTop: 6 }}>We&apos;ll review it soon.</div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                  <div style={{ fontSize: 17, fontWeight: 800, color: "var(--c-text)" }}>Report / Feedback</div>
                  <button type="button" onClick={() => setOpen(false)} style={{ background: "none", border: "none", fontSize: 20, color: "var(--c-sub)", cursor: "pointer", padding: 4 }}>×</button>
                </div>

                {/* Type selector */}
                <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                  {([
                    ["incorrect_allergen", "Wrong allergen data"],
                    ["missing_item", "Missing menu item"],
                    ["other", "Other"],
                  ] as [FeedbackType, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setType(val)}
                      style={{
                        padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                        border: type === val ? "2px solid var(--c-brand)" : "1.5px solid var(--c-border)",
                        background: type === val ? "var(--c-brand-bg)" : "transparent",
                        color: type === val ? "var(--c-brand)" : "var(--c-sub)",
                        cursor: "pointer",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    type === "incorrect_allergen"
                      ? "e.g. Big Mac should not list sesame — it's baked into the bun"
                      : type === "missing_item"
                      ? "e.g. Chipotle is missing the Lifestyle Bowls section"
                      : "Tell us what's wrong or what could be better..."
                  }
                  required
                  rows={4}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "12px 14px", borderRadius: 12, fontSize: 15,
                    color: "var(--c-text)", background: isDark ? "#252528" : "#f9f8f6",
                    border: "1.5px solid var(--c-border)", outline: "none",
                    resize: "none", lineHeight: 1.55,
                    marginBottom: 14,
                  }}
                />

                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  style={{
                    width: "100%", padding: "14px 0", borderRadius: 14, border: "none",
                    background: sending || !message.trim() ? "#9ca3af" : "var(--c-brand)",
                    color: "var(--c-brand-fg)", fontSize: 15, fontWeight: 800,
                    cursor: sending || !message.trim() ? "not-allowed" : "pointer",
                  }}
                >
                  {sending ? "Sending…" : "Send Feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}