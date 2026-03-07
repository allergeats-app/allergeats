import Link from "next/link";
import type { ScoredRestaurant } from "@/lib/types";
import { SourceBadge } from "./SourceBadge";

type Props = { restaurant: ScoredRestaurant };

export function RestaurantCard({ restaurant: r }: Props) {
  const { summary } = r;
  const safePercent = summary.total > 0 ? (summary.likelySafe / summary.total) * 100 : 0;
  const askPercent  = summary.total > 0 ? (summary.ask       / summary.total) * 100 : 0;
  const avoidPercent = summary.total > 0 ? (summary.avoid    / summary.total) * 100 : 0;

  return (
    <Link
      href={`/restaurants/${r.id}`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 20,
          padding: 16,
          display: "grid",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          cursor: "pointer",
          transition: "box-shadow 0.15s",
        }}
      >
        {/* Restaurant header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: "#111", lineHeight: 1.2 }}>{r.name}</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
              {r.cuisine}
              {r.distance != null && ` · ${r.distance} mi`}
            </div>
          </div>
          <SourceBadge sourceType={r.sourceType} />
        </div>

        {/* Safety bar */}
        {summary.total > 0 && (
          <div>
            <div
              style={{
                height: 6,
                borderRadius: 999,
                background: "#f3f4f6",
                overflow: "hidden",
                display: "flex",
              }}
            >
              <div style={{ width: `${safePercent}%`, background: "#22c55e" }} />
              <div style={{ width: `${askPercent}%`, background: "#f59e0b" }} />
              <div style={{ width: `${avoidPercent}%`, background: "#ef4444" }} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <Stat count={summary.likelySafe} label="Likely Safe" color="#15803d" />
              <Stat count={summary.ask}        label="Ask Staff"   color="#854d0e" />
              <Stat count={summary.avoid}      label="Avoid"       color="#b91c1c" />
              {summary.unknown > 0 && (
                <Stat count={summary.unknown} label="Unknown" color="#6b7280" />
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ fontSize: 13, fontWeight: 700, color: "#eb1700" }}>View menu →</div>
      </div>
    </Link>
  );
}

function Stat({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div style={{ fontSize: 12 }}>
      <span style={{ fontWeight: 800, color }}>{count}</span>
      <span style={{ color: "#9ca3af", marginLeft: 3 }}>{label}</span>
    </div>
  );
}
