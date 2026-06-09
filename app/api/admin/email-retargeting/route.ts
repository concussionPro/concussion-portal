/**
 * Retargeting candidates — recipients who opened/clicked email in the window
 * and where they sit in the funnel. Joins email_events with users.
 *
 * Buckets:
 *   - hot_clickers: clicked in the last N days, not yet converted → high intent
 *   - warm_openers: opened in the last N days, never clicked, not converted
 *   - converted_clickers: clicked and already bought (exclude from retargeting)
 *   - cold_nonopeners: received emails but never opened in window
 *
 * WHY THIS NEVER WORKED (fixed 2026-06-10):
 *   1. Buckets required users.access_level === 'preview', but the rollup
 *      LEFT JOINs users — every recipient WITHOUT a users row (workshop
 *      interest leads, abandoned checkouts, imported contacts) had
 *      access_level NULL and silently fell out of hot/warm. Non-converted
 *      now means "not online-only/full-course", including unknowns.
 *   2. B2B cold-outreach prospects polluted the buckets. They have their
 *      own engine (T1/T2/T3 + reply detection) and must never get consumer
 *      retargeting. Excluded via prospect_clinics.contact_email.
 *   3. Suppressed / unsubscribed addresses surfaced as "retarget me" —
 *      acting on them risks the complaint rate. Now excluded.
 *   4. Scanner opens/clicks (Defender/Mimecast pre-fetch) inflated intent.
 *      Where email_events.user_agent exists, bot UAs are filtered out.
 *   (Historically the feed itself was also broken: the webhook signing
 *   secret drifted ~Apr 14 2026 and dropped 17 days of events; engagement
 *   rows then only arrived via the manual sync-resend-events backfill.)
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
  access_level: string | null
  created_at: string | null
  last_login_at: string | null
  signup_source: string | null
  sends: number
  opens: number
  clicks: number
  last_open: string | null
  last_click: string | null
  last_click_url: string | null
}

/** Mail-gateway / scanner UA patterns — same family as the prospect surfaces. */
const BOT_UA_REGEX = '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|wget|curl|python-requests|node-fetch|axios|go-http-client|okhttp)'

const CONVERTED_LEVELS = new Set(['online-only', 'full-course'])

export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const daysRaw = parseInt(url.searchParams.get('days') || '30', 10)
  const days = Math.max(1, Math.min(365, isNaN(daysRaw) ? 30 : daysRaw))

  try {
    // Lazy column migration — user_agent is written by the new webhook path
    // and the prospect-schema-bootstrap; ensure it exists on older DBs so
    // the scanner filter below can't 42703.
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_agent TEXT`

    // Per-recipient rollup in the window.
    // - delivered = send denominator (webhook never writes 'sent' rows)
    // - opens/clicks human-filtered where user_agent is populated
    // - B2B prospects, suppressed, and unsubscribed recipients excluded
    const { rows } = await sql<EngagementRow>`
      WITH ev AS (
        SELECT
          LOWER(recipient) AS recipient,
          COUNT(DISTINCT email_id) FILTER (WHERE event_type = 'delivered') AS sends,
          COUNT(DISTINCT email_id) FILTER (
            WHERE event_type = 'opened'
              AND (user_agent IS NULL OR user_agent !~* ${BOT_UA_REGEX})
          ) AS opens,
          COUNT(DISTINCT email_id) FILTER (
            WHERE event_type = 'clicked'
              AND (user_agent IS NULL OR user_agent !~* ${BOT_UA_REGEX})
          ) AS clicks,
          MAX(CASE WHEN event_type = 'opened'  THEN created_at END) AS last_open,
          MAX(CASE WHEN event_type = 'clicked' THEN created_at END) AS last_click,
          (ARRAY_AGG(click_url ORDER BY created_at DESC) FILTER (WHERE event_type = 'clicked' AND click_url IS NOT NULL))[1] AS last_click_url
        FROM email_events
        WHERE created_at >= NOW() - (${days} || ' days')::INTERVAL
          AND COALESCE(project, 'cea') = 'cea'
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
      WHERE COALESCE(u.nurture_unsubscribed, false) = false
        AND ev.recipient NOT IN (SELECT LOWER(email) FROM email_suppression)
        AND ev.recipient NOT IN (
          SELECT LOWER(contact_email) FROM prospect_clinics WHERE contact_email IS NOT NULL
        )
      ORDER BY ev.clicks DESC, ev.opens DESC, ev.last_open DESC NULLS LAST
    `

    // Non-converted = anyone who hasn't bought. Recipients with NO users row
    // (access_level NULL) are leads, not converts — they belong in the
    // retargeting buckets, not in the void.
    const isConverted = (r: EngagementRow) => CONVERTED_LEVELS.has(r.access_level ?? '')
    const hotClickers = rows.filter((r) => r.clicks > 0 && !isConverted(r))
    const warmOpeners = rows.filter((r) => r.opens > 0 && r.clicks === 0 && !isConverted(r))
    const convertedClickers = rows.filter((r) => r.clicks > 0 && isConverted(r))
    const coldNonOpeners = rows.filter((r) => r.opens === 0 && r.clicks === 0 && r.sends > 0)

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
      note: 'B2B prospects (own engine), suppressed, and unsubscribed recipients are excluded. Opens/clicks are scanner-filtered where user_agent is recorded. Sends denominated on delivered events.',
    })
  } catch (err) {
    if ((err as { code?: string })?.code === '42P01') {
      return NextResponse.json({ error: 'email_events table missing — run scripts/add-email-events-table.ts' }, { status: 503 })
    }
    console.error('email-retargeting error:', err)
    return NextResponse.json({ error: 'Failed to aggregate' }, { status: 500 })
  }
}
