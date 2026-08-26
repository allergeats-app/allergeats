"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "allegeats_safety_v1";

export function DisclaimerGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      // storage blocked (private browsing, etc.) — don't show blocker
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch { /* ignore */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Safety disclaimer"
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        background: "rgba(0,0,0,0.72)",
        WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)",
        padding: "0 0 max(20px, env(safe-area-inset-bottom)) 0",
      }}
    >
      <div style={{
        background: "var(--c-card, #fff)",
        borderRadius: "24px 24px 16px 16px",
        width: "100%", maxWidth: 480,
        margin: "0 12px",
        padding: "28px 24px 24px",
        boxShadow: "0 -4px 40px rgba(0,0,0,0.3)",
        border: "1px solid var(--c-border, rgba(0,0,0,0.1))",
      }}>

        {/* Icon + heading */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: "rgba(220,38,38,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--c-text, #111)", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              Before you use AllergEats
            </div>
            <div style={{ fontSize: 12, color: "var(--c-sub, #6b7280)", marginTop: 2, fontWeight: 600 }}>
              Safety information — please read
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ fontSize: 14, color: "var(--c-sub, #6b7280)", lineHeight: 1.7, marginBottom: 20 }}>
          <p style={{ marginBottom: 10 }}>
            AllergEats helps you <strong style={{ color: "var(--c-text, #111)" }}>identify potential allergens</strong> in restaurant menu items.
            It is <strong style={{ color: "var(--c-text, #111)" }}>not a medical service</strong>.
          </p>
          <ul style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <li>Allergen data may be <strong style={{ color: "var(--c-text, #111)" }}>incomplete or outdated</strong></li>
            <li>Menus change — ingredients vary by location and date</li>
            <li>Cross-contamination risks cannot be fully predicted</li>
            <li><strong style={{ color: "var(--c-text, #111)" }}>Always confirm with restaurant staff</strong> before ordering</li>
            <li>Never rely solely on this app for life-threatening allergies</li>
          </ul>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={accept}
          style={{
            width: "100%", padding: "15px 0",
            borderRadius: 14, border: "none",
            background: "var(--c-brand, #1fbdcc)",
            color: "var(--c-brand-fg, #fff)",
            fontSize: 16, fontWeight: 800,
            cursor: "pointer", letterSpacing: "-0.01em",
            marginBottom: 14,
          }}
        >
          I understand — let&apos;s go
        </button>

        {/* Legal links */}
        <p style={{
          fontSize: 12, color: "var(--c-sub, #9ca3af)",
          textAlign: "center", lineHeight: 1.6, margin: 0,
        }}>
          By continuing, you agree to our{" "}
          <Link href="/terms" onClick={accept} style={{ color: "var(--c-brand, #1fbdcc)", fontWeight: 700 }}>Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" onClick={accept} style={{ color: "var(--c-brand, #1fbdcc)", fontWeight: 700 }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
