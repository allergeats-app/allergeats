"use client";

import { getCrawlRecord } from "@/lib/menu-crawl";

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function MenuFreshnessNotice({
  restaurantId,
  isChainTemplate,
  isDark,
  dataVerifiedDate,
  coverageLine,
}: {
  restaurantId: string;
  isChainTemplate: boolean;
  isDark: boolean;
  dataVerifiedDate?: string;
  coverageLine?: string;
}) {
  if (isChainTemplate) {
    // Official data: green verification badge + soft location disclaimer
    if (dataVerifiedDate) {
      const verifiedLabel = coverageLine
        ? `${coverageLine} · Verified ${fmtDate(dataVerifiedDate)}`
        : `Official allergen data · Verified ${fmtDate(dataVerifiedDate)}`;
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {/* Verified badge */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke={isDark ? "#4ade80" : "#16a34a"} strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span style={{ fontSize: 12, color: isDark ? "#4ade80" : "#15803d", fontWeight: 600 }}>
              {verifiedLabel}
            </span>
          </div>
          {/* Location disclaimer — muted, since we have good data */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6,
            padding: "7px 10px", borderRadius: 8,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"}` }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="var(--c-sub)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
            </svg>
            <span style={{ fontSize: 11, color: "var(--c-sub)", lineHeight: 1.5 }}>
              Items and prices may vary by location. Confirm before ordering.
            </span>
          </div>
        </div>
      );
    }

    // No verified date — existing amber chain warning
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 12,
        padding: "9px 12px", borderRadius: 10,
        background: isDark ? "rgba(245,158,11,0.08)" : "rgba(253,230,138,0.3)",
        border: `1px solid ${isDark ? "rgba(245,158,11,0.2)" : "rgba(251,191,36,0.4)"}` }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={isDark ? "#fbbf24" : "#92400e"} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 1 }}>
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
        </svg>
        <span style={{ fontSize: 12, color: isDark ? "#fbbf24" : "#92400e", lineHeight: 1.5 }}>
          <strong>National chain menu</strong> — items and allergens may differ at this location. Confirm before ordering.
        </span>
      </div>
    );
  }

  // Non-chain: crawl-record-based freshness
  const record = getCrawlRecord(restaurantId);
  if (!record?.lastCrawledAt) return null;

  if (record.hasPosIntegration) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
          boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
        <span style={{ fontSize: 12, color: isDark ? "#86efac" : "#15803d", fontWeight: 600 }}>
          Live menu data
        </span>
      </div>
    );
  }

  const ageDays = Math.floor((Date.now() - new Date(record.lastCrawledAt).getTime()) / 86_400_000);

  if (ageDays >= 30) {
    return (
      <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 12,
        padding: "9px 12px", borderRadius: 10,
        background: isDark ? "rgba(239,68,68,0.08)" : "rgba(254,226,226,0.6)",
        border: `1px solid ${isDark ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.2)"}` }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke={isDark ? "#fca5a5" : "#dc2626"} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ flexShrink: 0, marginTop: 1 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span style={{ fontSize: 12, color: isDark ? "#fca5a5" : "#b91c1c", lineHeight: 1.5 }}>
          <strong>Menu data is {ageDays >= 60 ? `${Math.floor(ageDays / 30)} months` : `${ageDays} days`} old</strong> — ingredients may have changed. Confirm with staff before ordering.
        </span>
      </div>
    );
  }

  if (ageDays >= 7) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
          stroke={isDark ? "#fbbf24" : "#d97706"} strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
        </svg>
        <span style={{ fontSize: 12, color: isDark ? "#a3a3a3" : "#6b7280" }}>
          Menu last checked {ageDays} days ago
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
      <div style={{ width: 5, height: 5, borderRadius: "50%",
        background: isDark ? "#4ade80" : "#16a34a" }} />
      <span style={{ fontSize: 11, color: "var(--c-sub)" }}>
        Updated {ageDays === 0 ? "today" : `${ageDays} day${ageDays !== 1 ? "s" : ""} ago`}
      </span>
    </div>
  );
}
