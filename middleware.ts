import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Block direct access to Complete Reference PDF
  // Must use API route which checks authentication
  if (pathname === '/docs/CCM_Complete_Reference_2026.pdf') {
    return NextResponse.json(
      { error: 'Direct access not allowed. Access via /complete-reference page.' },
      { status: 403 }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/docs/CCM_Complete_Reference_2026.pdf'
  ]
}
