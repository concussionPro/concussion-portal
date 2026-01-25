// Admin monitoring dashboard endpoint
import { NextRequest, NextResponse } from 'next/server'
import { list } from '@vercel/blob'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    // Simple admin auth - use a secure token
    const adminKey = request.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recent error logs
    const { blobs } = await list({ prefix: 'logs/errors-' })

    const recentErrors: any[] = []

    // Get the most recent error log file
    if (blobs.length > 0) {
      const latestLog = blobs.sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0]

      try {
        const response = await fetch(latestLog.url)
        const text = await response.text()
        const lines = text.trim().split('\n')

        for (const line of lines.slice(-20)) { // Last 20 errors
          if (line.trim()) {
            recentErrors.push(JSON.parse(line))
          }
        }
      } catch (error) {
        console.error('Failed to parse error log:', error)
      }
    }

    // Get user count
    const userBlobs = (await list()).blobs.filter(b => b.pathname === 'users.json')
    let userCount = 0

    if (userBlobs.length > 0) {
      const latestUserBlob = userBlobs.sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )[0]

      try {
        const response = await fetch(latestUserBlob.url)
        const users = await response.json()
        userCount = users.length
      } catch (error) {
        console.error('Failed to get user count:', error)
      }
    }

    // Get analytics summary
    const analyticsBlobs = (await list({ prefix: 'analytics/' })).blobs
    const today = new Date().toISOString().split('T')[0]
    const todayAnalytics = analyticsBlobs.find(b => b.pathname === `analytics/${today}.jsonl`)

    let todayEvents = 0
    if (todayAnalytics) {
      try {
        const response = await fetch(todayAnalytics.url)
        const text = await response.text()
        todayEvents = text.trim().split('\n').length
      } catch (error) {
        console.error('Failed to get analytics:', error)
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        userCount,
        todayEvents,
        recentErrorCount: recentErrors.length,
        criticalErrors: recentErrors.filter(e => e.severity === 'critical').length,
      },
      recentErrors: recentErrors.slice(0, 10), // Last 10 errors
      systemHealth: {
        blobStorage: true,
        authentication: true,
      }
    })
  } catch (error: any) {
    console.error('Monitoring endpoint error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
