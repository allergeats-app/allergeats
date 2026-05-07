"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/lib/themeContext";

type Role = "user" | "assistant";
interface Message { role: Role; content: string; }

const SUGGESTIONS = [
  "How do I set my allergens?",
  "Why are no restaurants showing?",
  "How does the safety score work?",
  "How do I scan a menu?",
];

export function SupportChat() {
  const { isDark } = useTheme();
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const ac = new AbortController();
    abortRef.current = ac;

    // Placeholder for streaming reply
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const errText = res.status === 429
          ? "You're sending messages too fast — give me a moment!"
          : "Something went wrong. Please try again.";
        setMessages(m => [...m.slice(0, -1), { role: "assistant", content: errText }]);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let reply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += dec.decode(value, { stream: true });
        setMessages(m => [...m.slice(0, -1), { role: "assistant", content: reply }]);
      }
    } catch (err: unknown) {
      if ((err as Error).name !== "AbortError") {
        setMessages(m => [...m.slice(0, -1), { role: "assistant", content: "Connection lost. Please try again." }]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function close() {
    abortRef.current?.abort();
    setOpen(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <>
      {/* Floating trigger */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Get support"
        style={{
          position: "fixed",
          bottom: "max(108px, calc(80px + env(safe-area-inset-bottom)))",
          left: 16,
          zIndex: 900,
          width: 44, height: 44,
          borderRadius: "50%",
          background: isDark ? "#1c1c1e" : "#fff",
          border: "1.5px solid var(--c-border)",
          boxShadow: "0 2px 12px rgba(0,0,0,0.14)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="var(--c-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* Backdrop + sheet */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 9997,
            background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={e => { if (e.target === e.currentTarget) close(); }}
        >
          <div style={{
            width: "100%", maxWidth: 520,
            height: "75dvh",
            background: "var(--c-card)",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
            display: "flex", flexDirection: "column",
            overflow: "hidden",
          }}>

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "16px 18px 14px",
              borderBottom: "1px solid var(--c-border)",
              flexShrink: 0,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--c-brand-bg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="var(--c-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)", lineHeight: 1.2 }}>AllergEats Support</div>
                <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} />
                  AI Assistant · Always online
                </div>
              </div>
              <button
                onClick={close}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--c-sub)", padding: 6, fontSize: 20, lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: "auto", padding: "16px 16px 8px",
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {/* Welcome state */}
              {isEmpty && (
                <div style={{ textAlign: "center", padding: "24px 0 8px" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🌿</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--c-text)", marginBottom: 6 }}>
                    How can I help?
                  </div>
                  <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 20, lineHeight: 1.5 }}>
                    Ask me anything about AllergEats — allergen profiles, restaurant scores, menu scanning, and more.
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {SUGGESTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        style={{
                          padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                          border: "1.5px solid var(--c-border)",
                          background: "var(--c-card)", color: "var(--c-text)",
                          cursor: "pointer", WebkitTapHighlightColor: "transparent",
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat bubbles */}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: msg.role === "user"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                    background: msg.role === "user"
                      ? "var(--c-brand)"
                      : isDark ? "#2c2c2e" : "#f3f4f6",
                    color: msg.role === "user" ? "var(--c-brand-fg)" : "var(--c-text)",
                    fontSize: 14, lineHeight: 1.55,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {msg.content}
                    {/* Blinking cursor while streaming last assistant message */}
                    {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                      <span style={{ display: "inline-block", width: 2, height: 14, background: "var(--c-sub)", marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />
                    )}
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{
              padding: "10px 12px",
              paddingBottom: "max(14px, calc(8px + env(safe-area-inset-bottom)))",
              borderTop: "1px solid var(--c-border)",
              display: "flex", gap: 8, alignItems: "center",
              flexShrink: 0,
            }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Message support…"
                disabled={streaming}
                style={{
                  flex: 1, height: 42, padding: "0 14px",
                  borderRadius: 999, fontSize: 14, fontWeight: 500,
                  border: "1.5px solid var(--c-border)",
                  background: isDark ? "#252528" : "#f9f8f6",
                  color: "var(--c-text)", outline: "none",
                  WebkitAppearance: "none",
                  opacity: streaming ? 0.6 : 1,
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--c-brand)")}
                onBlur={e  => (e.currentTarget.style.borderColor  = "var(--c-border)")}
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || streaming}
                aria-label="Send"
                style={{
                  width: 42, height: 42, borderRadius: "50%", border: "none",
                  background: input.trim() && !streaming ? "var(--c-brand)" : "var(--c-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: input.trim() && !streaming ? "pointer" : "default",
                  transition: "background 0.15s",
                  flexShrink: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={input.trim() && !streaming ? "var(--c-brand-fg)" : "var(--c-sub)"}
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </>
  );
}
