import { NextRequest, NextResponse } from 'next/server'
import { CLINIC_DEMO_KEY } from '@/lib/demo-key'
import { isPrefetchRequest } from '@/lib/prefetch-guard'
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
/**
 * A Next.js <Link> PREFETCHES its target as soon as it renders. This route is a
 * GET with two side effects — it mints an identity and it writes the
 * demo_tour_start analytics row — so every <Link href="/demo/clinic"> fired both
 * of them without anyone clicking anything.
 *
 * Measured 2026-08-06: loading the PUBLIC patient entry /sst-trainer (74
 * sessions/90d, the PWA install target, three such links on the page) left the
 * browser holding `clinic_demo` + a `session` cookie for the synthetic Clinic
 * Demo user. A patient who opened the trainer was signed into the portal as a
 * prospect demo, and demo_tour_start — THE conversion signal for the ACC
 * outreach — counted them.
 *
 * The links now carry prefetch={false}; this is the belt-and-braces so a link
 * added later cannot reintroduce it. A real click is a top-level navigation and
 * carries neither header.
 */
// Uses the SHARED helper rather than a local copy. This route had its own,
// and that copy did not check `sec-purpose` — so a Speculation Rules prefetch
// still reached it and was measured granting 2 cookies in production on
// 2026-08-06, on the highest-traffic demo route in the app. Nine sibling routes
// were fixed with the shared helper while this one was skipped precisely
// BECAUSE it already looked guarded. One implementation, one place to fix.

export async function GET(req: NextRequest) {
  if (isPrefetchRequest(req)) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }
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
