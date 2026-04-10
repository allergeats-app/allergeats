const KEY = "allegeats_recently_viewed";
const MAX  = 20;

export interface RecentView {
  id:       string;
  name:     string;
  cuisine:  string;
  lat?:     number;
  lng?:     number;
  distance?: number;
  viewedAt: number;
}

export function getRecentlyViewed(): RecentView[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as RecentView[]) : [];
  } catch { return []; }
}

export function recordView(r: Omit<RecentView, "viewedAt">): void {
  try {
    const views = getRecentlyViewed().filter((v) => v.id !== r.id);
    const next: RecentView[] = [{ ...r, viewedAt: Date.now() }, ...views].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch { /* ignore quota errors */ }
}
