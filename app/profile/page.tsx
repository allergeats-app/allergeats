"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useTheme, type ThemeMode } from "@/lib/themeContext";
import { isPasskeySupported, registerPasskey, removePasskey } from "@/lib/passkey";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ProfilePage() {
  const { user, loading, firstName, lastName, displayName, saveName, signOut } = useAuth();
  const { isDark, mode: themeMode, setMode: setThemeMode } = useTheme();
  const router = useRouter();

  const [signingOut, setSigningOut]       = useState(false);
  const [firstEdit, setFirstEdit]   = useState("");
  const [lastEdit,  setLastEdit]    = useState("");
  const [nameSaved, setNameSaved]   = useState(false);

  // Passkey state
  const [passkeySupported, setPasskeySupported]   = useState(false);
  const [passkeyRegistered, setPasskeyRegistered] = useState<string | null>(null); // credential_id
  const [passkeyLoading, setPasskeyLoading]       = useState(false);
  const [passkeyMsg, setPasskeyMsg]               = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  useEffect(() => {
    setFirstEdit(firstName); // eslint-disable-line react-hooks/set-state-in-effect
    setLastEdit(lastName);
  }, [firstName, lastName]);

  // Check passkey support and load existing credential
  useEffect(() => {
    isPasskeySupported().then(setPasskeySupported);
  }, []);

  useEffect(() => {
    if (!user) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    sb.from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()
      .then(({ data }) => { if (data) setPasskeyRegistered(data.credential_id as string); });
  }, [user]);

  async function handleAddPasskey() {
    const sb = getSupabaseClient();
    const session = (await sb?.auth.getSession())?.data.session;
    if (!session?.access_token) return;
    setPasskeyLoading(true);
    setPasskeyMsg(null);
    const err = await registerPasskey(session.access_token);
    setPasskeyLoading(false);
    if (err) {
      setPasskeyMsg({ text: err, ok: false });
    } else {
      // Reload credential id
      const { data } = await sb!.from("webauthn_credentials")
        .select("credential_id").eq("user_id", user!.id).limit(1).single();
      if (data) setPasskeyRegistered(data.credential_id as string);
      setPasskeyMsg({ text: "Face ID added! You can now sign in with it.", ok: true });
    }
  }

  async function handleRemovePasskey() {
    if (!passkeyRegistered) return;
    const sb = getSupabaseClient();
    const session = (await sb?.auth.getSession())?.data.session;
    if (!session?.access_token) return;
    setPasskeyLoading(true);
    setPasskeyMsg(null);
    const err = await removePasskey(passkeyRegistered, session.access_token);
    setPasskeyLoading(false);
    if (err) {
      setPasskeyMsg({ text: err, ok: false });
    } else {
      setPasskeyRegistered(null);
      setPasskeyMsg({ text: "Face ID removed.", ok: true });
    }
  }

  async function handleSaveName() {
    await saveName(firstEdit, lastEdit);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await signOut();
    router.push("/");
  }

  if (loading || !user) {
    return (
      <main style={{ minHeight: "100vh", background: "var(--c-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: "#9ca3af" }}>
        Loading…
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--c-bg)",
        fontFamily: "Inter, Arial, sans-serif",
        paddingBottom: 48,
      }}
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 50,
          background: "var(--c-hdr)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid var(--c-border)", padding: "12px 16px",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: "var(--c-sub)", textDecoration: "none" }}>← Home</Link>
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--c-text)" }}>My Account</span>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              fontSize: 13, fontWeight: 700, color: "#b91c1c",
              background: "none", border: "none", cursor: "pointer", padding: 0,
            }}
          >
            {signingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 16 }}>

        {/* Account card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
            Account
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#eb1700", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, flexShrink: 0,
              }}
            >
              {(firstName?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              {displayName && <div style={{ fontWeight: 900, fontSize: 16, color: "var(--c-text)" }}>{displayName}</div>}
              <div style={{ fontWeight: displayName ? 500 : 800, fontSize: displayName ? 13 : 15, color: displayName ? "var(--c-sub)" : "var(--c-text)" }}>{user.email}</div>
              <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 2 }}>
                Member since {new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </div>
            </div>
          </div>
        </div>

        {/* Settings card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>
            Settings
          </div>

          {/* Name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>
              Name
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input
                id="profile-first-name"
                type="text"
                value={firstEdit}
                onChange={(e) => setFirstEdit(e.target.value)}
                placeholder="First name"
                aria-label="First name"
                style={{
                  flex: 1, minWidth: 100, padding: "10px 12px", border: "1px solid var(--c-border)",
                  borderRadius: 10, fontSize: 14, color: "var(--c-text)",
                  background: "var(--c-input)", outline: "none", boxSizing: "border-box",
                }}
              />
              <input
                id="profile-last-name"
                type="text"
                value={lastEdit}
                onChange={(e) => setLastEdit(e.target.value)}
                placeholder="Last name"
                aria-label="Last name"
                style={{
                  flex: 1, minWidth: 100, padding: "10px 12px", border: "1px solid var(--c-border)",
                  borderRadius: 10, fontSize: 14, color: "var(--c-text)",
                  background: "var(--c-input)", outline: "none", boxSizing: "border-box",
                }}
              />
              {(firstEdit.trim() !== firstName || lastEdit.trim() !== lastName || nameSaved) && (
                <button
                  onClick={handleSaveName}
                  style={{
                    padding: "10px 16px", borderRadius: 10, border: "none",
                    background: nameSaved ? "#22c55e" : "var(--c-text)",
                    color: "var(--c-bg)", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap",
                  }}
                >
                  {nameSaved ? "Saved!" : "Save"}
                </button>
              )}
            </div>
          </div>

          {/* Appearance / theme selector */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 10 }}>
              Appearance
            </div>
            <div style={{ display: "flex", background: isDark ? "#2c2c2e" : "#f3f4f6", borderRadius: 12, padding: 4, gap: 2 }}>
              {(["system", "light", "dark"] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setThemeMode(m)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 9, border: "none",
                    background: themeMode === m ? (isDark ? "#3a3a3c" : "#fff") : "transparent",
                    color: themeMode === m ? "var(--c-text)" : "var(--c-sub)",
                    fontSize: 13, fontWeight: themeMode === m ? 700 : 500,
                    cursor: "pointer",
                    boxShadow: themeMode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {m === "system" ? "Auto" : m === "light" ? "Light" : "Dark"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: "var(--c-sub)", marginTop: 6 }}>
              {themeMode === "system" ? "Matches your phone's display settings" :
               themeMode === "light" ? "Always light" : "Always dark"}
            </div>
          </div>
        </div>


      </div>
    </main>
  );
}
