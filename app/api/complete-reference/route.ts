import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'
import { BOOK_CONFIG } from '@/lib/book'

/**
 * Legacy alias — auth then redirect to streamed /docs/ handler.
 * Never buffer the ~5.8MB PDF through this serverless route.
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to access this resource.' },
        { status: 401 },
      )
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 },
      )
    }

    if (
      !sessionData.accessLevel ||
      (sessionData.accessLevel !== 'online-only' && sessionData.accessLevel !== 'full-course')
    ) {
      return NextResponse.json(
        { error: 'Premium access required. This resource is available to enrolled students only.' },
        { status: 403 },
      )
    }

    return NextResponse.redirect(new URL(`/docs/${BOOK_CONFIG.filename}`, request.url))
  } catch (error) {
    console.error('Complete Reference access error:', error)
    return NextResponse.json({ error: 'Failed to load complete reference' }, { status: 500 })
  }
}
