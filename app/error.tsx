"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Sentry captures this automatically via the SDK; no manual call needed
    console.error(error);
  }, [error]);

  return (
    <main style={{
      minHeight: "100dvh",
      background: "var(--c-bg)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      textAlign: "center",
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 20,
        background: "rgba(220,38,38,0.08)",
        border: "1.5px solid rgba(220,38,38,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
        </svg>
      </div>

      <h1 style={{
        fontSize: 28, fontWeight: 900,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        letterSpacing: "-0.02em", lineHeight: 1.15,
        color: "var(--c-text)",
        margin: "0 0 10px",
      }}>
        Something went wrong
      </h1>

      <p style={{
        fontSize: 15, color: "var(--c-sub)",
        lineHeight: 1.6, maxWidth: 320,
        margin: "0 0 32px",
      }}>
        An unexpected error occurred. We&apos;ve been notified and are looking into it.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
        <button
          onClick={reset}
          style={{
            display: "block", textAlign: "center",
            padding: "14px 0", borderRadius: 14,
            background: "linear-gradient(135deg, #149aab 0%, var(--c-brand) 50%, #35d4e4 100%)",
            boxShadow: "0 2px 0 rgba(0,0,0,0.2), 0 6px 20px rgba(0,150,165,0.3)",
            color: "var(--c-brand-fg)", fontSize: 15, fontWeight: 800,
            border: "none", cursor: "pointer", letterSpacing: "-0.01em",
            width: "100%",
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            display: "block", textAlign: "center",
            padding: "13px 0", borderRadius: 14,
            background: "var(--c-card)",
            border: "1.5px solid var(--c-border)",
            color: "var(--c-text)", fontSize: 15, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Go home
        </Link>
      </div>

      {error.digest && (
        <p style={{ marginTop: 24, fontSize: 11, color: "var(--c-sub)", fontFamily: "monospace" }}>
          Error ID: {error.digest}
        </p>
      )}
    </main>
  );
}
