import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { verifySessionToken } from '@/lib/jwt-session'

export const runtime = 'edge'

// Store analytics events in Vercel Blob storage
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

    // Store in Blob storage (append to daily log file)
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `analytics/${date}.jsonl`

    try {
      // Append to existing file or create new one
      const eventLine = JSON.stringify(event) + '\n'

      await put(filename, eventLine, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/x-ndjson',
      })
    } catch (error) {
      console.error('Failed to store analytics event:', error)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    )
  }
}
