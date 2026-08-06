/**
 * GET /demo/essa-ai — clean reviewer link for ESSA (Steve, PD Coordinator) to view
 * the "AI in Clinical Practice" course for accreditation review. Mirrors /demo/essa
 * (the EP-course reviewer link): reads the demo key server-side (never in the URL),
 * sets the demo_key cookie, and drops the reviewer into the AI course. The course
 * pages are gated by requireAiCourseAccess() + noindex + unlisted, so this link is
 * the only way in.
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

  const dest = new URL('/courses/ai-in-clinical-practice/module-1-compliance', request.url)

  const res = NextResponse.redirect(dest)
  res.cookies.set('demo_key', DEMO_KEY, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 days
  })
  return res
}
