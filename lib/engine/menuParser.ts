// lib/engine/menuParser.ts
// Groups raw menu lines into ParsedDish objects.
// Handles: standalone item names, "Name - Description" format, multi-line items.

import type { ParsedDish } from "./types";
import { normalizeText, filterMenuLines } from "./ocrNormalizer";

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
 * Convert raw menu lines (from OCR or paste) into structured ParsedDish objects.
 * Strategy:
 * - Filter noise lines
 * - If a line is very long, treat it as "name + inline description"
 * - Otherwise treat each line as a separate item
 * - Skip section headers
 */
export function parseMenuLines(rawLines: string[]): ParsedDish[] {
  const cleaned = filterMenuLines(rawLines);
  const dishes: ParsedDish[] = [];

  for (const line of cleaned) {
    if (isSectionHeader(line)) continue;

    const [name, description] = splitNameDescription(line);
    const combined = name + (description ? " " + description : "");

    dishes.push({
      raw:        line,
      name:       name.trim(),
      description: description.trim(),
      normalized: normalizeText(combined),
    });
  }

  return dishes;
}
