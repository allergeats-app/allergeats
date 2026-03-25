"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

/**
 * OAuth callback page — handles the redirect from Google/Apple after login.
 * Must be client-side so Supabase can access the PKCE code verifier from localStorage.
 */
export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { router.replace("/"); return; }

    const params = new URLSearchParams(window.location.search);
    const code   = params.get("code");
    const error  = params.get("error");

    if (error) {
      router.replace("/auth?error=oauth_cancelled");
      return;
    }

    if (code) {
      sb.auth.exchangeCodeForSession(code).then(({ error: exchErr }) => {
        if (exchErr) router.replace("/auth?error=oauth_failed");
        else router.replace("/");
      });
    } else {
      // Fallback: session may already be set via hash fragment (implicit flow)
      sb.auth.getSession().then(({ data: { session } }) => {
        router.replace(session ? "/" : "/auth");
      });
    }
  }, [router]);

  return (
    <main style={{
      minHeight: "100vh", background: "var(--c-bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column", gap: 16,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: "3px solid var(--c-border)",
        borderTopColor: "#eb1700",
        animation: "spin 0.8s linear infinite",
      }} />
      <div style={{ fontSize: 15, color: "var(--c-sub)" }}>Signing you in…</div>
    </main>
  );
}
