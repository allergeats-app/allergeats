import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const RP_ID     = process.env.WEBAUTHN_RP_ID     ?? "localhost";
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN ?? "http://localhost:3000";

const WINDOW_MS = 60_000;
const MAX_REQ   = 20;

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: AuthenticationResponseJSON & { email: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { email, ...authResponse } = body;
  if (!email || typeof email !== "string" || email.length > 320) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // Load the stored credential
  const { data: storedCred } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, public_key, counter, user_id")
    .eq("email", email.toLowerCase().trim())
    .eq("credential_id", authResponse.id)
    .single();

  if (!storedCred) {
    return NextResponse.json({ error: "Passkey not recognized" }, { status: 400 });
  }

  // Load and consume the challenge
  const { data: challengeRow } = await supabase
    .from("webauthn_challenges")
    .select("challenge")
    .eq("user_id", storedCred.user_id)
    .eq("type", "authentication")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) {
    return NextResponse.json({ error: "Authentication session expired — please try again" }, { status: 400 });
  }

  await supabase
    .from("webauthn_challenges")
    .delete()
    .eq("user_id", storedCred.user_id)
    .eq("type", "authentication");

  let verification: Awaited<ReturnType<typeof verifyAuthenticationResponse>>;
  try {
    verification = await verifyAuthenticationResponse({
      response:          authResponse as AuthenticationResponseJSON,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin:    RP_ORIGIN,
      expectedRPID:      RP_ID,
      credential: {
        id:        storedCred.credential_id as string,
        publicKey: new Uint8Array(Buffer.from(storedCred.public_key as string, "base64")),
        counter:   storedCred.counter as number,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    console.error("[passkey/authenticate] verification error:", err);
    return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 });
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 });
  }

  // Update the replay-attack counter
  await supabase
    .from("webauthn_credentials")
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq("credential_id", storedCred.credential_id);

  // Generate a one-time sign-in token for this user via Supabase Admin API.
  // generateLink() does NOT send an email — it returns the token for us to use directly.
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type:  "magiclink",
    email: email.toLowerCase().trim(),
  });

  if (linkErr || !linkData?.properties?.hashed_token) {
    console.error("[passkey/authenticate] generateLink error:", linkErr);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }

  return NextResponse.json({ token: linkData.properties.hashed_token });
}
