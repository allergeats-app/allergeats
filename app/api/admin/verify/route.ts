import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
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

  let authorized = false;
  if (secret && password) {
    const a = Buffer.from(password);
    const b = Buffer.from(secret);
    authorized = a.length === b.length && timingSafeEqual(a, b);
  }
  if (!authorized) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
