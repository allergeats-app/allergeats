const KEY = "allegeats_scan_history";
const MAX  = 50;

export interface ScanEntry {
  id:             string;
  restaurantName: string;
  source:         "preloaded" | "url" | "manual";
  scannedAt:      number;
  totalItems:     number;
  safeCount:      number;
  askCount:       number;
  avoidCount:     number;
  allergens:      string[];
}

export function getScanHistory(): ScanEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ScanEntry[]) : [];
  } catch { return []; }
}

export function recordScan(entry: Omit<ScanEntry, "id" | "scannedAt">): void {
  try {
    const id   = Math.random().toString(36).slice(2) + "_" + Date.now().toString(36);
    const next = [{ ...entry, id, scannedAt: Date.now() }, ...getScanHistory()].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore quota errors */ }
}
