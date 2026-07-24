/**
 * Server-side admin token minting and verification.
 * Tokens are HMAC-SHA256 signed with an expiry timestamp.
 * Format: "${expiresAtMs}:${hmacHex}"
 */
import { createHmac, timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

const getSecret = () =>
  process.env.ADMIN_JWT_SECRET ?? process.env.ADMIN_PASSWORD ?? "dev-only-change-in-prod";

const TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

export function mintAdminToken(): string {
  const exp = String(Date.now() + TTL_MS);
  const mac = createHmac("sha256", getSecret()).update(exp).digest("hex");
  return `${exp}:${mac}`;
}

export function verifyAdminToken(token: string): boolean {
  const sep = token.indexOf(":");
  if (sep < 1) return false;
  const expStr = token.slice(0, sep);
  const mac    = token.slice(sep + 1);
  const exp    = Number(expStr);
  if (!exp || Date.now() > exp) return false;
  const expected = createHmac("sha256", getSecret()).update(expStr).digest("hex");
  const a = Buffer.from(mac,      "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function verifyAdminRequest(req: NextRequest): boolean {
  const auth  = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return verifyAdminToken(token);
}
