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
    if (sessionStorage.getItem(SESSION_KEY) !== "1") {
      router.replace("/admin");
      return;
    }
    const registry = safeJson<unknown[]>("allegeats_registry", []);
    setCtx(`${registry.length} restaurants in registry`);
    setReady(true);
  }, [router]);

  function handleRun() {
    const registry = safeJson<unknown[]>("allegeats_registry", []);
    run({ registry });
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
