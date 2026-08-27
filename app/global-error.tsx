"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Fallback when the root layout itself throws — must include its own <html>/<body>
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { Sentry.captureException(error); }, [error]);
  return (
    <html lang="en">
      <body style={{
        margin: 0,
        fontFamily: "system-ui, sans-serif",
        background: "#0a0f0f",
        color: "#f0f0f0",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "rgba(220,38,38,0.12)",
          border: "1.5px solid rgba(220,38,38,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none"
            stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3"/>
          </svg>
        </div>

        <h1 style={{
          fontSize: 26, fontWeight: 800,
          letterSpacing: "-0.02em", margin: "0 0 10px",
        }}>
          AllergEats is having trouble
        </h1>

        <p style={{
          fontSize: 15, color: "#a0a0a0",
          lineHeight: 1.6, maxWidth: 300,
          margin: "0 0 28px",
        }}>
          A critical error occurred. Please try again or reload the page.
        </p>

        <button
          onClick={reset}
          style={{
            padding: "13px 32px", borderRadius: 12,
            background: "#1fbdcc",
            color: "#001f26", fontSize: 15, fontWeight: 800,
            border: "none", cursor: "pointer",
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
