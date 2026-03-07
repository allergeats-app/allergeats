import type { MenuSource } from "@/lib/types";

export function buildScanInput(menu: MenuSource): string {
  return menu.items.join("\n");
}