"use client";

import { useState } from "react";

const PRO_FEATURES = [
  { icon: "🔄", label: "Profile sync across all your devices" },
  { icon: "👨‍👩‍👧", label: "Up to 5 family allergen profiles" },
  { icon: "🔔", label: "Alerts when a restaurant's allergen data changes" },
  { icon: "♾️",  label: "Unlimited saved restaurants" },
];

export function UpgradePrompt({
  isDark = false,
  compact = false,
  onDismiss,
}: {
  isDark?: boolean;
  compact?: boolean;
  onDismiss?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setLoading(false);
    }
  }

  const bg      = isDark ? "#1a1f2e" : "#f8f9ff";
  const border  = isDark ? "#2a3050" : "#dde3f8";
  const heading = isDark ? "#e2e6f0" : "#111827";
  const muted   = isDark ? "#7a849a" : "#6b7280";
  const purple  = "#7c3aed";
  const purpleL = "#8b5cf6";

  if (compact) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "10px 14px", borderRadius: 10,
        background: isDark ? "rgba(124,58,237,.1)" : "rgba(124,58,237,.06)",
        border: `1px solid ${isDark ? "rgba(124,58,237,.3)" : "rgba(124,58,237,.2)"}`,
      }}>
        <span style={{ fontSize: 13, color: isDark ? purpleL : purple, fontWeight: 600 }}>
          ✦ AllergEats Pro
        </span>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            padding: "5px 14px", borderRadius: 6, border: "none",
            background: purple, color: "#fff", fontSize: 12,
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "…" : "Upgrade $4/mo"}
        </button>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: 16, border: `1px solid ${border}`,
      background: bg, padding: 24, position: "relative",
    }}>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{
            position: "absolute", top: 14, right: 14,
            background: "none", border: "none", cursor: "pointer",
            color: muted, fontSize: 18, lineHeight: 1, padding: 2,
          }}
        >×</button>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase",
          color: purpleL, background: isDark ? "rgba(124,58,237,.15)" : "rgba(124,58,237,.08)",
          padding: "3px 8px", borderRadius: 4,
        }}>Pro</span>
      </div>

      <h3 style={{ fontSize: 17, fontWeight: 700, color: heading, marginBottom: 4 }}>
        Eat safely, everywhere
      </h3>
      <p style={{ fontSize: 13, color: muted, marginBottom: 16, lineHeight: 1.5 }}>
        Upgrade for $4/month and get everything you need to manage allergies for your whole family.
      </p>

      <ul style={{ listStyle: "none", margin: "0 0 20px", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {PRO_FEATURES.map((f) => (
          <li key={f.label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: heading }}>
            <span style={{ fontSize: 16, width: 22, textAlign: "center", flexShrink: 0 }}>{f.icon}</span>
            {f.label}
          </li>
        ))}
      </ul>

      {error && (
        <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>
      )}

      <button
        onClick={handleUpgrade}
        disabled={loading}
        style={{
          width: "100%", padding: "12px 0", borderRadius: 10, border: "none",
          background: `linear-gradient(135deg, ${purple}, ${purpleL})`,
          color: "#fff", fontSize: 14, fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          boxShadow: "0 2px 12px rgba(124,58,237,.35)",
        }}
      >
        {loading ? "Redirecting to checkout…" : "Upgrade to Pro — $4/mo"}
      </button>

      <p style={{ fontSize: 11, color: muted, textAlign: "center", marginTop: 10 }}>
        Cancel anytime · Billed via Stripe
      </p>
    </div>
  );
}
