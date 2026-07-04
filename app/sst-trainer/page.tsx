/**
 * /sst-trainer — the SST Trainer entry. PUBLIC route.
 *
 * NEW visitors get the preseason-style animated landing (SstLanding, with the
 * Loom-style walkthrough demo); anyone already in a flow goes straight to the
 * real app — QR deep links (?clinic=CODE), the landing CTA (?start=1),
 * returning patients with persisted state, and installed PWAs / the native
 * shell. That decision lives in SstEntry (client-side — it reads
 * localStorage).
 *
 * SELF-GUIDED IS ON (owner decision 2026-07-04): the app is fully usable
 * without a clinic code — a code links a clinician and turns on sync, it is
 * never a wall. The PWA manifest + service worker live in this segment's
 * layout (which keeps the noindex metadata), so install-to-home-screen works
 * straight off the patient QR link /sst-trainer?clinic=CODE.
 */
import SstEntry from '@/components/platform/SstEntry'

export default function SstTrainerPage() {
  return <SstEntry />
}
