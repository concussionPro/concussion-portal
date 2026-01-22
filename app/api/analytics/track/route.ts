// Analytics tracking API - server-side event storage
import { NextRequest, NextResponse } from 'next/server'
import { put, head } from '@vercel/blob'

export interface AnalyticsEvent {
  id: string
  timestamp: string
  sessionId: string | null
  userId: string | null
  email: string | null
  eventType:
    | 'page_view'
    | 'button_click'
    | 'cart_visit'
    | 'enroll_click'
    | 'preview_click'
    | 'module_view'
    | 'quiz_start'
    | 'quiz_complete'
    | 'download'
    | 'video_play'
    | 'video_complete'
    | 'login'
    | 'logout'
    | 'signup'
  eventData: {
    page?: string
    buttonLabel?: string
    buttonLocation?: string
    moduleId?: string
    score?: number
    videoId?: string
    progress?: number
    fileName?: string
    [key: string]: any
  }
  userAgent: string
  referrer: string
  ipAddress?: string
}

const ANALYTICS_BLOB_PATH = 'analytics.json'
const MAX_EVENTS_IN_MEMORY = 10000 // Rotate to new file after 10k events

async function loadEvents(): Promise<AnalyticsEvent[]> {
  try {
    const blobExists = await head(ANALYTICS_BLOB_PATH).catch(() => null)
    if (!blobExists) return []

    const response = await fetch(`${blobExists.url}?t=${Date.now()}`, {
      cache: 'no-store'
    })
    return await response.json()
  } catch (error) {
    console.error('Error loading analytics:', error)
    return []
  }
}

async function saveEvents(events: AnalyticsEvent[]) {
  try {
    await put(ANALYTICS_BLOB_PATH, JSON.stringify(events, null, 2), {
      access: 'public', // TODO: Make private and add admin-only access
      contentType: 'application/json',
    })
  } catch (error) {
    console.error('Error saving analytics:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventType, eventData, sessionId, userId, email } = body

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type required' },
        { status: 400 }
      )
    }

    // Create analytics event
    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || null,
      userId: userId || null,
      email: email || null,
      eventType,
      eventData: eventData || {},
      userAgent: request.headers.get('user-agent') || 'Unknown',
      referrer: request.headers.get('referer') || 'Direct',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown',
    }

    // Load existing events
    const events = await loadEvents()

    // Add new event
    events.push(event)

    // Rotate if too large (keep last 10k events)
    const eventsToSave = events.length > MAX_EVENTS_IN_MEMORY
      ? events.slice(-MAX_EVENTS_IN_MEMORY)
      : events

    // Save events
    await saveEvents(eventsToSave)

    return NextResponse.json({ success: true, eventId: event.id })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Don't fail the request if analytics fails
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

// GET endpoint for admin to view analytics
export async function GET(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    const { searchParams } = new URL(request.url)
    const eventType = searchParams.get('eventType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let events = await loadEvents()

    // Filter by event type
    if (eventType) {
      events = events.filter(e => e.eventType === eventType)
    }

    // Filter by date range
    if (startDate) {
      events = events.filter(e => new Date(e.timestamp) >= new Date(startDate))
    }
    if (endDate) {
      events = events.filter(e => new Date(e.timestamp) <= new Date(endDate))
    }

    // Return summary stats
    const stats = {
      totalEvents: events.length,
      eventTypes: events.reduce((acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
      uniqueSessions: new Set(events.map(e => e.sessionId).filter(Boolean)).size,
      topPages: events
        .filter(e => e.eventType === 'page_view')
        .reduce((acc, e) => {
          const page = e.eventData.page || 'Unknown'
          acc[page] = (acc[page] || 0) + 1
          return acc
        }, {} as Record<string, number>),
      topButtons: events
        .filter(e => e.eventType === 'button_click')
        .reduce((acc, e) => {
          const button = e.eventData.buttonLabel || 'Unknown'
          acc[button] = (acc[button] || 0) + 1
          return acc
        }, {} as Record<string, number>),
    }

    return NextResponse.json({
      stats,
      recentEvents: events.slice(-100).reverse(), // Last 100 events
    })
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
