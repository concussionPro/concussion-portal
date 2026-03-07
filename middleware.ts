import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// PDFs in /docs/ that are freely accessible (clinical assessment tools)
const PUBLIC_DOCS = new Set([
  '/docs/SCAT6_Fillable.pdf',
  '/docs/SCOAT6_Fillable.pdf',
])

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block direct access to paid PDFs in /docs/ (except SCAT6/SCOAT6 forms)
  if (pathname.startsWith('/docs/') && pathname.endsWith('.pdf') && !PUBLIC_DOCS.has(pathname)) {
    return NextResponse.json(
      { error: 'Direct access not allowed. Please download via the Clinical Toolkit.' },
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
    '/docs/:path*.pdf',
    '/resources/:path*.pdf',
    '/api/admin/:path*',
  ]
}
