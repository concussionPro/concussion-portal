import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveClinicalAccess } from '@/lib/sst-trainer/access'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

/** GET /api/clinical-testing/access — the page gate. Returns the caller's
 *  Clinical Testing access door from their session (owner|course|sst|…),
 *  falling back to 'demo' for /demo/clinic prospects.
 *
 *  ORDER MATTERS: a REAL entitlement must win over a lingering demo cookie —
 *  the owner testing /demo/clinic lost his Clinical Testing sidebar item
 *  because 'demo' was returned before his session was even checked
 *  (nav regression, 2026-07-27). Demo is the floor, never a downgrade. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  const access = session
    ? await resolveClinicalAccess({ email: session.email, accessLevel: session.accessLevel })
    : 'locked'
  if (['owner', 'course', 'sst'].includes(access)) {
    return NextResponse.json({ access })
  }
  // Not entitled (or no session) — demo cookies open the demo door.
  if (
    req.cookies.get('demo_key')?.value === DEMO_KEY ||
    req.cookies.get('clinic_demo')?.value === CLINIC_DEMO_KEY
  ) {
    return NextResponse.json({ access: 'demo' })
  }
  return NextResponse.json({ access: session ? access : 'none' })
}
