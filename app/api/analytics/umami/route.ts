/**
 * app/api/analytics/umami/route.ts
 *
 * Server-side proxy for Umami Cloud analytics API.
 * Avoids CORS issues by keeping the Umami API token server-side.
 *
 * Query params:
 *   ?type=stats|pageviews|metrics|events
 *   &period=24h|7d|30d|90d
 *   &metricType=url|referrer|browser|os|device  (for metrics endpoint)
 *
 * Headers:
 *   x-admin-key: must match ANALYTICS_API_KEY env var
 */

import { NextRequest, NextResponse } from 'next/server'

// ── Env vars ──────────────────────────────────────────────────────────────────
// Set these in Vercel dashboard:
//   UMAMI_WEBSITE_ID  = your Umami website ID
//   UMAMI_API_TOKEN   = your Umami API token
//   ANALYTICS_API_KEY = admin dashboard auth key

const UMAMI_BASE = 'https://cloud.umami.is/api'
const WEBSITE_ID = process.env.UMAMI_WEBSITE_ID ?? ''
const API_TOKEN = process.env.UMAMI_API_TOKEN ?? ''
const ADMIN_KEY = process.env.ANALYTICS_API_KEY ?? ''

// ── Period helpers ────────────────────────────────────────────────────────────
function getPeriodTimestamps(period: string): { startAt: number; endAt: number } {
  const endAt = Date.now()
  const msMap: Record<string, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  }
  const delta = msMap[period] ?? msMap['7d']
  return { startAt: endAt - delta, endAt }
}

// ── Mock data (shown when env vars are not configured) ────────────────────────
interface MockStats {
  _isMockData: boolean
  _message: string
  pageviews: { value: number; prev: number }
  uniques: { value: number; prev: number }
  bounces: { value: number; prev: number }
  totaltime: { value: number; prev: number }
}

interface MockPageviews {
  _isMockData: boolean
  _message: string
  pageviews: never[]
  sessions: never[]
}

interface MockMetrics {
  _isMockData: boolean
  _message: string
  data: never[]
}

const MOCK_STATS: MockStats = {
  _isMockData: true,
  _message: 'Set UMAMI_API_TOKEN and UMAMI_WEBSITE_ID in Vercel environment variables to see real data.',
  pageviews: { value: 0, prev: 0 },
  uniques: { value: 0, prev: 0 },
  bounces: { value: 0, prev: 0 },
  totaltime: { value: 0, prev: 0 },
}

const MOCK_PAGEVIEWS: MockPageviews = {
  _isMockData: true,
  _message: 'Set UMAMI_API_TOKEN and UMAMI_WEBSITE_ID in Vercel environment variables to see real data.',
  pageviews: [],
  sessions: [],
}

const MOCK_METRICS: MockMetrics = {
  _isMockData: true,
  _message: 'Set UMAMI_API_TOKEN and UMAMI_WEBSITE_ID in Vercel environment variables to see real data.',
  data: [],
}

// ── Umami API request helper ──────────────────────────────────────────────────
async function fetchUmami(path: string, params: Record<string, string>): Promise<Response> {
  const url = new URL(`${UMAMI_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  return fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${API_TOKEN}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
}

function getMockForType(type: string): MockStats | MockPageviews | MockMetrics {
  if (type === 'stats') return MOCK_STATS
  if (type === 'pageviews') return MOCK_PAGEVIEWS
  return MOCK_METRICS
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const adminKey = request.headers.get('x-admin-key') ?? ''

  if (ADMIN_KEY && adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Env-var check — return mock data with setup instructions ─────────────
  if (!WEBSITE_ID || !API_TOKEN) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'stats'
    const mock = getMockForType(type)
    return NextResponse.json(mock, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Mock-Data': 'true',
      },
    })
  }

  // ── Parse query params ────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'stats'
  const period = searchParams.get('period') ?? '7d'
  const metricType = searchParams.get('metricType') ?? 'url'

  const { startAt, endAt } = getPeriodTimestamps(period)
  const timeParams = {
    startAt: startAt.toString(),
    endAt: endAt.toString(),
  }

  try {
    let umamiResponse: Response

    switch (type) {
      case 'stats': {
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/stats`, timeParams)
        break
      }

      case 'pageviews': {
        const unit = period === '24h' ? 'hour' : 'day'
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/pageviews`, {
          ...timeParams,
          unit,
          timezone: 'Australia/Sydney',
        })
        break
      }

      case 'metrics': {
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/metrics`, {
          ...timeParams,
          type: metricType,
        })
        break
      }

      case 'events': {
        const evtUnit = period === '24h' ? 'hour' : 'day'
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/events`, {
          ...timeParams,
          unit: evtUnit,
          timezone: 'Australia/Sydney',
        })
        break
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }

    // ── Handle Umami errors ─────────────────────────────────────────────────
    if (!umamiResponse.ok) {
      const errorText = await umamiResponse.text()
      console.error(`[analytics/umami] Umami API error ${umamiResponse.status}:`, errorText)

      if (umamiResponse.status === 401 || umamiResponse.status === 403) {
        const mock = getMockForType(type)
        return NextResponse.json(
          {
            ...mock,
            error: 'Umami API authentication failed. Check UMAMI_API_TOKEN in Vercel env vars.',
          },
          { status: 200 }
        )
      }

      return NextResponse.json(
        { error: `Umami API returned ${umamiResponse.status}` },
        { status: umamiResponse.status }
      )
    }

    const data = await umamiResponse.json()

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Mock-Data': 'false',
      },
    })
  } catch (err) {
    console.error('[analytics/umami] Fetch error:', err)
    return NextResponse.json(
      { error: 'Failed to reach Umami API', details: String(err) },
      { status: 502 }
    )
  }
}
