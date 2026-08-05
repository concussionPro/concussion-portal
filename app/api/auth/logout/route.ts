import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_COOKIE_NAME } from '@/lib/admin-session'

export async function POST(request: NextRequest) {
  try {
    // CSRF protection: verify request comes from same origin (or referer as fallback)
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const source = origin || referer
    if (source && appUrl) {
      try {
        const sourceHost = new URL(source).hostname
        const appHost = new URL(appUrl).hostname
        if (sourceHost !== appHost && !sourceHost.endsWith('.vercel.app')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      } catch {
        // Invalid URL — reject to prevent CSRF bypass
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // JWT sessions are stateless — just clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    })

    // Every identity-bearing cookie, not just `session`. The demo cookies are
    // identities in their own right: /api/auth/session falls back to them when
    // no session verifies, so clearing `session` alone left a browser that had
    // ever opened a /demo/* link logged in as a full-course reviewer (demo_key)
    // or a preview clinic prospect (clinic_demo) AFTER the user clicked Sign
    // out — for the 30-day cookie lifetime, on a shared clinic machine.
    //
    // `admin_session` IS CLEARED TOO (decided 2026-08-06, reversing the earlier
    // "don't sign Zac out of admin" convenience). The precondition for keeping
    // it was that no USER-FACING surface can act on admin authority — and that
    // is false in seven places: lib/course-access.ts, lib/ai-course/access.ts,
    // components/ai-course/CourseGate.tsx, components/ep-course/CrmCourseGate.tsx,
    // app/platform/app/layout.tsx, app/api/ep-course/modules/[id]/route.ts and
    // lib/rtp/gate.ts all admit a valid admin_session to PAID customer content.
    // So "Sign out" left the browser signed out of the portal while the paid
    // course surfaces stayed unlocked for the cookie's remaining life — the
    // exact shared-clinic-machine leak the demo cookies were added here to fix,
    // via a strictly more powerful credential.
    //
    // Workflow cost is bounded and one-directional: /api/admin/logout still
    // clears ONLY admin_session, so signing out of admin never signs Zac out of
    // the portal, and re-authing is one POST to /api/admin/login (the /admin
    // middleware redirect already carries ?redirect= back to where he was).
    for (const name of ['session', 'demo_key', 'demo_org', 'clinic_demo', ADMIN_COOKIE_NAME]) {
      response.cookies.delete(name)
    }

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
