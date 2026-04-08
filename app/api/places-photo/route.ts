/**
 * GET /api/places-photo
 *
 * Proxies a Google Places restaurant photo. Supports both the new Places API
 * v1 photo resource names and legacy photo_reference strings so cached data
 * from either format continues to work.
 *
 * Query params (pick one):
 *   ?photoRef={resource_name}  — new format "places/{id}/photos/{ref}" (preferred)
 *   ?placeId={place_id}        — look up first photo via Place Details
 *   ?name={text}&lat=&lng=     — find place by name, then look up photo
 *
 * Returns image bytes with a 24h cache header, or 404 if no photo found /
 * key not configured.
 */

import { isRateLimited, getClientIp } from "@/lib/rateLimit";

const PHOTO_WINDOW_MS = 60_000;
const PHOTO_MAX_REQ   = 30;
const FETCH_TIMEOUT_MS = 10_000;

const PLACES_V1 = "https://places.googleapis.com/v1";

export async function GET(req: Request) {
  if (await isRateLimited(getClientIp(req), PHOTO_WINDOW_MS, PHOTO_MAX_REQ)) {
    return new Response("Too many requests", { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const photoRef = searchParams.get("photoRef");
  const placeId  = searchParams.get("placeId");
  const name     = searchParams.get("name") ?? "";
  const latRaw   = searchParams.get("lat");
  const lngRaw   = searchParams.get("lng");

  const NO_CACHE = { headers: { "Cache-Control": "no-store" } };

  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return new Response(null, { status: 404, ...NO_CACHE });
  if (!photoRef && !placeId && !name) return new Response(null, { status: 404, ...NO_CACHE });

  if ((photoRef && photoRef.length > 400) || (placeId && placeId.length > 300) || name.length > 200) {
    return new Response(null, { status: 400, ...NO_CACHE });
  }

  // Validate lat/lng
  let lat: string | null = null;
  let lng: string | null = null;
  if (latRaw && lngRaw) {
    const latNum = parseFloat(latRaw);
    const lngNum = parseFloat(lngRaw);
    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return new Response(null, { status: 400, ...NO_CACHE });
    }
    lat = String(latNum);
    lng = String(lngNum);
  }

  try {
    let resolvedPhotoRef: string | undefined = photoRef ?? undefined;

    // ── Resolve a photo resource name if we don't already have one ────────────
    if (!resolvedPhotoRef) {
      if (placeId) {
        // New Places API v1 — Place Details to get photo name
        const detailRes = await fetch(
          `${PLACES_V1}/places/${encodeURIComponent(placeId)}?fields=photos`,
          {
            headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": "photos" },
            next:    { revalidate: 3600 },
            signal:  AbortSignal.timeout(FETCH_TIMEOUT_MS),
          },
        );
        if (detailRes.ok) {
          const detail = await detailRes.json() as { photos?: { name: string }[] };
          resolvedPhotoRef = detail.photos?.[0]?.name;
        }
      } else if (name) {
        // Text Search to find place + photo
        const bias = lat && lng
          ? { circle: { center: { latitude: parseFloat(lat), longitude: parseFloat(lng) }, radius: 5000 } }
          : undefined;
        const body: Record<string, unknown> = { textQuery: name, maxResultCount: 1 };
        if (bias) body.locationBias = bias;

        const findRes = await fetch(`${PLACES_V1}/places:searchText`, {
          method:  "POST",
          headers: {
            "Content-Type":     "application/json",
            "X-Goog-Api-Key":   key,
            "X-Goog-FieldMask": "places.photos",
          },
          body:   JSON.stringify(body),
          next:   { revalidate: 3600 },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (findRes.ok) {
          const findData = await findRes.json() as { places?: { photos?: { name: string }[] }[] };
          resolvedPhotoRef = findData.places?.[0]?.photos?.[0]?.name;
        }
      }
    }

    if (!resolvedPhotoRef) return new Response(null, { status: 404, ...NO_CACHE });

    // ── Fetch the actual photo bytes ──────────────────────────────────────────
    // New API resource names start with "places/".
    // Legacy photo_reference strings are short alphanumeric tokens.
    const photoUrl = resolvedPhotoRef.startsWith("places/")
      ? `${PLACES_V1}/${resolvedPhotoRef}/media?maxWidthPx=600&key=${key}&skipHttpRedirect=true`
      : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=600&photo_reference=${resolvedPhotoRef}&key=${key}`;

    const photoRes = await fetch(photoUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });

    if (!photoRes.ok) return new Response(null, { status: 404, ...NO_CACHE });

    // New API with skipHttpRedirect=true returns JSON { photoUri: "..." }
    const contentType = photoRes.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const json = await photoRes.json() as { photoUri?: string };
      if (!json.photoUri) return new Response(null, { status: 404, ...NO_CACHE });
      const imgRes = await fetch(json.photoUri, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
      if (!imgRes.ok) return new Response(null, { status: 404, ...NO_CACHE });
      const VALID = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const imgType = VALID.find((t) => (imgRes.headers.get("Content-Type") ?? "").includes(t)) ?? "image/jpeg";
      return new Response(await imgRes.arrayBuffer(), {
        headers: {
          "Content-Type": imgType,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
        },
      });
    }

    // Legacy path — direct image bytes
    const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const imgContentType = VALID_IMAGE_TYPES.find((t) => contentType.includes(t)) ?? "image/jpeg";
    return new Response(await photoRes.arrayBuffer(), {
      headers: {
        "Content-Type": imgContentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
      },
    });
  } catch {
    return new Response(null, { status: 404, ...NO_CACHE });
  }
}
