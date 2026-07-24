"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentConsole } from "@/components/admin/AgentConsole";
import { useAgentStream } from "@/lib/hooks/useAgentStream";
import type { AgentAction } from "@/components/admin/AgentConsole";

const SESSION_KEY = "allegeats_admin_authed";

export default function RestaurantOpsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [ctx, setCtx]     = useState("");

  const { running, streamText, actions, run, resolve } = useAgentStream(
    "/api/admin/agent/restaurant-ops"
  );

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1" || !sessionStorage.getItem("allegeats_admin_token")) {
      sessionStorage.removeItem(SESSION_KEY);
      router.replace("/admin");
      return;
    }
    const registry = safeJson<unknown[]>("allegeats_registry", []);
    setCtx(`${registry.length} restaurants in registry`);
    setReady(true);
  }, [router]);

  function handleRun() {
    const raw = safeJson<Record<string, unknown>[]>("allegeats_registry", []);
    const nintyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    // Pre-filter to suspicious records only — agents can't review thousands of entries.
    // FL bounding box: lat 24.4–31.1, lng -87.7–-79.8
    const suspicious = raw.filter(r => {
      const lat = Number(r.lat);
      const lng = Number(r.lng);
      const outOfRegion = (lat && lng) && (lat < 24.4 || lat > 31.1 || lng < -87.7 || lng > -79.8);
      const stale = r.lastSeenAt && new Date(r.lastSeenAt as string).getTime() < nintyDaysAgo;
      const missingData = !r.address || !r.cuisine;
      const lowConf = r.confidence === "low";
      return outOfRegion || stale || missingData || lowConf;
    });

    // Also include a 75-record random sample of clean records for duplicate detection.
    const clean = raw.filter(r => !suspicious.includes(r));
    const sample = clean.sort(() => Math.random() - 0.5).slice(0, 75);

    const combined = [...suspicious, ...sample].map(r => ({
      registryId:       r.registryId,
      displayName:      r.displayName,
      lat:              r.lat,
      lng:              r.lng,
      address:          r.address,
      cuisine:          r.cuisine,
      website:          r.website,
      confidence:       r.confidence,
      lastSeenAt:       r.lastSeenAt,
      firstSeenAt:      r.firstSeenAt,
      sourceCount:      Array.isArray(r.sourceEvents) ? (r.sourceEvents as unknown[]).length : r.sourceCount,
    }));

    run({
      registry: combined,
      totalRecords: raw.length,
      suspiciousCount: suspicious.length,
      note: `Showing ${suspicious.length} suspicious + ${sample.length} sampled clean records out of ${raw.length} total.`,
    });
  }

  function handleApprove(action: AgentAction) {
    if (action.type === "flag_duplicate") {
      const d = action.details as { id1?: string; id2?: string };
      if (d.id1) window.open(`/restaurants/${d.id1}`, "_blank", "noopener");
      if (d.id2) window.open(`/restaurants/${d.id2}`, "_blank", "noopener");
    }
    resolve(action.id, "approved");
  }

  if (!ready) return null;

  return (
    <AgentConsole
      name="Restaurant Ops"
      emoji="🏪"
      role="Audits the restaurant registry — flags duplicates, missing data, and stale entries"
      contextLabel={ctx}
      running={running}
      streamText={streamText}
      actions={actions}
      onRun={handleRun}
      onApprove={handleApprove}
      onReject={a => resolve(a.id, "rejected")}
    />
  );
}

function safeJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}
