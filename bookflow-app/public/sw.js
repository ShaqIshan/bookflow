/* BookFlow service worker — offline-friendly caching for the static export.
   Scope-aware so it works at the domain root (Netlify) and under a
   subpath (GitHub Pages). */
const CACHE = "bookflow-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  const scope = self.registration.scope;
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([scope, scope + "manifest.webmanifest"])),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const scope = self.registration.scope;
  if (!request.url.startsWith(scope)) return;

  // Hashed build assets never change — cache-first
  if (
    request.url.startsWith(scope + "_next/static/") ||
    request.url.startsWith(scope + "icons/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  // Pages — network-first, cached fallback for offline
  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return res;
      })
      .catch(() => caches.match(request).then((hit) => hit || caches.match(scope))),
  );
});
