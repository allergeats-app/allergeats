"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errMsg, setErrMsg] = useState<string | null>(null);

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
      sb.auth.exchangeCodeForSession(code).then(({ data, error: exchErr }) => {
        if (exchErr) {
          console.error("[auth/callback] exchangeCodeForSession error:", exchErr);
          setErrMsg(exchErr.message);
          return;
        }
        if (data.session) {
          router.replace("/");
        } else {
          setErrMsg("Session not established — please try signing in again.");
        }
      });
    } else {
      // No code — check if a session already exists (e.g. implicit flow via hash)
      sb.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/");
        } else {
          // Listen for the auth state change triggered by the hash fragment
          const { data: { subscription } } = sb.auth.onAuthStateChange((event, sess) => {
            if (sess) {
              subscription.unsubscribe();
              router.replace("/");
            }
          });
          // Timeout fallback
          setTimeout(() => {
            subscription.unsubscribe();
            router.replace("/auth?error=oauth_failed");
          }, 8000);
        }
      });
    }
  }, [router]);

  if (errMsg) {
    return (
      <main style={{
        minHeight: "100vh", background: "var(--c-bg)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 16, padding: "0 24px",
      }}>
        <div style={{ fontSize: 15, color: "#b91c1c", textAlign: "center", maxWidth: 340 }}>
          Sign-in failed: {errMsg}
        </div>
        <button onClick={() => router.replace("/auth")} style={{
          padding: "12px 24px", borderRadius: 12, border: "none",
          background: "#eb1700", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
        }}>
          Try again
        </button>
      </main>
    );
  }

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
