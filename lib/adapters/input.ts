/**
 * User-input adapter.
 * Parses raw pasted or typed menu text into RawMenuItem[].
 * Produces "user-input" source type → Low confidence.
 *
 * Each non-empty line becomes one menu item. Lines are assumed to follow
 * the pattern: "Item Name - optional description" or just "Item Name".
 */

import type { MenuAdapter } from "./types";
import type { RawMenuItem } from "@/lib/types";

let counter = 0;
function nextId() {
  return `input-${++counter}-${Date.now()}`;
}

export class UserInputAdapter implements MenuAdapter {
  readonly sourceType = "user-input" as const;

  async ingest(rawText: string): Promise<RawMenuItem[]> {
    return rawText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        // Try to split "Name - Description" or "Name: Description"
        const sepMatch = line.match(/^(.+?)\s*[-:]\s*(.+)$/);
        if (sepMatch) {
          return {
            id: nextId(),
            name: sepMatch[1].trim(),
            description: sepMatch[2].trim(),
          };
        }
        return { id: nextId(), name: line };
      });
  }
}
