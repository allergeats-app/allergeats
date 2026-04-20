/**
 * lib/userMenus.ts
 * localStorage store for user-contributed menu data for local/indie restaurants.
 *
 * When a restaurant has no official data, users can paste menu text or provide
 * a URL. Items are stored here with sourceType "user-input" so the scoring
 * engine applies appropriate lower confidence and surfaces an "Estimated" caveat.
 */

import type { RawMenuItem } from "./types";

const STORAGE_KEY = "allegeats_user_menus";

type UserMenuEntry = {
  restaurantId: string;
  restaurantName: string;
  items: RawMenuItem[];
  addedAt: string; // ISO date
  source: "text" | "url";
  sourceUrl?: string;
};

type UserMenuStore = Record<string, UserMenuEntry>;

function load(): UserMenuStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserMenuStore) : {};
  } catch {
    return {};
  }
}

function save(store: UserMenuStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

export function getUserMenu(restaurantId: string): UserMenuEntry | null {
  return load()[restaurantId] ?? null;
}

export function saveUserMenu(
  restaurantId: string,
  restaurantName: string,
  items: RawMenuItem[],
  source: "text" | "url",
  sourceUrl?: string
): void {
  const store = load();
  store[restaurantId] = {
    restaurantId,
    restaurantName,
    items,
    addedAt: new Date().toISOString().slice(0, 10),
    source,
    sourceUrl,
  };
  save(store);
}

export function clearUserMenu(restaurantId: string): void {
  const store = load();
  delete store[restaurantId];
  save(store);
}

/**
 * Convert raw menu text (newline-separated items) into RawMenuItem[].
 * Each non-empty line becomes one item. Lines with " - " or " | " are
 * split into name + description. Lines that look like section headers
 * (ALL CAPS, short) are treated as category labels for subsequent items.
 */
export function parseTextToMenuItems(text: string, restaurantId: string): RawMenuItem[] {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items: RawMenuItem[] = [];
  let currentCategory: string | undefined;
  let itemIndex = 0;

  for (const line of lines) {
    // Section header heuristic: short, no digits, title/all-caps, ends with ":"
    const isHeader =
      (line.endsWith(":") && line.length < 50 && !/\d/.test(line)) ||
      (line === line.toUpperCase() && line.length < 40 && /[A-Z]/.test(line));

    if (isHeader) {
      currentCategory = line.replace(/:$/, "").trim();
      continue;
    }

    // Skip price-only lines
    if (/^\$[\d.]+$/.test(line)) continue;

    // Split name and description
    let name = line;
    let description: string | undefined;
    for (const sep of [" - ", " – ", " — ", " | "]) {
      const idx = line.indexOf(sep);
      if (idx > 2 && idx < 80) {
        name = line.slice(0, idx).trim();
        description = line.slice(idx + sep.length).trim() || undefined;
        break;
      }
    }

    // Strip leading price (e.g. "$12.99 Burger" or "12. Burger")
    name = name.replace(/^\$[\d.,]+\s+/, "").replace(/^\d+\.\s+/, "").trim();
    if (!name) continue;

    items.push({
      id: `${restaurantId}-user-${itemIndex++}`,
      name,
      description,
      category: currentCategory,
      sourceType: "user-input",
      sourceConfidence: "low",
    });
  }

  return items;
}
