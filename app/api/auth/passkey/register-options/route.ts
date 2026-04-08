import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const RP_ID   = process.env.WEBAUTHN_RP_ID   ?? "localhost";
const RP_NAME = "AllergEats";

const WINDOW_MS = 60_000;
const MAX_REQ   = 10;

export async function POST(req: Request) {
  if (await isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Verify the caller's Supabase session
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch existing credentials to exclude re-registration on the same device
  const { data: existing } = await supabase
    .from("webauthn_credentials")
    .select("credential_id")
    .eq("user_id", user.id);

  const options = await generateRegistrationOptions({
    rpName:          RP_NAME,
    rpID:            RP_ID,
    userName:        user.email ?? user.id,
    userDisplayName: (user.user_metadata?.username as string | undefined) ?? user.email ?? "User",
    attestationType: "none",
    excludeCredentials: (existing ?? []).map((c) => ({ id: c.credential_id })),
    authenticatorSelection: {
      // platform = Face ID / Touch ID / Windows Hello (no physical security keys)
      authenticatorAttachment: "platform",
      requireResidentKey:      true,
      residentKey:             "required",
      userVerification:        "required",
    },
  });

  // Persist the challenge (expires in 5 min)
  await supabase.from("webauthn_challenges").insert({
    challenge:  options.challenge,
    user_id:    user.id,
    type:       "registration",
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });

  return NextResponse.json(options);
}
