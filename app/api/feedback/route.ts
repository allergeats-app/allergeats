import { NextRequest, NextResponse } from "next/server";

// Rate-limit: max 5 feedback submissions per IP per 10 minutes
const recentSubmissions = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const times = (recentSubmissions.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (times.length >= MAX_PER_WINDOW) return true;
  recentSubmissions.set(ip, [...times, now]);
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
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

  // Log to server console (Vercel will capture this in Function Logs)
  console.log("[feedback]", JSON.stringify({
    type,
    message: message.trim(),
    url,
    ip,
    ts: new Date().toISOString(),
  }));

  // If a FEEDBACK_EMAIL env var is set, forward via a simple fetch to a mail service.
  // For now we log only — wire up Resend / SendGrid here when ready.
  // Example:
  // if (process.env.RESEND_API_KEY) {
  //   await fetch("https://api.resend.com/emails", {
  //     method: "POST",
  //     headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
  //     body: JSON.stringify({ from: "feedback@allergeats.com", to: process.env.FEEDBACK_EMAIL, subject: `[AllergEats feedback] ${type}`, text: `${message}\n\nURL: ${url}` }),
  //   });
  // }

  return NextResponse.json({ ok: true });
}