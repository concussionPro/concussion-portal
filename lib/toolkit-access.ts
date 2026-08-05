/**
 * SERVER-side gate for the paid Hub Program toolkit surfaces
 * (/clinical-toolkit/templates, /outreach-kit, /admin-workflow) and the
 * Reference Repository dataset (/api/references).
 *
 * Same entitlement as /api/toolkit/download: accessLevel online-only /
 * full-course, or bundle (Reference + Toolkit) buyer. The partner-preview
 * demo_key cookie is honoured too — /api/auth/session synthesises a
 * full-course viewer for it, so the on-screen toolkit has always rendered
 * for partners reviewing the course.
 *
 * These pages gate on the SERVER so the template content only ever ships in
 * the RSC payload of an entitled request — a render-time client check leaves
 * the full paid dataset sitting in a public static chunk.
 */
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'
import { isBookOwner, getCurrentAccessLevel } from '@/lib/users'
import { isDemoUserId } from '@/lib/demo-session'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

export type ToolkitPageAccess = 'entitled' | 'locked' | 'unauthenticated'

export async function resolveToolkitPageAccess(): Promise<ToolkitPageAccess> {
  const cookieStore = await cookies()
  if (cookieStore.get('demo_key')?.value === DEMO_KEY) return 'entitled'
  // /demo/clinic prospects (clinic_demo cookie, NO session): the middleware
  // contract shows them the free-tier SELL screens — a /login bounce
  // mid-pitch kills the tour (2026-08-05 regression check #2).
  if (cookieStore.get('clinic_demo')?.value === CLINIC_DEMO_KEY) return 'locked'
  const sessionToken = cookieStore.get('session')?.value
  const session = sessionToken ? verifySessionToken(sessionToken) : null
  if (!session) {
    // Mirrors /api/auth/session's localhost dev-preview fallback: render the
    // locked screen for review instead of bouncing to /login.
    return process.env.NODE_ENV !== 'production' ? 'locked' : 'unauthenticated'
  }
  if (session.accessLevel === 'online-only' || session.accessLevel === 'full-course') {
    // Revocation re-check (2026-08-05 sweep #5): a 365-day session JWT
    // outlives a refund downgrade — a paid CLAIM is verified against the DB
    // row (cheap indexed select; free/demo paths never reach this branch's
    // DB read). Prefer the DB level when it disagrees downward; when no row
    // is found (DB blip) keep the JWT claim.
    const dbLevel = isDemoUserId(session.userId)
      ? null
      : await getCurrentAccessLevel(session.userId)
    if (!dbLevel || dbLevel === 'online-only' || dbLevel === 'full-course') {
      return 'entitled'
    }
    // DB says the paid level is gone — fall through to the book-owner door.
  }
  // FAIL CLOSED: a DB error must render the locked screen, not grant access
  // (and not 500 a whole page render).
  try {
    return (await isBookOwner(session.email)) ? 'entitled' : 'locked'
  } catch (err) {
    console.error('[toolkit-access] isBookOwner check failed:', err)
    return 'locked'
  }
}
