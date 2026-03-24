// lib/engine/menuParser.ts
// Groups raw menu lines into ParsedDish objects.
// Handles: standalone item names, "Name - Description" format, multi-line items.

import type { ParsedDish } from "./types";
import { normalizeText } from "./ocrNormalizer";

/**
 * Heuristic: is this line a section header (category)?
 * Section headers are short, have no lowercase food keywords,
 * and are often ALL CAPS or title case with no description words.
 */
function isSectionHeader(line: string): boolean {
  // Very short lines that look like category labels
  if (line.length > 60) return false;
  const upper = line.toUpperCase();
  if (upper === line && line.length <= 40) return true;
  // Common category names
  const categoryKeywords = [
    "appetizer", "starter", "entree", "entrée", "main", "side", "dessert",
    "drink", "beverage", "breakfast", "lunch", "dinner", "salad", "soup",
    "sandwich", "burger", "pizza", "pasta", "seafood", "meat", "vegetarian",
    "vegan", "kids", "specials", "combo", "value", "add on",
    "cocktail", "mocktail", "smoothie", "juice", "beer", "wine", "spirit", "liquor",
  ];
  const lower = line.toLowerCase();
  return categoryKeywords.some((k) => lower === k || lower === k + "s");
}

/**
 * Parse a separator between name and description.
 * Returns [name, description] or [line, ""] if no separator found.
 */
function splitNameDescription(line: string): [string, string] {
  // Common separators: " - ", " – ", " | ", ". " (after a capitalized word), ":"
  const separators = [" - ", " – ", " | ", " — "];
  for (const sep of separators) {
    const idx = line.indexOf(sep);
    if (idx > 2 && idx < 60) {
      return [line.slice(0, idx).trim(), line.slice(idx + sep.length).trim()];
    }
  }
  // If line ends with ": ..." treat colon as separator
  const colonIdx = line.indexOf(":");
  if (colonIdx > 2 && colonIdx < 40) {
    return [line.slice(0, colonIdx).trim(), line.slice(colonIdx + 1).trim()];
  }
  return [line, ""];
}

/**
 * Returns true for lines that are add-ons, modifiers, or upsells — not standalone dishes.
 * These are excluded from analysis to reduce noise.
 * Examples: "+$1.50 cheese", "Add bacon", "Extra sauce", "Substitute fries for salad".
 */
function isAddOnLine(line: string): boolean {
  const lower = line.toLowerCase().trim();
  if (/^\+\s*\$?\d/.test(lower)) return true;                                         // "+$1.50 cheese"
  if (/^add\s+on\s*:/i.test(lower)) return true;                                      // "Add on: bacon"
  if (/^(?:add|extra|substitute|upgrade)\s+\w/.test(lower) && lower.length < 50) return true; // "Add cheese"
  return false;
}

/**
 * Convert raw menu lines (from OCR or paste) into structured ParsedDish objects.
 *
 * Improvements over the previous version:
 * - Section headers (ALL CAPS, category keywords) are tracked rather than discarded,
 *   so downstream analysis can use the section context (e.g. "VEGAN", "GLUTEN FREE").
 * - Add-on / modifier lines ("+$1.50 Add cheese") are filtered as noise.
 * - Each dish carries an optional `sectionTag` with the heading it falls under.
 */
export function parseMenuLines(rawLines: string[]): ParsedDish[] {
  const dishes: ParsedDish[] = [];
  let currentSection = "";

  for (const raw of rawLines) {
    const line = raw.trim();
    if (line.length <= 1) continue;    // drop blank / single-char
    if (/^\d+$/.test(line)) continue;  // drop pure numbers (page/table numbers)

    // Section headers: track them but don't emit a dish entry
    if (isSectionHeader(line)) {
      currentSection = line.toLowerCase().trim();
      continue;
    }

    // Add-on / modifier lines: skip
    if (isAddOnLine(line)) continue;

    const [name, description] = splitNameDescription(line);
    const combined = name + (description ? " " + description : "");

    dishes.push({
      raw:         line,
      name:        name.trim(),
      description: description.trim(),
      normalized:  normalizeText(combined),
      sectionTag:  currentSection || undefined,
    });
  }

  return dishes;
}
