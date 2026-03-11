import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ingestFromText } from "@/lib/menu-ingestion";
import type { NormalizedMenu } from "@/lib/menu-ingestion";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Max image size we'll accept (10 MB). */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export async function POST(req: Request) {
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
    const base64 = Buffer.from(buffer).toString("base64");

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
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
