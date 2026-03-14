// ── Perfectly Flawed Leadership — Service Worker ─────────────────────────────
// Caches the app shell so it loads instantly and works offline.
// Never caches Firebase, Firestore, or Anthropic API calls.

const CACHE_NAME  = "pfl-v2";
const SHELL_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pre-cache the shell ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

// ── Activate: remove stale caches ────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // ❶ Always bypass cache for live API calls
  const BYPASS = [
    "api.anthropic.com",       // AI devotion & advisor
    "firestore.googleapis.com",// Firestore reads/writes
    "firebase.googleapis.com", // Firebase auth tokens
    "identitytoolkit.googleapis.com",
    "securetoken.googleapis.com",
    "accounts.google.com",
  ];
  if (BYPASS.some((h) => url.hostname.includes(h))) {
    event.respondWith(fetch(request));
    return;
  }

  // ❷ Cache-first for Google Fonts (rarely change)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }

  // ❸ Network-first for HTML navigation — fall back to index.html (SPA)
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // ❹ Cache-first for static assets (JS bundles, CSS, images)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (!res || res.status !== 200 || res.type === "opaque") return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        return res;
      });
    })
  );
});

// ── Push notifications (optional — wire up later) ─────────────────────────────
self.addEventListener("push", (event) => {
  const data    = event.data?.json() ?? {};
  const title   = data.title || "Perfectly Flawed Leadership";
  const options = {
    body:    data.body || "You have a new notification",
    icon:    "/icons/icon-192.png",
    badge:   "/icons/icon-96.png",
    vibrate: [100, 50, 100],
    data:    { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});