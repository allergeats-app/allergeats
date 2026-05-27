import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// Strict rate limit — 5 attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const { password } = await req.json() as { password?: string };
  const secret = process.env.ADMIN_PASSWORD;

  if (!secret || !password || password !== secret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
