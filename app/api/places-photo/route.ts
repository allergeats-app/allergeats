import { NextResponse } from "next/server";

/**
 * GET /api/places-photo?name={restaurantName}&lat={lat}&lng={lng}
 *
 * Proxies a Google Places photo for the named restaurant.
 * The API key stays server-side — the client never sees it.
 * Returns the image bytes directly (jpeg/webp) with a 24h cache header,
 * or 404 if no photo is found or the key is not configured.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "";
  const lat  = searchParams.get("lat");
  const lng  = searchParams.get("lng");

  const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key || !name) return new Response(null, { status: 404, ...NO_CACHE });

  try {
    // 1. Find the place and retrieve photo references
    const bias = lat && lng ? `&locationbias=circle:5000@${lat},${lng}` : "";
    const findRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
      `?input=${encodeURIComponent(name)}&inputtype=textquery&fields=photos${bias}&key=${key}`,
      { next: { revalidate: 86400 } } // cache the Places lookup for 24h
    );

    if (!findRes.ok) return new Response(null, { status: 404, ...NO_CACHE });

    const findData = await findRes.json();
    const photoRef: string | undefined =
      findData.candidates?.[0]?.photos?.[0]?.photo_reference;

    if (!photoRef) return new Response(null, { status: 404, ...NO_CACHE });

    // 2. Fetch and stream the actual photo bytes
    const photoRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=600&photo_reference=${photoRef}&key=${key}`
    );

    if (!photoRes.ok) return new Response(null, { status: 404, ...NO_CACHE });

    const imageBytes = await photoRes.arrayBuffer();
    return new Response(imageBytes, {
      headers: {
        "Content-Type": photoRes.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response(null, { status: 404, ...NO_CACHE });
  }
}
