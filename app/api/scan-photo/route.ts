import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mediaType = (file.type || "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
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
              text: `This is a photo of a restaurant menu. Extract every food and drink item name visible.

Return ONLY a plain list — one item per line, no numbers, no bullets, no prices, no descriptions, no categories, no extra text.

Example output:
Classic Burger
Caesar Salad
Grilled Chicken Sandwich
Chocolate Lava Cake

If you cannot read the menu clearly, return the items you can make out. If there is no menu visible, return: NO_MENU`,
            },
          ],
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (text === "NO_MENU" || !text) {
      return NextResponse.json({ error: "No menu found in the image." }, { status: 422 });
    }

    const menuLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== "NO_MENU");

    return NextResponse.json({ ok: true, menuLines });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
