import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";
import { supabase } from "@/lib/supabase";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { type, message, url } = body as Record<string, unknown>;

  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const entry = {
    type:       String(type ?? "general").slice(0, 50),
    message:    message.trim().slice(0, 2000),
    url:        typeof url === "string" ? url.slice(0, 500) : null,
    ip,
    created_at: new Date().toISOString(),
  };

  // Persist to Supabase (requires a `feedback` table — fails silently if absent)
  const { error: dbError } = await supabase.from("feedback").insert(entry);
  if (dbError) {
    // Fall back to Vercel Function Logs so submissions are never fully lost
    console.log("[feedback]", JSON.stringify(entry));
    console.error("[feedback] supabase insert error:", dbError.message);
  }

  return NextResponse.json({ ok: true });
}