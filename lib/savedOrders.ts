const KEY = "allegeats_saved_orders";
const MAX = 50;

export type SavedOrderItem = {
  id: string;
  name: string;
  risk: string;
  category?: string;
};

export type SavedOrder = {
  id: string;
  savedAt: number;
  restaurantId: string;
  restaurantName: string;
  /** For builder restaurants: grouped by step label */
  stepGroups?: { label: string; items: SavedOrderItem[] }[];
  /** For regular restaurants: flat list */
  items?: SavedOrderItem[];
};

export function loadSavedOrders(): SavedOrder[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as SavedOrder[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Omit<SavedOrder, "id" | "savedAt">): SavedOrder {
  const orders = loadSavedOrders();
  const entry: SavedOrder = { ...order, id: `order_${Date.now()}`, savedAt: Date.now() };
  const updated = [entry, ...orders].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(updated));
  return entry;
}

export function deleteSavedOrder(id: string): void {
  const orders = loadSavedOrders().filter((o) => o.id !== id);
  localStorage.setItem(KEY, JSON.stringify(orders));
}
