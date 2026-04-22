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

export async function GET(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login?redirect=/reference/download', request.url))
  }

  const session = verifySessionToken(sessionToken)
  if (!session) {
    return NextResponse.redirect(new URL('/login?redirect=/reference/download', request.url))
  }

  // Book comes bundled with paid course access.
  const hasAccess =
    session.accessLevel === 'online-only' ||
    session.accessLevel === 'full-course' ||
    (await isBookOwner(session.email))

  if (!hasAccess) {
    return NextResponse.redirect(new URL('/reference?purchase=required', request.url))
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
