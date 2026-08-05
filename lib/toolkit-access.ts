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
import { isBookOwner } from '@/lib/users'
import { DEMO_KEY } from '@/lib/demo-key'

export type ToolkitPageAccess = 'entitled' | 'locked' | 'unauthenticated'

export async function resolveToolkitPageAccess(): Promise<ToolkitPageAccess> {
  const cookieStore = await cookies()
  if (cookieStore.get('demo_key')?.value === DEMO_KEY) return 'entitled'
  const sessionToken = cookieStore.get('session')?.value
  const session = sessionToken ? verifySessionToken(sessionToken) : null
  if (!session) {
    // Mirrors /api/auth/session's localhost dev-preview fallback: render the
    // locked screen for review instead of bouncing to /login.
    return process.env.NODE_ENV !== 'production' ? 'locked' : 'unauthenticated'
  }
  if (session.accessLevel === 'online-only' || session.accessLevel === 'full-course') {
    return 'entitled'
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
