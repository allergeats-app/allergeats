"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";

type Mode = "signin" | "signup";

export default function AuthPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();

  const [mode, setMode]         = useState<Mode>("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [info, setInfo]         = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

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
      ? await signIn(email, password)
      : await signUp(email, password);

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
        background: "linear-gradient(160deg, #fff7f6 0%, #f7f7f7 60%)",
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="AllergEats" style={{ height: 44, width: "auto" }} />
      </Link>

      {/* Card */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e5e7eb",
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
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
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
                borderRadius: 12, fontSize: 15, color: "#111",
                background: "#fafafa", outline: "none",
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
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
                borderRadius: 12, fontSize: 15, color: "#111",
                background: "#fafafa", outline: "none",
              }}
            />
          </div>

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

      <Link href="/" style={{ marginTop: 20, fontSize: 13, color: "#9ca3af", textDecoration: "none" }}>
        ← Back to home
      </Link>
    </main>
  );
}
