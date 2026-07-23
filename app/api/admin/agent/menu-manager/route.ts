import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Menu Manager AI employee for AllergEats, a food allergy navigation app.

Your job: analyze the restaurant registry and menu crawl data, then identify what needs updating.

You will receive:
- registry: CanonicalRestaurant[] — restaurants discovered by users
- crawlQueue: Record<registryId, {lastCrawledAt, url}> — when menus were last fetched
- mockRestaurants: array of pre-seeded chain restaurants with their menu counts

Analyze and report:
1. Registry restaurants missing menu URLs (can't be scraped)
2. Restaurants whose menus haven't been crawled in >30 days
3. Mock/seeded restaurants that may need manual allergen updates
4. Any data gaps or anomalies worth flagging

Be direct and specific. Use restaurant names, not IDs. Keep analysis under 300 words.

After your analysis, output proposed actions in this EXACT format — no exceptions:

ACTIONS:
\`\`\`json
{"actions":[]}
\`\`\`

Valid action shapes:
{"type":"fetch_menu","restaurantId":"...","displayName":"...","url":"...","reason":"..."}
{"type":"flag_stale","restaurantId":"...","displayName":"...","daysSinceCrawl":0,"reason":"..."}
{"type":"flag_no_url","restaurantId":"...","displayName":"...","reason":"..."}

If nothing needs attention, output {"actions":[]} — do not manufacture fake issues.`;

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("API key not configured", { status: 503 });

  const body = await req.json() as {
    registry?: unknown[];
    crawlQueue?: Record<string, unknown>;
    mockRestaurants?: { id: string; name: string; itemCount: number }[];
  };

  const userMessage = JSON.stringify({
    registry: body.registry ?? [],
    crawlQueue: body.crawlQueue ?? {},
    mockRestaurants: body.mockRestaurants ?? [],
    analyzedAt: new Date().toISOString(),
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({
          model: process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6",
          max_tokens: 2048,
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
