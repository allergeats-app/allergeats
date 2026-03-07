"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import { useTheme } from "@/lib/themeContext";
import { AllergySelector } from "@/components/AllergySelector";
import { ALLERGEN_LIST } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading, allergens, username, saveAllergens, saveUsername, signOut } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();
  const router = useRouter();

  const [selected, setSelected]       = useState<AllergenId[]>([]);
  const [saved, setSaved]             = useState(false);
  const [signingOut, setSigningOut]   = useState(false);
  const [usernameEdit, setUsernameEdit] = useState("");
  const [usernameSaved, setUsernameSaved] = useState(false);

  // Redirect to auth if not signed in (after loading completes)
  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [loading, user, router]);

  // Sync allergens from context once loaded
  useEffect(() => {
    if (allergens.length > 0) setSelected(allergens);
  }, [allergens]);

  // Sync username from context
  useEffect(() => {
    setUsernameEdit(username);
  }, [username]);

  async function handleSave() {
    await saveAllergens(selected);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleSaveUsername() {
    await saveUsername(usernameEdit.trim());
    setUsernameSaved(true);
    setTimeout(() => setUsernameSaved(false), 2000);
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

  const allergenLabels = selected
    .map((id) => ALLERGEN_LIST.find((a) => a.id === id))
    .filter(Boolean);

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
            {/* Avatar initials */}
            <div
              style={{
                width: 48, height: 48, borderRadius: "50%",
                background: "#eb1700", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 900, flexShrink: 0,
              }}
            >
              {(username?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
            </div>
            <div>
              {username && <div style={{ fontWeight: 900, fontSize: 16, color: "var(--c-text)" }}>{username}</div>}
              <div style={{ fontWeight: username ? 500 : 800, fontSize: username ? 13 : 15, color: username ? "var(--c-sub)" : "var(--c-text)" }}>{user.email}</div>
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

          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)", marginBottom: 8 }}>Username</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={usernameEdit}
                onChange={(e) => setUsernameEdit(e.target.value)}
                placeholder="Add a username…"
                style={{
                  flex: 1, padding: "10px 12px", border: "1px solid var(--c-border)",
                  borderRadius: 10, fontSize: 14, color: "var(--c-text)",
                  background: "var(--c-input)", outline: "none", boxSizing: "border-box",
                }}
              />
              <button
                onClick={handleSaveUsername}
                style={{
                  padding: "10px 16px", borderRadius: 10, border: "none",
                  background: usernameSaved ? "#22c55e" : "var(--c-text)",
                  color: "var(--c-bg)", fontSize: 13, fontWeight: 700,
                  cursor: "pointer", transition: "background 0.2s", whiteSpace: "nowrap",
                }}
              >
                {usernameSaved ? "Saved!" : "Save"}
              </button>
            </div>
          </div>

          {/* Dark mode toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--c-text)" }}>Dark Mode</div>
            <button
              onClick={toggleTheme}
              style={{
                width: 52, height: 28, borderRadius: 999, border: "none",
                background: isDark ? "#eb1700" : "#e5e7eb",
                cursor: "pointer", position: "relative", transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: "absolute", top: 3, left: isDark ? 27 : 3,
                  width: 22, height: 22, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Allergy profile card */}
        <div
          style={{
            background: "var(--c-card)", border: "1px solid var(--c-border)",
            borderRadius: 20, padding: 20,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
            Allergy Profile
          </div>
          <div style={{ fontSize: 13, color: "var(--c-sub)", marginBottom: 16 }}>
            Saved to your account and synced across devices.
          </div>

          <AllergySelector selected={selected} onChange={setSelected} />

          <button
            onClick={handleSave}
            style={{
              marginTop: 20, width: "100%", padding: "14px 0",
              borderRadius: 14, border: "none",
              background: saved ? "#22c55e" : "var(--c-text)",
              color: "var(--c-bg)", fontSize: 14, fontWeight: 800,
              cursor: "pointer", transition: "background 0.2s",
            }}
          >
            {saved ? "Saved!" : "Save Allergy Profile"}
          </button>
        </div>

        {/* Current profile summary */}
        {allergenLabels.length > 0 && (
          <div
            style={{
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              borderRadius: 20, padding: 20,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "var(--c-sub)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>
              Active Restrictions ({allergenLabels.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {allergenLabels.map((a) => (
                <div
                  key={a!.id}
                  style={{
                    padding: "7px 12px", borderRadius: 999,
                    background: "#fff1f0", border: "1px solid #f3c5c0",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>{a!.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allergenLabels.length === 0 && (
          <div
            style={{
              padding: "20px", borderRadius: 20, background: "var(--c-card)",
              border: "1px solid var(--c-border)", textAlign: "center",
              fontSize: 14, color: "var(--c-sub)",
            }}
          >
            No allergens selected yet. Choose from the list above.
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "grid", gap: 10 }}>
          <Link
            href="/restaurants"
            style={{
              display: "block", padding: "14px 18px", borderRadius: 14,
              background: "#eb1700", color: "#fff", textDecoration: "none",
              fontSize: 14, fontWeight: 800, textAlign: "center",
            }}
          >
            Find Restaurants →
          </Link>
          <Link
            href="/scan"
            style={{
              display: "block", padding: "14px 18px", borderRadius: 14,
              background: "var(--c-card)", border: "1px solid var(--c-border)",
              color: "var(--c-text)", textDecoration: "none",
              fontSize: 14, fontWeight: 700, textAlign: "center",
            }}
          >
            Manual Menu Scan
          </Link>
        </div>
      </div>
    </main>
  );
}
