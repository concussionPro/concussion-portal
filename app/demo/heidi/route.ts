/**
 * GET /demo/heidi — clean partner-demo entry point (Zac 2026-06-17).
 *
 * The original Heidi pitch link was
 *   /api/ai-course/demo-access?key=<random-string>
 * — a phishing-shaped URL (an /api/ path + a ?key= random token) that a
 * security-aware partner like Heidi Health won't click (mail security flags it,
 * or the recipient distrusts it). Result: 0 clicks, 0 demo acceptances.
 *
 * This is a clean, human-readable path — `portal.concussion-education-australia.com/demo/heidi`
 * — that reads HEIDI_DEMO_KEY server-side (the key NEVER appears in the URL),
 * sets the demo_key cookie, and drops them straight into the course. Reads like
 * a real page, not a tracking link. The course is marketing/preview content and
 * the obscure path is the gate, consistent with the keyless /p/<slug> portals.
 *
 * Identical cookie mechanics to /api/ai-course/demo-access so the existing
 * 'heidi user' analytics (demo acceptances + activity) light up unchanged.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const dest = new URL('/courses', request.url)
  const key = process.env.HEIDI_DEMO_KEY
  if (!key) return NextResponse.redirect(dest)

  const res = NextResponse.redirect(dest)
  res.cookies.set('demo_key', key, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 days
  })
  return res
}
