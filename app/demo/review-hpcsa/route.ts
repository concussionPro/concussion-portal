/**
 * GET /demo/review-hpcsa — reviewer link for the hpcsa accreditation review of
 * "Concussion Rehabilitation for Exercise Physiologists" (CRM). Clone of
 * /demo/essa: sets the demo_key cookie server-side and drops the reviewer into
 * the private, gated, unlisted course. ESSA endorsement is disclosed as pending
 * on the course pages — do not represent it as held.
 */
import { NextRequest, NextResponse } from 'next/server'
import { DEMO_KEY } from '@/lib/demo-key'
import { isPrefetchRequest } from '@/lib/prefetch-guard'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  // A prefetch must never GRANT anything. Scrolling a public page into
  // view prefetches this link, and this route hands out access.
  // See lib/prefetch-guard.ts.
  if (isPrefetchRequest(request)) {
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
  }

  const dest = new URL('/ep-course/dashboard', request.url)
  const res = NextResponse.redirect(dest)
  res.cookies.set('demo_key', DEMO_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  })
  return res
}
