import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { mintAdminToken } from "@/lib/adminAuth";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// Strict rate limit — 5 attempts per 15 minutes per IP
const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_WINDOW = 5;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (await isRateLimited(ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: { password?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const secret = process.env.ADMIN_PASSWORD;
  const submitted = body.password ?? "";

  let authorized = false;
  if (secret && submitted) {
    const a = Buffer.from(submitted);
    const b = Buffer.from(secret);
    authorized = a.length === b.length && timingSafeEqual(a, b);
  }

  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ token: mintAdminToken() });
}
