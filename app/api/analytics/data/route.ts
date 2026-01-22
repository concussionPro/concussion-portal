import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export const runtime = 'edge'

// Retrieve analytics data (admin only)
export async function GET(request: NextRequest) {
  try {
    // Simple admin auth check (you should add proper admin authentication)
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get date range from query params (default to last 30 days)
    const { searchParams } = new URL(request.url)
    const daysBack = parseInt(searchParams.get('days') || '30')
    const eventType = searchParams.get('eventType')

    // List analytics files
    const { blobs } = await list({
      prefix: 'analytics/',
      limit: daysBack,
    })

    // Fetch and parse all analytics files
    const allEvents: any[] = []

    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const text = await response.text()
        const lines = text.trim().split('\n')

        for (const line of lines) {
          if (line.trim()) {
            const event = JSON.parse(line)
            if (!eventType || event.eventType === eventType) {
              allEvents.push(event)
            }
          }
        }
      } catch (error) {
        console.error(`Failed to parse blob ${blob.pathname}:`, error)
      }
    }

    // Sort by timestamp descending
    allEvents.sort((a, b) => b.timestamp - a.timestamp)

    // Calculate summary statistics
    const summary = calculateSummary(allEvents)

    return NextResponse.json({
      success: true,
      events: allEvents,
      summary,
      totalEvents: allEvents.length,
    })
  } catch (error) {
    console.error('Analytics data retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve analytics data' },
      { status: 500 }
    )
  }
}

function calculateSummary(events: any[]) {
  const summary: any = {
    totalEvents: events.length,
    uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
    uniqueSessions: new Set(events.map(e => e.sessionId)).size,
    eventsByType: {},
    topPages: {},
    shopClicks: 0,
    enrollButtonClicks: 0,
    moduleCompletions: 0,
    downloads: 0,
    avgEventsPerSession: 0,
  }

  // Count events by type
  events.forEach(event => {
    // Event type counts
    summary.eventsByType[event.eventType] = (summary.eventsByType[event.eventType] || 0) + 1

    // Page view counts
    if (event.eventType === 'page_view') {
      summary.topPages[event.path] = (summary.topPages[event.path] || 0) + 1
    }

    // Conversion tracking
    if (event.eventType === 'shop_click') {
      summary.shopClicks++
    }
    if (event.eventType === 'enroll_button_click') {
      summary.enrollButtonClicks++
    }
    if (event.eventType === 'module_complete') {
      summary.moduleCompletions++
    }
    if (event.eventType === 'toolkit_download') {
      summary.downloads++
    }
  })

  // Calculate avg events per session
  if (summary.uniqueSessions > 0) {
    summary.avgEventsPerSession = (summary.totalEvents / summary.uniqueSessions).toFixed(2)
  }

  // Sort top pages
  summary.topPages = Object.fromEntries(
    Object.entries(summary.topPages)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 10)
  )

  return summary
}
