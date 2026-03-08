// Admin monitoring dashboard endpoint
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN

let blobList: typeof import('@vercel/blob').list | null = null
if (useBlob) {
  try {
    const blob = require('@vercel/blob')
    blobList = blob.list
  } catch {
    // @vercel/blob not available
  }
}

const LOCAL_ANALYTICS_DIR = path.join(process.cwd(), '.data', 'analytics')

export async function GET(request: NextRequest) {
  try {
    // Admin auth (timing-safe)
    const adminKey = request.headers.get('x-admin-key')
    const expected = process.env.ADMIN_API_KEY
    if (!expected || !adminKey || adminKey.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(adminKey), Buffer.from(expected))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let todayEvents = 0
    let userCount = 0
    const recentErrors: any[] = []

    const today = new Date().toISOString().split('T')[0]

    if (useBlob && blobList) {
      // --- Vercel Blob path ---
      try {
        const { blobs } = await blobList({ prefix: 'logs/errors-' })
        if (blobs.length > 0) {
          const latestLog = blobs.sort((a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          )[0]
          try {
            const response = await fetch(latestLog.url)
            const text = await response.text()
            const lines = text.trim().split('\n')
            for (const line of lines.slice(-20)) {
              if (line.trim()) {
                recentErrors.push(JSON.parse(line))
              }
            }
          } catch {}
        }
      } catch {}

      try {
        const userBlobs = (await blobList({})).blobs.filter(b => b.pathname === 'users.json')
        if (userBlobs.length > 0) {
          const latestUserBlob = userBlobs.sort((a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
          )[0]
          const response = await fetch(latestUserBlob.url)
          const users = await response.json()
          userCount = users.length
        }
      } catch {}

      try {
        const analyticsBlobs = (await blobList({ prefix: 'analytics/' })).blobs
        const todayAnalytics = analyticsBlobs.find(b => b.pathname === `analytics/${today}.ndjson` || b.pathname === `analytics/${today}.jsonl`)
        if (todayAnalytics) {
          const response = await fetch(todayAnalytics.url)
          const text = await response.text()
          todayEvents = text.trim().split('\n').length
        }
      } catch {}
    } else {
      // --- Local filesystem fallback (dev) ---
      try {
        const todayFile = path.join(LOCAL_ANALYTICS_DIR, `${today}.ndjson`)
        if (fs.existsSync(todayFile)) {
          const text = fs.readFileSync(todayFile, 'utf-8')
          todayEvents = text.trim().split('\n').filter(Boolean).length
        }
      } catch {}

      // Count local users
      try {
        const usersFile = path.join(process.cwd(), 'data', 'users.local.json')
        if (fs.existsSync(usersFile)) {
          const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'))
          userCount = Array.isArray(users) ? users.length : 0
        }
      } catch {}
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      storage: useBlob ? 'vercel-blob' : 'local-filesystem',
      metrics: {
        userCount,
        todayEvents,
        recentErrorCount: recentErrors.length,
        criticalErrors: recentErrors.filter((e: any) => e.severity === 'critical').length,
      },
      recentErrors: recentErrors.slice(0, 10),
      systemHealth: {
        blobStorage: useBlob,
        localStorage: !useBlob,
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
