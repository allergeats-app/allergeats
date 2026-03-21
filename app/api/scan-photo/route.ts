import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ingestFromText } from "@/lib/menu-ingestion";
import type { NormalizedMenu } from "@/lib/menu-ingestion";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// 5 scans per minute per IP — Anthropic calls are expensive
const SCAN_WINDOW_MS  = 60_000;
const SCAN_MAX_REQ    = 5;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

/** Max image size we'll accept (10 MB). */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
/** Timeout for the Anthropic API call. */
const ANTHROPIC_TIMEOUT_MS = 25_000;

// Magic byte signatures for image format validation
const MAGIC: Record<string, (b: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8,
  "image/png":  (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/gif":  (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46,
  "image/webp": (b) => b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
};

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(req: Request) {
  if (isRateLimited(getClientIp(req), SCAN_WINDOW_MS, SCAN_MAX_REQ)) {
    return NextResponse.json({ error: "Too many requests — please wait a moment" }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const restaurantId   = (formData.get("restaurantId")   as string | null) ?? undefined;
    const restaurantName = (formData.get("restaurantName") as string | null) ?? undefined;

    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Validate file size before reading into memory
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image too large — maximum size is 10 MB" },
        { status: 413 }
      );
    }

    // Validate MIME type from client declaration (Anthropic API enforces this on its end too)
    const declaredType = file.type || "image/jpeg";
    if (!ALLOWED_MEDIA_TYPES.has(declaredType)) {
      return NextResponse.json(
        { error: "Unsupported image type — use JPEG, PNG, GIF, or WebP" },
        { status: 415 }
      );
    }
    const mediaType = declaredType as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const buffer = await file.arrayBuffer();

    // Validate actual file bytes against declared MIME type (guards against spoofed Content-Type)
    const magic = MAGIC[mediaType];
    if (magic && !magic(new Uint8Array(buffer.slice(0, 12)))) {
      return NextResponse.json(
        { error: "File content does not match the declared image type" },
        { status: 415 }
      );
    }

    const base64 = Buffer.from(buffer).toString("base64");

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), ANTHROPIC_TIMEOUT_MS);

    let message: Awaited<ReturnType<typeof client.messages.create>>;
    try {
      message = await client.messages.create({
        model: MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `This is a photo of a restaurant menu. Extract every food and drink item visible.

For each item, output one line in this exact format:
<Item Name> | <ingredients and description if shown>

Rules:
- If the menu shows a description or ingredients, include them after the pipe character
- If no description is shown, just output the item name with no pipe
- Include ALL ingredients, sauces, toppings, and preparation notes you can read — this is critical for allergy detection
- Do NOT include prices, calories, item numbers, or section headers
- One item per line
- If you cannot read the menu clearly, extract what you can
- If there is no menu visible, output: NO_MENU

Example output:
Truffle Pasta | house-made fettuccine, black truffle butter, parmesan, crispy pancetta
Classic Burger | beef patty, cheddar cheese, brioche bun, house mayo, lettuce, tomato
Garden Salad
Chocolate Lava Cake | warm chocolate cake, vanilla ice cream, contains eggs and dairy`,
            },
          ],
        },
      ],
      });
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return NextResponse.json(
        { error: isTimeout ? "Menu scan timed out — please try again" : "Failed to analyze image" },
        { status: isTimeout ? 408 : 502 }
      );
    } finally {
      clearTimeout(timeoutId);
    }

    // Guard against unexpected response shapes from the Anthropic API
    const textBlock = message.content.find((c) => c.type === "text");
    const text = textBlock?.type === "text" ? textBlock.text.trim() : "";

    if (!text || text === "NO_MENU") {
      return NextResponse.json({ error: "No menu found in the image." }, { status: 422 });
    }

    // Parse Claude's "Name | description" lines into plain text for the ingestion pipeline
    const cleanedLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== "NO_MENU");

    // Feed the extracted text through the ingestion pipeline
    const plainText = cleanedLines.join("\n");
    const menu: NormalizedMenu = await ingestFromText(plainText, {
      restaurantId:   restaurantId  ?? "unknown",
      restaurantName: restaurantName ?? "Unknown Restaurant",
      sourceLabel:    "Photo scan",
    });

    // Override source type to image (ingestFromText sets user_upload)
    (menu as { sourceType: string }).sourceType = "image";

    // Backward-compatible flat lines for the scan page
    const menuLines = cleanedLines.map((l) => {
      const [name, desc] = l.split("|").map((s) => s.trim());
      return desc ? `${name} — ${desc}` : name;
    });

    return NextResponse.json({ ok: true, menuLines, menu });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
