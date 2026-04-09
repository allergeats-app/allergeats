"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { SettingsButton } from "@/components/SettingsButton";
import { useFavorites, type FavoriteMeta } from "@/lib/favoritesContext";
import { getRecentlyViewed, type RecentView } from "@/lib/recentlyViewed";
import { getScanHistory, type ScanEntry } from "@/lib/scanHistory";
import { loadSavedOrders, deleteSavedOrder, type SavedOrder } from "@/lib/savedOrders";
import { CameraScanButton } from "@/components/CameraScanButton";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 2)   return "Just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ScanSummaryBar({ safe, ask, avoid, total }: { safe: number; ask: number; avoid: number; total: number }) {
  if (total === 0) return null;
  return (
    <div style={{ height: 4, borderRadius: 999, background: "var(--c-muted)", overflow: "hidden", display: "flex", marginTop: 6 }}>
      <div style={{ width: `${(safe  / total) * 100}%`, background: "#22c55e" }} />
      <div style={{ width: `${(ask   / total) * 100}%`, background: "#f59e0b" }} />
      <div style={{ width: `${(avoid / total) * 100}%`, background: "#ef4444" }} />
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "28px 0 12px" }}>
      <h2 style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>{label}</h2>
      {count != null && <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{count}</span>}
    </div>
  );
}

function RecentViewCard({ view }: { view: RecentView }) {
  return (
    <Link href={`/restaurants/${view.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <div style={{
        background: "var(--c-card)", border: "1px solid var(--c-border)",
        borderRadius: 16, padding: "12px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{view.name}</div>
          <div style={{ fontSize: 11, color: "var(--c-sub)", marginTop: 2 }}>{view.cuisine}{view.distance != null ? ` · ${view.distance} mi` : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, paddingLeft: 12 }}>
          <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{timeAgo(view.viewedAt)}</span>
          <span style={{ fontSize: 13, color: "#eb1700", fontWeight: 700 }}>→</span>
        </div>
      </div>
    </Link>
  );
}

function ScanCard({ entry }: { entry: ScanEntry }) {
  const safeLabel  = entry.safeCount  > 0 ? `${entry.safeCount} safe`  : null;
  const avoidLabel = entry.avoidCount > 0 ? `${entry.avoidCount} avoid` : null;
  const sourceLabel = entry.source === "preloaded" ? "Menu library" : entry.source === "url" ? "URL scan" : "Manual";

  return (
    <div style={{
      background: "var(--c-card)", border: "1px solid var(--c-border)",
      borderRadius: 16, padding: "12px 14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          {entry.restaurantName}
        </div>
        <span style={{ fontSize: 11, color: "var(--c-sub)", flexShrink: 0, paddingLeft: 10 }}>{timeAgo(entry.scannedAt)}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "var(--c-sub)" }}>{sourceLabel} · {entry.totalItems} items</span>
        {safeLabel  && <span style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>{safeLabel}</span>}
        {avoidLabel && <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>{avoidLabel}</span>}
      </div>
      <ScanSummaryBar safe={entry.safeCount} ask={entry.askCount} avoid={entry.avoidCount} total={entry.totalItems} />
    </div>
  );
}

function SavedOrderCard({ order, onDelete }: { order: SavedOrder; onDelete: () => void }) {
  const isBuilder = !!order.stepGroups;
  const [mainGroup, ...modGroups] = order.stepGroups ?? [];
  const mainName = isBuilder ? (mainGroup?.items[0]?.name ?? "Custom Order") : null;
  const flatItems = order.items ?? [];

  return (
    <div style={{
      background: "var(--c-card)", border: "1px solid var(--c-border)",
      borderRadius: 16, padding: "12px 14px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <Link href={`/restaurants/${order.restaurantId}`} style={{ textDecoration: "none" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#eb1700" }}>{order.restaurantName}</span>
            </Link>
            <span style={{ fontSize: 11, color: "var(--c-sub)" }}>· {timeAgo(order.savedAt)}</span>
          </div>

          {isBuilder ? (
            <>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", marginBottom: 4 }}>{mainName}</div>
              {modGroups.map(({ label, items }) => (
                <div key={label} style={{ display: "flex", gap: 6, marginTop: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.04em", flexShrink: 0 }}>{label}:</span>
                  <span style={{ fontSize: 12, color: "var(--c-text)" }}>{items.map(i => i.name).join(", ")}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {flatItems.map((item) => {
                const color = item.risk === "likely-safe" ? "#16a34a" : item.risk === "ask" ? "#d97706" : "#dc2626";
                return (
                  <div key={item.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--c-text)" }}>{item.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete saved order"
          style={{
            width: 30, height: 30, borderRadius: 999, flexShrink: 0,
            background: "var(--c-muted)", border: "1px solid var(--c-border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "var(--c-sub)",
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function SavedContent() {
  const { favorites, favoritesMeta } = useFavorites();
  const [recentViews]   = useState<RecentView[]>(() => getRecentlyViewed());
  const [scanHistory]   = useState<ScanEntry[]>(() => getScanHistory());
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>(() => loadSavedOrders());

  function removeOrder(id: string) {
    deleteSavedOrder(id);
    setSavedOrders((prev) => prev.filter((o) => o.id !== id));
  }

  // "Your Usual Safe Spots" = restaurants that are both favorited AND recently viewed
  const usualSpots = recentViews.filter((v) => favorites.has(v.id));

  // Recently viewed (excluding usual spots to avoid duplication)
  const usualIds = new Set(usualSpots.map((v) => v.id));
  const recentOnly = recentViews.filter((v) => !usualIds.has(v.id)).slice(0, 8);

  // Saved places not in recently viewed (IDs only — link to detail page)
  const viewedIds = new Set(recentViews.map((v) => v.id));
  const savedNotViewed = [...favorites].filter((id) => !viewedIds.has(id));

  const hasAnything = usualSpots.length > 0 || recentViews.length > 0 || scanHistory.length > 0 || savedOrders.length > 0;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", paddingBottom: "max(80px, calc(60px + env(safe-area-inset-bottom)))" }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "var(--c-hdr)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--c-border)",
        paddingTop: "max(12px, calc(12px + env(safe-area-inset-top)))",
        paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link href="/" style={{ color: "var(--c-sub)", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>← Back</Link>
          <span style={{ color: "var(--c-border)" }}>|</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: "var(--c-text)" }}>Saved Orders</span>
        </div>
        <SettingsButton />
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>

        {!hasAnything ? (
          /* Empty state */
          <div style={{ padding: "64px 0 32px", textAlign: "center" }}>
            <div style={{ fontSize: 36, marginBottom: 14 }}>🍽️</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 8 }}>Nothing saved yet</div>
            <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.6 }}>
              Save restaurants with the heart button.<br />
              Your visit history and scans will appear here.
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 260, margin: "0 auto" }}>
              <Link href="/" style={{
                display: "block", textAlign: "center",
                padding: "13px 0", borderRadius: 14,
                background: "#eb1700", color: "#fff",
                fontSize: 14, fontWeight: 800, textDecoration: "none",
              }}>
                Browse Restaurants
              </Link>
              <CameraScanButton style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                padding: "13px 0", borderRadius: 14,
                background: "var(--c-card)", border: "1.5px solid var(--c-border)",
                color: "var(--c-text)", fontSize: 14, fontWeight: 800,
                cursor: "pointer", textDecoration: "none",
              }}>
                Scan a Menu
              </CameraScanButton>
            </div>
          </div>
        ) : (
          <>
            {/* ── Saved Orders ── */}
            {savedOrders.length > 0 && (
              <>
                <SectionHeader label="Saved Orders" count={savedOrders.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedOrders.map((order) => (
                    <SavedOrderCard key={order.id} order={order} onDelete={() => removeOrder(order.id)} />
                  ))}
                </div>
              </>
            )}

            {/* ── Your Usual Safe Spots ── */}
            {usualSpots.length > 0 && (
              <>
                <SectionHeader label="Your Usual Safe Spots" count={usualSpots.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {usualSpots.map((v) => <RecentViewCard key={v.id} view={v} />)}
                </div>
              </>
            )}

            {/* ── Saved Places not yet visited this session ── */}
            {savedNotViewed.length > 0 && (
              <>
                <SectionHeader label="Saved Places" count={favorites.size} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {savedNotViewed.map((id) => {
                    const meta: FavoriteMeta | undefined = favoritesMeta.get(id);
                    return (
                      <Link key={id} href={`/restaurants/${id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{
                          background: "var(--c-card)", border: "1px solid var(--c-border)",
                          borderRadius: 16, padding: "12px 14px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#eb1700" stroke="none" style={{ flexShrink: 0 }}>
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            {meta ? (
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: 14, color: "var(--c-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.name}</div>
                                <div style={{ fontSize: 11, color: "var(--c-sub)", marginTop: 1 }}>{meta.cuisine}</div>
                              </div>
                            ) : (
                              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--c-sub)" }}>Saved place</span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "var(--c-sub)", flexShrink: 0, paddingLeft: 10 }}>View →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Recently Viewed ── */}
            {recentOnly.length > 0 && (
              <>
                <SectionHeader label="Recently Viewed" count={recentOnly.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {recentOnly.map((v) => <RecentViewCard key={v.id} view={v} />)}
                </div>
              </>
            )}

            {/* ── Recent Scans ── */}
            {scanHistory.length > 0 && (
              <>
                <SectionHeader label="Recent Scans" count={scanHistory.length} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {scanHistory.slice(0, 10).map((entry) => <ScanCard key={entry.id} entry={entry} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function SavedPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100dvh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
        Loading…
      </main>
    }>
      <SavedContent />
    </Suspense>
  );
}
