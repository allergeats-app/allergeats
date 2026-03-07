export type MenuSource = {
  id: string;
  restaurant: string;
  category: string;
  url?: string;
  location?: string;
  items: string[];
};

export type ImportedMenuRow = {
  restaurant: string;
  category: string;
  item: string;
};