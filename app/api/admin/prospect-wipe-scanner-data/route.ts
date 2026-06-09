/**
 * POST /api/admin/prospect-wipe-scanner-data
 *
 * Wipes prospect_portal_views rows that match the scanner pattern:
 *   - exit interactions with dwell_ms < 60_000 (sub-60s sessions = bot)
 *   - section_view bursts that came from those same scanner sessions
 *   - any view from a known bot UA pattern
 *
 * Why: with Cloudflare Bot Fight Mode turned off (to unblock Cal webhook),
 * the portal pages got hammered by mail-gateway scanners (Defender ATP,
 * Mimecast, Cloudflare Email Security) rendering portals in headless
 * Chrome to inspect links. Those false "engagement" signals are
 * permanently misleading the lead-scoring system.
 *
 * Strategy:
 *   1. Identify scanner-session signatures:
 *      a) viewer_ip + viewed_at::day groups where MAX dwell_ms < 60_000
 *      b) viewer_ip groups where total interactions in <10s exceeds 5
 *      c) any UA matching headless/bot regex
 *   2. Delete all rows from those scanner sessions
 *   3. Log to scanner_wipe_log for audit
 *
 * Body: { dryRun?: boolean (default true), clinicId?: number (target one) }
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 60

const SCANNER_UA_REGEX = '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|yandex|baidu|crawler|spider|slurp|facebook|linkedin|whatsapp|telegram|skype|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell|defender|atp|cloudflare email)'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { dryRun?: boolean; clinicId?: number }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false
  const filterClinic = body.clinicId != null ? Number(body.clinicId) : null

  // ── Identify scanner-session signatures ──
  // Group by (clinic_id, viewer_ip, viewed_at::date) — each represents a
  // "session" from a unique IP to a unique portal on a unique day.
  // A session is scanner-suspect if:
  //   a) total events in the session >= 3 AND every exit_dwell_ms < 60s
  //   b) OR the UA matches the bot regex
  //   c) OR the burst pattern: 5+ events in under 10 seconds
  const { rows: sessions } = filterClinic
    ? await sql<{ clinic_id: number; viewer_ip: string; session_date: string; total_events: number; max_dwell_ms: number; min_ts: string; max_ts: string; ua_match: boolean }>`
        SELECT
          clinic_id,
          viewer_ip,
          viewed_at::date AS session_date,
          COUNT(*)::int AS total_events,
          COALESCE(MAX(CASE WHEN interaction_type='exit' THEN dwell_ms ELSE 0 END), 0)::int AS max_dwell_ms,
          MIN(viewed_at)::text AS min_ts,
          MAX(viewed_at)::text AS max_ts,
          BOOL_OR(COALESCE(user_agent, '') ~* ${SCANNER_UA_REGEX}) AS ua_match
        FROM prospect_portal_views
        WHERE clinic_id = ${filterClinic}
        GROUP BY clinic_id, viewer_ip, viewed_at::date
      `
    : await sql<{ clinic_id: number; viewer_ip: string; session_date: string; total_events: number; max_dwell_ms: number; min_ts: string; max_ts: string; ua_match: boolean }>`
        SELECT
          clinic_id,
          viewer_ip,
          viewed_at::date AS session_date,
          COUNT(*)::int AS total_events,
          COALESCE(MAX(CASE WHEN interaction_type='exit' THEN dwell_ms ELSE 0 END), 0)::int AS max_dwell_ms,
          MIN(viewed_at)::text AS min_ts,
          MAX(viewed_at)::text AS max_ts,
          BOOL_OR(COALESCE(user_agent, '') ~* ${SCANNER_UA_REGEX}) AS ua_match
        FROM prospect_portal_views
        GROUP BY clinic_id, viewer_ip, viewed_at::date
      `

  const scannerSessions: typeof sessions = []
  for (const s of sessions) {
    const burstMs = new Date(s.max_ts).getTime() - new Date(s.min_ts).getTime()
    const isBurst = s.total_events >= 5 && burstMs < 10_000
    const isShortDwell = s.total_events >= 3 && s.max_dwell_ms < 60_000
    if (s.ua_match || isBurst || isShortDwell) {
      scannerSessions.push(s)
    }
  }

  if (!dryRun && scannerSessions.length > 0) {
    // Lazy log table
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS scanner_wipe_log (
          id SERIAL PRIMARY KEY,
          wiped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          clinic_id INTEGER NOT NULL,
          viewer_ip TEXT,
          session_date DATE,
          rows_deleted INTEGER NOT NULL
        )
      `
    } catch { /* non-fatal */ }

    // Delete each scanner session in turn
    for (const s of scannerSessions) {
      try {
        const { rowCount } = await sql`
          DELETE FROM prospect_portal_views
          WHERE clinic_id = ${s.clinic_id}
            AND viewer_ip = ${s.viewer_ip}
            AND viewed_at::date = ${s.session_date}::date
        `
        await sql`
          INSERT INTO scanner_wipe_log (clinic_id, viewer_ip, session_date, rows_deleted)
          VALUES (${s.clinic_id}, ${s.viewer_ip}, ${s.session_date}::date, ${rowCount ?? 0})
        `
      } catch (err) {
        console.error('[wipe-scanner-data]', err)
      }
    }
  }

  const totalSessions = sessions.length
  const scannerSessionCount = scannerSessions.length
  const rowsToDelete = scannerSessions.reduce((acc, s) => acc + s.total_events, 0)

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      totalSessionsExamined: totalSessions,
      scannerSessionsIdentified: scannerSessionCount,
      portalViewRowsTargeted: rowsToDelete,
      clinicsAffected: new Set(scannerSessions.map(s => s.clinic_id)).size,
    },
    sampleSessions: scannerSessions.slice(0, 20),
  })
}
