/**
 * lib/passkey.ts
 * Browser-side helpers for WebAuthn passkey (Face ID / Touch ID) registration
 * and authentication. Wraps @simplewebauthn/browser and the four API routes.
 *
 * Usage:
 *   registerPasskey(accessToken)   — call from profile page (user must be signed in)
 *   authenticateWithPasskey(email) — call from auth page (replaces password flow)
 */

import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

/** Returns true if this browser / device supports platform passkeys (Face ID, Touch ID, etc.). */
export async function isPasskeySupported(): Promise<boolean> {
  try {
    return (
      typeof window !== "undefined" &&
      !!window.PublicKeyCredential &&
      (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
    );
  } catch {
    return false;
  }
}

/**
 * Registers a passkey for the signed-in user.
 * @param accessToken  Supabase access_token from the current session.
 * @returns null on success, or an error message string.
 */
export async function registerPasskey(accessToken: string): Promise<string | null> {
  // 1. Get registration options from server
  const optRes = await fetch("/api/auth/passkey/register-options", {
    method:  "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!optRes.ok) {
    const j = await optRes.json().catch(() => ({}));
    return (j as { error?: string }).error ?? "Failed to start passkey setup";
  }
  const options = (await optRes.json()) as PublicKeyCredentialCreationOptionsJSON;

  // 2. Trigger Face ID / Touch ID prompt
  let attResp;
  try {
    attResp = await startRegistration({ optionsJSON: options });
  } catch (err) {
    if (err instanceof Error && err.name === "NotAllowedError") {
      return "Passkey setup was cancelled";
    }
    return "Passkey setup failed — please try again";
  }

  // 3. Verify and save on server
  const verRes = await fetch("/api/auth/passkey/register", {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      Authorization:   `Bearer ${accessToken}`,
    },
    body: JSON.stringify(attResp),
  });
  if (!verRes.ok) {
    const j = await verRes.json().catch(() => ({}));
    return (j as { error?: string }).error ?? "Failed to save passkey";
  }
  return null;
}

/**
 * Authenticates the user with a passkey and returns a Supabase token_hash
 * to exchange for a session via supabase.auth.verifyOtp({ token_hash, type: "magiclink" }).
 * @returns { tokenHash } on success, or { error } string on failure.
 */
export async function authenticateWithPasskey(
  email: string
): Promise<{ tokenHash: string } | { error: string }> {
  // 1. Get authentication options from server
  const optRes = await fetch("/api/auth/passkey/authenticate-options", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email }),
  });
  if (!optRes.ok) {
    const j = await optRes.json().catch(() => ({}));
    return { error: (j as { error?: string }).error ?? "No passkey found for this account" };
  }
  const options = (await optRes.json()) as PublicKeyCredentialRequestOptionsJSON;

  // 2. Trigger Face ID / Touch ID prompt
  let assertResp;
  try {
    assertResp = await startAuthentication({ optionsJSON: options });
  } catch (err) {
    if (err instanceof Error && err.name === "NotAllowedError") {
      return { error: "Face ID was cancelled" };
    }
    return { error: "Face ID failed — please try again" };
  }

  // 3. Verify on server and receive one-time session token
  const verRes = await fetch("/api/auth/passkey/authenticate", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ ...assertResp, email }),
  });
  if (!verRes.ok) {
    const j = await verRes.json().catch(() => ({}));
    return { error: (j as { error?: string }).error ?? "Face ID verification failed" };
  }

  const { token } = (await verRes.json()) as { token: string };
  return { tokenHash: token };
}

/**
 * Removes a passkey credential for the signed-in user.
 * @param credentialId  The credential_id to delete.
 * @param accessToken   Supabase access_token from the current session.
 */
export async function removePasskey(
  credentialId: string,
  accessToken:  string
): Promise<string | null> {
  const res = await fetch("/api/auth/passkey/remove", {
    method:  "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ credentialId }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    return (j as { error?: string }).error ?? "Failed to remove passkey";
  }
  return null;
}
