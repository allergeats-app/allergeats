"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabaseClient } from "./supabaseClient";
import type { AllergenId } from "./types";

const PROFILE_KEY = "allegeats_profile_allergens";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  allergens: AllergenId[];
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  saveAllergens: (allergens: AllergenId[]) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession]     = useState<Session | null>(null);
  const [loading, setLoading]     = useState(true);
  const [allergens, setAllergens] = useState<AllergenId[]>([]);

  function hydrateAllergens(sess: Session | null) {
    const cloud = sess?.user?.user_metadata?.allergens as AllergenId[] | undefined;
    if (cloud?.length) {
      setAllergens(cloud);
      try { localStorage.setItem(PROFILE_KEY, JSON.stringify(cloud)); } catch { /* ignore */ }
      return;
    }
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setAllergens(JSON.parse(raw) as AllergenId[]);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    const sb = getSupabaseClient();
    if (!sb) {
      // Supabase not configured — load from localStorage only
      try {
        const raw = localStorage.getItem(PROFILE_KEY);
        if (raw) setAllergens(JSON.parse(raw) as AllergenId[]);
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      hydrateAllergens(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      hydrateAllergens(sess);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signIn(email: string, password: string): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const { error } = await sb.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  }

  async function signUp(email: string, password: string): Promise<string | null> {
    const sb = getSupabaseClient();
    if (!sb) return "Supabase is not configured.";
    const { error } = await sb.auth.signUp({ email, password });
    return error?.message ?? null;
  }

  async function signOut(): Promise<void> {
    const sb = getSupabaseClient();
    if (sb) await sb.auth.signOut();
    setSession(null);
    setAllergens([]);
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
      value={{ session, user: session?.user ?? null, loading, allergens, signIn, signUp, signOut, saveAllergens }}
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
