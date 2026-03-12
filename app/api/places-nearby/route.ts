/**
 * POST /api/places-nearby
 *
 * Server-side proxy for Google Places Nearby Search (legacy API).
 * The API key stays server-side — the client never sees it.
 *
 * Request body: { lat: number; lng: number; radiusMeters: number }
 * Response:     { places: PlaceResult[] }  (simplified — only fields we use)
 *
 * Returns 200 with { places: [] } when the key is not configured, so the client
 * can detect "no key" vs "network error" and fall back gracefully.
 * Returns 500 only on genuine upstream failures.
 */

export type PlaceResult = {
  placeId:   string;
  name:      string;
  lat:       number;
  lng:       number;
  /** Formatted address (vicinity in Places API) */
  address:   string;
  /** Primary type string from Google, e.g. "restaurant", "cafe", "fast_food" */
  types:     string[];
  phone?:    string;
  website?:  string;
  /** First photo reference (pass to /api/places-photo) */
  photoRef?: string;
};

type NearbySearchResult = {
  place_id: string;
  name:     string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  types:    string[];
  photos?:  { photo_reference: string }[];
};

export async function POST(req: Request) {
  const key = process.env.GOOGLE_PLACES_API_KEY;

  // Return empty — client interprets as "no key, fall back to OSM"
  if (!key) {
    return Response.json({ places: [] });
  }

  let lat: number, lng: number, radiusMeters: number;
  try {
    ({ lat, lng, radiusMeters } = await req.json() as { lat: number; lng: number; radiusMeters: number });
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&radius=${Math.round(radiusMeters)}` +
      `&type=restaurant` +
      `&key=${key}`;

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return new Response("Places API error", { status: 502 });
    }

    const data = await res.json() as { status: string; results: NearbySearchResult[] };

    // ZERO_RESULTS is a valid success state
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return new Response(`Places API status: ${data.status}`, { status: 502 });
    }

    const places: PlaceResult[] = (data.results ?? []).map((r) => ({
      placeId:  r.place_id,
      name:     r.name,
      lat:      r.geometry.location.lat,
      lng:      r.geometry.location.lng,
      address:  r.vicinity,
      types:    r.types ?? [],
      photoRef: r.photos?.[0]?.photo_reference,
    }));

    return Response.json({ places });
  } catch (err) {
    console.error("[places-nearby]", err);
    return new Response("Internal error", { status: 500 });
  }
}
