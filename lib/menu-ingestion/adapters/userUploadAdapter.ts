/**
 * lib/menu-ingestion/adapters/userUploadAdapter.ts
 *
 * Ingests pasted or uploaded plain-text menu content.
 *
 * This is a significant upgrade over the existing UserInputAdapter in
 * lib/adapters/input.ts — it detects sections, handles multiple item
 * formats, parses prices, and preserves raw text per item.
 *
 * Supported item formats:
 *   "Burger King Whopper"
 *   "Whopper - Two all-beef patties, special sauce..."
 *   "Whopper: Two all-beef patties..."
 *   "Whopper $9.99"
 *   "Whopper $9.99 - Two all-beef patties..."
 *   "• Whopper — classic beef burger"
 *   "# BURGERS"        (markdown heading → section)
 *   "## Appetizers"    (markdown heading → section)
 *   "BURGERS:"         (caps heading → section)
 *   "Burgers"          (short title line → section, if followed by items)
 */

import type { MenuIngestionAdapter, NormalizedMenu, IngestionMeta } from "../types";
import {
  buildMenuShell, buildSection, buildItem,
  extractPrice, stripPrice,
} from "./base";

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_ITEM_NAME_LEN   = 3;
const MAX_SECTION_NAME_LEN = 55;

/** Price pattern */
const PRICE_RE = /\$?\d+\.\d{2}|\$\d+/;

/** Section heading patterns */
const MARKDOWN_HEADING_RE = /^#{1,3}\s+(.+)$/;
const CAPS_HEADING_RE     = /^[A-Z][A-Z\s&\/''.-]{2,}$/;
const COLON_HEADING_RE    = /^([^:]{3,50}):\s*$/;

/** Menu category keywords for short-line section detection */
const CATEGORY_RE =
  /^(appetizers?|starters?|mains?|entrees?|entr[eé]es?|sides?|desserts?|beverages?|drinks?|cocktails?|beer|wine|spirits?|salads?|soups?|sandwiches?|burgers?|pizza|pasta|seafood|breakfast|brunch|lunch|dinner|specials?|combos?|kids?|extras?|add-?ons?|sauces?|dressings?|toppings?|shareables?|snacks?|wraps?|tacos?|sushi|rolls?|bowls?|platters?|wings?|noodles?|rice|ramen|pho|bao|dim\s?sum|vegan|vegetarian|gluten[\s-]free)s?$/i;

/** Bullet/list markers to strip from item lines */
const BULLET_RE = /^[\s•·▪▸▶‣◦\-*]+/;

// ─── Item line parsing ────────────────────────────────────────────────────────

/** Split "Name — Description", "Name: Description", or "Name     Description" */
const ITEM_SEP_RE = /^(.{3,60}?)\s*(?:[-–—]|:\s{2,}|\s{4,})\s*(.{5,})$/;

function parseItemLine(raw: string): {
  name: string;
  description?: string;
  price?: string;
} {
  // Strip bullet markers
  const line = raw.replace(BULLET_RE, "").trim();
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

  return { name: noPrice.slice(0, 100).trim(), price };
}

// ─── Section detection ────────────────────────────────────────────────────────

type LineResult =
  | { kind: "section"; name: string }
  | { kind: "item";    raw: string }
  | { kind: "blank" };

function classifyUploadLine(line: string, nextLine?: string): LineResult {
  if (!line.trim()) return { kind: "blank" };

  const trimmed = line.trim();

  // Markdown headings: # Heading, ## Heading
  const markdownMatch = trimmed.match(MARKDOWN_HEADING_RE);
  if (markdownMatch) return { kind: "section", name: markdownMatch[1].trim() };

  // Explicit colon heading: "Burgers:" or "APPETIZERS:"
  const colonMatch = trimmed.match(COLON_HEADING_RE);
  if (colonMatch && !PRICE_RE.test(trimmed)) {
    return { kind: "section", name: colonMatch[1].trim() };
  }

  // ALL CAPS, no price, short enough
  if (
    CAPS_HEADING_RE.test(trimmed) &&
    trimmed.length <= MAX_SECTION_NAME_LEN &&
    !PRICE_RE.test(trimmed)
  ) {
    return { kind: "section", name: trimmed };
  }

  // Short category keyword line (use look-ahead: next line should be an item)
  if (
    CATEGORY_RE.test(trimmed) &&
    trimmed.length <= MAX_SECTION_NAME_LEN &&
    !PRICE_RE.test(trimmed) &&
    nextLine && nextLine.trim().length > 0
  ) {
    return { kind: "section", name: trimmed };
  }

  // Everything else is an item
  return { kind: "item", raw: trimmed };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export class UserUploadAdapter implements MenuIngestionAdapter<string> {
  readonly sourceType = "user_upload" as const;

  async ingest(rawText: string, meta: IngestionMeta): Promise<NormalizedMenu> {
    const menu = buildMenuShell("user_upload", meta, rawText.slice(0, 5000));
    let currentSection = buildSection("Menu");
    menu.sections.push(currentSection);

    const lines = rawText.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const result = classifyUploadLine(lines[i], lines[i + 1]);

      if (result.kind === "blank") continue;

      if (result.kind === "section") {
        if (result.name.toLowerCase() !== currentSection.sectionName.toLowerCase()) {
          currentSection = buildSection(result.name);
          menu.sections.push(currentSection);
        }
        continue;
      }

      // item
      const parsed = parseItemLine(result.raw);
      if (parsed.name.length < MIN_ITEM_NAME_LEN) continue;

      const item = buildItem("upload", parsed.name, {
        description: parsed.description,
        price:       parsed.price,
        rawText:     result.raw,
      });
      currentSection.items.push(item);
    }

    // Drop empty sections
    menu.sections = menu.sections.filter((s) => s.items.length > 0);

    if (menu.sections.length === 0) {
      menu.sections = [buildSection("Menu")];
    }

    return menu;
  }
}
