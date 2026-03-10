import { NextResponse } from "next/server";
import { ingestFromHtml, toRawMenuItems } from "@/lib/menu-ingestion";
import type { NormalizedMenu } from "@/lib/menu-ingestion";
import { persistMenu } from "@/lib/db/persistMenu";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      url?: string;
      restaurantId?: string;
      restaurantName?: string;
    };
    const { url, restaurantId, restaurantName } = body;

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

    const menu: NormalizedMenu = await ingestFromHtml(html, {
      restaurantId:  restaurantId ?? parsed.hostname,
      restaurantName: restaurantName ?? parsed.hostname,
      sourceUrl:     url,
      sourceLabel:   `${restaurantName ?? parsed.hostname} website`,
    });

    // Backward-compatible flat lines for the scan page
    const menuLines = toRawMenuItems(menu).map((item) =>
      [item.name, item.description].filter(Boolean).join(" — ")
    );

    // Persist when we have a real restaurantId
    let persisted: Awaited<ReturnType<typeof persistMenu>> | undefined;
    if (restaurantId && restaurantName) {
      persisted = await persistMenu(menu, { id: restaurantId, name: restaurantName });
    }

    return NextResponse.json({ url, menuLines, menu, ...(persisted ? { persisted } : {}) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
