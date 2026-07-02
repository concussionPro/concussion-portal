/**
 * /sst-trainer — the SST Trainer PWA entry.
 *
 * Renders the SAME real, wearable-paired app as /platform/app (Bluetooth /
 * camera HR via useLiveHr, the real engine, clinic sync + live in-session
 * monitoring). NOT PUBLIC YET (owner decision 2026-07-02 — still building):
 * access requires the demo cookie (/demo/sst link), an enrolled user, or an
 * admin session — the same gate as /platform/app. The previous bare re-export
 * bypassed the platform layout's gate (layouts belong to the route segment,
 * not the component), which made the provocative graded test anonymously
 * runnable. The PWA manifest + service worker stay in this segment's layout so
 * install-to-home-screen keeps working for gated users; the QR-card flow goes
 * via /demo/sst, which sets the cookie first.
 */
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import PlatformApp from '@/app/platform/app/page'

export default async function SstTrainerPage() {
  await requireAiCourseAccess('/login')
  return <PlatformApp />
}
