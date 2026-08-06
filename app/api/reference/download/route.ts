/**
 * Access-gated delivery of the Clinical Reference Text.
 * User must (a) be logged in AND (b) have purchased the book, OR
 * have paid-course access (online-only / full-course) which includes
 * the reference as a bundled benefit.
 */

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { verifySessionToken } from '@/lib/jwt-session'
import { isBookOwner } from '@/lib/users'
import { BOOK_CONFIG } from '@/lib/book'

export const runtime = 'nodejs'

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

// `/reference/download` is NOT a route (verified live 2026-08-06: 404), so the
// post-login target below used to drop a successfully signed-in buyer on a 404.
// /complete-reference is the real reader page and carries its own middleware
// gate. Likewise /reference is a redirect-only stub to /pricing (the A$97
// bundle was retired) and `?purchase=required` is read by nothing — the
// unentitled branch goes straight to /pricing rather than paying a second hop.
export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login?redirect=/complete-reference', request.url))
  }

  const session = verifySessionToken(sessionToken)
  if (!session) {
    return NextResponse.redirect(new URL('/login?redirect=/complete-reference', request.url))
  }

  // Book comes bundled with paid course access.
  const hasAccess =
    session.accessLevel === 'online-only' ||
    session.accessLevel === 'full-course' ||
    (await isBookOwner(session.email))

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/pricing', request.url))
  }

  try {
    const filePath = path.join(process.cwd(), 'public', 'docs', BOOK_CONFIG.filename)
    const buffer = await fs.readFile(filePath)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${BOOK_CONFIG.filename}"`,
        'Cache-Control': 'private, max-age=0, must-revalidate',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (err) {
    console.error('Failed to read reference PDF:', err)
    return NextResponse.json({ error: 'Reference text temporarily unavailable.' }, { status: 500 })
  }
}
