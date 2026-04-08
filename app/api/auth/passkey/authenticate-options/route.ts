import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const RP_ID = process.env.WEBAUTHN_RP_ID ?? "localhost";

const WINDOW_MS = 60_000;
const MAX_REQ   = 20;

export async function POST(req: Request) {
  if (await isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let email: string;
  try { ({ email } = await req.json()); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!email || typeof email !== "string" || email.length > 320) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // Look up credentials by email (email is stored in the credentials table)
  const { data: creds } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, user_id")
    .eq("email", email.toLowerCase().trim());

  if (!creds?.length) {
    // Return 404 so the client can show a helpful message
    return NextResponse.json({ error: "No passkey registered for this account" }, { status: 404 });
  }

  const userId = creds[0].user_id as string;

  const options = await generateAuthenticationOptions({
    rpID:             RP_ID,
    allowCredentials: creds.map((c) => ({ id: c.credential_id })),
    userVerification: "required",
  });

  // Store challenge for this user
  await supabase.from("webauthn_challenges").insert({
    challenge:  options.challenge,
    user_id:    userId,
    type:       "authentication",
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });

  return NextResponse.json(options);
}
