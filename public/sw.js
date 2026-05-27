// AllergEats Service Worker
// Strategy: cache-first for static assets, network-first for API/dynamic

const CACHE = "allergeats-v1";

const PRECACHE = [
  "/",
  "/saved",
  "/scan",
  "/manifest.json",
  "/logo 3d.png",
  "/icon-192.png",
  "/icon-512.png",
];

// ── Install: precache shell ──────────────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll(PRECACHE).catch(() => {/* non-fatal */})
    ).then(() => self.skipWaiting())
  );
});

// ── Activate: clear old caches ───────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin (e.g. Supabase, Anthropic)
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Network-first for API routes — fresh data matters
  if (url.pathname.startsWith("/api/")) {
    e.respondWith(
      fetch(request)
        .catch(() =>
          caches.match(request).then((cached) =>
            cached ?? new Response(
              JSON.stringify({ error: "offline" }),
              { status: 503, headers: { "Content-Type": "application/json" } }
            )
          )
        )
    );
    return;
  }

  // Cache-first for everything else (static assets, pages)
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((res) => {
        // Only cache successful same-origin responses
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      });
      return cached ?? network;
    })
  );
});
