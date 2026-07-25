"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

type Role = "user" | "assistant";
interface Message { role: Role; content: string; }

const QUICK_ACTIONS = [
  { label: "Reddit post", icon: "📢", prompt: "Write a Reddit post for r/FoodAllergies introducing AllergEats. Make it personal, community-focused, and not salesy. Include a catchy title." },
  { label: "Email a blogger", icon: "📧", prompt: "Write a cold email pitch to a food allergy blogger. Keep it under 150 words. Include [Blogger Name] and [Blog Name] placeholders. Subject line included." },
  { label: "Press pitch", icon: "📰", prompt: "Write a press pitch email for a food/health journalist. Include a strong news hook, 3 key facts about AllergEats, and a call to action. Under 200 words." },
  { label: "Instagram caption", icon: "📸", prompt: "Write 3 Instagram caption options for AllergEats. Each under 100 words. Include relevant hashtags. Tone: warm, relatable, allergy-community insider." },
  { label: "DM an influencer", icon: "💬", prompt: "Write a short DM (under 60 words) to a food allergy influencer asking if they'd try the app. No fluff, just honest and respectful." },
  { label: "Weekly outreach plan", icon: "📋", prompt: "Create a 5-target outreach plan for this week: list specific subreddits, blogger types, or press outlets to reach, with one sentence on the angle for each. Ready to action immediately." },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      onClick={copy}
      style={{
        marginTop: 8, padding: "6px 14px", borderRadius: 999,
        border: "1px solid var(--c-border)",
        background: copied ? "#22c55e" : "var(--c-card)",
        color: copied ? "#fff" : "var(--c-sub)",
        fontSize: 12, fontWeight: 700, cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function OutreachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const next: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await fetch("/api/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
        signal: ac.signal,
      });

      if (!res.ok || !res.body) {
        const errText = res.status === 429
          ? "Rate limit reached — take a break and try again."
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
  }, [messages, streaming]);

  function clearChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
  }

  const isEmpty = messages.length === 0;

  return (
    <main style={{ minHeight: "100dvh", background: "var(--c-bg)", fontFamily: "Inter, Arial, sans-serif", display: "flex", flexDirection: "column" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "var(--c-hdr)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)",
        borderBottom: "1px solid var(--c-border)",
        paddingTop: "max(12px, env(safe-area-inset-top))",
        paddingBottom: 12, paddingLeft: 16, paddingRight: 16,
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Home</Link>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: "var(--c-text)" }}>PR & Outreach Manager</div>
            <div style={{ fontSize: 11, color: "var(--c-sub)", fontWeight: 500 }}>Powered by Claude Sonnet</div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", background: "none", border: "none", cursor: "pointer", padding: "4px 8px" }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 720, width: "100%", margin: "0 auto", padding: "0 16px", display: "flex", flexDirection: "column" }}>

        {/* Welcome + quick actions */}
        {isEmpty && (
          <div style={{ padding: "32px 0 24px" }}>
            <div style={{ marginBottom: 6, fontSize: 28, fontWeight: 900, color: "var(--c-text)", letterSpacing: "-0.02em" }}>
              Let&apos;s grow AllergEats. 🚀
            </div>
            <div style={{ fontSize: 15, color: "var(--c-sub)", marginBottom: 28, lineHeight: 1.6 }}>
              I&apos;ll draft pitches, Reddit posts, press emails, and influencer DMs — ready to copy and send. Tell me where you want to reach out, or pick a quick start.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {QUICK_ACTIONS.map(a => (
                <button
                  key={a.label}
                  onClick={() => send(a.prompt)}
                  style={{
                    padding: "14px 16px", borderRadius: 14, textAlign: "left",
                    border: "1.5px solid var(--c-border)",
                    background: "var(--c-card)", cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                    transition: "border-color 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--c-brand)")}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--c-border)")}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{a.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>{a.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24 }}>
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.role === "user" ? (
                <div style={{
                  display: "flex", justifyContent: "flex-end",
                }}>
                  <div style={{
                    maxWidth: "80%", padding: "10px 16px",
                    borderRadius: "18px 18px 4px 18px",
                    background: "var(--c-brand)", color: "var(--c-brand-fg)",
                    fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap",
                  }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: "var(--c-card)", borderRadius: 16,
                  border: "1px solid var(--c-border)",
                  padding: "16px 18px",
                }}>
                  <div style={{ fontSize: 14, lineHeight: 1.75, color: "var(--c-text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {msg.content}
                    {streaming && i === messages.length - 1 && (
                      <span style={{ display: "inline-block", width: 2, height: 14, background: "var(--c-brand)", marginLeft: 3, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />
                    )}
                  </div>
                  {!streaming && msg.content && (
                    <CopyButton text={msg.content} />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Sticky input */}
      <div style={{
        position: "sticky", bottom: 0,
        background: "var(--c-hdr)", WebkitBackdropFilter: "blur(24px)", backdropFilter: "blur(24px)",
        borderTop: "1px solid var(--c-border)",
        padding: "12px 16px",
        paddingBottom: "max(16px, calc(10px + env(safe-area-inset-bottom)))",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", gap: 10, alignItems: "flex-end" }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            placeholder="e.g. Write a Reddit post for r/Celiac…"
            disabled={streaming}
            rows={2}
            style={{
              flex: 1, padding: "10px 14px",
              borderRadius: 14, fontSize: 14, lineHeight: 1.5,
              border: "1.5px solid var(--c-border)",
              background: "var(--c-card)", color: "var(--c-text)",
              outline: "none", resize: "none",
              WebkitAppearance: "none",
              opacity: streaming ? 0.6 : 1,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "var(--c-brand)")}
            onBlur={e  => (e.currentTarget.style.borderColor  = "var(--c-border)")}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || streaming}
            style={{
              width: 44, height: 44, borderRadius: "50%", border: "none", flexShrink: 0,
              background: input.trim() && !streaming ? "var(--c-brand)" : "var(--c-border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: input.trim() && !streaming ? "pointer" : "default",
              transition: "background 0.15s",
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

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </main>
  );
}
