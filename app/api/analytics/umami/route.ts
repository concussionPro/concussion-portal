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
//   UMAMI_WEBSITE_ID  = 78007a9523265d8a53b15efc8457b60c2f3394d2d5ad0259a38761afb69a02d3
//   UMAMI_API_TOKEN   = 78007a9523265d8a53b15efc8457b60c2f3394d2d5ad0259a38761afb69a02d3
//   ANALYTICS_API_KEY = (any secret key you want admins to use for dashboard auth)

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
const MOCK_STATS = {
  _isMockData: true,
  _message: 'Set UMAMI_API_TOKEN and UMAMI_WEBSITE_ID in Vercel environment variables to see real data.',
  pageviews: { value: 0, prev: 0 },
  uniques: { value: 0, prev: 0 },
  bounces: { value: 0, prev: 0 },
  totaltime: { value: 0, prev: 0 },
}

const MOCK_PAGEVIEWS = {
  _isMockData: true,
  _message: 'Set UMAMI_API_TOKEN and UMAMI_WEBSITE_ID in Vercel environment variables to see real data.',
  pageviews: [],
  sessions: [],
}

const MOCK_METRICS = {
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
    // Edge/Node fetch — no cache so we always get fresh data
    cache: 'no-store',
  })
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  // ── Auth check ────────────────────────────────────────────────────────────
  const adminKey = request.headers.get('x-admin-key') ?? ''

  // Allow through if ANALYTICS_API_KEY is not set (dev mode) OR if keys match
  if (ADMIN_KEY && adminKey !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Env-var check — return mock data with setup instructions ─────────────
  if (!WEBSITE_ID || !API_TOKEN) {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'stats'
    const mock = type === 'stats' ? MOCK_STATS : type === 'pageviews' ? MOCK_PAGEVIEWS : MOCK_METRICS
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
        // GET /api/websites/{id}/stats?startAt=&endAt=
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/stats`, timeParams)
        break
      }

      case 'pageviews': {
        // GET /api/websites/{id}/pageviews?startAt=&endAt=&unit=day
        const unit = period === '24h' ? 'hour' : 'day'
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/pageviews`, {
          ...timeParams,
          unit,
          timezone: 'Australia/Sydney',
        })
        break
      }

      case 'metrics': {
        // GET /api/websites/{id}/metrics?startAt=&endAt=&type=url|referrer|browser|os
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/metrics`, {
          ...timeParams,
          type: metricType,
        })
        break
      }

      case 'events': {
        // GET /api/websites/{id}/events?startAt=&endAt=&unit=day
        const unit = period === '24h' ? 'hour' : 'day'
        umamiResponse = await fetchUmami(`/websites/${WEBSITE_ID}/events`, {
          ...timeParams,
          unit,
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

      // If 401/403, the token is probably wrong — return helpful error
      if (umamiResponse.status === 401 || umamiResponse.status === 403) {
        return NextResponse.json(
          {
            error: 'Umami API authentication failed. Check UMAMI_API_TOKEN in Vercel env vars.',
            _isMockData: true,
            ...getMockForType(type),
          },
          { status: 200 } // Return 200 so dashboard can show the error gracefully
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

function getMockForType(type: string) {
  if (type === 'stats') return MOCK_STATS
  if (type === 'pageviews') return MOCK_PAGEVIEWS
  return MOCK_METRICS
}
