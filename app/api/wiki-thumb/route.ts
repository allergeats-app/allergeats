/**
 * GET /api/wiki-thumb?name={restaurant_name}
 *
 * Fetches the lead thumbnail from Wikipedia for a known restaurant chain
 * and proxies the image bytes with a 24-hour cache header.
 * No API key required — uses Wikipedia's free public REST API.
 */

import { isRateLimited, getClientIp } from "@/lib/rateLimit";

// Canonical Wikipedia article titles for known chains
const WIKI_TITLES: Record<string, string> = {
  "mcdonald's":               "McDonald's",
  "chipotle mexican grill":   "Chipotle Mexican Grill",
  "subway":                   "Subway (restaurant)",
  "chick-fil-a":              "Chick-fil-A",
  "taco bell":                "Taco Bell",
  "burger king":              "Burger King",
  "wendy's":                  "Wendy's",
  "domino's":                 "Domino's Pizza",
  "domino's pizza":           "Domino's Pizza",
  "kfc":                      "KFC",
  "panera bread":             "Panera Bread",
  "panera":                   "Panera Bread",
  "pizza hut":                "Pizza Hut",
  "starbucks":                "Starbucks",
  "dunkin'":                  "Dunkin' Donuts",
  "dunkin":                   "Dunkin' Donuts",
  "popeyes":                  "Popeyes",
  "five guys":                "Five Guys",
  "in-n-out burger":          "In-N-Out Burger",
  "in-n-out":                 "In-N-Out Burger",
  "shake shack":              "Shake Shack",
  "olive garden":             "Olive Garden",
  "red lobster":              "Red Lobster",
  "ihop":                     "IHOP",
  "denny's":                  "Denny's",
  "the cheesecake factory":   "The Cheesecake Factory",
  "cheesecake factory":       "The Cheesecake Factory",
  "buffalo wild wings":       "Buffalo Wild Wings",
  "wingstop":                 "Wingstop",
  "panda express":            "Panda Express",
  "p.f. chang's":             "P.F. Chang's",
  "raising cane's":           "Raising Cane's Chicken Fingers",
  "sonic drive-in":           "Sonic Drive-In",
  "sonic":                    "Sonic Drive-In",
  "arby's":                   "Arby's",
  "whataburger":              "Whataburger",
  "dairy queen":              "Dairy Queen",
  "papa john's":              "Papa John's Pizza",
  "papa johns":               "Papa John's Pizza",
  "qdoba":                    "Qdoba",
  "qdoba mexican eats":       "Qdoba",
  "tgi fridays":              "TGI Fridays",
  "red robin":                "Red Robin (restaurant)",
  "cracker barrel":           "Cracker Barrel",
  "jack in the box":          "Jack in the Box",
  "culver's":                 "Culver's",
  "noodles & company":        "Noodles & Company",
  "yard house":               "Yard House",
};

const RATE_WINDOW_MS = 60_000;
const RATE_MAX       = 120;

export async function GET(req: Request) {
  if (isRateLimited(getClientIp(req), RATE_WINDOW_MS, RATE_MAX)) {
    return new Response(null, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const name = (searchParams.get("name") ?? "").trim();
  if (!name || name.length > 200) return new Response(null, { status: 400 });

  const wikiTitle = WIKI_TITLES[name.toLowerCase()] ?? name;

  try {
    const summaryRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTitle)}`,
      { headers: { "User-Agent": "AllergEats/1.0 (food-allergy-app; contact@allegeats.com)" }, next: { revalidate: 86400 } }
    );
    if (!summaryRes.ok) return new Response(null, { status: 404 });

    const data = await summaryRes.json();
    const imgUrl: string | undefined = data.originalimage?.source ?? data.thumbnail?.source;
    if (!imgUrl) return new Response(null, { status: 404 });

    // Proxy the image bytes so the client loads from our domain
    const imgRes = await fetch(imgUrl, {
      headers: { "User-Agent": "AllergEats/1.0" },
    });
    if (!imgRes.ok) return new Response(null, { status: 404 });

    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const buffer = await imgRes.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response(null, { status: 500 });
  }
}
