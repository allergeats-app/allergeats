"use client";

export function StatBlock({
  count, label, color, rgb, isDark, active, onClick,
}: {
  count: number; label: string; color: string; rgb: string; isDark: boolean;
  active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Show ${label.toLowerCase()} items`}
      style={{
        textAlign: "center",
        padding: "12px 8px",
        borderRadius: 14,
        background: active
          ? `rgba(${rgb},${isDark ? "0.22" : "0.14"})`
          : `rgba(${rgb},${isDark ? "0.14" : "0.08"})`,
        border: active
          ? `1.5px solid rgba(${rgb},${isDark ? "0.65" : "0.50"})`
          : `1.5px solid rgba(${rgb},${isDark ? "0.35" : "0.22"})`,
        boxShadow: active
          ? `0 4px 20px rgba(${rgb},${isDark ? "0.35" : "0.20"})`
          : count > 0 ? `0 4px 16px rgba(${rgb},${isDark ? "0.25" : "0.12"})` : "none",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: 11, fontWeight: 800, color, opacity: 0.8, marginTop: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
    </button>
  );
}
