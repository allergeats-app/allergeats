"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import type { AllergenId, AllergenSeverity } from "./types";
import { loadProfileAllergens, loadProfileSeverities, saveProfileSeverities, ALLERGEN_LIST } from "./allergenProfile";

const PROFILE_KEY = "allegeats_profile_allergens";
const SESSION_ONLY_KEY = "allegeats_session_only";
const WAS_SESSION_ONLY_KEY = "allegeats_was_session_only";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  /** First name from user_metadata (falls back to legacy username) */
  firstName: string;
  /** Last name from user_metadata */
  lastName: string;
  /** Full display name — firstName + lastName, or email prefix as fallback */
  displayName: string;
  loading: boolean;
  allergens: AllergenId[];
  severities: Partial<Record<AllergenId, AllergenSeverity>>;
  signIn: (email: string, password: string, staySignedIn: boolean) => Promise<string | null>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<string | null>;
  signInWithOAuth: (provider: "google") => Promise<string | null>;
  linkIdentity: (provider: "google") => Promise<string | null>;
  signOut: () => Promise<void>;
  saveAllergens: (allergens: AllergenId[]) => Promise<void>;
  saveSeverities: (severities: Partial<Record<AllergenId, AllergenSeverity>>) => void;
  saveName: (firstName: string, lastName: string) => Promise<void>;
  profileConflict: { local: AllergenId[], cloud: AllergenId[] } | null;
  resolveProfileConflict: (choice: "local" | "cloud" | "merge") => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]         = useState<Session | null>(null);
  const [loading, setLoading]         = useState(true);
  const [allergens, setAllergens]     = useState<AllergenId[]>([]);
  const [severities, setSeverities]   = useState<Partial<Record<AllergenId, AllergenSeverity>>>(() => loadProfileSeverities());
  const [firstName, setFirstName]     = useState<string>("");
  const [lastName,  setLastName]      = useState<string>("");
  const [profileConflict, setProfileConflict] = useState<{ local: AllergenId[], cloud: AllergenId[] } | null>(null);

  function hydrate(sess: Session | null) {
    const meta = sess?.user?.user_metadata ?? {};
    // Support both new first_name/last_name and legacy username field
    setFirstName((meta.first_name as string | undefined) ?? (meta.username as string | undefined) ?? "");
    setLastName((meta.last_name  as string | undefined) ?? "");

    const cloud = meta.allergens as AllergenId[] | undefined;
    // IMP-08: use validated loadProfileAllergens() instead of raw JSON.parse
    const local = loadProfileAllergens();
    if (cloud?.length) {
      // S-05: if both profiles are non-empty and differ, ask the user instead of silently overwriting
      if (local.length > 0 && JSON.stringify([...cloud].sort()) !== JSON.stringify([...local].sort())) {
        setProfileConflict({ local, cloud });
      } else {
        setAllergens(cloud);
        try { localStorage.setItem(PROFILE_KEY, JSON.stringify(cloud)); } catch { /* ignore */ }
      }
    } else {
      if (local.length > 0) setAllergens(local);
    }
  }

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) {
      // Supabase not configured — load from localStorage only
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) setAllergens(JSON.parse(raw) as AllergenId[]); // eslint-disable-line react-hooks/set-state-in-effect
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data }) => {
      // "Session only" mode: if the user chose not to stay signed in,
      // sign them out when they open a new browser session (no sessionStorage flag).
      if (data.session) {
        try {
          const wasSessionOnly = localStorage.getItem(WAS_SESSION_ONLY_KEY) === "1";
          const hasSessionFlag = sessionStorage.getItem(SESSION_ONLY_KEY) === "1";
          if (wasSessionOnly && !hasSessionFlag) {
            sb.auth.signOut();
            localStorage.removeItem(WAS_SESSION_ONLY_KEY);
            setLoading(false);
            return;
          }
        } catch { /* ignore */ }
      }
      setSession(data.session);
      hydrate(data.session);
      setLoading(false);
    }).catch((err) => {
      console.error("[authContext] getSession failed:", err);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      hydrate(sess);
    });

    // Sync allergen changes made in another browser tab
    function onStorageChange(e: StorageEvent) {
      if (e.key !== PROFILE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) setAllergens(parsed as AllergenId[]);
      } catch { /* ignore */ }
    }
    window.addEventListener("storage", onStorageChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorageChange);
    };
  }, []);

  async function signIn(email: string, password: string, staySignedIn: boolean): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (!error) {
      try {
        if (!staySignedIn) {
          sessionStorage.setItem(SESSION_ONLY_KEY, "1");
          localStorage.setItem(WAS_SESSION_ONLY_KEY, "1");
        } else {
          sessionStorage.removeItem(SESSION_ONLY_KEY);
          localStorage.removeItem(WAS_SESSION_ONLY_KEY);
        }
      } catch { /* ignore */ }
    }
    return error?.message ?? null;
  }

  async function signInWithOAuth(provider: "google"): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo } });
    return error?.message ?? null;
  }

  async function linkIdentity(provider: "google"): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await sb.auth.linkIdentity({ provider, options: { redirectTo } });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string, first: string, last: string): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const { error } = await sb.auth.signUp({
      email, password,
      options: { data: { first_name: first.trim(), last_name: last.trim() } },
    });
    return error?.message ?? null;
  }

  async function saveName(first: string, last: string): Promise<void> {
    setFirstName(first.trim());
    setLastName(last.trim());
    const sb = getSupabaseClient();
    if (sb && session) await sb.auth.updateUser({ data: { first_name: first.trim(), last_name: last.trim() } });
  }

  async function signOut(): Promise<void> {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    setSession(null);
    setAllergens([]);
    setFirstName("");
    setLastName("");
    try {
      localStorage.removeItem(PROFILE_KEY);
      sessionStorage.removeItem(SESSION_ONLY_KEY);
      localStorage.removeItem(WAS_SESSION_ONLY_KEY);
    } catch { /* ignore */ }
  }

  function saveSeverities(map: Partial<Record<AllergenId, AllergenSeverity>>): void {
    setSeverities(map);
    saveProfileSeverities(map);
  }

  function resolveProfileConflict(choice: "local" | "cloud" | "merge"): void {
    if (!profileConflict) return;
    const resolved: AllergenId[] = choice === "local"
      ? profileConflict.local
      : choice === "cloud"
        ? profileConflict.cloud
        : [...new Set([...profileConflict.local, ...profileConflict.cloud])];
    setAllergens(resolved);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(resolved)); } catch { /* ignore */ }
    // Push the chosen profile back to Supabase unless the user chose "cloud" (already in sync)
    if (session && choice !== "cloud") {
      const sb = getSupabaseClient();
      if (sb) sb.auth.updateUser({ data: { allergens: resolved } }).catch(() => { /* ignore */ });
    }
    setProfileConflict(null);
  }

  async function saveAllergens(list: AllergenId[]): Promise<void> {
    setAllergens(list);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(list)); } catch { /* ignore */ }
    if (session) {
      const sb = getSupabaseClient();
      if (sb) await sb.auth.updateUser({ data: { allergens: list } });
    }
  }

  return (
    <AuthContext.Provider
      value={{ session, user: session?.user ?? null, firstName, lastName, displayName: [firstName, lastName].filter(Boolean).join(" ") || session?.user?.email?.split("@")[0] || "", loading, allergens, severities, signIn, signUp, signInWithOAuth, linkIdentity, signOut, saveAllergens, saveSeverities, saveName, profileConflict, resolveProfileConflict }}
    >
      {profileConflict && (
        <div role="dialog" aria-modal="true" aria-label="Allergen profile conflict" style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#1a1d20", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 16px 64px rgba(0,0,0,0.7)", border: "1px solid rgba(255,255,255,0.15)" }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Profile Conflict</div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", marginBottom: 20, lineHeight: 1.6 }}>
              Your device and account have different allergen profiles. Which would you like to use?
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button onClick={() => resolveProfileConflict("local")} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontWeight: 800, marginBottom: 3 }}>Keep device profile</div>
                <div style={{ fontWeight: 400, opacity: 0.7, fontSize: 12 }}>{profileConflict.local.map(id => ALLERGEN_LIST.find(a => a.id === id)?.label ?? id).join(", ")}</div>
              </button>
              <button onClick={() => resolveProfileConflict("cloud")} style={{ padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.07)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontWeight: 800, marginBottom: 3 }}>Use saved profile</div>
                <div style={{ fontWeight: 400, opacity: 0.7, fontSize: 12 }}>{profileConflict.cloud.map(id => ALLERGEN_LIST.find(a => a.id === id)?.label ?? id).join(", ")}</div>
              </button>
              <button onClick={() => resolveProfileConflict("merge")} style={{ padding: "12px 16px", borderRadius: 12, border: "none", background: "#1fbccc", color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", textAlign: "left" }}>
                Merge both
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
