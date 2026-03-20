import { NextResponse } from "next/server";

const TIMEOUT_MS = 10_000;

export async function POST(req: Request) {
  const appId  = process.env.NUTRITIONIX_APP_ID;
  const appKey = process.env.NUTRITIONIX_APP_KEY;

  if (!appId || !appKey) {
    return NextResponse.json({ error: "Nutritionix credentials not configured" }, { status: 503 });
  }

  let query: string;
  try {
    ({ query } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(
      "https://trackapi.nutritionix.com/v2/search/instant?query=" + encodeURIComponent(query.slice(0, 200)),
      {
        headers: { "x-app-id": appId, "x-app-key": appKey },
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: `Nutritionix error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json(
      { error: isTimeout ? "Request timed out" : "Nutritionix fetch failed" },
      { status: isTimeout ? 408 : 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
