// HalfWay – service worker: aplikacja otwiera się też bez internetu.
const VERSION = 'halfway-v9';
const SHELL = [
  './', 'index.html', 'styles.css', 'app.js', 'config.js', 'vendor/supabase.js',
  'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/favicon.png',
  'icons/sports/pompki.png', 'icons/sports/przysiady.png', 'icons/sports/koszykowka.png', 'icons/sports/pilka.png', 'icons/sports/rower.png', 'icons/sports/plywanie.png', 'icons/sports/ogrod.png', 'icons/sports/spacer.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // dane zawsze z sieci

  if (url.origin === self.location.origin) {
    // network-first: nowe wersje docierają od razu, offline działa z cache
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
    );
    return;
  }

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res;
      }))
    );
  }
});
