"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FeedbackButton } from "@/components/FeedbackButton";

export function AppFooter() {
  const pathname = usePathname();
  if (pathname === "/try") return null;

  return (
    <footer style={{
      textAlign: "center",
      padding: `20px max(20px, env(safe-area-inset-right)) max(96px, calc(80px + env(safe-area-inset-bottom))) max(20px, env(safe-area-inset-left))`,
      fontSize: 13,
      color: "var(--c-sub)",
      lineHeight: 1.6,
    }}>
      <span style={{
        display: "block",
        fontSize: 11,
        fontWeight: 800,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--c-brand)",
        marginBottom: 4,
      }}>Always confirm with staff before ordering.</span>
      AllergEats is a decision-support tool, not medical advice.
      <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 20 }}>
        <Link href="/privacy" style={{ color: "var(--c-sub)", textDecoration: "none", fontWeight: 600 }}>Privacy Policy</Link>
        <Link href="/terms" style={{ color: "var(--c-sub)", textDecoration: "none", fontWeight: 600 }}>Terms of Service</Link>
        <FeedbackButton />
      </div>
    </footer>
  );
}
