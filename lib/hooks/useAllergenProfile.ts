/**
 * useAllergenProfile
 *
 * Single source of truth for the user's allergen list. Handles:
 *   - Hydration from localStorage on mount
 *   - One-time override from Supabase auth allergens (first load, signed-in users)
 *   - Immediate localStorage writes on every change
 *   - Debounced (800 ms) Supabase remote save, with sequence-counter guard
 *     against out-of-order responses
 *
 * Returns:
 *   allergens   — current active allergen list (use everywhere instead of reading localStorage)
 *   saveState   — "idle" | "saving" | "saved" | "error"  (for UI feedback)
 *   setAllergens — call when the user changes their profile
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/authContext";
import { loadProfileAllergens, saveProfileAllergens } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useAllergenProfile() {
  const { user, allergens: authAllergens, loading: authLoading, saveAllergens } = useAuth();

  const [allergens, setAllergensState] = useState<AllergenId[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const initializedRef = useRef(false);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeqRef     = useRef(0);

  // Hydrate from localStorage after mount (browser-only)
  useEffect(() => {
    setAllergensState(loadProfileAllergens());
  }, []);

  // Auth allergens override localStorage on first load for signed-in users.
  // Only runs once (initializedRef guards it) so subsequent local edits
  // are not clobbered when authAllergens reference changes.
  useEffect(() => {
    if (!authLoading && authAllergens.length > 0 && !initializedRef.current) {
      initializedRef.current = true;
      setAllergensState(authAllergens);
    }
  }, [authLoading, authAllergens]);

  // Debounced remote save. Sequence counter ensures a slow earlier
  // response cannot overwrite a newer save result in the UI.
  useEffect(() => {
    if (!user || !initializedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("idle");
    debounceRef.current = setTimeout(async () => {
      const seq = ++saveSeqRef.current;
      setSaveState("saving");
      try {
        await saveAllergens(allergens);
        if (seq !== saveSeqRef.current) return;
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2000);
      } catch {
        if (seq !== saveSeqRef.current) return;
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 4000);
      }
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [allergens]); // eslint-disable-line react-hooks/exhaustive-deps

  function setAllergens(next: AllergenId[]) {
    setAllergensState(next);
    saveProfileAllergens(next);
    // Mark as initialized so the debounced save runs on signed-in users
    initializedRef.current = true;
  }

  return { allergens, saveState, setAllergens };
}
