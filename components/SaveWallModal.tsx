"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";

const FEATURES = [
  { icon: "♾️",  text: "Unlimited saved restaurants" },
  { icon: "👨‍👩‍👧", text: "Up to 5 family allergen profiles" },
  { icon: "🔔", text: "Alerts when allergen data changes" },
  { icon: "🔄", text: "Sync your profile across all devices" },
];

export function SaveWallModal({
  isDark,
  onClose,
}: {
  isDark: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleUpgrade() {
    if (!user) {
      window.location.href = "/auth?next=/profile";
      return;
    }
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

  const glassBase   = isDark ? "rgba(14, 8, 36, 0.9)"       : "rgba(248, 245, 255, 0.93)";
  const glassBorder = isDark ? "rgba(139,92,246,0.22)"       : "rgba(124,58,237,0.18)";
  const glowColor   = isDark ? "rgba(124,58,237,0.18)"       : "rgba(124,58,237,0.1)";
  const headingClr  = isDark ? "#f0ecff"                     : "#1a0533";
  const subClr      = isDark ? "#c4b5fd"                     : "#5b21b6";
  const featureClr  = isDark ? "#e2d9ff"                     : "#2e1065";
  const featureBg   = isDark ? "rgba(139,92,246,0.09)"       : "rgba(124,58,237,0.05)";
  const featureBdr  = isDark ? "rgba(139,92,246,0.18)"       : "rgba(124,58,237,0.13)";
  const mutedClr    = isDark ? "rgba(167,139,250,0.55)"      : "rgba(109,40,217,0.45)";
  const closeBg     = isDark ? "rgba(255,255,255,0.07)"      : "rgba(0,0,0,0.06)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to AllergEats Pro"
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 16px",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: isDark ? "rgba(0,0,0,0.78)" : "rgba(10,0,30,0.5)",
          backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
          animation: "swFadeIn .22s ease",
        }}
      />

      {/* Glass card */}
      <div
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: 376,
          background: glassBase,
          border: `1px solid ${glassBorder}`,
          borderRadius: 24,
          backdropFilter: "blur(36px)", WebkitBackdropFilter: "blur(36px)",
          boxShadow: isDark
            ? "0 0 0 1px rgba(139,92,246,0.08), 0 40px 80px rgba(0,0,0,0.65), 0 0 100px rgba(109,40,217,0.14)"
            : "0 0 0 1px rgba(124,58,237,0.07), 0 40px 80px rgba(10,0,30,0.15), 0 0 100px rgba(109,40,217,0.07)",
          padding: "30px 24px 26px",
          animation: "swPopIn .28s cubic-bezier(0.34,1.56,0.64,1)",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
          width: 260, height: 140,
          background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 68%)`,
          pointerEvents: "none",
        }} />

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute", top: 14, right: 14,
            background: closeBg, border: "none", borderRadius: "50%",
            width: 30, height: 30,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: mutedClr, fontSize: 18, lineHeight: 1,
          }}
        >×</button>

        {/* Pro badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "5px 16px", borderRadius: 99,
            background: "linear-gradient(135deg, #5b21b6, #7c3aed, #8b5cf6)",
            fontSize: 11, fontWeight: 800, letterSpacing: ".09em",
            textTransform: "uppercase", color: "#fff",
            boxShadow: "0 4px 20px rgba(109,40,217,0.45)",
          }}>
            ✦ AllergEats Pro
          </span>
        </div>

        {/* Headline */}
        <h2 style={{
          fontSize: 22, fontWeight: 800, color: headingClr,
          textAlign: "center", margin: "0 0 9px", lineHeight: 1.2,
          letterSpacing: "-.03em",
        }}>
          Eat safely,<br />for your whole family.
        </h2>

        <p style={{
          fontSize: 13.5, color: subClr, textAlign: "center",
          margin: "0 0 20px", lineHeight: 1.6,
        }}>
          You&apos;ve hit the free save limit. Upgrade to unlock unlimited restaurants and keep your family safe everywhere you eat.
        </p>

        {/* Feature rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
          {FEATURES.map((f) => (
            <div key={f.text} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px", borderRadius: 12,
              background: featureBg,
              border: `1px solid ${featureBdr}`,
            }}>
              <span style={{ fontSize: 17, flexShrink: 0, width: 24, textAlign: "center" }}>{f.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: featureClr, lineHeight: 1.3 }}>{f.text}</span>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 12, color: "#f87171", textAlign: "center", marginBottom: 10 }}>{error}</p>
        )}

        {/* CTA */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          style={{
            width: "100%", padding: "15px 0", borderRadius: 14, border: "none",
            background: loading
              ? "rgba(124,58,237,0.45)"
              : "linear-gradient(135deg, #5b21b6 0%, #7c3aed 55%, #8b5cf6 100%)",
            color: "#fff", fontSize: 15, fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : "0 6px 28px rgba(109,40,217,0.48)",
            letterSpacing: "-.01em",
            transition: "opacity .15s, box-shadow .15s",
          }}
        >
          {loading ? "Redirecting…" : "Upgrade to Pro — $5/mo"}
        </button>

        <p style={{
          fontSize: 11.5, color: mutedClr, textAlign: "center",
          margin: "12px 0 0", lineHeight: 1.5,
        }}>
          Cancel anytime · No contracts · Billed monthly via Stripe
        </p>
      </div>

      <style>{`
        @keyframes swFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes swPopIn  { from { opacity: 0; transform: scale(.9) translateY(8px) }
                              to   { opacity: 1; transform: scale(1) translateY(0)    } }
      `}</style>
    </div>
  );
}
