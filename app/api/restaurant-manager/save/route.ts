import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Only writable in local dev — Vercel filesystem is read-only in production
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "File write is only available in local development. Copy the code and paste it into lib/mockRestaurants.ts manually." },
      { status: 403 }
    );
  }

  let body: { tsCode?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { tsCode } = body;
  if (!tsCode?.trim()) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "lib", "mockRestaurants.ts");
  const contents = await fs.readFile(filePath, "utf8");

  // Find the closing ]; of MOCK_RESTAURANTS
  const insertMarker = "];";
  const markerIdx = contents.lastIndexOf(insertMarker);
  if (markerIdx === -1) {
    return NextResponse.json({ error: "Could not find insertion point in mockRestaurants.ts" }, { status: 500 });
  }

  // Check this restaurant isn't already in the file (by id)
  const idMatch = tsCode.match(/id:\s*["']([^"']+)["']/);
  if (idMatch && contents.includes(`id: "${idMatch[1]}"`)) {
    return NextResponse.json({ error: `Restaurant "${idMatch[1]}" is already in mockRestaurants.ts` }, { status: 409 });
  }

  const updated =
    contents.slice(0, markerIdx) +
    "\n" + tsCode.trimEnd() + ",\n\n" +
    contents.slice(markerIdx);

  await fs.writeFile(filePath, updated, "utf8");
  return NextResponse.json({ ok: true });
}
