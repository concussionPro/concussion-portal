import { NextRequest, NextResponse } from 'next/server'
import { CLINIC_DEMO_KEY } from '@/lib/demo-key'
import { createJWTSession, verifySessionToken } from '@/lib/jwt-session'
import { CLINIC_DEMO_USER_ID, CLINIC_DEMO_EMAIL } from '@/lib/demo-session'
import { sql } from '@/lib/db'

/** Server-side tour-entry event — the /acc → demo conversion signal for the
 *  ACC outreach. Client tracking can't see this redirect, and the referrer
 *  header here is the only place we learn WHERE the prospect came from. */
const SCANNER_UA = /bot|crawler|spider|headless|safelinks|mimecast|proofpoint|barracuda|googleimageproxy|expanse|urlscan|preview|scan/i

async function logTourStart(req: NextRequest) {
  try {
    // Email-security sandboxes follow the tour link from cold sends — a
    // 'tour' that fires within the scanner's detonation is not a prospect.
    if (SCANNER_UA.test(req.headers.get('user-agent') || '')) return
    await sql`
      INSERT INTO analytics_events
        (event_type, event_data, session_id, timestamp_ms, user_agent, referrer, path, search, ip, country)
      VALUES
        ('demo_tour_start', '{}'::jsonb, ${'server_demo_' + Date.now()}, ${Date.now()},
         ${req.headers.get('user-agent') || ''}, ${req.headers.get('referer') || null},
         '/demo/clinic', ${req.nextUrl.search || null},
         ${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null},
         ${req.headers.get('x-vercel-ip-country') || null})
    `
  } catch (err) {
    console.error('[demo/clinic] tour-start log failed:', err)
  }
}

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
export async function GET(req: NextRequest) {
  await logTourStart(req)
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
