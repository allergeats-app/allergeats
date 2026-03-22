"use client";

import { CameraScanButton } from "@/components/CameraScanButton";
import type { TypeFilter } from "@/app/restaurants/types";

interface SmartEmptyStateProps {
  query: string;
  radiusMiles: number;
  onlySaved: boolean;
  onlyWithMenu: boolean;
  typeFilter: TypeFilter;
  onClearQuery: () => void;
  onClearSaved: () => void;
  onShowAll: () => void;
  onClearCuisine: () => void;
  onOpenMap: () => void;
}

export function SmartEmptyState({
  query, radiusMiles, onlySaved, onlyWithMenu, typeFilter,
  onClearQuery, onClearSaved, onShowAll, onClearCuisine, onOpenMap,
}: SmartEmptyStateProps) {
  const suggestions: { label: string; action: () => void }[] = [];
  if (query)                suggestions.push({ label: `Clear search "${query}"`,       action: onClearQuery   });
  if (onlySaved)            suggestions.push({ label: "Turn off Saved Places",          action: onClearSaved  });
  if (onlyWithMenu)         suggestions.push({ label: "Show restaurants without menus", action: onShowAll     });
  if (typeFilter !== "all") suggestions.push({ label: "Show all cuisines",              action: onClearCuisine });
  suggestions.push(         { label: "Switch to map view",                              action: onOpenMap     });

  const subtitle = query
    ? `No restaurants match "${query}".`
    : onlySaved
    ? "None of your saved places match the current filters."
    : `Nothing found within ${radiusMiles} miles.`;

  return (
    <div style={{ padding: "56px 0 32px", textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12, lineHeight: 1 }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--c-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block" }} aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>No restaurants found</div>
      <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.5 }}>{subtitle}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 300, margin: "0 auto 28px" }}>
        {suggestions.map(({ label, action }) => (
          <button
            key={label}
            type="button"
            onClick={action}
            style={{
              padding: "11px 18px", borderRadius: 14,
              background: "var(--c-card)", border: "1.5px solid var(--c-border)",
              color: "var(--c-text)", fontSize: 13, fontWeight: 700,
              cursor: "pointer", textAlign: "left",
              display: "flex", alignItems: "center", gap: 8,
              transition: "border-color 0.15s",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#eb1700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            {label}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 12, color: "var(--c-sub)", marginBottom: 12 }}>Or scan any menu directly</div>
      <CameraScanButton style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "12px 22px", background: "#eb1700", color: "#fff",
        borderRadius: 12, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Scan a Menu
      </CameraScanButton>
    </div>
  );
}
