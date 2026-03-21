"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./authContext";
import { getSupabaseClient } from "./supabaseClient";

const LOCAL_KEY = "allegeats_favorites";
const LOCAL_META_KEY = "allegeats_favorites_meta";

export type FavoriteMeta = { name: string; cuisine: string };

type FavoritesContextValue = {
  favorites: Set<string>;
  favoritesMeta: Map<string, FavoriteMeta>;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string, meta?: FavoriteMeta) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch { /* ignore */ }
    return new Set();
  });

  const [favoritesMeta, setFavoritesMeta] = useState<Map<string, FavoriteMeta>>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_META_KEY);
      if (raw) return new Map(Object.entries(JSON.parse(raw) as Record<string, FavoriteMeta>));
    } catch { /* ignore */ }
    return new Map();
  });

  // When user signs in, load their server-side favorites and merge with local
  useEffect(() => {
    if (!user) return;
    const sb = getSupabaseClient();
    if (!sb) return;

    sb.from("user_favorites")
      .select("restaurant_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (!data) return;
        const serverIds = new Set(data.map((r) => r.restaurant_id as string));
        setFavorites((prev) => {
          const merged = new Set([...prev, ...serverIds]);
          try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...merged])); } catch { /* ignore */ }
          return merged;
        });
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function isFavorite(id: string): boolean {
    return favorites.has(id);
  }

  function toggleFavorite(id: string, meta?: FavoriteMeta): void {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (user) persistRemove(id);
      } else {
        next.add(id);
        if (user) persistAdd(id);
        if (meta) {
          setFavoritesMeta((prevMeta) => {
            const nextMeta = new Map(prevMeta);
            nextMeta.set(id, meta);
            try { localStorage.setItem(LOCAL_META_KEY, JSON.stringify(Object.fromEntries(nextMeta))); } catch { /* ignore */ }
            return nextMeta;
          });
        }
      }
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }

  async function persistAdd(restaurantId: string) {
    if (!user) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("user_favorites").upsert({ user_id: user.id, restaurant_id: restaurantId });
  }

  async function persistRemove(restaurantId: string) {
    if (!user) return;
    const sb = getSupabaseClient();
    if (!sb) return;
    await sb.from("user_favorites").delete()
      .eq("user_id", user.id)
      .eq("restaurant_id", restaurantId);
  }

  return (
    <FavoritesContext.Provider value={{ favorites, favoritesMeta, isFavorite, toggleFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used inside <FavoritesProvider>");
  return ctx;
}
