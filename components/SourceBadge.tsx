import type { SourceType } from "@/lib/types";
import { sourceLabel } from "@/lib/sourceConfidence";

const CONFIG: Record<SourceType, { bg: string; text: string }> = {
  "official":         { bg: "#eff6ff", text: "#1d4ed8" },
  "verified-dataset": { bg: "#f0fdf4", text: "#15803d" },
  "aggregator":       { bg: "#fefce8", text: "#854d0e" },
  "scraped":          { bg: "#f5f5f5", text: "#6b7280" },
  "user-input":       { bg: "#f5f3ff", text: "#7c3aed" },
};

type Props = { sourceType: SourceType };

export function SourceBadge({ sourceType }: Props) {
  const { bg, text } = CONFIG[sourceType];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 8px",
        borderRadius: 999,
        background: bg,
        color: text,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      }}
    >
      {sourceLabel(sourceType)}
    </span>
  );
}
