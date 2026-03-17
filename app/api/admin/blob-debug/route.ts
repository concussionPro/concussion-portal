import { NextRequest, NextResponse } from 'next/server'
import { list, get } from '@vercel/blob'
import crypto from 'crypto'

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.ADMIN_API_KEY
  if (!expected) return false
  const key = request.headers.get('x-admin-key')
  if (!key) return false
  const aHash = crypto.createHmac('sha256', 'compare').update(key).digest()
  const bHash = crypto.createHmac('sha256', 'compare').update(expected).digest()
  return crypto.timingSafeEqual(aHash, bHash)
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: any = {
    hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    blobs: [],
    readTests: [],
  }

  try {
    // List ALL analytics blobs
    let cursor: string | undefined
    const allBlobs: any[] = []
    do {
      const result = await list({ prefix: 'analytics/', cursor, limit: 100 })
      for (const blob of result.blobs) {
        allBlobs.push({
          pathname: blob.pathname,
          url: blob.url.substring(0, 80) + '...',
          size: blob.size,
          uploadedAt: blob.uploadedAt,
        })
      }
      cursor = result.cursor
    } while (cursor)

    results.blobs = allBlobs
    results.totalBlobs = allBlobs.length

    // Try to read the most recent blob both ways
    if (allBlobs.length > 0) {
      const sorted = [...allBlobs].sort((a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
      const recent = sorted[0]

      // Test 1: get() with private access
      try {
        const blob = await get(recent.pathname, { access: 'private' })
        if (blob && blob.statusCode === 200 && blob.stream) {
          const text = await new Response(blob.stream).text()
          results.readTests.push({
            method: 'get(pathname, private)',
            pathname: recent.pathname,
            success: true,
            lines: text.split('\n').filter(Boolean).length,
            preview: text.substring(0, 200),
          })
        } else {
          results.readTests.push({
            method: 'get(pathname, private)',
            pathname: recent.pathname,
            success: false,
            result: blob ? `statusCode=${blob.statusCode}` : 'null',
          })
        }
      } catch (err: any) {
        results.readTests.push({
          method: 'get(pathname, private)',
          pathname: recent.pathname,
          success: false,
          error: err.message,
        })
      }

      // Test 2: get() with public access
      try {
        const blob = await get(recent.pathname, { access: 'public' })
        if (blob && blob.statusCode === 200 && blob.stream) {
          const text = await new Response(blob.stream).text()
          results.readTests.push({
            method: 'get(pathname, public)',
            pathname: recent.pathname,
            success: true,
            lines: text.split('\n').filter(Boolean).length,
          })
        } else {
          results.readTests.push({
            method: 'get(pathname, public)',
            pathname: recent.pathname,
            success: false,
            result: blob ? `statusCode=${blob.statusCode}` : 'null',
          })
        }
      } catch (err: any) {
        results.readTests.push({
          method: 'get(pathname, public)',
          pathname: recent.pathname,
          success: false,
          error: err.message,
        })
      }

      // Test 3: fetch(url) directly
      const fullBlobData = sorted[0]
      // Get the full URL from a fresh list
      const { blobs: freshBlobs } = await list({ prefix: recent.pathname })
      const freshBlob = freshBlobs.find(b => b.pathname === recent.pathname)
      if (freshBlob) {
        try {
          const res = await fetch(freshBlob.url, { cache: 'no-store' })
          results.readTests.push({
            method: 'fetch(url)',
            url: freshBlob.url.substring(0, 80) + '...',
            success: res.ok,
            status: res.status,
            lines: res.ok ? (await res.text()).split('\n').filter(Boolean).length : 0,
          })
        } catch (err: any) {
          results.readTests.push({
            method: 'fetch(url)',
            success: false,
            error: err.message,
          })
        }
      }
    }
  } catch (err: any) {
    results.error = err.message
  }

  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
