"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "allegeats_alerts_banner_dismissed";

export function ProAlertsBanner({
  restaurantName,
  isDark,
}: {
  restaurantName: string;
  isDark: boolean;
}) {
  const [visible, setVisible] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;
    // Delay so the user has seen the allergen results first
    const t = setTimeout(() => setVisible(true), 2500);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setUpgrading(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      role="status"
      style={{
        position: "fixed", bottom: "calc(64px + env(safe-area-inset-bottom))", left: 0, right: 0,
        zIndex: 40,
        display: "flex", alignItems: "center", gap: 10,
        padding: "11px 16px",
        background: isDark ? "rgba(15,11,40,0.97)" : "rgba(245,243,255,0.98)",
        borderTop: `1px solid ${isDark ? "rgba(124,58,237,.25)" : "rgba(124,58,237,.15)"}`,
        backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        animation: "slideUp 0.3s ease",
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>

      <span style={{ fontSize: 15, flexShrink: 0 }}>🔔</span>

      <p style={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: isDark ? "#c4b5fd" : "#5b21b6", margin: 0 }}>
        Get notified when <strong>{restaurantName}</strong>&apos;s allergen data changes.
      </p>

      <button
        onClick={handleUpgrade}
        disabled={upgrading}
        style={{
          flexShrink: 0, padding: "6px 14px", borderRadius: 8, border: "none",
          background: "#7c3aed", color: "#fff", fontSize: 12, fontWeight: 700,
          cursor: upgrading ? "not-allowed" : "pointer", opacity: upgrading ? 0.7 : 1,
          whiteSpace: "nowrap",
        }}
      >
        {upgrading ? "…" : "Go Pro"}
      </button>

      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0, background: "none", border: "none",
          cursor: "pointer", color: isDark ? "#7c6fa0" : "#9c7cc0",
          fontSize: 18, lineHeight: 1, padding: "2px 4px",
        }}
      >
        ×
      </button>
    </div>
  );
}
