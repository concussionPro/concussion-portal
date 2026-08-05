/**
 * Pre-launch access gate for the RTP Tracker API.
 *
 * It MUST admit exactly who the PAGE gate admits (requireAiCourseAccess /
 * checkServerAccess in components/ai-course/CourseGate.tsx). It previously
 * accepted admin or demo_key only, while the pages also admitted enrolled
 * users — so an enrolled clinician rendered the whole pathway, completed
 * consent and injury details, tapped "Open pathway" and got the raw string
 * "Not available" on every API call, forever.
 *
 * Allowed:
 *   - admin requests (admin_session cookie / x-admin-key / Bearer), or
 *   - the shared demo key (x-demo-key header or the demo_key cookie set by
 *     /demo/*) — the same pre-launch reviewer gate the EP / AI courses use.
 *     The ?demo= query param is intentionally NOT accepted (it leaks the key
 *     into logs / Referer). DEMO_KEY is empty (fail-closed) in production
 *     unless HEIDI_DEMO_KEY is set (see lib/demo-key.ts), or
 *   - an ENROLLED user (users.ai_course_enrolled) with a valid session.
 *
 * To launch publicly, relax this gate AND the page gate together.
 */

import { isAdminRequest } from '@/lib/require-admin'
import { DEMO_KEY } from '@/lib/demo-key'
import { verifySessionToken } from '@/lib/jwt-session'
import { isUserEnrolled } from '@/lib/ai-course/access'

function cookieValue(header: string | null, name: string): string | undefined {
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=')
    if (k === name) return decodeURIComponent(v.join('='))
  }
  return undefined
}

export async function isRtpRequestAllowed(request: Request): Promise<boolean> {
  if (isAdminRequest(request)) return true

  const cookieHeader = request.headers.get('cookie')

  const supplied = request.headers.get('x-demo-key') || cookieValue(cookieHeader, 'demo_key')
  if (supplied && supplied === DEMO_KEY) return true

  // Enrolled users — the door the page gate opens and this one didn't.
  const sessionCookie = cookieValue(cookieHeader, 'session')
  if (!sessionCookie) return false
  const session = verifySessionToken(sessionCookie)
  if (!session) return false
  // Fail closed on a DB error: no enrolment proof, no access.
  return await isUserEnrolled(session.email).catch(() => false)
}
