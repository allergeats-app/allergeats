import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM = `You are the Feedback Triager AI employee for AllergEats.

Your job: review user feedback and candidate rules, then recommend what to promote or reject.

You will receive:
- feedback: recent FeedbackEntry[] from users (type, allergen, dish, trust score)
- rules: CandidateRule[] with trustWeightTotal, status, conflicted flag

Promotion thresholds:
- candidate → supported: trustWeightTotal >= 4, not conflicted
- supported → validated: trustWeightTotal >= 8, not conflicted
- Any conflicted rule needs human review before promotion

Analyze:
1. Rules ready for promotion (trustWeightTotal high, status lagging behind threshold)
2. Rules that should be rejected (irreversibly conflicted, very low evidence, nonsensical pattern)
3. Notable patterns in recent feedback (e.g. repeated complaints about one restaurant)

Be specific — name the dish pattern and allergen. Keep analysis under 300 words.

After your analysis, output proposed actions in this EXACT format:

ACTIONS:
\`\`\`json
{"actions":[]}
\`\`\`

Valid action shapes:
{"type":"promote_rule","ruleId":"...","pattern":"...","allergen":"...","newStatus":"validated","reason":"..."}
{"type":"reject_rule","ruleId":"...","pattern":"...","allergen":"...","reason":"..."}
{"type":"flag_review","ruleId":"...","pattern":"...","allergen":"...","reason":"..."}

If there's nothing to act on (empty data, no qualifying rules), output {"actions":[]} and explain clearly.`;

function verifyAdmin(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  return !!process.env.ADMIN_PASSWORD && token === process.env.ADMIN_PASSWORD;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("API key not configured", { status: 503 });

  const body = await req.json() as { feedback?: unknown[]; rules?: unknown[] };

  const userMessage = JSON.stringify({
    feedback: (body.feedback ?? []).slice(0, 100),
    rules: body.rules ?? [],
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
