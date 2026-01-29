import { NextRequest, NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import { verifySessionToken } from '@/lib/jwt-session'

// Changed from 'edge' to 'nodejs' to support crypto module in jwt-session
export const runtime = 'nodejs'

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
      // Read existing file content if it exists
      let existingContent = ''

      try {
        // Check if file exists by listing blobs with this exact pathname
        const { blobs } = await list({
          prefix: filename,
          limit: 1,
        })

        // If file exists, fetch its content
        if (blobs.length > 0 && blobs[0].pathname === filename) {
          const response = await fetch(blobs[0].url)
          if (response.ok) {
            existingContent = await response.text()
          }
        }
      } catch (readError) {
        // File doesn't exist yet, that's okay
        console.log('Creating new analytics file for', date)
      }

      // Append new event line
      const eventLine = JSON.stringify(event) + '\n'
      const updatedContent = existingContent + eventLine

      // Write back to blob storage
      await put(filename, updatedContent, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/x-ndjson',
      })

      console.log('Analytics event stored successfully:', event.eventType)
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
