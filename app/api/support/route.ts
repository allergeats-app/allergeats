import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 20 messages per 10 minutes per IP — generous for support chat
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;

const SYSTEM_PROMPT = `You are the AllergEats support assistant — friendly, concise, and knowledgeable about food allergies and the app.

## What AllergEats Does
AllergEats is a mobile web app that helps people with food allergies discover safe restaurants and menu items nearby. It is NOT medical advice — always remind users to confirm with restaurant staff.

## Core Features
- **Home / Restaurant Feed**: Shows nearby restaurants with a safety fit score based on how many menu items are safe for the user's allergen profile. Tap any card to see the full menu analysis.
- **Allergen Profile**: Set your personal allergens (peanuts, tree nuts, dairy, eggs, wheat/gluten, soy, fish, shellfish, sesame, corn, sulfites, mustard, and more). Go to Profile or tap the allergen chips on the home screen. Changes save automatically.
- **Safety Colors**: Green = Likely Safe, Yellow = Ask Staff (uncertain / cross-contamination risk), Red = Avoid (detected allergen match).
- **Menu Scan** (Scan tab): Upload a menu photo or paste a URL to analyze any restaurant's menu on the spot — even ones not in the database.
- **Saved**: Saved restaurants and past orders for quick re-ordering reference.
- **Map View**: Tap the map icon in the bottom nav to see restaurants plotted on a map.
- **Filters**: Filter by distance radius, cuisine type, or safety tier via the filter icon in the header.

## Troubleshooting
- **Location not working**: Tap the location label at the top of the home screen and grant location permission, or manually search for a city/zip.
- **No restaurants showing**: Coverage depends on OpenStreetMap data — may be limited in rural areas. Try widening the search radius in Filters.
- **Menu scan missing items**: Upload a higher-quality photo with good lighting, or paste the restaurant's direct menu URL.
- **Can't sign in**: Use the email + password you registered with. Use the "Forgot password" link if needed. Guest mode (no account) still works for the full allergen scanning experience.
- **Data seems wrong for a restaurant**: Tap 💬 (bottom-right of any page) to report incorrect allergen data — the team reviews every report.

## Important
- AllergEats is a decision-support tool, NOT medical advice. Always confirm with staff before ordering.
- Restaurant data comes from OpenStreetMap and community sources — it may not always be 100% complete.
- If a user has a severe/anaphylactic allergy, remind them to always carry their epinephrine and confirm with restaurant staff.

## Tone
Be warm, clear, and concise. If you're unsure of a specific answer, say so honestly and direct the user to the 💬 feedback button or to confirm with the restaurant. Never guess at specific menu item safety.`;

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY is not configured.", { status: 503 });
  }

  const ip = getClientIp(req);
  if (await isRateLimited(ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return new Response("Too many messages — please wait a moment.", { status: 429 });
  }

  let messages: Anthropic.MessageParam[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return new Response("Invalid request", { status: 400 });
  }

  // Cap history at last 20 turns to avoid runaway context
  const trimmed = messages.slice(-20);

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: trimmed,
  });

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(enc.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
