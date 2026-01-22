import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/sessions'

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value

    if (sessionId) {
      // Delete session from storage
      await deleteSession(sessionId)
    }

    // Clear the cookie
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
