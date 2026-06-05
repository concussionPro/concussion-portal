/**
 * GET /api/admin/system-health
 *
 * Single-page health check across every dependency the outreach engine
 * touches. Run before every ramp tier bump.
 *
 * Checks:
 *  - DB: prospect_clinics + prospect_outreach_log + email_events readable
 *  - Resend: env present + API reachable (no actual send)
 *  - Cal.com walkthrough event: HEAD the URL — catches "did Zac forget
 *    to create the event type?" before T2/T3 hot variants ship
 *  - Cal.com 30min event: same
 *  - Webhook secrets present: RESEND_WEBHOOK_SECRET, CAL_WEBHOOK_SECRET
 *  - Daily-cap state: snapshot from adaptive-cap module
 *  - Recent send health: 7d bounce / complaint rates
 *
 * Returns red/green per check + a single overall verdict. Anything red
 * blocks the ramp.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { computeAdaptiveCap } from '@/lib/prospect/adaptive-cap'

export const maxDuration = 60

interface Check {
  name: string
  status: 'ok' | 'warn' | 'fail'
  detail: string
}

async function checkUrl(url: string, name: string): Promise<Check> {
  try {
    // HEAD first; some hosts disallow HEAD so fall through to GET on 405
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' })
    }
    if (res.ok || res.status === 200) {
      return { name, status: 'ok', detail: `${res.status} ${url}` }
    }
    if (res.status === 404) {
      return { name, status: 'fail', detail: `404 NOT FOUND ${url} — create the cal.com event type` }
    }
    return { name, status: 'warn', detail: `HTTP ${res.status} ${url}` }
  } catch (err) {
    return { name, status: 'fail', detail: `unreachable ${url}: ${(err as Error).message}` }
  }
}

export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const checks: Check[] = []

  // ── DB reachability ────────────────────────────────────────────────────
  try {
    const { rows } = await sql<{
      clinics: number
      sends: number
      events: number
    }>`
      SELECT
        (SELECT COUNT(*) FROM prospect_clinics)::int AS clinics,
        (SELECT COUNT(*) FROM prospect_outreach_log)::int AS sends,
        (SELECT COUNT(*) FROM email_events)::int AS events
    `
    const r = rows[0] || { clinics: 0, sends: 0, events: 0 }
    checks.push({ name: 'db', status: 'ok', detail: `${r.clinics} clinics · ${r.sends} sends · ${r.events} events` })
  } catch (err) {
    checks.push({ name: 'db', status: 'fail', detail: (err as Error).message })
  }

  // ── Env / secrets ──────────────────────────────────────────────────────
  const REQUIRED_ENV = [
    'RESEND_API_KEY',
    'RESEND_WEBHOOK_SECRET',
    'CAL_WEBHOOK_SECRET',
    'POSTGRES_URL',
    'ADMIN_API_KEY',
  ] as const
  for (const k of REQUIRED_ENV) {
    const v = process.env[k]
    checks.push({
      name: `env:${k}`,
      status: v ? 'ok' : 'fail',
      detail: v ? `${v.slice(0, 4)}*** (${v.length} chars)` : 'missing',
    })
  }

  // ── Cal.com event types (URL existence) ───────────────────────────────
  const calChecks = await Promise.all([
    checkUrl('https://cal.com/zac-lewis-so8zjs/30min', 'cal:30min'),
    checkUrl('https://cal.com/zac-lewis-so8zjs/portal-walkthrough', 'cal:portal-walkthrough'),
  ])
  checks.push(...calChecks)

  // ── Resend API reachable ──────────────────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      })
      checks.push({
        name: 'resend:api',
        status: res.ok ? 'ok' : 'fail',
        detail: `HTTP ${res.status}`,
      })
    } catch (err) {
      checks.push({ name: 'resend:api', status: 'fail', detail: (err as Error).message })
    }
  }

  // ── Adaptive cap snapshot ─────────────────────────────────────────────
  try {
    const cap = await computeAdaptiveCap()
    const m = cap.metrics
    const bouncePct = (m.coldBounceRate7d * 100).toFixed(1)
    const complaintPct = (m.coldComplaintRate7d * 100).toFixed(2)
    const okBounce = m.coldBounceRate7d < 0.05
    const okComplaint = m.coldComplaintRate7d < 0.003
    checks.push({
      name: 'cap:adaptive',
      status: cap.cap === 0 ? 'fail' : (okBounce && okComplaint ? 'ok' : 'warn'),
      detail: `cap=${cap.cap} · 7d cold bounce ${bouncePct}% (n=${m.coldSends7d}) · cold complaint ${complaintPct}% · ${cap.reason}`,
    })
  } catch (err) {
    checks.push({ name: 'cap:adaptive', status: 'fail', detail: (err as Error).message })
  }

  // ── Recent send health: 24h sends + failure count ─────────────────────
  try {
    const { rows } = await sql<{ recent_sends: number; recent_failures: number }>`
      SELECT
        (SELECT COUNT(*) FROM prospect_outreach_log
         WHERE sent_at >= NOW() - INTERVAL '24 hours' AND resend_email_id IS NOT NULL)::int AS recent_sends,
        (SELECT COUNT(*) FROM email_events
         WHERE event_type IN ('bounced', 'complained') AND created_at >= NOW() - INTERVAL '24 hours')::int AS recent_failures
    `
    const r = rows[0] || { recent_sends: 0, recent_failures: 0 }
    checks.push({
      name: 'sends:24h',
      status: r.recent_failures > Math.max(2, r.recent_sends * 0.1) ? 'warn' : 'ok',
      detail: `${r.recent_sends} sent / ${r.recent_failures} bounce+complaint`,
    })
  } catch (err) {
    checks.push({ name: 'sends:24h', status: 'fail', detail: (err as Error).message })
  }

  const failCount = checks.filter((c) => c.status === 'fail').length
  const warnCount = checks.filter((c) => c.status === 'warn').length
  const verdict = failCount > 0 ? 'red' : warnCount > 0 ? 'amber' : 'green'

  return NextResponse.json({
    verdict,
    summary: { ok: checks.length - failCount - warnCount, warn: warnCount, fail: failCount, total: checks.length },
    checks,
    rampGate: {
      canRamp: verdict === 'green',
      reason:
        verdict === 'green'
          ? 'All checks pass — safe to bump cap tier per ramp ladder.'
          : verdict === 'amber'
            ? 'Warnings present — investigate before ramping; not necessarily blocking.'
            : 'Failures present — DO NOT RAMP. Fix red checks first.',
    },
  })
}
