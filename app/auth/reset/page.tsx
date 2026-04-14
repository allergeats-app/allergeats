"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useTheme } from "@/lib/themeContext";

export default function ResetPasswordPage() {
  useTheme();
  const router = useRouter();

  const [password, setPassword]   = useState("");
  const [confirm,  setConfirm]    = useState("");
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState<string | null>(null);
  const [done,     setDone]       = useState(false);
  const [ready,    setReady]      = useState(false);

  // Supabase delivers the recovery token via the URL hash.
  // onAuthStateChange fires PASSWORD_RECOVERY once the session is live.
  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) { router.replace("/auth"); return; }

    // If already in a recovery session (page reload), just show the form
    sb.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((event, sess) => {
      if (event === "PASSWORD_RECOVERY" && sess) {
        setReady(true);
      } else if (!sess && event !== "INITIAL_SESSION") {
        // No session and not just initialising — link may be expired
        setError("This reset link has expired. Please request a new one.");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }

    setLoading(true);
    const sb = getSupabaseClient();
    if (!sb) { setError("Auth not configured."); setLoading(false); return; }

    const { error: err } = await sb.auth.updateUser({ password });
    setLoading(false);

    if (err) { setError(err.message); return; }
    setDone(true);
    setTimeout(() => router.replace("/"), 2000);
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
      padding: "24px 16px",
    }}>
      <div style={{
        background: "var(--c-card)", border: "1px solid var(--c-border)",
        borderRadius: 24, padding: "28px 24px", width: "100%", maxWidth: 400,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
      }}>
        {done ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: "var(--c-text)", marginBottom: 8 }}>
              Password updated!
            </div>
            <div style={{ fontSize: 14, color: "var(--c-sub)" }}>Redirecting you home…</div>
          </div>
        ) : !ready ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            {error ? (
              <>
                <div style={{ fontSize: 14, color: "#b91c1c", marginBottom: 20 }}>{error}</div>
                <button
                  onClick={() => router.replace("/auth")}
                  style={{
                    padding: "12px 24px", borderRadius: 12, border: "none",
                    background: "#1fbdcc", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  Back to sign in
                </button>
              </>
            ) : (
              <>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "3px solid var(--c-border)", borderTopColor: "#1fbdcc",
                  animation: "spin 0.8s linear infinite", margin: "0 auto 12px",
                }} />
                <div style={{ fontSize: 14, color: "var(--c-sub)" }}>Verifying reset link…</div>
              </>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 900, fontSize: 22, color: "var(--c-text)", marginBottom: 6 }}>
              Set new password
            </div>
            <div style={{ fontSize: 14, color: "var(--c-sub)", marginBottom: 24, lineHeight: 1.5 }}>
              Choose a new password for your account.
            </div>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
              <div>
                <label htmlFor="new-password" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>New password</label>
                <input id="new-password" type="password" required minLength={8}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters" style={inputStyle} />
              </div>
              <div>
                <label htmlFor="confirm-password" style={{ fontSize: 12, fontWeight: 700, color: "var(--c-sub)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>Confirm password</label>
                <input id="confirm-password" type="password" required minLength={6}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Same password again" style={inputStyle} />
              </div>

              {error && (
                <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fff1f0", border: "1px solid #f3c5c0", fontSize: 13, color: "#b91c1c" }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                marginTop: 2, padding: "14px 0", borderRadius: 14, border: "none",
                background: loading ? "#9ca3af" : "#1fbdcc", color: "#fff",
                fontSize: 15, fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
              }}>
                {loading ? "Updating…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}