/**
 * /sst-trainer — the SST Trainer PWA entry. PUBLIC route (launch architecture,
 * owner-approved 2026-07-02): anyone may load the app shell, but the CLINIC
 * CODE is the gate — the provocative graded test is unreachable without a
 * registered code (validated against the shared clinic registry via
 * /api/sst/validate-code; the onboarding flow inside the app enforces it —
 * that enforcement lives in SstOnboarding, owned by another workstream).
 * Regulatory line: the graded test is clinician-distributed.
 *
 * Renders the SAME real, wearable-paired app as /platform/app (Bluetooth /
 * camera HR via useLiveHr, the real engine, clinic sync + live in-session
 * monitoring). No login gate here any more — the old requireAiCourseAccess
 * gate is retired for this segment; /platform/* keeps its own gate. The PWA
 * manifest + service worker live in this segment's layout (which also keeps
 * the noindex metadata), so install-to-home-screen works straight off the
 * patient QR link /sst-trainer?clinic=CODE.
 */
import PlatformApp from '@/app/platform/app/page'

export default function SstTrainerPage() {
  return <PlatformApp />
}
