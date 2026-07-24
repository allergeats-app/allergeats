"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AgentAction } from "@/components/admin/AgentConsole";

function actionDescription(a: Record<string, unknown>): string {
  switch (a.type) {
    case "fetch_menu":          return `Refresh menu: ${a.displayName ?? a.restaurantId}`;
    case "flag_stale":          return `Stale data: ${a.displayName ?? a.restaurantId}`;
    case "flag_no_url":         return `No menu URL: ${a.displayName ?? a.restaurantId}`;
    case "propose_correction":  return `Allergen fix: "${a.itemName}" at ${a.restaurantId}`;
    case "flag_review":         return `Flag for review: ${a.itemName ?? a.pattern ?? a.restaurantId}`;
    case "flag_duplicate":      return `Duplicate: "${a.name1}" ≈ "${a.name2}"`;
    case "flag_missing_data":   return `Missing fields: ${a.displayName} — ${(a.missingFields as string[])?.join(", ")}`;
    case "promote_rule":        return `Promote rule: "${a.pattern}" → ${a.allergen} (${a.newStatus})`;
    case "reject_rule":         return `Reject rule: "${a.pattern}" → ${a.allergen}`;
    default:                    return String(a.type ?? "Unknown action");
  }
}

function parseActions(text: string): AgentAction[] {
  const match = text.match(/ACTIONS:\s*```json\s*([\s\S]*?)\s*```/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]) as { actions?: Record<string, unknown>[] };
    return (parsed.actions ?? []).map((a, i) => ({
      id: `action-${i}`,
      type: String(a.type ?? "unknown"),
      description: actionDescription(a),
      details: a,
      status: "pending" as const,
    }));
  } catch {
    return [];
  }
}

export function useAgentStream(endpoint: string) {
  const [running, setRunning]       = useState(false);
  const [streamText, setStreamText] = useState("");
  const [actions, setActions]       = useState<AgentAction[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setRunning(false);
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  const run = useCallback(async (body: Record<string, unknown>) => {
    const token = typeof sessionStorage !== "undefined"
      ? (sessionStorage.getItem("allegeats_admin_token") ?? "")
      : "";

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setRunning(true);
    setStreamText("");
    setActions([]);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        setStreamText(`Error ${res.status}: ${res.statusText}`);
        return;
      }

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const { text } = JSON.parse(payload) as { text?: string };
            if (text) { full += text; setStreamText(full); }
          } catch { /* partial SSE chunk */ }
        }
      }

      setActions(parseActions(full));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setStreamText(`Error: ${String(err)}`);
    } finally {
      setRunning(false);
    }
  }, [endpoint]);

  const resolve = useCallback((id: string, status: "approved" | "rejected") => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }, []);

  return { running, streamText, actions, run, resolve, stop };
}
