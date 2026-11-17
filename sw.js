// Offline support: keeps the app itself available without network.
// Data goes to Firebase (never cached here); Firestore keeps unsaved changes on the device itself.
const CACHE = "lab-duties-v4";
const FB = "https://www.gstatic.com/firebasejs/10.12.2/";
const SHELL = ["./", "index.html", "config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  FB + "firebase-app-compat.js", FB + "firebase-auth-compat.js", FB + "firebase-firestore-compat.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const isShell = url.origin === location.origin || url.href.startsWith(FB);
  if (!isShell) return; // Google sign-in and the database always go to the network
  // network first, so updates (e.g. config.js) arrive; cached copy when offline
  e.respondWith(
    // "no-cache": always ask GitHub for the newest version (skips the browser's 10-minute cache)
    fetch(e.request, url.origin === location.origin ? { cache: "no-cache" } : undefined).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
