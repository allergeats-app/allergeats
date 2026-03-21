import type { Risk } from "@/lib/types";

const CONFIG: Record<Risk, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  "likely-safe": {
    label: "Likely Safe",
    bg: "#eefbf3", text: "#166534", border: "#bbf7d0",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    ),
  },
  "ask": {
    label: "Ask Staff",
    bg: "#fff7db", text: "#8a6700", border: "#f4dd8d",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
      </svg>
    ),
  },
  "avoid": {
    label: "Avoid",
    bg: "#fff1f0", text: "#c0392b", border: "#f3c5c0",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  },
  "unknown": {
    label: "Unknown",
    bg: "#f5f5f5", text: "#6b7280", border: "#e5e7eb",
    icon: (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
};

type Props = {
  risk: Risk;
  size?: "sm" | "md";
};

export function RiskBadge({ risk, size = "sm" }: Props) {
  const { label, bg, text, border, icon } = CONFIG[risk];
  const padding = size === "md" ? "8px 16px" : "6px 12px";
  const fontSize = size === "md" ? 15 : 13;
  const gap = size === "md" ? 6 : 5;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap,
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
      {icon}
      {label}
    </span>
  );
}
