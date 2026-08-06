/**
 * GET /demo/embodia — full-catalogue review access for Embodia.
 *
 * Same mechanics as the accreditation reviewer links (/demo/essa,
 * /demo/review-acsm and friends): sets the demo_key cookie server-side and
 * lands the visitor on the course catalogue. The key NEVER appears in the URL,
 * so it cannot leak into access logs, Referer headers, or a forwarded link
 * preview.
 *
 * WHAT THIS OPENS. Everything in the catalogue at full-course scope:
 *   CCM (8 modules) · CRM / EP course (8 modules) · SCAT6 Mastery ·
 *   AI in Clinical Practice · Vagus Nerve · RTP · the Clinical Toolkit ·
 *   the complete reference and citation library · Clinical Testing (SST
 *   Trainer + Baseline)
 *
 * CCM needed a gate change to be included — every other course already
 * honoured demo_key, but the flagship did not, so reviewers were getting the
 * whole catalogue EXCEPT the thing it is built around. Measured before the
 * change: CRM module 1 served 6,711 characters to a reviewer while CCM modules
 * 1-8 served an 800-character shell.
 *
 * EXPOSURE, stated plainly because this is a paid catalogue:
 *  - This is the SAME shared reviewer key the accreditation bodies use. Anyone
 *    holding this link has the same access, and it does not expire.
 *  - To revoke: rotate DEMO_KEY in lib/demo-key.ts, or set HEIDI_DEMO_KEY in
 *    Vercel. That kills THIS link and every accreditation reviewer link at the
 *    same time — they share one key by design, because seventeen gates across
 *    twelve files accept it and a second key means any gate missed becomes a
 *    locked page for the partner.
 *  - Demo identities never write: no progress is recorded, no certificate can
 *    be issued, and nothing a reviewer does touches a real account.
 */
import { NextRequest, NextResponse } from 'next/server'
import { DEMO_KEY } from '@/lib/demo-key'
import { isPrefetchRequest } from '@/lib/prefetch-guard'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // A prefetch must never GRANT anything — scrolling a link into view would
  // otherwise hand out catalogue access. See lib/prefetch-guard.ts.
  if (isPrefetchRequest(request)) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }

  // The catalogue, so the reviewer sees the full offering and chooses where to
  // start, rather than being dropped inside one course.
  const res = NextResponse.redirect(new URL('/courses', request.url))
  res.cookies.set('demo_key', DEMO_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
  return res
}
