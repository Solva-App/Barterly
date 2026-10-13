// Barterly service worker.
//  - App shell is precached so the app opens offline.
//  - Same-origin files: network-first (fresh code in dev), cache fallback offline.
//  - Fonts + photos: cache-first, so seen listings keep their pictures offline.
const VERSION = 'v1';
const SHELL = `barterly-shell-${VERSION}`;
const RUNTIME = `barterly-runtime-${VERSION}`;
const MAX_RUNTIME = 150;

const SHELL_FILES = [
  './', 'index.html', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'src/styles/tokens.css', 'src/styles/base.css', 'src/styles/components.css', 'src/styles/screens.css', 'src/styles/motion.css',
  'src/js/main.js', 'src/js/router.js', 'src/js/store.js', 'src/js/theme.js', 'src/js/actions.js', 'src/js/util.js', 'src/js/icons.js', 'src/js/config.js',
  'src/js/data/mock.js',
  'src/js/services/api.js', 'src/js/services/db.js', 'src/js/services/auth.js', 'src/js/services/listings.js', 'src/js/services/chats.js', 'src/js/services/profile.js',
  'src/js/components/ui.js', 'src/js/components/sheet.js', 'src/js/components/toast.js', 'src/js/components/fx.js', 'src/js/components/tabbar.js',
  'src/js/components/flows.js', 'src/js/components/listing-list.js', 'src/js/components/verify.js',
  'src/js/pages/auth.js', 'src/js/pages/home.js', 'src/js/pages/explore.js', 'src/js/pages/detail.js', 'src/js/pages/post.js',
  'src/js/pages/chats.js', 'src/js/pages/thread.js', 'src/js/pages/profile.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(SHELL_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![SHELL, RUNTIME].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_RUNTIME) await Promise.all(keys.slice(0, keys.length - MAX_RUNTIME).map(k => cache.delete(k)));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then(res => { if (res.ok) caches.open(SHELL).then(c => c.put(req, res.clone())); return res; })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())))
    );
    return;
  }

  const isAsset = req.destination === 'image' || req.destination === 'font' || req.destination === 'style' || /fonts\.(googleapis|gstatic)\.com/.test(url.host);
  if (!isAsset) return;
  e.respondWith(
    caches.open(RUNTIME).then(async cache => {
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') { cache.put(req, res.clone()); trim(cache); }
        return res;
      } catch { return hit || Response.error(); }
    })
  );
});
