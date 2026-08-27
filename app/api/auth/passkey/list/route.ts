import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const WINDOW_MS = 60_000;
const MAX_REQ   = 20;

export async function GET(req: Request) {
  if (await isRateLimited(getClientIp(req), WINDOW_MS, MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("webauthn_credentials")
    .select("credential_id, device_type, backed_up, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Failed to load passkeys" }, { status: 500 });

  return NextResponse.json({ passkeys: data ?? [] });
}
