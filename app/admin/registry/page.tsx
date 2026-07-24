"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getChainUrl } from "@/lib/chainUrls";
import type { CanonicalRestaurant } from "@/lib/registry/types";
import type { CrawlRecord, CrawlResult, CrawlSourcePriority, RefreshTier } from "@/lib/menu-crawl/types";

const SESSION_KEY  = "allegeats_admin_authed";
const REGISTRY_KEY = "allegeats_registry";
const QUEUE_KEY    = "allegeats_crawl_queue";

// Geographic bounds
const FL    = { latMin: 24.4, latMax: 31.1, lngMin: -87.7, lngMax: -79.8 };
const SW_FL = { latMin: 25.9, latMax: 27.2, lngMin: -82.4, lngMax: -81.5 };

function inBounds(r: CanonicalRestaurant, b: typeof FL) {
  if (r.lat == null || r.lng == null) return true; // no coords = preserve (MOCK/seeded)
  return r.lat >= b.latMin && r.lat <= b.latMax && r.lng >= b.lngMin && r.lng <= b.lngMax;
}

function loadRegistry(): CanonicalRestaurant[] {
  try { return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "[]") ?? []; }
  catch { return []; }
}

function saveRegistry(records: CanonicalRestaurant[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(records));
}

function loadQueue(): Record<string, CrawlRecord> {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "{}") ?? {}; }
  catch { return {}; }
}

function saveQueue(q: Record<string, CrawlRecord>) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
}

function safeDate(iso: string | undefined): string {
  if (!iso) return "never";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "never";
  const days = Math.floor((Date.now() - d.getTime()) / 86_400_000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

type Stats = {
  total: number;
  withUrl: number;
  withoutUrl: number;
  inFL: number;
  outsideFL: number;
  inSWFL: number;
  outsideSWFL: number;
  noCoords: number;
  queueTotal: number;
  queueOrphaned: number;
  chainUrlSeeds: number;
};

export default function RegistryPage() {
  const router = useRouter();
  const [ready, setReady]       = useState(false);
  const [stats, setStats]       = useState<Stats | null>(null);
  const [log, setLog]           = useState<string[]>([]);
  const [crawlLog, setCrawlLog] = useState<string[]>([]);
  const [crawling, setCrawling] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const addCrawlLog = useCallback((msg: string) => {
    setCrawlLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const computeStats = useCallback(() => {
    const reg   = loadRegistry();
    const queue = loadQueue();
    const regIds = new Set(reg.map(r => r.registryId));

    let withUrl = 0, withoutUrl = 0, inFL = 0, outsideFL = 0;
    let inSWFL = 0, outsideSWFL = 0, noCoords = 0, chainUrlSeeds = 0;

    for (const r of reg) {
      if (r.website) withUrl++; else withoutUrl++;
      if (r.lat == null || r.lng == null) {
        noCoords++;
      } else {
        if (inBounds(r, FL)) inFL++; else outsideFL++;
        if (inBounds(r, SW_FL)) inSWFL++; else outsideSWFL++;
      }
      if (!r.website) {
        const url = getChainUrl(r.displayName ?? "");
        if (url) chainUrlSeeds++;
      }
    }

    const queueTotal    = Object.keys(queue).length;
    const queueOrphaned = Object.keys(queue).filter(id => !regIds.has(id)).length;

    setStats({ total: reg.length, withUrl, withoutUrl, inFL, outsideFL, inSWFL, outsideSWFL: noCoords + outsideSWFL - inSWFL, noCoords, queueTotal, queueOrphaned, chainUrlSeeds });
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1" || !sessionStorage.getItem("allegeats_admin_token")) {
      sessionStorage.removeItem(SESSION_KEY);
      router.replace("/admin");
      return;
    }
    computeStats();
    setReady(true);
  }, [router, computeStats]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log, crawlLog]);

  // ── Purge actions ─────────────────────────────────────────────────────────

  function handlePurge(label: string, bounds: typeof FL) {
    const reg = loadRegistry();
    const toRemove = reg.filter(r => !inBounds(r, bounds));
    if (toRemove.length === 0) {
      addLog(`No entries outside ${label} bounds.`);
      return;
    }
    if (!confirm(`Delete ${toRemove.length} entries outside ${label}? This cannot be undone.`)) return;
    const kept = reg.filter(r => inBounds(r, bounds));
    saveRegistry(kept);
    addLog(`Purged ${toRemove.length} entries outside ${label}. Registry now has ${kept.length} records.`);
    computeStats();
  }

  function handlePurgeOutsideFL() { handlePurge("Florida", FL); }
  function handlePurgeSWFL()      { handlePurge("SW Florida", SW_FL); }

  // ── Orphan cleanup ────────────────────────────────────────────────────────

  function handleCleanOrphans() {
    const reg   = loadRegistry();
    const queue = loadQueue();
    const regIds = new Set(reg.map(r => r.registryId));
    const orphans = Object.keys(queue).filter(id => !regIds.has(id));
    if (orphans.length === 0) {
      addLog("No orphaned queue entries found.");
      return;
    }
    for (const id of orphans) delete queue[id];
    saveQueue(queue);
    addLog(`Removed ${orphans.length} orphaned queue entries: ${orphans.join(", ")}`);
    computeStats();
  }

  // ── Seed chain URLs ───────────────────────────────────────────────────────

  function handleSeedUrls() {
    const reg = loadRegistry();
    let seeded = 0;
    for (const r of reg) {
      if (r.website) continue;
      const url = getChainUrl(r.displayName ?? "");
      if (url) {
        r.website = url;
        r.websiteDomain = new URL(url).hostname.replace(/^www\./, "");
        seeded++;
      }
    }
    if (seeded === 0) {
      addLog("No new chain URLs to seed.");
      return;
    }
    saveRegistry(reg);
    addLog(`Seeded allergen URLs for ${seeded} chains.`);
    computeStats();
  }

  // ── Delete one record ─────────────────────────────────────────────────────

  function handleDeleteOne(registryId: string, displayName: string) {
    if (!confirm(`Delete "${displayName}" (${registryId}) from registry?`)) return;
    const reg = loadRegistry().filter(r => r.registryId !== registryId);
    saveRegistry(reg);
    // Also remove from queue
    const queue = loadQueue();
    delete queue[registryId];
    saveQueue(queue);
    addLog(`Deleted ${displayName} (${registryId}).`);
    computeStats();
  }

  // ── Sync website URLs → crawl queue ──────────────────────────────────────

  function syncWebsitesToQueue(): number {
    const reg   = loadRegistry();
    const queue = loadQueue();
    let synced  = 0;
    for (const r of reg) {
      if (!r.website) continue;
      if (!queue[r.registryId]) {
        queue[r.registryId] = {
          registryId:          r.registryId,
          bestSourcePriority:  "F" as CrawlSourcePriority,
          sourceUrl:           r.website,
          nextCrawlDue:        new Date().toISOString(),
          refreshTier:         "stale" as RefreshTier,
          interactionCount:    0,
          hasPosIntegration:   false,
          consecutiveFailures: 0,
        };
        synced++;
      } else if (!queue[r.registryId].sourceUrl) {
        queue[r.registryId].sourceUrl    = r.website;
        queue[r.registryId].nextCrawlDue = new Date().toISOString();
        synced++;
      }
    }
    saveQueue(queue);
    return synced;
  }

  // ── Crawl batch (quick — 5 entries) ──────────────────────────────────────

  async function handleRunCrawl() {
    setCrawling(true);
    setCrawlLog([]);
    try {
      const { runCrawlBatch } = await import("@/lib/menu-crawl");
      addCrawlLog("Starting crawl batch (up to 5 overdue)…");
      const results: CrawlResult[] = await runCrawlBatch({
        batchSize: 5,
        onResult: (r: CrawlResult) => {
          const icon = r.outcome === "updated" ? "✓" : r.outcome === "failed" ? "✗" : "—";
          addCrawlLog(`${icon} ${r.registryId}: ${r.outcome}${r.error ? ` — ${r.error}` : ""}`);
        },
      });
      addCrawlLog(`Done. ${results.length} crawled — ${results.filter(r => r.outcome === "updated").length} updated, ${results.filter(r => r.outcome === "failed").length} failed.`);
    } catch (e) {
      addCrawlLog(`Error: ${String(e)}`);
    } finally {
      setCrawling(false);
      computeStats();
    }
  }

  // ── Bulk scrape all ───────────────────────────────────────────────────────

  async function handleBulkScrape() {
    setCrawling(true);
    setCrawlLog([]);
    try {
      // 1. Seed chain URLs into registry
      const reg = loadRegistry();
      let seeded = 0;
      for (const r of reg) {
        if (r.website) continue;
        const url = getChainUrl(r.displayName ?? "");
        if (url) {
          r.website = url;
          r.websiteDomain = new URL(url).hostname.replace(/^www\./, "");
          seeded++;
        }
      }
      if (seeded > 0) saveRegistry(reg);
      addCrawlLog(`Seeded ${seeded} chain URLs into registry`);

      // 2. Sync all registry website fields → crawl queue sourceUrls
      const synced = syncWebsitesToQueue();
      addCrawlLog(`Synced ${synced} new URLs into crawl queue`);
      computeStats();

      // 3. Batch-run until no overdue entries remain
      const { runCrawlBatch, getNextCrawlBatch } = await import("@/lib/menu-crawl");
      let totalCrawled = 0, totalUpdated = 0, totalFailed = 0, batch = 0;

      while (true) {
        const pending = getNextCrawlBatch(1).length;
        if (pending === 0) break;

        batch++;
        const remaining = getNextCrawlBatch(9999).length;
        addCrawlLog(`Batch ${batch} — ${remaining} overdue remaining…`);

        const results: CrawlResult[] = await runCrawlBatch({ batchSize: 10 });
        if (results.length === 0) break;

        const up  = results.filter(r => r.outcome === "updated").length;
        const fail= results.filter(r => r.outcome === "failed").length;
        const unch= results.filter(r => r.outcome === "unchanged").length;
        totalCrawled  += results.length;
        totalUpdated  += up;
        totalFailed   += fail;

        addCrawlLog(`  → ${up} updated · ${unch} unchanged · ${fail} failed`);

        // Log failures with reason
        for (const r of results) {
          if (r.outcome === "failed" && r.error) {
            addCrawlLog(`    ✗ ${r.registryId}: ${r.error}`);
          }
        }

        // 2s pause between batches — be polite to external servers
        await new Promise(res => setTimeout(res, 2000));
      }

      addCrawlLog(`✓ Bulk scrape complete. ${totalCrawled} crawled — ${totalUpdated} menus updated, ${totalFailed} failed.`);
    } catch (e) {
      addCrawlLog(`Error: ${String(e)}`);
    } finally {
      setCrawling(false);
      computeStats();
    }
  }

  // ── Anomaly scanner ───────────────────────────────────────────────────────

  type Anomaly = { registryId: string; displayName: string; reason: string; severity: "high" | "medium" };

  function detectAnomalies(): Anomaly[] {
    const reg   = loadRegistry();
    const queue = loadQueue();
    const regIds = new Set(reg.map(r => r.registryId));
    const found: Anomaly[] = [];

    // Orphaned queue entries
    for (const id of Object.keys(queue)) {
      if (!regIds.has(id)) {
        found.push({ registryId: id, displayName: `Queue entry ${id}`, reason: "In crawl queue but not in registry", severity: "high" });
      }
    }

    // Detect entries with coordinates far outside Florida
    for (const r of reg) {
      if (r.lat != null && r.lng != null && !inBounds(r, FL)) {
        found.push({ registryId: r.registryId, displayName: r.displayName ?? r.registryId, reason: `Coordinates outside Florida (${r.lat.toFixed(4)}, ${r.lng.toFixed(4)})`, severity: "high" });
      }
    }

    // Detect duplicates: same displayName within ~1km
    const seen = new Map<string, CanonicalRestaurant>();
    for (const r of reg) {
      const key = (r.displayName ?? "").toLowerCase().trim();
      if (!key) {
        found.push({ registryId: r.registryId, displayName: r.registryId, reason: "Empty display name", severity: "medium" });
        continue;
      }
      if (seen.has(key)) {
        const prev = seen.get(key)!;
        // Check if they're geographically close (within ~5km)
        if (r.lat != null && prev.lat != null) {
          const dlat = (r.lat - prev.lat) * 111;
          const dlng = ((r.lng ?? 0) - (prev.lng ?? 0)) * 111 * Math.cos((r.lat * Math.PI) / 180);
          const dist = Math.sqrt(dlat * dlat + dlng * dlng);
          if (dist < 5) {
            found.push({ registryId: r.registryId, displayName: r.displayName ?? r.registryId, reason: `Likely duplicate of ${prev.registryId} — same name, ${dist.toFixed(1)}km apart`, severity: "high" });
          }
        }
      } else {
        seen.set(key, r);
      }
    }

    return found.slice(0, 50);
  }

  if (!ready || !stats) return null;

  const anomalies = detectAnomalies();

  const stat = (label: string, val: number, warn?: boolean, good?: boolean) => (
    <div style={{ background: "#1c1c1e", border: `1px solid ${warn ? "#f87171" : good ? "rgba(31,189,204,0.4)" : "#2c2c2e"}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.03em", color: warn ? "#f87171" : good ? "var(--c-brand)" : "#f2f2f7" }}>{val.toLocaleString()}</div>
      <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 4, fontWeight: 600 }}>{label}</div>
    </div>
  );

  const btn = (label: string, onClick: () => void, variant: "default" | "danger" | "brand" | "dim" = "default", disabled?: boolean) => (
    <button onClick={onClick} disabled={disabled} style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${variant === "danger" ? "#f87171" : variant === "brand" ? "var(--c-brand)" : "#3c3c3e"}`, background: variant === "brand" ? "var(--c-brand)" : "transparent", color: variant === "brand" ? "#001f26" : variant === "danger" ? "#f87171" : "#f2f2f7", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );

  const logBox = (lines: string[]) => (
    <div ref={logRef} style={{ background: "#111", borderRadius: 10, border: "1px solid #2c2c2e", padding: "12px 14px", minHeight: 80, maxHeight: 220, overflowY: "auto", fontFamily: "monospace", fontSize: 12, color: "#a3e635", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
      {lines.length === 0 ? <span style={{ color: "#3c3c3e" }}>No activity yet.</span> : lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0f0f0f", color: "#f2f2f7", padding: "32px 24px", maxWidth: 860, margin: "0 auto" }}>

      {/* Back link */}
      <a href="/admin" style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        fontSize: "13px", color: "#8e8e93",
        textDecoration: "none", marginBottom: "16px",
        padding: "8px 0",
      }}>
        ← Admin Dashboard
      </a>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-brand)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
          <a href="/admin" style={{ color: "inherit", textDecoration: "none" }}>AllergEats Admin</a> / Registry Ops
        </div>
        <div style={{ fontSize: 26, fontWeight: 900 }}>Registry Operations</div>
        <div style={{ fontSize: 13, color: "#8e8e93", marginTop: 4 }}>Geo purge · Dedup · Chain URL seeding · Crawl runner</div>
      </div>

      {/* Stats grid */}
      <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Registry Stats</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: 32 }}>
        {stat("Total records", stats.total)}
        {stat("With menu URL", stats.withUrl, false, stats.withUrl > 0)}
        {stat("Missing URL", stats.withoutUrl, stats.withoutUrl > 0)}
        {stat("In Florida", stats.inFL, false, stats.inFL > 0)}
        {stat("Outside Florida", stats.outsideFL, stats.outsideFL > 0)}
        {stat("In SW Florida", stats.inSWFL, false, stats.inSWFL > 0)}
        {stat("No coordinates", stats.noCoords)}
        {stat("Crawl queue size", stats.queueTotal)}
        {stat("Orphaned queue", stats.queueOrphaned, stats.queueOrphaned > 0)}
        {stat("Chain URLs available", stats.chainUrlSeeds, false, stats.chainUrlSeeds > 0)}
      </div>

      {/* Geographic Purge */}
      <div style={{ background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Geographic Purge</div>
        <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 16 }}>
          Removes OSM-discovered entries outside the specified bounding box. Restaurants without coordinates are always preserved.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {btn(`Purge outside Florida (${stats.outsideFL} entries)`, handlePurgeOutsideFL, stats.outsideFL > 0 ? "danger" : "dim", stats.outsideFL === 0)}
          {btn(`Purge outside SW Florida (${stats.outsideFL + stats.inFL - stats.inSWFL} entries)`, handlePurgeSWFL, "danger", stats.inFL - stats.inSWFL + stats.outsideFL === 0)}
        </div>
      </div>

      {/* Chain URL Seeding */}
      <div style={{ background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Chain URL Seeding</div>
        <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 16 }}>
          Adds official allergen page URLs for known chains missing a website. Matches by display name — covers 80+ chains.
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {btn(`Seed ${stats.chainUrlSeeds} chain URLs`, handleSeedUrls, stats.chainUrlSeeds > 0 ? "brand" : "dim", stats.chainUrlSeeds === 0)}
        </div>
      </div>

      {/* Crawl Queue */}
      <div style={{ background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>Crawl Queue</div>
        <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 16 }}>
          {stats.queueOrphaned > 0
            ? `${stats.queueOrphaned} orphaned entries (registry IDs not in registry) · ${stats.queueTotal} total in queue`
            : `${stats.queueTotal} entries in queue — no orphans detected`}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: crawlLog.length > 0 ? 14 : 0 }}>
          {btn(`Clean ${stats.queueOrphaned} orphaned entries`, handleCleanOrphans, stats.queueOrphaned > 0 ? "danger" : "dim", stats.queueOrphaned === 0)}
          {btn(crawling ? "Running…" : "Run Batch (5)", handleRunCrawl, crawling ? "dim" : "default", crawling)}
          {btn(crawling ? "Running…" : "⚡ Bulk Scrape All", handleBulkScrape, crawling ? "dim" : "brand", crawling)}
        </div>
        <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: crawlLog.length > 0 ? 10 : 0 }}>
          Bulk Scrape seeds chain URLs, syncs all website fields to the crawl queue, then runs every entry until no overdue remain. ~2s between batches of 10.
        </div>
        {crawlLog.length > 0 && logBox(crawlLog)}
      </div>

      {/* Detected Anomalies */}
      <div style={{ background: "#1c1c1e", border: "1px solid #2c2c2e", borderRadius: 16, padding: "20px 22px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Detected Anomalies</div>
          {anomalies.length > 0 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f87171", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", padding: "2px 8px", borderRadius: 999 }}>{anomalies.length}</span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "#8e8e93", marginBottom: 16 }}>
          Live scan: out-of-region coordinates, empty names, geographic duplicates, orphaned queue entries.
        </div>
        {anomalies.length === 0 ? (
          <div style={{ fontSize: 13, color: "#34d399", fontWeight: 600 }}>No anomalies detected.</div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {anomalies.map(a => (
              <div key={a.registryId} style={{ display: "flex", alignItems: "center", gap: 12, background: "#252528", borderRadius: 10, padding: "10px 14px", border: `1px solid ${a.severity === "high" ? "rgba(248,113,113,0.25)" : "#2c2c2e"}` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: a.severity === "high" ? "#f87171" : "#fbbf24", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#f2f2f7", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.displayName}</div>
                  <div style={{ fontSize: 11, color: "#8e8e93", marginTop: 1 }}>{a.registryId} · {a.reason}</div>
                </div>
                <button
                  onClick={() => handleDeleteOne(a.registryId, a.displayName)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "1px solid rgba(248,113,113,0.4)", background: "transparent", color: "#f87171", fontSize: 11, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity log */}
      {log.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#8e8e93", marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Activity Log</div>
          {logBox(log)}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <a href="/admin" style={{ fontSize: 13, color: "#8e8e93", textDecoration: "none" }}>← Back to Admin</a>
      </div>
    </div>
  );
}
