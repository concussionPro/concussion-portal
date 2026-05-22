import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/ai-course/demo-access?key=<HEIDI_DEMO_KEY>
 *
 * Bootstrap endpoint for partner-pitch demo access. Validates the key
 * against HEIDI_DEMO_KEY env var, sets an httpOnly cookie (90-day TTL),
 * and redirects to /courses. The cookie lets the partner browse the
 * marketplace + course content without re-pasting the key.
 *
 * Scope: AI course surface only (handled by CourseGate / checkAiCourseAccess).
 * Does NOT unlock /api/admin/* routes. Safe to share with partners.
 *
 * To rotate access: change HEIDI_DEMO_KEY in Vercel env. Existing cookies
 * fail signature check on next page load.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const key = url.searchParams.get('key')
  const target = url.searchParams.get('to') || '/courses'

  // Only allow same-origin paths as redirect target
  const safeTarget = target.startsWith('/') && !target.startsWith('//') ? target : '/courses'

  if (!process.env.HEIDI_DEMO_KEY) {
    return NextResponse.json(
      { error: 'Demo access is not configured on this deployment.' },
      { status: 503 }
    )
  }
  if (!key || key !== process.env.HEIDI_DEMO_KEY) {
    return NextResponse.json({ error: 'Invalid demo key.' }, { status: 401 })
  }

  const response = NextResponse.redirect(new URL(safeTarget, request.url))
  response.cookies.set('demo_key', key, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90, // 90 days
  })
  return response
}
