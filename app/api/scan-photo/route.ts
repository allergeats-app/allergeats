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

    const text = message.content[0].type === "text" ? message.content[0].text.trim() : "";

    if (text === "NO_MENU" || !text) {
      return NextResponse.json({ error: "No menu found in the image." }, { status: 422 });
    }

    // Each line is "Name | description" or just "Name"
    // We join name + description so the allergen engine sees all ingredients
    const menuLines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l !== "NO_MENU")
      .map((l) => {
        const [name, desc] = l.split("|").map((s) => s.trim());
        return desc ? `${name} — ${desc}` : name;
      });

    return NextResponse.json({ ok: true, menuLines });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
