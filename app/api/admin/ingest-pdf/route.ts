import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { verifyAdminRequest } from "@/lib/adminAuth";

export const maxDuration = 120;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLERGEN_IDS = [
  "dairy","egg","wheat","gluten","soy","peanut","tree-nut",
  "sesame","fish","shellfish","mustard","corn","legumes","oats",
];

const SYSTEM = `You are an allergen data extractor for AllergEats, a food allergy navigation app.

Extract ALL menu items and their allergens from the restaurant's allergen guide.

Map the PDF's allergen labels to these exact IDs:
- Milk / Dairy / Butter → "dairy"
- Egg / Eggs → "egg"
- Wheat / Gluten-Containing Grains → "wheat"
- Soy / Soybeans → "soy"
- Peanut / Peanuts → "peanut"
- Tree Nut / Tree Nuts / Almond / Cashew / Pecan / Walnut → "tree-nut"
- Sesame / Sesame Seeds → "sesame"
- Fish → "fish"
- Shellfish / Crustacean Shellfish / Shrimp / Lobster / Crab → "shellfish"
- Mustard → "mustard"
- Corn → "corn"

Valid allergen IDs (use ONLY these): ${ALLERGEN_IDS.join(", ")}

Return a JSON object ONLY — no prose, no markdown fences, no explanation:
{
  "menuItems": [
    {
      "id": "<kebab-case derived from name, e.g. 'classic-burger'>",
      "name": "<item name>",
      "category": "<section or category from the PDF>",
      "allergens": ["dairy", "wheat"],
      "description": ""
    }
  ],
  "facilityAllergens": ["peanut", "tree-nut"],
  "notes": "<any cross-contact warnings, fryer-sharing notes, or data caveats>"
}

facilityAllergens = allergens present facility-wide that may cause cross-contact even in items that don't contain them as ingredients.
If the PDF has no facility allergen section, return [].
Include EVERY item — don't skip or truncate. If an item has no allergens listed, use [].`;

interface IngestBody {
  url: string;
  restaurantName: string;
  restaurantId: string;
}

export async function POST(req: NextRequest) {
  if (!verifyAdminRequest(req)) return new Response("Unauthorized", { status: 401 });
  if (!process.env.ANTHROPIC_API_KEY) return new Response("API key not configured", { status: 503 });

  let body: IngestBody;
  try { body = await req.json(); } catch {
    return new Response("Invalid JSON", { status: 400 });
  }
  const { url, restaurantName, restaurantId } = body;
  if (!url || !restaurantName) return new Response("Missing url or restaurantName", { status: 400 });

  // Fetch PDF bytes
  let pdfBuffer: Buffer;
  try {
    const resp = await fetch(url, {
      headers: { "User-Agent": "AllergEats-AllergenBot/1.0 (+https://www.allergeats.com)" },
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return new Response(`Failed to fetch PDF: HTTP ${resp.status}`, { status: 502 });
    pdfBuffer = Buffer.from(await resp.arrayBuffer());
  } catch (err) {
    return new Response(`Fetch failed: ${err instanceof Error ? err.message : String(err)}`, { status: 502 });
  }

  const sizeKB = pdfBuffer.length / 1024;
  let method: "document-api" | "text-extraction";
  let messages: Anthropic.MessageParam[];

  if (sizeKB > 20_000) {
    // Large PDF (>20MB or roughly >100 pages) — extract text first
    method = "text-extraction";
    const pdfParse = (await import("pdf-parse")).default;
    let pdfData: { text: string; numpages: number };
    try { pdfData = await pdfParse(pdfBuffer); } catch (err) {
      return new Response(`PDF parse failed: ${err instanceof Error ? err.message : String(err)}`, { status: 422 });
    }
    const text = pdfData.text.trim();
    if (!text) return new Response("PDF has no extractable text (may be image-only; use document-api path for small image PDFs)", { status: 422 });
    messages = [{
      role: "user",
      content: `Restaurant: ${restaurantName} (ID: ${restaurantId})\nPDF URL: ${url}\nPages: ${pdfData.numpages}\n\nExtracted text:\n\n${text.slice(0, 150_000)}`,
    }];
  } else {
    // Standard PDF — send as base64 document block
    method = "document-api";
    messages = [{
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: pdfBuffer.toString("base64"),
          },
        } as Anthropic.DocumentBlockParam,
        {
          type: "text",
          text: `Restaurant: ${restaurantName} (ID: ${restaurantId})\nPDF URL: ${url}\n\nExtract all menu items and allergen data. Return JSON only.`,
        },
      ],
    }];
  }

  try {
    const response = await client.messages.create({
      model: process.env.CLAUDE_MODEL ?? "claude-sonnet-5",
      max_tokens: 8192,
      system: SYSTEM,
      messages,
    });

    const block = response.content[0];
    if (block.type !== "text") return new Response("Unexpected response shape from Claude", { status: 500 });

    const rawText = block.text.trim();
    // Strip markdown fences if present
    const jsonStr = rawText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      return Response.json({
        restaurantId, restaurantName, source: url,
        extractedAt: new Date().toISOString().split("T")[0],
        method, rawOutput: rawText,
        parseError: "Claude returned non-JSON. See rawOutput.",
      });
    }

    return Response.json({
      restaurantId, restaurantName, source: url,
      extractedAt: new Date().toISOString().split("T")[0],
      method, ...parsed,
    });
  } catch (err) {
    return new Response(`Claude API error: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
  }
}
