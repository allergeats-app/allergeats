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
    if (sessionStorage.getItem(SESSION_KEY) !== "1") {
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

  function handleRun() {
    const registry   = safeJson<unknown[]>("allegeats_registry", []);
    const crawlQueue = safeJson<Record<string, unknown>>("allegeats_crawl_queue", {});
    const mockRestaurants = MOCK_RESTAURANTS.map(r => ({
      id: r.id,
      name: r.name,
      itemCount: r.menuItems.length,
    }));
    run({ registry, crawlQueue, mockRestaurants });
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
    />
  );
}

function safeJson<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback; }
  catch { return fallback; }
}
