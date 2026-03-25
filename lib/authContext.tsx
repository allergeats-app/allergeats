"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import type { AllergenId } from "./types";

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
  signIn: (email: string, password: string, staySignedIn: boolean) => Promise<string | null>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<string | null>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<string | null>;
  signOut: () => Promise<void>;
  saveAllergens: (allergens: AllergenId[]) => Promise<void>;
  saveName: (firstName: string, lastName: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]     = useState<Session | null>(null);
  const [loading, setLoading]     = useState(true);
  const [allergens, setAllergens] = useState<AllergenId[]>([]);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName,  setLastName]  = useState<string>("");

  function hydrate(sess: Session | null) {
    const meta = sess?.user?.user_metadata ?? {};
    // Support both new first_name/last_name and legacy username field
    setFirstName((meta.first_name as string | undefined) ?? (meta.username as string | undefined) ?? "");
    setLastName((meta.last_name  as string | undefined) ?? "");

    const cloud = meta.allergens as AllergenId[] | undefined;
    if (cloud?.length) {
      setAllergens(cloud);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(cloud)); } catch { /* ignore */ }
    } else {
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) setAllergens(JSON.parse(raw) as AllergenId[]);
      } catch { /* ignore */ }
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

  async function signInWithOAuth(provider: "google" | "apple"): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo } });
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
      sessionStorage.removeItem(SESSION_ONLY_KEY);
      localStorage.removeItem(WAS_SESSION_ONLY_KEY);
    } catch { /* ignore */ }
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
      value={{ session, user: session?.user ?? null, firstName, lastName, displayName: [firstName, lastName].filter(Boolean).join(" ") || session?.user?.email?.split("@")[0] || "", loading, allergens, signIn, signUp, signInWithOAuth, signOut, saveAllergens, saveName }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
