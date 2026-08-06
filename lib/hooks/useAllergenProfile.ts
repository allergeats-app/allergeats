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
import { loadProfileAllergens, saveProfileAllergens, PROFILE_KEY } from "@/lib/allergenProfile";
import type { AllergenId } from "@/lib/types";

export type SaveState = "idle" | "saving" | "saved" | "error";

export function useAllergenProfile() {
  const { user, allergens: authAllergens, loading: authLoading, saveAllergens } = useAuth();

  const [allergens, setAllergensState] = useState<AllergenId[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const initializedRef     = useRef(false); // true only after user explicitly edits
  const authOverriddenRef  = useRef(false); // true after auth allergens have been applied once
  const debounceRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeqRef         = useRef(0);
  const saveAllergensRef   = useRef(saveAllergens);
  useEffect(() => { saveAllergensRef.current = saveAllergens; }, [saveAllergens]);

  // Hydrate from localStorage after mount (browser-only)
  useEffect(() => {
    setAllergensState(loadProfileAllergens()); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // UX-01: re-read when another tab writes OR when OnboardingModal dispatches a same-tab storage event
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === PROFILE_KEY) {
        setAllergensState(loadProfileAllergens() as AllergenId[]); // eslint-disable-line react-hooks/set-state-in-effect
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Auth allergens override localStorage on first load for signed-in users.
  // Only runs once, and only if the user hasn't already made local edits
  // (initializedRef.current would be true). Prevents clobbering in-progress
  // edits when auth resolves while the user is already on the profile screen.
  useEffect(() => {
    if (!authLoading && authAllergens.length > 0 && !authOverriddenRef.current && !initializedRef.current) {
      authOverriddenRef.current = true;
      setAllergensState(authAllergens); // eslint-disable-line react-hooks/set-state-in-effect
      // Do NOT set initializedRef here — that would trigger a spurious remote save
      // on every page load. initializedRef is only set when the user explicitly edits.
    }
  }, [authLoading, authAllergens]);

  // Debounced remote save. Sequence counter ensures a slow earlier
  // response cannot overwrite a newer save result in the UI.
  useEffect(() => {
    if (!user || !initializedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("idle"); // eslint-disable-line react-hooks/set-state-in-effect
    debounceRef.current = setTimeout(async () => {
      const seq = ++saveSeqRef.current;
      setSaveState("saving");
      try {
        await saveAllergensRef.current(allergens);
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
  }, [allergens, user, saveAllergensRef]);

  function setAllergens(next: AllergenId[]) {
    setAllergensState(next);
    saveProfileAllergens(next);
    // Mark as initialized so the debounced save runs on signed-in users
    initializedRef.current = true;
  }

  return { allergens, saveState, setAllergens };
}
