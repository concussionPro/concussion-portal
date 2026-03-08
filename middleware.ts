import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Edge-compatible constant-time string comparison
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

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
    if (!envKey) {
      return NextResponse.json(
        { error: 'Admin API not configured' },
        { status: 503 }
      )
    }
    const keyMatch = adminKey ? constantTimeEqual(adminKey, envKey) : false
    const bearerMatch = bearerToken ? constantTimeEqual(bearerToken, envKey) : false
    if (!keyMatch && !bearerMatch) {
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
