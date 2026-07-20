import type { Metadata } from 'next'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CourseStreamsClient from '@/components/courses/CourseStreamsClient'
import { CONFIG } from '@/lib/config'

// ─────────────────────────────────────────────────────────────────────────────
// Dual-stream courses page — CCM (clinical) ⇆ CRM (exercise physiology) toggle.
// Reuses each stream's EXISTING landing body as-is; the toggle just switches.
//
// NOT PUBLIC until launch (owner directive): noindex + the same access gate the
// CRM landing uses. EVERYTHING here — robots, the access gate, the ESSA copy in
// the CRM body — is driven by CONFIG.FEATURES.ESSA_ACCREDITED, so approval day
// is one flag flip. Nothing on this page should be hand-edited to go live.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Courses — Concussion Education Australia',
  robots: CONFIG.FEATURES.ESSA_ACCREDITED ? 'index, follow' : 'noindex, nofollow',
}

export default async function CourseStreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>
}) {
  // Pre-launch gate: admin / demo-key / enrolled only. Opens automatically on
  // ESSA approval — do NOT hand-remove this line (that was how the gate came to
  // ship commented-out and left the CRM pricing body publicly reachable).
  if (!CONFIG.FEATURES.ESSA_ACCREDITED) await requireAiCourseAccess('/login')
  const sp = await searchParams
  const initial = sp.stream === 'crm' || sp.stream === 'ep' ? 'crm' : 'ccm'
  return <CourseStreamsClient initial={initial} />
}
