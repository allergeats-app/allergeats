/**
 * Local PDF allergen extractor.
 * Uses Claude document API (small PDFs) or pdf-parse + Claude text (large PDFs).
 *
 * Usage:
 *   node scripts/extract-allergens.mjs <pdf-url> "<Restaurant Name>" [restaurant-id]
 *
 * Output: JSON to stdout, progress to stderr.
 * Example:
 *   node scripts/extract-allergens.mjs \
 *     "https://resources.jimmyjohns.com/downloadable-files/JimmyJohnsAllergenInformation.pdf" \
 *     "Jimmy John's" "jimmy-johns" > /tmp/jimmy-johns.json
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// ── Load .env.local ──────────────────────────────────────────────────────────
function loadEnvLocal() {
  try {
    const text = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch { /* no .env.local — rely on environment */ }
}
loadEnvLocal();

// ── Constants ────────────────────────────────────────────────────────────────
const ALLERGEN_IDS = [
  "dairy","egg","wheat","gluten","soy","peanut","tree-nut",
  "sesame","fish","shellfish","mustard","corn","legumes","oats",
];

const SYSTEM = `You are an allergen data extractor for AllergEats, a food allergy navigation app.

Extract ALL menu items and their allergens from the restaurant's allergen guide.

Map the PDF's allergen labels to these exact IDs:
- Milk / Dairy / Butter / Cream → "dairy"
- Egg / Eggs → "egg"
- Wheat / Gluten / Barley / Rye → "wheat"
- Soy / Soybeans → "soy"
- Peanut / Peanuts / Peanut Butter → "peanut"
- Tree Nut / Almond / Cashew / Pecan / Walnut / Coconut → "tree-nut"
- Sesame / Sesame Seeds / Tahini → "sesame"
- Fish (any fish species) → "fish"
- Shellfish / Shrimp / Crab / Lobster / Scallop / Clam → "shellfish"
- Mustard → "mustard"

Valid allergen IDs: ${ALLERGEN_IDS.join(", ")}

Return a JSON object ONLY — no prose, no markdown fences, no explanation:
{
  "menuItems": [
    {
      "id": "<kebab-case-name, e.g. classic-turkey-slim>",
      "name": "<exact item name>",
      "category": "<section/category from PDF>",
      "allergens": ["dairy","wheat"],
      "description": ""
    }
  ],
  "facilityAllergens": ["peanut","tree-nut"],
  "notes": "<cross-contact warnings, fryer sharing, or data caveats>"
}

Rules:
- Include EVERY item — do not skip or truncate.
- If an item has no allergens, use [].
- facilityAllergens = allergens present facility-wide that may cross-contact items not directly containing them. Return [] if none mentioned.
- Generate id from name: lowercase, replace spaces/special chars with hyphens, deduplicate if needed.`;

// ── Main ─────────────────────────────────────────────────────────────────────
const [,, pdfUrl, restaurantName, restaurantId = "unknown"] = process.argv;

if (!pdfUrl || !restaurantName) {
  process.stderr.write(`Usage: node scripts/extract-allergens.mjs <pdf-url> "<Name>" [id]\n`);
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  process.stderr.write(`Error: ANTHROPIC_API_KEY not set. Add to .env.local or environment.\n`);
  process.exit(1);
}

const Anthropic = (await import("@anthropic-ai/sdk")).default;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

process.stderr.write(`\nFetching PDF: ${pdfUrl}\n`);

let pdfBuffer;
try {
  const resp = await fetch(pdfUrl, {
    headers: { "User-Agent": "AllergEats-AllergenBot/1.0 (+https://www.allergeats.com)" },
    signal: AbortSignal.timeout(45_000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
  pdfBuffer = Buffer.from(await resp.arrayBuffer());
  process.stderr.write(`Downloaded ${(pdfBuffer.length / 1024).toFixed(1)} KB\n`);
} catch (err) {
  process.stderr.write(`Fetch failed: ${err.message}\n`);
  process.exit(1);
}

const sizeKB = pdfBuffer.length / 1024;
let method;
let messages;

if (sizeKB > 20_000) {
  // Large PDF: extract text with pdf-parse first
  method = "text-extraction";
  process.stderr.write(`Large PDF (${(sizeKB / 1024).toFixed(1)} MB) — extracting text with pdf-parse...\n`);
  const pdfParse = require("pdf-parse");
  let pdfData;
  try { pdfData = await pdfParse(pdfBuffer); } catch (err) {
    process.stderr.write(`pdf-parse failed: ${err.message}\n`); process.exit(1);
  }
  process.stderr.write(`Extracted text from ${pdfData.numpages} pages\n`);
  const text = pdfData.text.trim();
  if (!text) { process.stderr.write("No extractable text found.\n"); process.exit(1); }
  messages = [{
    role: "user",
    content: `Restaurant: ${restaurantName} (ID: ${restaurantId})\nPDF URL: ${pdfUrl}\nPages: ${pdfData.numpages}\n\nExtracted text from allergen guide:\n\n${text.slice(0, 150_000)}`,
  }];
} else {
  // Standard PDF: send as document block
  method = "document-api";
  process.stderr.write(`Sending to Claude as document block (${sizeKB.toFixed(1)} KB)...\n`);
  messages = [{
    role: "user",
    content: [
      {
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: pdfBuffer.toString("base64") },
      },
      {
        type: "text",
        text: `Restaurant: ${restaurantName} (ID: ${restaurantId})\nPDF URL: ${pdfUrl}\n\nExtract all menu items and allergen data. Return JSON only.`,
      },
    ],
  }];
}

process.stderr.write(`Calling Claude (${method})...\n`);

let response;
try {
  response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 8192,
    system: SYSTEM,
    messages,
  });
} catch (err) {
  process.stderr.write(`Claude API error: ${err.message}\n`); process.exit(1);
}

const rawText = response.content[0]?.text?.trim() ?? "";
const jsonStr = rawText.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();

let parsed;
try {
  parsed = JSON.parse(jsonStr);
} catch {
  process.stderr.write(`Warning: Claude returned non-JSON. Raw output:\n${rawText}\n`);
  process.exit(1);
}

const itemCount = parsed.menuItems?.length ?? 0;
process.stderr.write(`Extracted ${itemCount} menu items\n\n`);

const result = {
  restaurantId,
  restaurantName,
  source: pdfUrl,
  extractedAt: new Date().toISOString().split("T")[0],
  method,
  ...parsed,
};

process.stdout.write(JSON.stringify(result, null, 2) + "\n");
