// Service worker: maakt de Oceaanquiz installeerbaar en offline speelbaar.
const VERSION = "v6";
const SHELL = `oq-shell-${VERSION}`;
const MEDIA = "oq-media"; // foto's en kaarten veranderen zelden: blijft bewaard tussen versies

const SHELL_FILES = [
  "./", "index.html", "style.css", "app.js", "data.js", "manifest.webmanifest",
  "fonts/inter.woff2", "fonts/jakarta.woff2",
  "maps/_base-light.png", "maps/_base-dark.png",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith("oq-shell-") && k !== SHELL).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const path = new URL(req.url).pathname;

  // Foto's en kaarten: eerst uit de cache, anders ophalen en bewaren
  if (/\/(images|maps)\//.test(path)) {
    event.respondWith(
      caches.open(MEDIA).then(async cache => {
        const hit = await cache.match(req, { ignoreSearch: true });
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) await cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // App zelf: netwerk eerst (zodat updates binnenkomen), cache als je offline bent
  event.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(async () =>
        (await caches.match(req, { ignoreSearch: true })) ||
        (req.mode === "navigate" ? caches.match("index.html") : Response.error()))
  );
});
