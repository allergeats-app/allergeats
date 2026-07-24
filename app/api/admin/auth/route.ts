import { NextRequest, NextResponse } from "next/server";
import { mintAdminToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const body = await req.json() as { password?: string };
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret || !body.password || body.password !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ token: mintAdminToken() });
}
