/*
 * SST Trainer service worker.
 *
 * A minimal, REAL offline layer (upgraded from the old no-op passthrough):
 *  - Precache the app shell route (/sst-trainer) + manifest + icons at install.
 *  - NETWORK-FIRST with cache fallback for navigations into /sst-trainer, so an
 *    installed app still opens offline to the last-deployed shell. The clinical
 *    data itself lives in localStorage (sst:v1) — the shell just has to boot.
 *  - Everything else passes straight through to the network: heart-rate pairing
 *    (Web Bluetooth) and clinic syncs need a live connection, and we never want
 *    a stale cached API response serving a recovering patient.
 *
 * NATIVE SHELL BYPASS: inside the Capacitor app (iOS / Android) the same origin
 * is loaded via server.url, so this SW would otherwise register and intercept.
 * That's harmful there — a cached shell can go stale against the live build and
 * clash with the native bridge injection. The native app boots
 * `/sst-trainer?source=app`, so the moment we see that marker we flip to a pure
 * passthrough (no caching, no shell interception) for the life of the worker,
 * and remember it across SW restarts via a cache sentinel. Plain web installs
 * never carry `source=app`, so they keep full PWA/offline behaviour.
 *
 * Bump CACHE on any strategy change so old caches are dropped at activate.
 */
const CACHE = 'sst-v2'
const APP_SHELL = '/sst-trainer'
// Cache sentinel + in-memory flag marking this a native (Capacitor) shell.
const NATIVE_FLAG = '/__sst_native_shell__'
let nativeShell = false
const PRECACHE = [
  APP_SHELL,
  '/sst.webmanifest',
  '/sst-icon.svg',
  '/sst-icon-192.png',
  '/sst-icon-512.png',
  '/sst-icon-512-maskable.png',
  '/sst-apple-touch-180.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // best-effort: a single missing icon must not fail the whole install
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      // Activate this SW immediately rather than waiting for old tabs to close.
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      // Rehydrate the native-shell flag: the SW is killed/restarted often and
      // loses in-memory state, so re-read the persisted sentinel on activate.
      .then(() => caches.open(CACHE).then((cache) => cache.match(NATIVE_FLAG)))
      .then((hit) => {
        if (hit) nativeShell = true
      })
      .catch(() => {})
      // Take control of open clients so the install prompt resolves promptly.
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Native (Capacitor) shell → total passthrough. The app boots
  // /sst-trainer?source=app; the first request carrying that marker flips the
  // worker into no-op mode (and persists a sentinel so it survives restarts),
  // so the WebView always gets the fresh remote build + native bridge and this
  // SW never caches or serves a shell there.
  if (url.searchParams.get('source') === 'app') {
    nativeShell = true
    caches.open(CACHE).then((cache) => cache.put(NATIVE_FLAG, new Response('1'))).catch(() => {})
  }
  if (nativeShell) return // default browser handling — no caching, no interception

  // Navigations into the app: network-first (always prefer the live build),
  // falling back to the cached shell when offline.
  if (req.mode === 'navigate' && url.pathname.startsWith(APP_SHELL)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone()
            caches.open(CACHE).then((cache) => cache.put(APP_SHELL, copy)).catch(() => {})
          }
          return res
        })
        .catch(() =>
          caches.match(req).then((hit) => hit || caches.match(APP_SHELL)).then(
            (hit) =>
              hit ||
              new Response('Offline — reconnect to open the SST Trainer.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain' },
              }),
          ),
        ),
    )
    return
  }

  // Precached static assets (manifest + icons): cache-first, refresh in background.
  if (PRECACHE.includes(url.pathname) && url.pathname !== APP_SHELL) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const refresh = fetch(req)
          .then((res) => {
            if (res && res.ok) {
              const copy = res.clone()
              caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {})
            }
            return res
          })
          .catch(() => hit)
        return hit || refresh
      }),
    )
  }
  // Everything else: straight to the network (default browser handling).
})
