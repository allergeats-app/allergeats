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

    // Errors can appear in query string (?error=) OR hash (#error=) depending on flow type.
    const params     = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const error      = params.get("error") || hashParams.get("error");
    const errorDesc  = params.get("error_description") || hashParams.get("error_description") || "";

    if (error) {
      const isEmailConflict = /already.registered|email.*exist|conflict|different.*provider/i.test(errorDesc);
      router.replace(`/auth?error=${isEmailConflict ? "email_conflict" : "oauth_cancelled"}`);
      return;
    }

    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    function finish(path: string) {
      if (done) return;
      done = true;
      if (timer !== null) clearTimeout(timer);
      subscription?.unsubscribe();
      router.replace(path);
    }

    // Register the listener FIRST before any async work to avoid a race condition:
    // detectSessionInUrl:true can exchange the code and fire SIGNED_IN before
    // getSession().then() registers its listener, leaving the page stuck in loading.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, sess) => {
      if (sess) {
        finish("/");
      } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
        // Exchange failed — fall back to error
        finish("/auth?error=oauth_cancelled");
      }
    });

    timer = setTimeout(() => {
      if (!done) {
        done = true;
        subscription.unsubscribe();
        setErrMsg("Sign-in timed out — please try again.");
      }
    }, 12000);

    // Also check if session is already present (exchange may have completed synchronously)
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) finish("/");
    }).catch(() => { /* ignore */ });

    return () => {
      if (timer !== null) clearTimeout(timer);
      if (!done) subscription.unsubscribe();
    };
  }, [router]);

  if (errMsg) {
    return (
      <main style={{
        minHeight: "100dvh", background: "var(--c-bg)",
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
      minHeight: "100dvh", background: "var(--c-bg)",
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
