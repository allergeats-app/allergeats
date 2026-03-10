/**
 * lib/menu-ingestion/adapters/websiteHtmlAdapter.ts
 *
 * Ingests menu data from raw HTML or pre-stripped text from a restaurant website.
 *
 * Accepts either:
 *   - Raw HTML (detected by presence of "<" tags) — strips tags, preserves structure
 *   - Pre-stripped text — parsed directly
 *
 * Section detection heuristics (in priority order):
 *   1. Text derived from structural HTML elements (h1–h6, thead, th, caption)
 *      is tagged as a section header before stripping
 *   2. ALL CAPS short lines (≤ 40 chars, no price)
 *   3. Lines ending with ":"
 *   4. Lines matching known menu category keywords
 *
 * Item parsing:
 *   - Lines with a price pattern ($X.XX) or a known food keyword are items
 *   - Name and description are split on the first "—", "–", ":", or " - "
 *     separator that appears after the first word
 *
 * Integration:
 *   Feed HTML from the existing /api/fetch-menu route into this adapter
 *   to get structured sections instead of a flat list.
 */

import type { MenuIngestionAdapter, NormalizedMenu, NormalizedMenuItem, IngestionMeta } from "../types";
import {
  buildMenuShell, buildSection, buildItem,
  extractPrice, stripPrice,
} from "./base";

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_LINE_LENGTH     = 200;
const MIN_LINE_LENGTH     = 4;
const MAX_SECTION_NAME_LEN = 60;
const HEADER_MARKER       = "\x01SECTION\x01"; // injected before tag-stripping

/** Price pattern: $12.99, 12.99, $12 */
const PRICE_RE = /\$?\d+\.\d{2}|\$\d+/;

/** Known menu section keywords */
const SECTION_KEYWORDS_RE =
  /^(appetizers?|starters?|mains?|entrees?|entr[eé]es?|sides?|desserts?|beverages?|drinks?|cocktails?|beer|wine|spirits?|salads?|soups?|sandwiches?|burgers?|pizza|pasta|seafood|breakfast|brunch|lunch|dinner|specials?|combos?|kids?|extras?|add-?ons?|sauces?|dressings?|toppings?|shareables?|snacks?|wraps?|tacos?|sushi|rolls?|bowls?|platters?|wings?|noodles?|rice|ramen|pho|bao|dim\s?sum|vegan|vegetarian|gluten[\s-]free)s?$/i;

/** Food term pattern — used to identify item lines */
const FOOD_TERM_RE =
  /(burger|taco|salad|pizza|chicken|steak|pasta|soup|wings|fries|sandwich|wrap|bowl|dessert|cake|ice\s*cream|coffee|tea|sushi|roll|rice|noodle|dumpling|curry|fish|shrimp|beef|pork|lamb|tofu|cheese|cream|sauce|dressing|bread|muffin|waffle|pancake|egg|bacon|veggie|mushroom|onion|pepper|tomato|avocado|spinach|garlic|ginger|coconut|peanut|almond|walnut|salmon|tuna|lobster|crab|clam|oyster|scallop|calamari|ribeye|brisket|ribs|pulled|grilled|fried|roasted|baked|steamed)/i;

/** Common noise patterns to skip */
const SKIP_RE =
  /^(menu|order\s+now|add\s+to\s+cart|view\s+menu|see\s+more|show\s+less|calories?|nutrition|allergen|toggle|filter|share|print|close|back\s+to|home|cart|login|sign\s+in|privacy|terms|contact\s+us|follow\s+us|download\s+app|gift\s+card)s?$/i;

// ─── HTML stripping ───────────────────────────────────────────────────────────

/** Inject a section marker before structural heading elements */
function injectSectionMarkers(html: string): string {
  return html
    // Structural heading elements → section markers
    .replace(/<(h[1-6]|thead|caption|th)[^>]*>([\s\S]*?)<\/\1>/gi, (_, _tag, inner) => {
      const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      return text ? `\n${HEADER_MARKER}${text}\n` : "";
    })
    // Dividers and major block elements → newlines
    .replace(/<\/(div|section|article|li|tr|p|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/&[a-z]+;/g, " ");
}

function stripHtml(html: string): string {
  // Remove script and style content
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // Inject structural markers before stripping
  const marked = injectSectionMarkers(stripped);

  // Strip remaining tags
  const text = marked.replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(text);
}

// ─── Line classification ──────────────────────────────────────────────────────

type LineKind = "section" | "item" | "skip";

function classifyLine(line: string, isStructuralHeader: boolean): LineKind {
  if (isStructuralHeader) return "section";

  // Too short or too long
  if (line.length < MIN_LINE_LENGTH || line.length > MAX_LINE_LENGTH) return "skip";

  // Known noise
  if (SKIP_RE.test(line)) return "skip";

  // Section: short, ALL CAPS, no price
  const isAllCaps = /^[A-Z][A-Z\s&\/''.-]{2,}$/.test(line);
  const hasPrice  = PRICE_RE.test(line);
  if (isAllCaps && !hasPrice && line.length <= MAX_SECTION_NAME_LEN) return "section";

  // Section: ends with colon and no price
  if (/:\s*$/.test(line) && !hasPrice && line.length <= MAX_SECTION_NAME_LEN) return "section";

  // Section: known category keyword
  const stripped = line.replace(/:\s*$/, "").trim();
  if (SECTION_KEYWORDS_RE.test(stripped) && !hasPrice) return "section";

  // Item: has price
  if (hasPrice) return "item";

  // Item: has food term
  if (FOOD_TERM_RE.test(line)) return "item";

  // Item: reasonably long (likely description without price)
  if (line.length >= 20 && line.length <= MAX_LINE_LENGTH) return "item";

  return "skip";
}

// ─── Item line parsing ────────────────────────────────────────────────────────

/** Split "Name — Description" or "Name: Description" patterns */
const ITEM_SEP_RE = /^(.{4,60}?)\s*(?:[-–—]|:\s{2,}|\s{3,})\s*(.{8,})$/;

function parseItemLine(line: string): { name: string; description?: string; price?: string } {
  const price = extractPrice(line);
  const noPrice = stripPrice(line);

  const sepMatch = noPrice.match(ITEM_SEP_RE);
  if (sepMatch) {
    return {
      name:        sepMatch[1].trim(),
      description: sepMatch[2].trim(),
      price,
    };
  }

  // No separator — use the whole line as name (trimmed at 100 chars)
  return { name: noPrice.slice(0, 100).trim(), price };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class WebsiteHtmlAdapter implements MenuIngestionAdapter<string> {
  readonly sourceType = "website_html" as const;

  async ingest(input: string, meta: IngestionMeta): Promise<NormalizedMenu> {
    const isHtml = /<[a-z][\s\S]*>/i.test(input);
    const text   = isHtml ? stripHtml(input) : input;

    // Split into lines, preserve structural marker info
    const rawLines = text.split(/\r?\n/);
    const lines: Array<{ text: string; isStructural: boolean }> = rawLines
      .map((l) => {
        const isStructural = l.startsWith(HEADER_MARKER);
        return {
          text:         isStructural ? l.slice(HEADER_MARKER.length).trim() : l.trim(),
          isStructural,
        };
      })
      .filter((l) => l.text.length > 0);

    // Build sections
    const menu = buildMenuShell("website_html", meta, isHtml ? text.slice(0, 5000) : undefined);
    let currentSection = buildSection("Menu");
    menu.sections.push(currentSection);

    for (const { text: line, isStructural } of lines) {
      const kind = classifyLine(line, isStructural);

      if (kind === "section") {
        // Only start a new section if it has a different name
        const cleanName = line.replace(/:\s*$/, "").trim();
        if (cleanName.toLowerCase() !== currentSection.sectionName.toLowerCase()) {
          currentSection = buildSection(cleanName);
          menu.sections.push(currentSection);
        }
        continue;
      }

      if (kind === "item") {
        const parsed = parseItemLine(line);
        if (parsed.name.length < MIN_LINE_LENGTH) continue;
        const item = buildItem("html", parsed.name, {
          description: parsed.description,
          price:       parsed.price,
          rawText:     line,
        });
        currentSection.items.push(item);
      }
    }

    // Drop empty sections
    menu.sections = menu.sections.filter((s) => s.items.length > 0);

    // If everything fell into one section with no structural grouping, keep it
    if (menu.sections.length === 0) {
      menu.sections = [buildSection("Menu")];
    }

    return menu;
  }
}
