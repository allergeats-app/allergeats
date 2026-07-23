"use client";

import { useRef, useEffect } from "react";

export type AgentAction = {
  id: string;
  type: string;
  description: string;
  details: Record<string, unknown>;
  status: "pending" | "approved" | "rejected";
};

type Props = {
  name: string;
  emoji: string;
  role: string;
  contextLabel: string;
  running: boolean;
  streamText: string;
  actions: AgentAction[];
  onRun: () => void;
  onApprove: (action: AgentAction) => void;
  onReject: (action: AgentAction) => void;
};

const S = {
  bg:     "#0f0f0f",
  card:   "#1c1c1e",
  card2:  "#252528",
  border: "#2c2c2e",
  text:   "#f2f2f7",
  sub:    "#8e8e93",
  dim:    "#4a4a4e",
  brand:  "#1fbdcc",
  green:  "#4ade80",
  red:    "#f87171",
  amber:  "#d97706",
};

export function AgentConsole({ name, emoji, role, contextLabel, running, streamText, actions, onRun, onApprove, onReject }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [streamText]);

  const pending  = actions.filter(a => a.status === "pending");
  const resolved = actions.filter(a => a.status !== "pending");

  return (
    <div style={{ minHeight: "100dvh", background: S.bg, color: S.text, padding: "24px 20px", maxWidth: 760, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: "rgba(31,189,204,0.12)", border: "1px solid rgba(31,189,204,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
            }}>{emoji}</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: S.brand, letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1 }}>AI Employee</div>
              <div style={{ fontSize: 20, fontWeight: 900, marginTop: 2 }}>{name}</div>
            </div>
          </div>
          <div style={{ fontSize: 13, color: S.sub }}>{role}</div>
          {contextLabel && <div style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>{contextLabel}</div>}
        </div>
        <button
          onClick={onRun}
          disabled={running}
          style={{
            padding: "11px 22px", borderRadius: 12, border: "none", flexShrink: 0,
            background: running ? "#2c2c2e" : S.brand,
            color: running ? S.sub : "#001f26",
            fontSize: 14, fontWeight: 800, cursor: running ? "not-allowed" : "pointer",
          }}
        >
          {running ? "Running…" : "Run Now"}
        </button>
      </div>

      {/* Live stream */}
      {(running || streamText) && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: running ? S.brand : S.sub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            {running && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: S.brand, animation: "pulse 1.4s ease-in-out infinite" }} />}
            {running ? "Live Output" : "Last Output"}
          </div>
          <div
            ref={scrollRef}
            style={{
              background: S.card, border: `1px solid ${S.border}`, borderRadius: 14,
              padding: "16px 18px", maxHeight: 380, overflowY: "auto",
              fontSize: 12.5, lineHeight: 1.65, color: "#c7c7cc",
              fontFamily: "'SF Mono', 'Fira Code', monospace",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}
          >
            {streamText || "Thinking…"}
            {running && (
              <span style={{
                display: "inline-block", width: 8, height: 13,
                background: S.brand, marginLeft: 2, verticalAlign: "text-bottom",
                animation: "blink 1s step-end infinite",
              }} />
            )}
          </div>
        </div>
      )}

      {/* Pending actions */}
      {pending.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.amber, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Pending Approval — {pending.length} action{pending.length !== 1 ? "s" : ""}
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {pending.map(action => (
              <div key={action.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "14px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: S.amber, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>{action.type.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: S.text, marginBottom: 8 }}>{action.description}</div>
                  <pre style={{
                    fontSize: 11, color: S.sub, background: S.card2, borderRadius: 8,
                    padding: "8px 12px", margin: 0, overflowX: "auto",
                    whiteSpace: "pre-wrap", wordBreak: "break-all",
                    fontFamily: "'SF Mono', monospace",
                  }}>
                    {JSON.stringify(action.details, null, 2)}
                  </pre>
                </div>
                <div style={{ display: "flex", borderTop: `1px solid ${S.border}` }}>
                  <button onClick={() => onApprove(action)} style={{ flex: 1, padding: "11px 0", border: "none", background: "rgba(74,222,128,0.08)", color: S.green, fontSize: 13, fontWeight: 700, cursor: "pointer", borderRight: `1px solid ${S.border}` }}>
                    ✓ Approve
                  </button>
                  <button onClick={() => onReject(action)} style={{ flex: 1, padding: "11px 0", border: "none", background: "transparent", color: S.red, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolved */}
      {resolved.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: S.sub, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
            Completed — {resolved.length}
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {resolved.map(action => (
              <div key={action.id} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 10, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, color: action.status === "approved" ? S.green : S.red }}>
                  {action.status === "approved" ? "✓" : "✕"}
                </span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: action.status === "approved" ? S.green : S.red }}>{action.description}</div>
                  <div style={{ fontSize: 11, color: S.dim }}>{action.type.replace(/_/g, " ")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!running && !streamText && actions.length === 0 && (
        <div style={{ textAlign: "center", padding: "64px 0" }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22, margin: "0 auto 16px",
            background: "rgba(31,189,204,0.08)", border: "1px solid rgba(31,189,204,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
          }}>{emoji}</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: S.text, marginBottom: 6 }}>{name} is standing by</div>
          <div style={{ fontSize: 13, color: S.sub }}>Click "Run Now" to begin analysis</div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
      `}</style>
    </div>
  );
}
