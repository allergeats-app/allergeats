/**
 * GET /api/places-photo?placeId={placeId}
 *               or
 *     /api/places-photo?name={restaurantName}&lat={lat}&lng={lng}
 *
 * Proxies a Google Places photo for a restaurant.
 * The API key stays server-side — the client never sees it.
 *
 * Preferred path: pass `placeId` (Google place_id) — resolves directly to
 *   Place Details → photo references, no name-matching ambiguity.
 * Fallback path:  pass `name` (+ optional lat/lng bias) — uses
 *   findplacefromtext, which can mis-match. Use only when place_id is absent.
 *
 * Returns image bytes with a 24h cache header, or 404 if no photo found /
 * key not configured.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get("placeId");
  const name    = searchParams.get("name") ?? "";
  const lat     = searchParams.get("lat");
  const lng     = searchParams.get("lng");

  const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return new Response(null, { status: 404, ...NO_CACHE });
  if (!placeId && !name) return new Response(null, { status: 404, ...NO_CACHE });

  // Cap param lengths to prevent oversized upstream requests
  if ((placeId && placeId.length > 300) || name.length > 200) {
    return new Response(null, { status: 400, ...NO_CACHE });
  }

  try {
    let photoRef: string | undefined;

    if (placeId) {
      // ── Preferred: Place Details by ID — unambiguous ─────────────────────
      const detailRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json` +
        `?place_id=${encodeURIComponent(placeId)}&fields=photos&key=${key}`,
        { next: { revalidate: 3600 } },
      );
      if (detailRes.ok) {
        const detail = await detailRes.json();
        photoRef = detail.result?.photos?.[0]?.photo_reference;
      }
    } else {
      // ── Fallback: text search with optional location bias ─────────────────
      const bias = lat && lng ? `&locationbias=circle:5000@${lat},${lng}` : "";
      const findRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json` +
        `?input=${encodeURIComponent(name)}&inputtype=textquery&fields=photos${bias}&key=${key}`,
        { next: { revalidate: 3600 } },
      );
      if (findRes.ok) {
        const findData = await findRes.json();
        photoRef = findData.candidates?.[0]?.photos?.[0]?.photo_reference;
      }
    }

    if (!photoRef) return new Response(null, { status: 404, ...NO_CACHE });

    // ── Fetch and proxy the actual photo bytes ────────────────────────────
    const photoRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/photo` +
      `?maxwidth=600&photo_reference=${photoRef}&key=${key}`,
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
