import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/jwt-session'
import { put, list } from '@vercel/blob'

export const runtime = 'nodejs'

/**
 * Analytics tracking endpoint — PERSISTENT VERSION
 *
 * Stores events to Vercel Blob in daily JSON files.
 * Each day gets its own blob: analytics/YYYY-MM-DD.json
 * Events are appended to the daily file.
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

    const event = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      email,
      timestamp: timestamp || Date.now(),
      eventType,
      eventData,
      sessionId,
      userAgent: userAgent?.substring(0, 200),
      referrer: referrer?.substring(0, 500),
      path,
    }

    console.log('[ANALYTICS]', JSON.stringify({
      type: eventType,
      user: email || 'anonymous',
      path,
      data: eventData,
      timestamp: new Date(timestamp || Date.now()).toISOString(),
    }))

    try {
      const today = new Date().toISOString().split('T')[0]
      const blobPath = `analytics/${today}.jsonl`
      const eventLine = JSON.stringify(event) + '\n'

      let existingContent = ''
      try {
        const blobs = await list({ prefix: blobPath })
        if (blobs.blobs.length > 0) {
          const existingBlob = blobs.blobs[0]
          const res = await fetch(existingBlob.url)
          if (res.ok) {
            existingContent = await res.text()
          }
        }
      } catch {
        // File doesn't exist yet
      }

      await put(blobPath, existingContent + eventLine, {
        access: 'public',
        addRandomSuffix: false,
      })
    } catch (blobError) {
      console.error('[ANALYTICS] Blob storage failed:', blobError)
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

/**
 * GET /api/analytics/track
 * Retrieve analytics data for the dashboard.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session')?.value
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionData = verifySessionToken(sessionToken)
    if (!sessionData) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30)

    const allEvents: any[] = []
    const today = new Date()

    for (let i = 0; i < days; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const blobPath = `analytics/${dateStr}.jsonl`

      try {
        const blobs = await list({ prefix: blobPath })
        if (blobs.blobs.length > 0) {
          const res = await fetch(blobs.blobs[0].url)
          if (res.ok) {
            const text = await res.text()
            const lines = text.trim().split('\n').filter(Boolean)
            for (const line of lines) {
              try {
                allEvents.push(JSON.parse(line))
              } catch {
                // Skip malformed lines
              }
            }
          }
        }
      } catch {
        // File doesn't exist for this date
      }
    }

    const pageViews = allEvents.filter(e => e.eventType === 'page_view')
    const uniqueSessions = new Set(allEvents.map(e => e.sessionId)).size
    const uniqueUsers = new Set(allEvents.filter(e => e.email).map(e => e.email)).size

    const pathCounts: Record<string, number> = {}
    for (const event of pageViews) {
      const p = event.path || '/'
      pathCounts[p] = (pathCounts[p] || 0) + 1
    }

    const eventCounts: Record<string, number> = {}
    for (const event of allEvents) {
      eventCounts[event.eventType] = (eventCounts[event.eventType] || 0) + 1
    }

    const dailyViews: Record<string, number> = {}
    for (const event of pageViews) {
      const day = new Date(event.timestamp).toISOString().split('T')[0]
      dailyViews[day] = (dailyViews[day] || 0) + 1
    }

    const referrerCounts: Record<string, number> = {}
    for (const event of pageViews) {
      const ref = event.referrer || 'direct'
      try {
        const domain = ref === 'direct' ? 'direct' : new URL(ref).hostname
        referrerCounts[domain] = (referrerCounts[domain] || 0) + 1
      } catch {
        referrerCounts[ref.substring(0, 50)] = (referrerCounts[ref.substring(0, 50)] || 0) + 1
      }
    }

    return NextResponse.json({
      success: true,
      period: { days, from: new Date(today.getTime() - days * 86400000).toISOString().split('T')[0], to: today.toISOString().split('T')[0] },
      summary: { totalEvents: allEvents.length, pageViews: pageViews.length, uniqueSessions, uniqueUsers },
      topPages: Object.entries(pathCounts).sort(([, a], [, b]) => b - a).slice(0, 20).map(([path, count]) => ({ path, count })),
      eventBreakdown: Object.entries(eventCounts).sort(([, a], [, b]) => b - a).map(([event, count]) => ({ event, count })),
      dailyViews: Object.entries(dailyViews).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count })),
      topReferrers: Object.entries(referrerCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([referrer, count]) => ({ referrer, count })),
    })
  } catch (error) {
    console.error('Analytics retrieval error:', error)
    return NextResponse.json({ error: 'Failed to retrieve analytics' }, { status: 500 })
  }
}
