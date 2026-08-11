import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { CONFIG } from '@/lib/config'
import { sendEmail } from '@/lib/resend-client'
import { analyze, loadWindow, reconcileFindings } from '@/lib/analytics-findings'
import { sql } from '@/lib/db'

export const maxDuration = 60

/**
 * Weekly analytics review — the self-cleaning optimisation loop.
 *
 * Analyses the last 14 days of events into money-anchored WORK ORDERS
 * (lib/analytics-findings.ts), reconciles them against the open set
 * (auto-resolving anything the data no longer supports), and emails the
 * digest. The digest's job is not to inform — it is to trigger the pass:
 * Zac tells Claude "run the analytics pass", Claude reads
 * GET /api/admin/analytics-findings and implements the open orders.
 *
 * Schedule: Sundays 21:00 UTC → Monday morning Sydney. Manual trigger:
 * x-admin-key.
 */
function isAuthorized(request: NextRequest): boolean {
  const adminKey = process.env.ADMIN_API_KEY
  const headerKey = request.headers.get('x-admin-key')
  if (adminKey && headerKey && headerKey.length === adminKey.length) {
    try {
      if (crypto.timingSafeEqual(Buffer.from(headerKey), Buffer.from(adminKey))) return true
    } catch { /* guarded */ }
  }
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  if (cronSecret && authHeader) {
    const expected = `Bearer ${cronSecret}`
    if (authHeader.length === expected.length) {
      try {
        if (crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) return true
      } catch { /* guarded */ }
    }
  }
  return false
}

const sevLabel = ['', 'MONEY LEAK', 'PIPELINE GAP', 'SIGNAL']

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const events = await loadWindow(14, Date.now())
    const findings = analyze(events)
    const { opened, refreshed, resolved } = await reconcileFindings(findings)

    const { rows: open } = await sql`
      SELECT key, severity, title, evidence, proposed_change, first_seen
      FROM analytics_findings WHERE status = 'open'
      ORDER BY severity ASC, first_seen ASC
    `

    const purchases = events.filter((e) => e.type === 'purchase_complete').length
    const tours = events.filter((e) => e.type === 'demo_tour_start').length
    const cals = events.filter((e) => e.type === 'cal_click').length

    const rowsHtml = open
      .map(
        (f) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
          <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:10px;font-weight:700;background:${f.severity === 1 ? '#fee2e2;color:#b91c1c' : f.severity === 2 ? '#fef3c7;color:#b45309' : '#e0f2fe;color:#0369a1'};">${sevLabel[f.severity as number]}</span>
          <p style="margin:6px 0 2px;font-size:14px;font-weight:700;color:#0f172a;">${f.title}</p>
          <p style="margin:0 0 4px;font-size:12px;color:#475569;">${f.evidence}</p>
          <p style="margin:0;font-size:12.5px;color:#0f766e;"><strong>Do:</strong> ${f.proposed_change}</p>
        </td>
      </tr>`,
      )
      .join('')

    if (open.length > 0) {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject: `CEA analytics — ${open.length} open work order${open.length > 1 ? 's' : ''} (${resolved} auto-resolved)`,
        html: `
          <div style="font-family:-apple-system,Segoe UI,sans-serif;max-width:640px;margin:0 auto;">
            <p style="font-size:13px;color:#475569;">Last 14 days: <strong>${purchases}</strong> purchases · <strong>${tours}</strong> demo tours · <strong>${cals}</strong> call bookings clicked · ${opened} new / ${refreshed} persisting / ${resolved} auto-resolved.</p>
            <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:12px;">${rowsHtml || '<tr><td style="padding:14px;font-size:13px;color:#475569;">No open work orders — the funnel has no measured leak this window.</td></tr>'}</table>
            <p style="font-size:12px;color:#64748b;margin-top:14px;">To action: tell Claude <strong>"run the analytics pass"</strong> — it reads these orders and implements them. Resolved items closed themselves from the data.</p>
          </div>`,
        tags: [{ name: 'type', value: 'analytics-review' }],
      })
    }

    return NextResponse.json({ ok: true, open: open.length, opened, refreshed, resolved })
  } catch (err) {
    console.error('[analytics-review] failed:', err)
    return NextResponse.json({ error: 'Review failed' }, { status: 500 })
  }
}
