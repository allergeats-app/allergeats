import { NextResponse } from "next/server";
import { ingestFromHtml, toRawMenuItems } from "@/lib/menu-ingestion";
import type { NormalizedMenu } from "@/lib/menu-ingestion";
import { persistMenu } from "@/lib/db/persistMenu";

/** Max response body size we'll read from an external menu URL (5 MB). */
const MAX_BODY_BYTES = 5 * 1024 * 1024;
/** Timeout for the external fetch in milliseconds. */
const FETCH_TIMEOUT_MS = 30_000;

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

    // Block SSRF targets: loopback, private ranges, link-local (AWS metadata), reserved
    const hostname = parsed.hostname.toLowerCase();
    const ssrfBlocked =
      hostname === "localhost" ||
      /^127\./.test(hostname) ||
      /^0\.0\.0\.0/.test(hostname) ||
      /^::1$/.test(hostname) ||
      /^169\.254\./.test(hostname) ||           // link-local / AWS metadata
      /^10\./.test(hostname) ||                  // RFC1918
      /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname) || // RFC1918
      /^192\.168\./.test(hostname) ||            // RFC1918
      /^fc00:/i.test(hostname) ||                // IPv6 unique local
      /^fe80:/i.test(hostname);                  // IPv6 link-local
    if (ssrfBlocked) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // Abort the fetch if the remote server doesn't respond within FETCH_TIMEOUT_MS
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
          Accept: "text/html,application/xhtml+xml",
        },
        cache:  "no-store",
        signal: controller.signal,
      });
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Request timed out — the menu page took too long to respond"
        : (err instanceof Error ? err.message : "Network error");
      return NextResponse.json({ error: msg }, { status: 408 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not retrieve menu page (status ${res.status})` },
        { status: 400 }
      );
    }

    // Reject responses that are larger than MAX_BODY_BYTES to avoid memory exhaustion
    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Menu page is too large to process (max 5 MB)" },
        { status: 413 }
      );
    }

    const html = await res.text();
    if (html.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "Menu page is too large to process (max 5 MB)" },
        { status: 413 }
      );
    }

    // Run ingestion — errors here are a 422 (bad content), not a 500
    let menu: NormalizedMenu;
    try {
      menu = await ingestFromHtml(html, {
        restaurantId:   restaurantId ?? parsed.hostname,
        restaurantName: restaurantName ?? parsed.hostname,
        sourceUrl:      url,
        sourceLabel:    `${restaurantName ?? parsed.hostname} website`,
      });
    } catch (err) {
      console.error("[fetch-menu] ingestion error:", err);
      return NextResponse.json({ error: "Could not extract menu from this page" }, { status: 422 });
    }

    // Backward-compatible flat lines for the scan page
    const menuLines = toRawMenuItems(menu).map((item) =>
      [item.name, item.description].filter(Boolean).join(" — ")
    );

    // Persist when we have a real restaurantId — errors here don't block the response
    let persisted: Awaited<ReturnType<typeof persistMenu>> | undefined;
    if (restaurantId && restaurantName) {
      try {
        persisted = await persistMenu(menu, { id: restaurantId, name: restaurantName });
      } catch {
        // Persistence failure is non-fatal — menu was ingested successfully
        persisted = { status: "error", error: "DB write failed" };
      }
    }

    return NextResponse.json({ url, menuLines, menu, ...(persisted ? { persisted } : {}) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
