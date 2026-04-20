import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found | AllergEats",
};

export default function NotFound() {
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
        background: "rgba(31,189,204,0.08)",
        border: "1.5px solid rgba(31,189,204,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 20px",
      }}>
        <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none"
          stroke="#1fbdcc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3"/>
        </svg>
      </div>

      <h1 style={{
        fontSize: 28, fontWeight: 900,
        fontFamily: "'Georgia', 'Times New Roman', serif",
        letterSpacing: "-0.02em", lineHeight: 1.15,
        background: "linear-gradient(135deg, #149aab 0%, #1fbdcc 50%, #35d4e4 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        margin: "0 0 10px",
      }}>
        Page Not Found
      </h1>

      <p style={{
        fontSize: 15, color: "var(--c-sub)",
        lineHeight: 1.6, maxWidth: 320,
        margin: "0 0 32px",
      }}>
        This page doesn&apos;t exist. Try browsing nearby restaurants or scanning a menu.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 280 }}>
        <Link
          href="/"
          style={{
            display: "block", textAlign: "center",
            padding: "14px 0", borderRadius: 14,
            background: "linear-gradient(135deg, #149aab 0%, #1fbdcc 50%, #35d4e4 100%)",
            boxShadow: "0 2px 0 rgba(0,0,0,0.2), 0 6px 20px rgba(0,150,165,0.3)",
            color: "var(--c-brand-fg)", fontSize: 15, fontWeight: 800,
            textDecoration: "none", letterSpacing: "-0.01em",
          }}
        >
          Browse Restaurants
        </Link>
        <Link
          href="/scan"
          style={{
            display: "block", textAlign: "center",
            padding: "13px 0", borderRadius: 14,
            background: "var(--c-card)",
            border: "1.5px solid var(--c-border)",
            color: "var(--c-text)", fontSize: 15, fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Scan a Menu
        </Link>
      </div>
    </main>
  );
}
