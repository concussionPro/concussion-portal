/**
 * Access-gated delivery of the Clinical Reference Text.
 * User must (a) be logged in AND (b) have purchased the book, OR
 * have paid-course access (online-only / full-course) which includes
 * the reference as a bundled benefit.
 *
 * After auth, redirect to /docs/CCM_Complete_Reference_2026.pdf — the
 * streamed private-docs handler. Do NOT buffer the ~5.8MB PDF here
 * (Vercel serverless ~4.5MB response cap → hang / fail).
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { isBookOwner } from '@/lib/users'
import { BOOK_CONFIG } from '@/lib/book'

export const runtime = 'nodejs'

function docsUrl(request: NextRequest) {
  return new URL(`/docs/${BOOK_CONFIG.filename}`, request.url)
}

// HEAD exists so the success page can poll for post-webhook access without
// downloading the whole PDF every poll. Returns the same auth outcome as GET
// but no body.
export async function HEAD(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) return new NextResponse(null, { status: 401 })

  const session = verifySessionToken(sessionToken)
  if (!session) return new NextResponse(null, { status: 401 })

  const hasAccess =
    session.accessLevel === 'online-only' ||
    session.accessLevel === 'full-course' ||
    (await isBookOwner(session.email))

  return new NextResponse(null, { status: hasAccess ? 200 : 403 })
}

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login?redirect=/complete-reference', request.url))
  }

  const session = verifySessionToken(sessionToken)
  if (!session) {
    return NextResponse.redirect(new URL('/login?redirect=/complete-reference', request.url))
  }

  const hasAccess =
    session.accessLevel === 'online-only' ||
    session.accessLevel === 'full-course' ||
    (await isBookOwner(session.email))

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/pricing', request.url))
  }

  return NextResponse.redirect(docsUrl(request))
}
