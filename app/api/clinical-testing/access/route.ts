import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveClinicalAccess } from '@/lib/sst-trainer/access'
import { DEMO_KEY, CLINIC_DEMO_KEY } from '@/lib/demo-key'

/** GET /api/clinical-testing/access — the page gate. Returns the caller's
 *  Clinical Testing access door (owner|course|sst|none) from their session. */
export async function GET(req: NextRequest) {
  // Demo viewers (/demo/clinic — the pitch surface) get the suite in demo mode.
  if (
    req.cookies.get('demo_key')?.value === DEMO_KEY ||
    req.cookies.get('clinic_demo')?.value === CLINIC_DEMO_KEY
  ) {
    return NextResponse.json({ access: 'sst', demo: true })
  }
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session) return NextResponse.json({ access: 'none' })
  const access = await resolveClinicalAccess({ email: session.email, accessLevel: session.accessLevel })
  return NextResponse.json({ access })
}
