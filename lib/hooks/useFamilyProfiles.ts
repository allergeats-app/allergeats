"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { useSubscription } from "@/lib/hooks/useSubscription";
import { getSupabaseClient } from "@/lib/supabaseClient";
import type { AllergenId } from "@/lib/types";

export type FamilyProfile = {
  id: string;
  name: string;
  emoji: string;
  allergens: AllergenId[];
  sort_order: number;
};

const ACTIVE_KEY = "allegeats_active_family_profile_id";
const MAX_PROFILES = 5;

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

export function useFamilyProfiles() {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate active profile id from localStorage
  useEffect(() => {
    setActiveIdState(loadActiveId());
  }, []);

  // Load profiles from Supabase when user is Pro
  useEffect(() => {
    if (!user || !isPro) {
      setProfiles([]);
      setLoading(false);
      return;
    }

    const client = getSupabaseClient();
    if (!client) { setLoading(false); return; }

    async function load() {
      const { data } = await client!
        .from("family_profiles")
        .select("id, name, emoji, allergens, sort_order")
        .eq("user_id", user!.id)
        .order("sort_order");

      setProfiles(
        (data ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          emoji: r.emoji,
          allergens: (r.allergens ?? []) as AllergenId[],
          sort_order: r.sort_order,
        }))
      );
      setLoading(false);
    }

    load();
  }, [user, isPro]);

  // Clear active profile if it no longer exists (e.g. was deleted)
  useEffect(() => {
    if (!loading && activeId && profiles.length > 0) {
      if (!profiles.find((p) => p.id === activeId)) {
        setActiveId(null);
      }
    }
  }, [profiles, activeId, loading]);

  function setActiveId(id: string | null) {
    setActiveIdState(id);
    if (id) {
      localStorage.setItem(ACTIVE_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }

  const createProfile = useCallback(async (
    name: string,
    emoji: string,
    allergens: AllergenId[]
  ): Promise<FamilyProfile | null> => {
    if (!user || !isPro) return null;
    if (profiles.length >= MAX_PROFILES) return null;

    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("family_profiles")
      .insert({
        user_id: user.id,
        name: name.trim(),
        emoji,
        allergens,
        sort_order: profiles.length,
      })
      .select("id, name, emoji, allergens, sort_order")
      .single();

    if (error || !data) return null;

    const profile: FamilyProfile = {
      id: data.id,
      name: data.name,
      emoji: data.emoji,
      allergens: (data.allergens ?? []) as AllergenId[],
      sort_order: data.sort_order,
    };
    setProfiles((prev) => [...prev, profile]);
    return profile;
  }, [user, isPro, profiles.length]);

  const updateProfile = useCallback(async (
    id: string,
    patch: Partial<Pick<FamilyProfile, "name" | "emoji" | "allergens">>
  ): Promise<boolean> => {
    if (!user) return false;

    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("family_profiles")
      .update(patch)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return false;

    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
    );
    return true;
  }, [user]);

  const deleteProfile = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return false;

    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("family_profiles")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return false;

    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) setActiveId(null);
    return true;
  }, [user, activeId]);

  const activeProfile = profiles.find((p) => p.id === activeId) ?? null;

  return {
    profiles,
    activeProfile,
    activeId,
    setActiveId,
    createProfile,
    updateProfile,
    deleteProfile,
    loading,
    canAddMore: profiles.length < MAX_PROFILES,
  };
}
