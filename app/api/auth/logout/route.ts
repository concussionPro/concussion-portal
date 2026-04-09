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

    response.cookies.delete('session')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
