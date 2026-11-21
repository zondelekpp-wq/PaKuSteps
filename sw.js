/* PaKuSteps service worker – caches the whole app so it works fully offline.
   When you change any file, bump VERSION so users get the update. */
const VERSION = '1.3.0';
const CACHE = 'pakusteps-' + VERSION;
const ASSETS = [
  './', './index.html', './app.js', './i18n.js', './family.js', './manifest.webmanifest',
  './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './qr.svg'
];

// Adds back any missing file (only when online). Several apps share this web address,
// and an older app may clear caches that are not its own – this keeps offline mode working.
function ensureCached() {
  return caches.open(CACHE).then(c => Promise.all(ASSETS.map(a =>
    c.match(a).then(hit => hit || c.add(a).catch(() => { }))
  ))).catch(() => { });
}

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pakusteps-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  // only this app's own files – other PaKu apps on the same address look after their own
  if (req.method !== 'GET' || !req.url.startsWith(self.registration.scope)) return;
  if (req.mode === 'navigate') {
    e.respondWith(caches.match('./index.html').then(r => r || fetch(req)));
    e.waitUntil(ensureCached());   // self-repair: re-download anything another app on this address may have removed
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
