/**
 * Version identifiers for Terms of Service and the safety acknowledgement.
 *
 * HOW TO BUMP:
 *   1. Increment the version string below (e.g. "2026-08-26-v1" → "2026-09-15-v1").
 *   2. Run the Supabase migration (no schema change needed — the new string is just data).
 *   3. Deploy. Every user — anonymous and logged-in — will see the acknowledgement modal
 *      again because the localStorage key and Supabase check both encode these strings.
 *
 * Bump TERMS_VERSION whenever the Terms of Service change materially.
 * Bump SAFETY_NOTICE_VERSION whenever the safety acknowledgement text changes materially.
 * You may bump both at once.
 */
export const TERMS_VERSION          = "2026-08-26-v2";
export const SAFETY_NOTICE_VERSION  = "2026-08-26-v2";

/** localStorage key that encodes both versions — auto-invalidates on version bump. */
export const SAFETY_LS_KEY =
  `allegeats_safety_${TERMS_VERSION}_${SAFETY_NOTICE_VERSION}`;
