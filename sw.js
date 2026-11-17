// Service worker: guarda todo en el teléfono para que la app funcione sin internet.
const CACHE = 'patentes-v1';
const ARCHIVOS = ['./', 'index.html', 'logo.png', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
const FUENTES = 'https://fonts.googleapis.com/css2?family=Oxygen+Mono&family=Montserrat:wght@500;600;700&display=swap';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(ARCHIVOS);
    // Descarga y guarda las tipografías (Oxygen Mono y Montserrat)
    try {
      const r = await fetch(FUENTES);
      const css = await r.clone().text();
      await c.put(FUENTES, r);
      const urls = [...css.matchAll(/url\((https:[^)]+)\)/g)].map(m => m[1]);
      await Promise.all(urls.map(u => fetch(u).then(res => c.put(u, res))));
    } catch (err) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(e.request, { ignoreSearch: e.request.mode === 'navigate' });
    if (hit) return hit;
    try {
      const res = await fetch(e.request);
      if (res.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes('fonts.g'))) c.put(e.request, res.clone());
      return res;
    } catch (err) {
      if (e.request.mode === 'navigate') return c.match('index.html');
      throw err;
    }
  })());
});
