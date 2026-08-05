import { NextRequest, NextResponse } from 'next/server'

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
    for (const name of ['session', 'demo_key', 'demo_org', 'clinic_demo']) {
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
