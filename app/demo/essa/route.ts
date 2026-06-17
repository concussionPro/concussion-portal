/**
 * GET /demo/essa — clean reviewer link for ESSA (Steve, PD Coordinator) to view
 * the private "Concussion Rehabilitation for Exercise Physiologists" course for
 * accreditation review. Mirrors /demo/heidi: reads the demo key server-side (never
 * in the URL), sets the demo_key cookie, and drops the reviewer into the course.
 * The course pages are gated by requireAiCourseAccess() + noindex + unlisted, so
 * this link is the only way in.
 */
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const dest = new URL('/ep-course/modules/1', request.url)
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
