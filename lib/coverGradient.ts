/**
 * Returns a cuisine-matched cover gradient for restaurant cards and hero images.
 * Shared between RestaurantCard and the restaurant detail page.
 */
export function coverGradient(cuisine: string, name: string): string {
  const c = cuisine.toLowerCase();
  const n = name.toLowerCase();
  if (n.includes("mcdonald") || c.includes("burger") || n.includes("burger") || n.includes("wendy") || n.includes("shake shack") || n.includes("five guys"))
    return "linear-gradient(135deg, #fde68a 0%, #fca5a5 100%)";
  if (c.includes("mexican") || c.includes("tex-mex") || n.includes("chipotle") || n.includes("taco"))
    return "linear-gradient(135deg, #fed7aa 0%, #fde68a 100%)";
  if (c.includes("chicken") || n.includes("chick-fil") || n.includes("popeyes") || n.includes("kfc"))
    return "linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)";
  if (c.includes("coffee") || c.includes("café") || c.includes("cafe") || c.includes("bakery") || n.includes("starbucks") || n.includes("dunkin") || n.includes("panera"))
    return "linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)";
  if (c.includes("pizza") || n.includes("domino") || n.includes("pizza hut"))
    return "linear-gradient(135deg, #fca5a5 0%, #fb923c 100%)";
  if (c.includes("sandwich") || c.includes("sub") || n.includes("subway") || n.includes("jersey mike") || n.includes("jimmy john"))
    return "linear-gradient(135deg, #bbf7d0 0%, #6ee7b7 100%)";
  if (c.includes("asian") || c.includes("chinese") || c.includes("sushi") || c.includes("japanese"))
    return "linear-gradient(135deg, #fde68a 0%, #86efac 100%)";
  if (c.includes("italian") || c.includes("pasta"))
    return "linear-gradient(135deg, #fca5a5 0%, #fde68a 100%)";
  return "linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%)";
}
