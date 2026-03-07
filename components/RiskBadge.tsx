import type { Risk } from "@/lib/types";

const CONFIG: Record<Risk, { label: string; bg: string; text: string; border: string }> = {
  "avoid":       { label: "Avoid",        bg: "#fff1f0", text: "#c0392b", border: "#f3c5c0" },
  "ask":         { label: "Ask Staff",    bg: "#fff7db", text: "#8a6700", border: "#f4dd8d" },
  "likely-safe": { label: "Likely Safe",  bg: "#eefbf3", text: "#166534", border: "#bbf7d0" },
  "unknown":     { label: "Unknown",      bg: "#f5f5f5", text: "#6b7280", border: "#e5e7eb" },
};

type Props = {
  risk: Risk;
  size?: "sm" | "md";
};

export function RiskBadge({ risk, size = "sm" }: Props) {
  const { label, bg, text, border } = CONFIG[risk];
  const padding = size === "md" ? "6px 12px" : "4px 9px";
  const fontSize = size === "md" ? 13 : 11;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding,
        borderRadius: 999,
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        fontSize,
        fontWeight: 800,
        whiteSpace: "nowrap",
        letterSpacing: "0.01em",
      }}
    >
      {label}
    </span>
  );
}
