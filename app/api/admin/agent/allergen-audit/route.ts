import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { MOCK_RESTAURANTS } from "@/lib/mockRestaurants";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLERGEN_IDS = ["dairy","egg","wheat","gluten","soy","peanut","tree-nut","sesame","fish","shellfish","mustard","corn","legumes","oats"];

const SYSTEM = `You are the Allergen Auditor AI employee for AllergEats, a food allergy navigation app.

Your job: review menu items and identify likely allergen data errors or gaps.

You will receive:
- restaurants: array of restaurants with their menu items and declared allergens
- corrections: existing admin corrections already applied

Use your knowledge of common restaurant ingredients to identify:
1. Items where the declared allergens seem clearly incomplete (e.g. "Mac and Cheese" missing dairy)
2. Items with names strongly implying an allergen that isn't listed (e.g. "Butter Chicken" missing dairy)
3. Items that commonly share fryers/surfaces with allergens not flagged

Do NOT flag everything — only propose corrections you are highly confident about. A wrong suggestion is worse than a missed one.

Valid allergen IDs: ${ALLERGEN_IDS.join(", ")}

Keep analysis under 400 words. Be specific — name the item and explain why.

After your analysis, output proposed actions in this EXACT format:

ACTIONS:
\`\`\`json
{"actions":[]}
\`\`\`

Valid action shapes:
{"type":"propose_correction","restaurantId":"...","itemId":"...","itemName":"...","currentAllergens":[...],"proposedAllergens":[...],"reason":"..."}
{"type":"flag_review","restaurantId":"...","itemId":"...","itemName":"...","reason":"..."}

If nothing needs correction, output {"actions":[]} — do not manufacture issues.`;

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("API key not configured", { status: 503 });

  const body = await req.json() as { corrections?: Record<string, unknown> };

  const restaurants = MOCK_RESTAURANTS.map(r => ({
    id: r.id,
    name: r.name,
    items: r.menuItems.map(i => ({ id: i.id, name: i.name, category: i.category, allergens: i.allergens ?? [] })),
  }));

  const userMessage = JSON.stringify({
    restaurants,
    corrections: body.corrections ?? {},
    analyzedAt: new Date().toISOString(),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({
          model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 8192,
          system: SYSTEM,
          messages: [{ role: "user", content: userMessage }],
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
          }
        }
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `\n\nError: ${String(err)}` })}\n\n`));
      } finally {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
