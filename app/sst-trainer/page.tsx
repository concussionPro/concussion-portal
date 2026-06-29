/**
 * /sst-trainer — the PUBLIC, installable SST Trainer PWA.
 *
 * Renders the SAME real, wearable-paired app as /platform/app (Bluetooth / camera
 * HR via useLiveHr, the real engine, clinic sync + live in-session monitoring) —
 * NOT the old manual scaffold. This route is just the public, installable entry:
 * the PWA manifest + service worker live in this segment's layout, and it's
 * ungated so a patient can open it from the QR card / clinic link without the
 * /demo/sst gate. One app, one codebase.
 */
export { default } from '@/app/platform/app/page'
