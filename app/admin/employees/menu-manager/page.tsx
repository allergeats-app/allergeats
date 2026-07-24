"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AgentConsole } from "@/components/admin/AgentConsole";
import { useAgentStream } from "@/lib/hooks/useAgentStream";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";
import type { AgentAction } from "@/components/admin/AgentConsole";

const SESSION_KEY = "allegeats_admin_authed";

export default function MenuManagerPage() {
  const router  = useRouter();
  const [ready, setReady]   = useState(false);
  const [ctx, setCtx]       = useState("");

  const { running, streamText, actions, run, resolve } = useAgentStream(
    "/api/admin/agent/menu-manager"
  );

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1" || !sessionStorage.getItem("allegeats_admin_token")) {
      sessionStorage.removeItem(SESSION_KEY);
      router.replace("/admin");
      return;
    }

    const registry   = safeJson<unknown[]>("allegeats_registry", []);
    const crawlQueue = safeJson<Record<string, unknown>>("allegeats_crawl_queue", {});

    const regCount   = registry.length;
    const queueCount = Object.keys(crawlQueue).length;
    const mockCount  = MOCK_RESTAURANTS.length;
    setCtx(`${mockCount} seeded restaurants · ${regCount} in registry · ${queueCount} crawl records`);
    setReady(true);
  }, [router]);

  function sanitizeForPrompt(s: unknown): string | undefined {
    if (typeof s !== "string") return undefined;
    return s.replace(/[\x00-\x1F\x7F]/g, " ").slice(0, 200).trim() || undefined;
  }

  function handleRun() {
    const raw        = safeJson<Record<string, unknown>[]>("allegeats_registry", []);
    const crawlQueue = safeJson<Record<string, unknown>>("allegeats_crawl_queue", {});

    // Only send records missing a website — those are the actionable ones for Menu Manager.
    // Sending the full registry would exceed the Claude API context window.
    const noUrl = raw
      .filter(r => !r.website)
      .slice(0, 400)
      .map(r => ({
        registryId:  r.registryId,
        displayName: sanitizeForPrompt(r.displayName),
        website:     r.website,
        lat:         r.lat,
        lng:         r.lng,
        address:     sanitizeForPrompt(r.address),
        cuisine:     sanitizeForPrompt(r.cuisine),
        lastSeenAt:  r.lastSeenAt,
      }));

    const mockRestaurants = MOCK_RESTAURANTS.map(r => ({
      id: r.id,
      name: r.name,
      itemCount: r.menuItems.length,
    }));

    // Slim crawl queue to just IDs + source URLs — remove large metadata blobs
    const slimQueue: Record<string, unknown> = {};
    for (const [id, rec] of Object.entries(crawlQueue)) {
      const r = rec as Record<string, unknown>;
      slimQueue[id] = { sourceUrl: r.sourceUrl, lastCrawledAt: r.lastCrawledAt, status: r.status };
    }

    run({
      registry: noUrl,
      crawlQueue: slimQueue,
      mockRestaurants,
      totalRecords: raw.length,
      noUrlCount: raw.filter(r => !r.website).length,
      note: `Showing ${noUrl.length} records missing a website URL (out of ${raw.filter(r => !r.website).length} total without URL, ${raw.length} total records).`,
    });
  }

  function handleApprove(action: AgentAction) {
    const d = action.details;
    if (action.type === "fetch_menu" && d.url) {
      window.open(String(d.url), "_blank", "noopener");
    }
    resolve(action.id, "approved");
  }

  if (!ready) return null;

  return (
    <AgentConsole
      name="Menu Manager"
      emoji="📋"
      role="Analyzes restaurant registry and menu crawl data — flags stale or missing menus"
      contextLabel={ctx}
      running={running}
      streamText={streamText}
      actions={actions}
      onRun={handleRun}
      onApprove={handleApprove}
      onReject={a => resolve(a.id, "rejected")}
      backHref="/admin"
    />
  );
}

function safeJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}
