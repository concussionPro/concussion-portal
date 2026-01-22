import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { cookies } from 'next/headers'
import { verifySessionToken } from '@/lib/jwt-session'

export async function GET(request: NextRequest) {
  try {
    // Authentication check - ONLY paid users can access
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session')?.value

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to access this resource.' },
        { status: 401 }
      )
    }

    // Verify JWT session token
    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Invalid or expired session. Please log in again.' },
        { status: 401 }
      )
    }

    // Verify user has paid access (online-only OR full-course)
    if (!sessionData.accessLevel || (sessionData.accessLevel !== 'online-only' && sessionData.accessLevel !== 'full-course')) {
      return NextResponse.json(
        { error: 'Premium access required. This resource is available to enrolled students only.' },
        { status: 403 }
      )
    }

    // Serve the PDF file
    const filePath = join(process.cwd(), 'public', 'docs', 'CCM_Complete_Reference_2026.pdf')
    const fileBuffer = await readFile(filePath)

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="CCM_Complete_Reference_2026.pdf"',
        'Cache-Control': 'private, max-age=3600',
      },
    })

  } catch (error) {
    console.error('Complete Reference access error:', error)
    return NextResponse.json(
      { error: 'Failed to load complete reference' },
      { status: 500 }
    )
  }
}
