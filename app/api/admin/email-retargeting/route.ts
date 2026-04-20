/**
 * Retargeting candidates — recipients who opened/clicked email in the window
 * and where they sit in the funnel. Joins email_events with users.
 *
 * Buckets:
 *   - hot_clickers: clicked in the last N days, still preview access → high intent
 *   - warm_openers: opened in the last N days, never clicked, still preview
 *   - cold_nonopeners: received emails but never opened in window (exclude from nurture?)
 *
 * Query: ?days=30 (default 30, capped 365)
 * Auth: admin cookie / x-admin-key / Bearer.
 */

import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'

interface EngagementRow {
  email: string
  name: string | null
  access_level: string
  created_at: string
  last_login_at: string | null
  signup_source: string | null
  sends: number
  opens: number
  clicks: number
  last_open: string | null
  last_click: string | null
  last_click_url: string | null
}

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const daysRaw = parseInt(url.searchParams.get('days') || '30', 10)
  const days = Math.max(1, Math.min(365, isNaN(daysRaw) ? 30 : daysRaw))

  try {
    // Per-recipient rollup in the window
    const { rows } = await sql<EngagementRow>`
      WITH ev AS (
        SELECT
          LOWER(recipient) AS recipient,
          COUNT(DISTINCT email_id) FILTER (WHERE event_type = 'delivered') AS sends,
          COUNT(DISTINCT email_id) FILTER (WHERE event_type = 'opened')    AS opens,
          COUNT(DISTINCT email_id) FILTER (WHERE event_type = 'clicked')   AS clicks,
          MAX(CASE WHEN event_type = 'opened'  THEN created_at END) AS last_open,
          MAX(CASE WHEN event_type = 'clicked' THEN created_at END) AS last_click,
          (ARRAY_AGG(click_url ORDER BY created_at DESC) FILTER (WHERE event_type = 'clicked' AND click_url IS NOT NULL))[1] AS last_click_url
        FROM email_events
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
        GROUP BY LOWER(recipient)
      )
      SELECT
        ev.recipient AS email,
        u.name,
        u.access_level,
        u.created_at,
        u.last_login_at,
        u.signup_source,
        COALESCE(ev.sends, 0)::int  AS sends,
        COALESCE(ev.opens, 0)::int  AS opens,
        COALESCE(ev.clicks, 0)::int AS clicks,
        ev.last_open,
        ev.last_click,
        ev.last_click_url
      FROM ev
      LEFT JOIN users u ON LOWER(u.email) = ev.recipient
      ORDER BY ev.clicks DESC, ev.opens DESC, ev.last_open DESC NULLS LAST
    `

    const hotClickers = rows.filter((r) => r.clicks > 0 && r.access_level === 'preview')
    const warmOpeners = rows.filter((r) => r.opens > 0 && r.clicks === 0 && r.access_level === 'preview')
    const convertedClickers = rows.filter((r) => r.clicks > 0 && (r.access_level === 'online-only' || r.access_level === 'full-course'))
    const coldNonOpeners = rows.filter((r) => r.opens === 0 && r.sends > 0)

    const shape = (r: EngagementRow) => ({
      email: r.email,
      name: r.name,
      accessLevel: r.access_level || 'unknown',
      signupSource: r.signup_source,
      sends: r.sends,
      opens: r.opens,
      clicks: r.clicks,
      lastOpen: r.last_open,
      lastClick: r.last_click,
      lastClickUrl: r.last_click_url,
      createdAt: r.created_at,
      lastLoginAt: r.last_login_at,
    })

    return NextResponse.json({
      windowDays: days,
      counts: {
        totalRecipients: rows.length,
        hotClickers: hotClickers.length,
        warmOpeners: warmOpeners.length,
        convertedClickers: convertedClickers.length,
        coldNonOpeners: coldNonOpeners.length,
      },
      hotClickers: hotClickers.map(shape),
      warmOpeners: warmOpeners.map(shape),
      convertedClickers: convertedClickers.map(shape),
      coldNonOpeners: coldNonOpeners.map(shape),
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({ error: 'email_events table missing — run scripts/add-email-events-table.ts' }, { status: 503 })
    }
    console.error('email-retargeting error:', err)
    return NextResponse.json({ error: 'Failed to aggregate' }, { status: 500 })
  }
}
