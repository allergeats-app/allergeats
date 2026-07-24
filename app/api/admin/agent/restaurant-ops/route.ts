import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Restaurant Ops AI employee for AllergEats.

Your job: audit the restaurant registry for data quality issues.

You will receive a list of CanonicalRestaurant records discovered by users.

Look for:
1. Obvious duplicates — same name and very similar address/coordinates, or same registryId used for different locations
2. Records missing critical fields (no address, no cuisine)
3. Records not seen recently (lastSeenAt > 90 days ago) — may have closed
4. Suspiciously low-confidence records (confidence: "low") with no corroboration
5. Records with out-of-region coordinates (not in Florida, especially NYC/NJ lat/lng)

Be thorough — surface ALL meaningful findings. Do not cut your analysis short to save space. Work through the full dataset.

After your analysis, output proposed actions in this EXACT format:

ACTIONS:
\`\`\`json
{"actions":[]}
\`\`\`

Valid action shapes:
{"type":"flag_duplicate","id1":"...","name1":"...","id2":"...","name2":"...","reason":"..."}
{"type":"flag_missing_data","restaurantId":"...","displayName":"...","missingFields":["cuisine","address"],"reason":"..."}
{"type":"flag_stale","restaurantId":"...","displayName":"...","lastSeenAt":"...","reason":"..."}

If the registry is empty or nothing needs attention, output {"actions":[]} and say so clearly.`;

export async function POST(req: NextRequest) {
  if (!verifyAdminRequest(req)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("API key not configured", { status: 503 });

  const body = await req.json() as { registry?: unknown[] };

  const userMessage = JSON.stringify({
    registry: body.registry ?? [],
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
