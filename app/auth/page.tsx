"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Mode = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const { signIn, signUp, signInWithOAuth, user } = useAuth();
  useTheme();
  const router = useRouter();

  const REMEMBER_KEY = "allegeats_remembered_email";

  const [mode, setMode]         = useState<Mode>("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStay] = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | null>(null);

  useEffect(() => { if (user) router.replace("/"); }, [user, router]);
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) setEmail(saved); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("error");
    if (p === "oauth_cancelled") setError("Sign-in was cancelled.");
    else if (p === "oauth_failed") setError("Sign-in failed — please try again.");
  }, []);

  function switchMode(m: Mode) { setMode(m); setError(null); setInfo(null); }

  async function handleOAuth(provider: "google") {
    setError(null);
    setOauthLoading(provider);
    const err = await signInWithOAuth(provider);
    if (err) { setError(err); setOauthLoading(null); }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const sb = getSupabaseClient();
    if (!sb) { setError("Auth not configured"); setLoading(false); return; }
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setInfo("Check your email for a password reset link.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const err = mode === "signin"
      ? await signIn(email, password, staySignedIn)
      : await signUp(email, password, "", "");

    setLoading(false);
    if (err) { setError(err); return; }

    if (mode === "signin") {
      if (staySignedIn) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      router.push("/");
    } else {
      setInfo("Check your email to confirm your account, then sign in.");
      switchMode("signin");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", boxSizing: "border-box",
    padding: "13px 14px", borderRadius: 12, fontSize: 15,
    color: "var(--c-text)", background: "var(--c-input)", outline: "none",
    border: "1.5px solid var(--c-border)", transition: "border-color 0.15s",
  };

  return (
    <main style={{
      minHeight: "100dvh", background: "var(--c-bg)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: `max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))`,
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 8, display: "block", textAlign: "center" }}>
        <Image src="/logo.png" alt="AllergEats" width={280} height={64}
          style={{ width: "auto", height: 56, maxWidth: "80vw", display: "block", margin: "0 auto" }} priority />
      </Link>
      <p style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 28, textAlign: "center" }}>
        Eat safely with food allergies
      </p>

      {/* Card */}
      <div style={{
        background: "var(--c-card)", border: "1px solid var(--c-border)",
        borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 400,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>

        {mode === "forgot" ? (
          /* ── Forgot password ── */
          <>
            <button onClick={() => switchMode("signin")} style={{ background: "none", border: "none", color: "var(--c-sub)", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 18, display: "flex", alignItems: "center", gap: 4 }}>
              ← Back to sign in
            </button>
            <div style={{ fontWeight: 800, fontSize: 20, color: "var(--c-text)", marginBottom: 6 }}>Reset your password</div>
            <div style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 24, lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </div>
            <form onSubmit={handleForgotPassword} style={{ display: "grid", gap: 14 }}>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" style={inputStyle} />
              {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>{error}</div>}
              {info  && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#15803d" }}>{info}</div>}
              <button type="submit" disabled={loading} style={{
                padding: "14px 0", borderRadius: 14, border: "none",
                background: loading ? "#9ca3af" : "#eb1700", color: "#fff",
                fontSize: 15, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          /* ── Sign in / Sign up ── */
          <>
            {/* Google SSO */}
            <button type="button" onClick={() => handleOAuth("google")} disabled={oauthLoading !== null}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "13px 16px", borderRadius: 14, marginBottom: 20,
                border: "1.5px solid var(--c-border)", background: "var(--c-card)",
                color: "var(--c-text)", fontSize: 15, fontWeight: 700,
                cursor: oauthLoading ? "not-allowed" : "pointer",
                opacity: oauthLoading ? 0.7 : 1, transition: "opacity 0.15s",
              }}>
              {oauthLoading === "google" ? "Redirecting…" : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
              <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
            </div>

            {/* Mode tabs */}
            <div style={{ display: "flex", background: "var(--c-muted)", borderRadius: 12, padding: 4, marginBottom: 22 }}>
              {(["signin", "signup"] as const).map((m) => (
                <button key={m} onClick={() => switchMode(m)} style={{
                  flex: 1, padding: "9px 0", borderRadius: 9, border: "none",
                  background: mode === m ? "var(--c-card)" : "transparent",
                  color: mode === m ? "var(--c-text)" : "var(--c-sub)",
                  fontSize: 14, fontWeight: 700, cursor: "pointer",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}>
                  {m === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              {/* Email */}
              <div>
                <label htmlFor="auth-email" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Email</label>
                <input id="auth-email" type="email" required value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com" style={inputStyle} />
              </div>

              {/* Password */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <label htmlFor="auth-password" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Password</label>
                  {mode === "signin" && (
                    <button type="button" onClick={() => switchMode("forgot")}
                      style={{ background: "none", border: "none", fontSize: 12, color: "#eb1700", fontWeight: 600, cursor: "pointer", padding: 0 }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <input id="auth-password" type="password" required minLength={6}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                  style={inputStyle} />
              </div>

              {/* Stay signed in */}
              {mode === "signin" && (
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={staySignedIn} onChange={(e) => setStay(e.target.checked)}
                    style={{ width: 17, height: 17, accentColor: "#eb1700", cursor: "pointer", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Stay signed in</span>
                </label>
              )}

              {error && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>{error}</div>}
              {info  && <div style={{ padding: "10px 14px", borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: 13, color: "#15803d" }}>{info}</div>}

              <button type="submit" disabled={loading} style={{
                marginTop: 2, padding: "14px 0", borderRadius: 14, border: "none",
                background: loading ? "#9ca3af" : "#eb1700", color: "#fff",
                fontSize: 15, fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
              }}>
                {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </>
        )}
      </div>

      <Link href="/" style={{ marginTop: 24, fontSize: 13, color: "var(--c-sub)", textDecoration: "none" }}>
        ← Back to home
      </Link>
    </main>
  );
}
