import { NextRequest, NextResponse } from 'next/server'
import { CLINIC_DEMO_KEY } from '@/lib/demo-key'
import { createJWTSession, verifySessionToken } from '@/lib/jwt-session'
import { CLINIC_DEMO_USER_ID, CLINIC_DEMO_EMAIL } from '@/lib/demo-session'

/**
 * /demo/clinic — the supplier-prospect demo entry (the /acc CTA).
 *
 * Lands the visitor in the REAL portal at the Clinical Testing tab (owner
 * 2026-07-27: "let them browse and use the tools with everything else locked
 * out but viewable"), by setting TWO cookies:
 *
 *  1. `clinic_demo` — the demo marker: DEMO00 workspace, demo access door,
 *     middleware pass.
 *  2. `session` — a REAL preview-level JWT for the synthetic demo identity.
 *     This is the systemic fix for the endless 401 whack-a-mole: every
 *     session-authed READ (module content, free courses, notes lists,
 *     progress) works exactly as for any free-tier user, portal-wide,
 *     including surfaces built later. Writes are refused by the
 *     isDemoUserId guard in every mutation route (lib/demo-session.ts).
 *
 * A visitor with a REAL valid session keeps it — we never downgrade a
 * logged-in user to the demo identity.
 *
 * NEVER the reviewer DEMO_KEY — that cookie opens paid course content and
 * is not for prospects.
 */
export function GET(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/clinical-testing', req.url))
  const maxAge = 30 * 24 * 60 * 60
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  }
  res.cookies.set('clinic_demo', CLINIC_DEMO_KEY, cookieOpts)

  const existing = req.cookies.get('session')?.value
  const hasRealSession = existing ? verifySessionToken(existing) !== null : false
  if (!hasRealSession) {
    res.cookies.set(
      'session',
      createJWTSession(CLINIC_DEMO_USER_ID, CLINIC_DEMO_EMAIL, 'Clinic Demo', 'preview', false),
      cookieOpts,
    )
  }
  return res
}
