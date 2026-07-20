import type { Metadata } from 'next'
import { requireAiCourseAccess } from '@/components/ai-course/CourseGate'
import CourseStreamsClient from '@/components/courses/CourseStreamsClient'

// ─────────────────────────────────────────────────────────────────────────────
// Dual-stream courses page — CCM (clinical) ⇆ CRM (exercise physiology) toggle.
// Reuses each stream's EXISTING landing body as-is; the toggle just switches.
//
// NOT PUBLIC until launch (owner directive): noindex + the same access gate the
// CRM landing uses, and not linked from any public nav. On ESSA approval, flip
// live by removing the gate line + linking it from nav; ESSA copy inside the CRM
// body flips automatically via CONFIG.FEATURES.ESSA_ACCREDITED.
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'Courses — Concussion Education Australia',
  robots: 'noindex, nofollow',
}

export default async function CourseStreamsPage({
  searchParams,
}: {
  searchParams: Promise<{ stream?: string }>
}) {
  // Pre-launch gate: admin / demo-key / enrolled only. Remove this line to go live.
  // TEMPORARILY DISABLED FOR LOCAL REVIEW ONLY — DO NOT COMMIT/PUSH.
  // await requireAiCourseAccess('/login')
  void requireAiCourseAccess
  const sp = await searchParams
  const initial = sp.stream === 'crm' || sp.stream === 'ep' ? 'crm' : 'ccm'
  return <CourseStreamsClient initial={initial} />
}
