import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'

export const runtime = 'nodejs'

/**
 * Analytics tracking endpoint - LIGHTWEIGHT VERSION
 *
 * Logs events to console only to avoid Vercel Blob quota issues.
 * For production analytics, integrate with proper analytics service
 * (Google Analytics, Mixpanel, PostHog, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventType,
      eventData,
      sessionId,
      timestamp,
      userAgent,
      referrer,
      path,
    } = body

    // Get user info from session if available
    const sessionToken = request.cookies.get('session')?.value
    let userId: string | null = null
    let email: string | null = null

    if (sessionToken) {
      const sessionData = verifySessionToken(sessionToken)
      if (sessionData) {
        userId = sessionData.userId
        email = sessionData.email
      }
    }

    // Create analytics event
    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      email,
      timestamp: timestamp || Date.now(),
      eventType,
      eventData,
      sessionId,
      userAgent,
      referrer,
      path,
    }

    // Log to Vercel logs (viewable in Vercel dashboard)
    console.log('[ANALYTICS]', JSON.stringify({
      type: eventType,
      user: email || 'anonymous',
      path,
      data: eventData,
      timestamp: new Date(timestamp).toISOString(),
    }))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
