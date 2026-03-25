"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { isPasskeySupported, authenticateWithPasskey } from "@/lib/passkey";
import { getSupabaseClient } from "@/lib/supabaseClient";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const { signIn, signUp, signInWithOAuth, user } = useAuth();
  useTheme();
  const router = useRouter();

  const REMEMBER_KEY = "allegeats_remembered_email";

  const [mode, setMode]             = useState<Mode>("signin");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [firstNameVal, setFirstName] = useState("");
  const [lastNameVal,  setLastName]  = useState("");
  const [staySignedIn, setStay]     = useState(true);
  const [rememberEmail, setRemember] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [info, setInfo]             = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [passkeyLoading, setPasskeyLoading]     = useState(false);
  const [oauthLoading, setOauthLoading]         = useState<"google" | null>(null);

  // Already signed in — go home
  useEffect(() => {
    if (user) router.replace("/");
  }, [user, router]);

  // Detect Face ID / Touch ID support
  useEffect(() => {
    isPasskeySupported().then(setPasskeySupported);
  }, []);

  // Pre-fill email if remembered
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY);
    if (saved) { setEmail(saved); setRemember(true); } // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // Show error from OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err === "oauth_cancelled") setError("Sign-in was cancelled.");
    else if (err === "oauth_failed") setError("Sign-in failed — please try again.");
  }, []);

  async function handleOAuth(provider: "google") {
    setError(null);
    setOauthLoading(provider);
    const err = await signInWithOAuth(provider);
    if (err) { setError(err); setOauthLoading(null); }
    // On success, browser navigates to provider — no state reset needed
  }

  async function handleFaceId() {
    if (!email) { setError("Enter your email first, then tap Face ID"); return; }
    setError(null);
    setPasskeyLoading(true);
    const result = await authenticateWithPasskey(email);
    if ("error" in result) { setError(result.error); setPasskeyLoading(false); return; }
    const sb = getSupabaseClient();
    if (!sb) { setError("Auth not configured"); setPasskeyLoading(false); return; }
    const { error: otpErr } = await sb.auth.verifyOtp({
      token_hash: result.tokenHash,
      type:       "magiclink",
    });
    setPasskeyLoading(false);
    if (otpErr) { setError("Face ID sign-in failed — please use your password"); return; }
    router.push("/");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const err = mode === "signin"
      ? await signIn(email, password, staySignedIn)
      : await signUp(email, password, firstNameVal.trim(), lastNameVal.trim());

    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    if (mode === "signin") {
      if (rememberEmail) localStorage.setItem(REMEMBER_KEY, email);
      else localStorage.removeItem(REMEMBER_KEY);
      router.push("/");
    } else {
      setInfo("Check your email to confirm your account, then sign in.");
      setMode("signin");
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        fontFamily: "Inter, Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none", marginBottom: 28, display: "block", textAlign: "center" }}>
        <Image src="/logo.png" alt="AllergEats" width={280} height={64} style={{ width: "auto", height: 64, maxWidth: "90vw", display: "block", margin: "0 auto", transform: "translateX(-2px)" }} priority />
      </Link>

      {/* Card */}
      <div
        style={{
          background: "var(--c-card)",
          border: "1px solid var(--c-border)",
          borderRadius: 24,
          padding: 28,
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        }}
      >
        {/* Social SSO buttons */}
        <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              padding: "13px 16px", borderRadius: 14,
              border: "1.5px solid var(--c-border)", background: "var(--c-card)",
              color: "var(--c-text)", fontSize: 15, fontWeight: 700,
              cursor: oauthLoading ? "not-allowed" : "pointer",
              opacity: oauthLoading && oauthLoading !== "google" ? 0.5 : 1,
              transition: "opacity 0.15s",
            }}
          >
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

        </div>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
          <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>or continue with email</span>
          <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
        </div>

        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            background: "var(--c-muted)",
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setInfo(null); }}
              style={{
                flex: 1,
                padding: "9px 0",
                borderRadius: 9,
                border: "none",
                background: mode === m ? "var(--c-card)" : "transparent",
                color: mode === m ? "var(--c-text)" : "var(--c-sub)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s",
              }}
            >
              {m === "signin" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
          <div>
            <label htmlFor="auth-email" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", border: "1px solid #e5e7eb",
                borderRadius: 12, fontSize: 15, color: "var(--c-text)",
                background: "var(--c-input)", outline: "none",
              }}
            />
          </div>

          <div>
            <label htmlFor="auth-password" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "12px 14px", border: "1px solid #e5e7eb",
                borderRadius: 12, fontSize: 15, color: "var(--c-text)",
                background: "var(--c-input)", outline: "none",
              }}
            />
          </div>

          {mode === "signup" && (
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="auth-first-name" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
                  First Name
                </label>
                <input
                  id="auth-first-name"
                  type="text"
                  required
                  value={firstNameVal}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "12px 14px", border: "1px solid #e5e7eb",
                    borderRadius: 12, fontSize: 15, color: "var(--c-text)",
                    background: "var(--c-input)", outline: "none",
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="auth-last-name" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
                  Last Name
                </label>
                <input
                  id="auth-last-name"
                  type="text"
                  required
                  value={lastNameVal}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last"
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "12px 14px", border: "1px solid #e5e7eb",
                    borderRadius: 12, fontSize: 15, color: "var(--c-text)",
                    background: "var(--c-input)", outline: "none",
                  }}
                />
              </div>
            </div>
          )}

          {mode === "signin" && (
            <div style={{ display: "flex", gap: 20 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) => setRemember(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#eb1700", cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Remember me</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={staySignedIn}
                  onChange={(e) => setStay(e.target.checked)}
                  style={{ width: 16, height: 16, accentColor: "#eb1700", cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Keep me signed in</span>
              </label>
            </div>
          )}

          {error && (
            <div
              style={{
                padding: "10px 14px", borderRadius: 10,
                background: "#fff1f0", border: "1px solid #f3c5c0",
                fontSize: 13, color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          {info && (
            <div
              style={{
                padding: "10px 14px", borderRadius: 10,
                background: "#f0fdf4", border: "1px solid #bbf7d0",
                fontSize: 13, color: "#15803d",
              }}
            >
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "14px 0",
              borderRadius: 14,
              border: "none",
              background: loading ? "#9ca3af" : "#eb1700",
              color: "#fff",
              fontSize: 15,
              fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>

          {/* Face ID / Touch ID button — only shown on supported devices in sign-in mode */}
          {mode === "signin" && passkeySupported && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
                <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
                <span style={{ fontSize: 12, color: "var(--c-sub)", fontWeight: 600 }}>or</span>
                <div style={{ flex: 1, height: 1, background: "var(--c-border)" }} />
              </div>
              <button
                type="button"
                onClick={handleFaceId}
                disabled={passkeyLoading}
                style={{
                  padding: "14px 0",
                  borderRadius: 14,
                  border: "1.5px solid var(--c-border)",
                  background: "var(--c-card)",
                  color: "var(--c-text)",
                  fontSize: 15,
                  fontWeight: 800,
                  cursor: passkeyLoading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  transition: "background 0.15s",
                }}
              >
                {passkeyLoading ? (
                  "Verifying…"
                ) : (
                  <>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2C9.24 2 7 4.24 7 7v1H5v13h14V8h-2V7c0-2.76-2.24-5-5-5zm0 2c1.66 0 3 1.34 3 3v1H9V7c0-1.66 1.34-3 3-3zm0 8c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2z" fill="currentColor" opacity="0.15"/>
                      <path d="M9 12c0-.55.45-1 1-1 .28 0 .52.11.71.29" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <path d="M7 7c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                      <path d="M6 10c-.55 0-1 .45-1 1v8c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-8c0-.55-.45-1-1-1H6z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                      <circle cx="12" cy="15" r="1.5" fill="currentColor"/>
                      <path d="M12 16.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    Sign In with Face ID
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>

      <Link href="/" style={{ marginTop: 20, fontSize: 13, color: "var(--c-sub)", textDecoration: "none" }}>
        ← Back to home
      </Link>
    </main>
  );
}
