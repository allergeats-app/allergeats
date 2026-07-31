import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Menu Manager AI employee for AllergEats, a food allergy navigation app.

Your job: analyze the restaurant registry and menu crawl data, then identify what needs updating.

You will receive:
- registry: CanonicalRestaurant[] — restaurants discovered by users
- crawlQueue: Record<registryId, {lastCrawledAt, url}> — when menus were last fetched
- mockRestaurants: array of pre-seeded chain restaurants with their menu counts

Analyze and report:
1. Registry restaurants missing menu URLs (can't be scraped) — list only the ones MISSING a URL; do NOT list or annotate entries that have one
2. Restaurants whose menus haven't been crawled in >30 days
3. Mock/seeded restaurants that may need manual allergen updates
4. Any data gaps or anomalies worth flagging

Be thorough — surface ALL meaningful findings. Skip entries that are fine. Do not annotate or comment on entries that pass — only report problems.

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

export async function POST(req: NextRequest) {
  if (!verifyAdminRequest(req)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("API key not configured", { status: 503 });

  let body: {
    registry?: unknown[];
    crawlQueue?: Record<string, unknown>;
    mockRestaurants?: { id: string; name: string; itemCount: number }[];
  };
  try { body = await req.json(); } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

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
        const msg = (err instanceof Error && err.message.includes("status"))
          ? "Anthropic API error — check server configuration"
          : "An error occurred processing your request";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `\n\nError: ${msg}` })}\n\n`));
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
