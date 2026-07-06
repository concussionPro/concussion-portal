import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { resolveClinicalAccess } from '@/lib/sst-trainer/access'

/** GET /api/clinical-testing/access — the page gate. Returns the caller's
 *  Clinical Testing access door (owner|course|sst|none) from their session. */
export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value
  const session = token ? verifySessionToken(token) : null
  if (!session) return NextResponse.json({ access: 'none' })
  const access = await resolveClinicalAccess({ email: session.email, accessLevel: session.accessLevel })
  return NextResponse.json({ access })
}
