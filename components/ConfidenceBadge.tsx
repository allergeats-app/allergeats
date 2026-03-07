import type { Confidence } from "@/lib/types";

const CONFIG: Record<Confidence, { bg: string; text: string; border: string }> = {
  High:   { bg: "#fff1f0", text: "#c0392b", border: "#f3c5c0" },
  Medium: { bg: "#fff7db", text: "#8a6700", border: "#f4dd8d" },
  Low:    { bg: "#f5f5f5", text: "#6b7280", border: "#e5e7eb" },
};

type Props = {
  confidence: Confidence;
  showLabel?: boolean;
};

export function ConfidenceBadge({ confidence, showLabel = true }: Props) {
  const { bg, text, border } = CONFIG[confidence];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 9px",
        borderRadius: 999,
        background: bg,
        color: text,
        border: `1px solid ${border}`,
        fontSize: 11,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {showLabel ? `${confidence} confidence` : confidence}
    </span>
  );
}
