import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const RP_ID     = process.env.WEBAUTHN_RP_ID     ?? "localhost";
const RP_ORIGIN = process.env.WEBAUTHN_RP_ORIGIN ?? "http://localhost:3000";

const WINDOW_MS = 60_000;
const MAX_REQ   = 10;

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: RegistrationResponseJSON;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  // Load and immediately consume the pending challenge
  const { data: challengeRow } = await supabase
    .from("webauthn_challenges")
    .select("challenge")
    .eq("user_id", user.id)
    .eq("type", "registration")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) {
    return NextResponse.json({ error: "Registration session expired — please try again" }, { status: 400 });
  }

  // Delete challenge regardless of outcome (one-time use)
  await supabase
    .from("webauthn_challenges")
    .delete()
    .eq("user_id", user.id)
    .eq("type", "registration");

  let verification: Awaited<ReturnType<typeof verifyRegistrationResponse>>;
  try {
    verification = await verifyRegistrationResponse({
      response:             body,
      expectedChallenge:    challengeRow.challenge,
      expectedOrigin:       RP_ORIGIN,
      expectedRPID:         RP_ID,
      requireUserVerification: true,
    });
  } catch (err) {
    console.error("[passkey/register] verification error:", err);
    return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 });
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Passkey verification failed" }, { status: 400 });
  }

  const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

  const { error: insertErr } = await supabase.from("webauthn_credentials").insert({
    user_id:       user.id,
    email:         (user.email ?? "").toLowerCase(),
    credential_id: credential.id,
    public_key:    Buffer.from(credential.publicKey as Uint8Array).toString("base64"),
    counter:       credential.counter,
    device_type:   credentialDeviceType,
    backed_up:     credentialBackedUp,
  });

  if (insertErr) {
    console.error("[passkey/register] DB insert error:", insertErr);
    return NextResponse.json({ error: "Failed to save passkey" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
