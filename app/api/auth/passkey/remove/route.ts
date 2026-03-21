import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const WINDOW_MS = 60_000;
const MAX_REQ   = 10;

export async function DELETE(req: Request) {
  if (isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let credentialId: string;
  try { ({ credentialId } = await req.json()); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (!credentialId || typeof credentialId !== "string" || credentialId.length > 1000) {
    return NextResponse.json({ error: "Invalid credentialId" }, { status: 400 });
  }

  // Only delete if it belongs to this user — prevents cross-user deletion
  const { error: deleteErr } = await supabase
    .from("webauthn_credentials")
    .delete()
    .eq("user_id", user.id)
    .eq("credential_id", credentialId);

  if (deleteErr) {
    console.error("[passkey/remove] delete error:", deleteErr);
    return NextResponse.json({ error: "Failed to remove passkey" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
