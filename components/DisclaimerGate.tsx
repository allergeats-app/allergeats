"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { TERMS_VERSION, SAFETY_NOTICE_VERSION, SAFETY_LS_KEY } from "@/lib/legalVersions";

type GateState = "loading" | "hidden" | "visible";

export function DisclaimerGate() {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<GateState>("loading");
  const supabaseChecked = useRef(false);

  // Phase 1 — check localStorage (synchronous, no flash)
  useEffect(() => {
    try {
      if (localStorage.getItem(SAFETY_LS_KEY)) {
        setState("hidden");
        return;
      }
    } catch { /* storage blocked */ }

    // localStorage doesn't have it — wait for auth to resolve before deciding
    if (!authLoading) resolveFromAuth(!!user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 2 — once auth settles, check Supabase for logged-in users
  useEffect(() => {
    if (authLoading || state === "hidden" || supabaseChecked.current) return;
    supabaseChecked.current = true;
    resolveFromAuth(!!user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function resolveFromAuth(loggedIn: boolean) {
    if (!loggedIn) {
      setState("visible");
      return;
    }
    // Logged-in: check Supabase for an existing acceptance record
    const sb = getSupabaseClient();
    if (!sb) { setState("visible"); return; }
    const { data } = await sb
      .from("safety_acceptances")
      .select("id")
      .eq("terms_version", TERMS_VERSION)
      .eq("safety_notice_version", SAFETY_NOTICE_VERSION)
      .maybeSingle();

    if (data) {
      // Already accepted on another device — sync localStorage
      try { localStorage.setItem(SAFETY_LS_KEY, String(Date.now())); } catch { /* ignore */ }
      setState("hidden");
    } else {
      setState("visible");
    }
  }

  async function accept() {
    // Write localStorage first so the modal disappears immediately
    try { localStorage.setItem(SAFETY_LS_KEY, String(Date.now())); } catch { /* ignore */ }
    setState("hidden");

    // Persist to Supabase for logged-in users
    if (user) {
      const sb = getSupabaseClient();
      if (sb) {
        await sb.from("safety_acceptances").upsert(
          {
            user_id:               user.id,
            terms_version:         TERMS_VERSION,
            safety_notice_version: SAFETY_NOTICE_VERSION,
            user_agent:            typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 512) : null,
          },
          { onConflict: "user_id,terms_version,safety_notice_version", ignoreDuplicates: true }
        );
      }
    }
  }

  if (state !== "visible") return null;

  const items = [
    { bold: "Info may be incomplete or outdated.", rest: " Menus and ingredients change." },
    { bold: "Cross-contamination can't be predicted.", rest: " Kitchen conditions vary." },
    { bold: "Always confirm with restaurant staff", rest: " before ordering." },
    { bold: "Not a medical service.", rest: " Never rely solely on AllergEats." },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Safety acknowledgement"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.65)",
        WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)",
        padding: "20px 16px max(20px, env(safe-area-inset-bottom))",
      }}
    >
      <div style={{
        background: "rgba(14, 24, 40, 0.82)",
        WebkitBackdropFilter: "blur(40px) saturate(160%)",
        backdropFilter: "blur(40px) saturate(160%)",
        borderRadius: 28,
        width: "100%", maxWidth: 440,
        padding: "32px 28px 28px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.08)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}>

        {/* Icon + heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: "rgba(31, 189, 204, 0.15)",
            border: "1px solid rgba(31, 189, 204, 0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--c-brand, #1fbdcc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#f0f8ff", letterSpacing: "-0.025em", lineHeight: 1.2 }}>
              A quick note before you start
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(180,215,240,0.55)", marginTop: 3, fontWeight: 500 }}>
              AllergEats is a tool, not a guarantee
            </div>
          </div>
        </div>

        {/* Lead sentence */}
        <p style={{ fontSize: 14, color: "rgba(200,228,248,0.75)", lineHeight: 1.65, marginBottom: 18 }}>
          We help you <strong style={{ color: "#f0f8ff", fontWeight: 700 }}>spot potential allergens</strong> on restaurant menus — but menu data changes, and we can't verify every ingredient.
        </p>

        {/* Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
          {items.map(({ bold, rest }) => (
            <div key={bold} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }}>
                <circle cx="8" cy="8" r="7" stroke="rgba(31,189,204,0.4)" strokeWidth="1.5"/>
                <circle cx="8" cy="8" r="2.5" fill="var(--c-brand, #1fbdcc)" opacity="0.7"/>
              </svg>
              <span style={{ fontSize: 13.5, color: "rgba(200,228,248,0.75)", lineHeight: 1.6 }}>
                <strong style={{ color: "#e8f4ff", fontWeight: 700 }}>{bold}</strong>
                {rest}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={accept}
          style={{
            width: "100%", padding: "15px 0",
            borderRadius: 100, border: "none",
            background: "var(--c-brand, #1fbdcc)",
            color: "#07111f",
            fontSize: 15, fontWeight: 800,
            cursor: "pointer", letterSpacing: "-0.01em",
            marginBottom: 16,
          }}
        >
          Got it — let&apos;s go
        </button>

        {/* Legal copy */}
        <p style={{
          fontSize: 11.5, color: "rgba(180,215,240,0.38)",
          textAlign: "center", lineHeight: 1.6, margin: 0,
        }}>
          By continuing you agree to our{" "}
          <Link href="/terms" onClick={accept} style={{ color: "rgba(31,189,204,0.7)", fontWeight: 600 }}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" onClick={accept} style={{ color: "rgba(31,189,204,0.7)", fontWeight: 600 }}>Privacy Policy</Link>
          {" "}and acknowledge the safety information above.
        </p>
      </div>
    </div>
  );
}
