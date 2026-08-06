"use client";

import { useEffect } from "react";
import { UpgradePrompt } from "./UpgradePrompt";

export function SaveWallModal({
  isDark,
  onClose,
}: {
  isDark: boolean;
  onClose: () => void;
}) {
  // Close on backdrop click or Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to save more restaurants"
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "absolute", inset: 0,
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          animation: "fadeIn 0.2s ease",
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "relative", zIndex: 1,
          background: isDark ? "#131720" : "#ffffff",
          borderRadius: "20px 20px 0 0",
          padding: "8px 16px calc(24px + env(safe-area-inset-bottom))",
          animation: "sheetUp 0.28s cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: isDark ? "#3a3f52" : "#d1d5db",
          margin: "0 auto 20px",
        }} />

        <p style={{
          fontSize: 13, color: isDark ? "#9ca3af" : "#6b7280",
          textAlign: "center", marginBottom: 16, lineHeight: 1.5,
        }}>
          Free accounts can save up to 5 restaurants.<br />
          Upgrade to save unlimited.
        </p>

        <UpgradePrompt isDark={isDark} onDismiss={onClose} />
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes sheetUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </div>
  );
}
