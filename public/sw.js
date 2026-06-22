/*
 * SST Trainer service worker.
 *
 * Deliberately minimal: a no-op fetch passthrough. Its only job is to satisfy
 * the PWA installability criteria (a registered SW with a fetch handler), so the
 * app can be installed to a phone home screen and launched standalone. There is
 * NO offline caching of clinical screens here on purpose — heart-rate pairing
 * (Web Bluetooth / camera) and the engine need a live, secure context, and we
 * never want a stale cached build serving a recovering patient.
 *
 * If real offline support is added later, add a cache strategy here and bump the
 * CACHE version.
 */
const SW_VERSION = 'sst-v1'

self.addEventListener('install', () => {
  // Activate this SW immediately rather than waiting for old tabs to close.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  // Take control of open clients so the install prompt resolves promptly.
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // No-op passthrough: let the network handle every request normally.
  return
})
