import { NextResponse } from "next/server";

function stripHtml(html: string) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, " ");
  html = html.replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = html.replace(/<[^>]*>/g, " ");
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLikelyMenuLines(text: string) {
  // Try to create “lines”
  const roughLines = text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const lines = roughLines.length > 30 ? roughLines : text.split(" • ").map((l) => l.trim()).filter(Boolean);

  const priceLike = /\$?\d+(\.\d{2})?/;
  const foodLike =
    /(burger|taco|salad|pizza|chicken|steak|pasta|soup|wings|fries|sandwich|wrap|bowl|dessert|cake|ice cream|coffee|tea)/i;

  const filtered = lines
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length >= 10 && l.length <= 160)
    .filter((l) => priceLike.test(l) || foodLike.test(l));

  return Array.from(new Set(filtered)).slice(0, 250);
}

export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "URL must start with http/https" }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Fetch failed: ${res.status} ${res.statusText}` },
        { status: 400 }
      );
    }

    const html = await res.text();
    const text = stripHtml(html);
    const menuLines = extractLikelyMenuLines(text);

    return NextResponse.json({ url, menuLines });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}