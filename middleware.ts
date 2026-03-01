import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block direct access to Complete Reference PDF
  if (pathname === '/docs/CCM_Complete_Reference_2026.pdf') {
    return NextResponse.json(
      { error: 'Direct access not allowed. Access via /complete-reference page.' },
      { status: 403 }
    )
  }

  // Block direct PDF access in /resources/ directory
  if (pathname.startsWith('/resources/') && pathname.endsWith('.pdf')) {
    return NextResponse.json(
      { error: 'Direct access not allowed. Access via /resources page.' },
      { status: 403 }
    )
  }

  // Admin API routes require x-admin-key header (except monitoring which handles its own)
  if (pathname.startsWith('/api/admin/')) {
    const adminKey = request.headers.get('x-admin-key')
    const authHeader = request.headers.get('authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const envKey = process.env.ADMIN_API_KEY
    if (envKey && adminKey !== envKey && bearerToken !== envKey) {
      return NextResponse.json(
        { error: 'Unauthorized \u2014 admin API key required' },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/docs/CCM_Complete_Reference_2026.pdf',
    '/resources/:path*.pdf',
    '/api/admin/:path*',
  ]
}
