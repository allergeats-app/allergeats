"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  useTheme();
  const router = useRouter();

  const [mode, setMode]             = useState<Mode>("signin");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [usernameVal, setUsername]  = useState("");
  const [staySignedIn, setStay]     = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [info, setInfo]             = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);

  // Already signed in — go to profile
  useEffect(() => {
    if (user) router.replace("/profile");
  }, [user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const err = mode === "signin"
      ? await signIn(email, password, staySignedIn)
      : await signUp(email, password, usernameVal.trim() || undefined);

    setLoading(false);

    if (err) {
      setError(err);
      return;
    }

    if (mode === "signup") {
      setInfo("Check your email to confirm your account, then sign in.");
      setMode("signin");
    } else {
      router.push("/profile");
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
        {/* Tab toggle */}
        <div
          style={{
            display: "flex",
            background: "#f3f4f6",
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
                background: mode === m ? "#fff" : "transparent",
                color: mode === m ? "#111" : "#6b7280",
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
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
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
            <label style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
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
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)", display: "block", marginBottom: 6 }}>
                Username <span style={{ fontWeight: 400, color: "#9ca3af" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={usernameVal}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. jonny123"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "12px 14px", border: "1px solid #e5e7eb",
                  borderRadius: 12, fontSize: 15, color: "#111",
                  background: "#fafafa", outline: "none",
                }}
              />
            </div>
          )}

          {mode === "signin" && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStay(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: "#eb1700", cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--c-text)" }}>Stay signed in</span>
            </label>
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
        </form>
      </div>

      <Link href="/" style={{ marginTop: 20, fontSize: 13, color: "var(--c-sub)", textDecoration: "none" }}>
        ← Back to home
      </Link>
    </main>
  );
}
