import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 30 requests per hour — this is a founder-only tool
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;

export const maxDuration = 60;

const PROMPT = `You are a food allergen expert building data for the AllergEats app.

Given a restaurant name, cuisine type, and optionally raw menu text scraped from their website, generate a complete restaurant entry in this exact JSON format:

{
  "id": "kebab-case-restaurant-name",
  "name": "Full Restaurant Name",
  "cuisine": "Category · Subcategory",
  "tags": ["tag1"],
  "facilityAllergens": ["dairy", "wheat"],
  "menuItems": [
    {
      "id": "prefix-item-name",
      "name": "Item Name",
      "category": "Category",
      "allergens": ["dairy", "wheat"]
    }
  ]
}

RULES:
- Valid allergen IDs ONLY: "dairy", "egg", "wheat", "gluten", "soy", "peanut", "tree-nut", "sesame", "fish", "shellfish", "mustard", "corn", "legumes", "oats"
- Be accurate and conservative — only list allergens you are confident about
- Use your knowledge of the chain's published allergen guides if available
- If menu text is provided, use it; otherwise use your training knowledge
- id prefix = first 3-4 letters of restaurant name (e.g. "tb-" for Taco Bell)
- Categories: use the restaurant's actual section names (Entrée, Side, Drink, Dessert, etc.)
- facilityAllergens = allergens present anywhere in the kitchen (cross-contamination risk)
- Include ALL major menu items — aim for 20-60 items for chain restaurants
- Drinks: plain soda/water/juice = [] allergens; milkshakes = ["dairy"]
- Return ONLY valid JSON, no markdown, no explanation`;

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
  }

  const ip = getClientIp(req);
  if (await isRateLimited(ip, WINDOW_MS, MAX_PER_WINDOW)) {
    return NextResponse.json({ error: "Rate limit reached" }, { status: 429 });
  }

  let parsedbody: { restaurantName?: string; menuUrl?: string; cuisineType?: string };
  try { parsedbody = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { restaurantName, menuUrl, cuisineType } = parsedbody;

  if (!restaurantName?.trim()) {
    return NextResponse.json({ error: "Restaurant name is required" }, { status: 400 });
  }

  // Try to fetch the menu if a URL was provided
  let menuText = "";
  if (menuUrl?.trim()) {
    try {
      const origin = new URL(req.url).origin;
      const fetchRes = await fetch(`${origin}/api/fetch-menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: menuUrl, restaurantName }),
      });
      if (fetchRes.ok) {
        const data = await fetchRes.json() as { menuLines?: string[] };
        if (data.menuLines?.length) {
          menuText = data.menuLines.slice(0, 400).join("\n"); // cap to avoid huge prompts
        }
      }
    } catch {
      // Proceed without menu text — Claude will use its knowledge
    }
  }

  const userMessage = [
    `Restaurant: ${restaurantName}`,
    cuisineType ? `Cuisine: ${cuisineType}` : "",
    menuText ? `\nMenu text scraped from their website:\n${menuText}` : "\nNo menu URL provided — use your knowledge of this chain.",
  ].filter(Boolean).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: PROMPT,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "";

  // Strip any accidental markdown fences
  const jsonStr = raw.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim();

  let restaurant: unknown;
  try {
    restaurant = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "Claude returned invalid JSON", raw }, { status: 500 });
  }

  return NextResponse.json({ restaurant });
}
