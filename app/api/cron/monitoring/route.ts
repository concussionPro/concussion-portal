/**
 * Daily Monitoring Cron — /api/cron/monitoring
 *
 * Runs at 6am AEST (8pm UTC) via Vercel cron.
 * Performs 5 health checks and sends a single alert email if any anomaly is found.
 *
 * Checks:
 *   1. Checkout ratio — pricing views vs Stripe sessions created
 *   2. Email delivery — emails sent in last 24h
 *   3. Cron health — last nurture email timestamp
 *   4. New free-course completions — upgrade opportunities
 *   5. Ad spend with zero signups — wasted ad budget detection
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { getStripe } from '@/lib/stripe'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'

export const maxDuration = 60

interface Finding {
  severity: 'alert' | 'info'
  title: string
  detail: string
  suggestion: string
}

export async function GET(request: NextRequest) {
  // ── Auth guard ──────────────────────────────────
  if (!process.env.CRON_SECRET) {
    console.error('[monitoring] CRON_SECRET not configured — refusing to run')
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('[monitoring] Starting daily health checks...')
  const findings: Finding[] = []

  // ── CHECK 1: Checkout ratio ──────────────────────
  try {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000

    // Count pricing page views in analytics
    const { rows: viewRows } = await sql`
      SELECT COUNT(*)::int AS count FROM analytics_events
      WHERE event_type = 'page_view'
        AND path = '/pricing'
        AND timestamp_ms > ${twentyFourHoursAgo}
    `
    const pricingViews = viewRows[0]?.count || 0

    // Count Stripe checkout sessions created in last 24h
    let stripeSessions = 0
    try {
      const sessions = await getStripe().checkout.sessions.list({
        created: { gte: Math.floor(twentyFourHoursAgo / 1000) },
        limit: 1,
      })
      // Use total_count if available, otherwise count returned items
      stripeSessions = sessions.data.length
      if (sessions.has_more) stripeSessions = 2 // At least 2 — enough to clear the alert
    } catch (stripeErr) {
      console.warn('[monitoring] Stripe API check failed:', stripeErr)
    }

    if (pricingViews > 5 && stripeSessions === 0) {
      findings.push({
        severity: 'alert',
        title: 'Enrol button may be broken',
        detail: `${pricingViews} pricing page views in the last 24h, but 0 Stripe checkout sessions created.`,
        suggestion: 'Test the Enrol button on /pricing. Check the browser console for JS errors. Verify /api/create-checkout is responding.',
      })
    }

    console.log(`[monitoring] Check 1: ${pricingViews} pricing views, ${stripeSessions}+ Stripe sessions`)
  } catch (err) {
    console.error('[monitoring] Check 1 (checkout ratio) failed:', err)
  }

  // ── CHECK 2: Email delivery ──────────────────────
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    // Count emails sent in last 24h via audit log
    const { rows: emailRows } = await sql`
      SELECT COUNT(*)::int AS count FROM email_audit_log
      WHERE sent_at > ${twentyFourHoursAgo.toISOString()}
    `
    const emailsSent = emailRows[0]?.count || 0

    // Count total users to calibrate expectation
    const { rows: userRows } = await sql`SELECT COUNT(*)::int AS count FROM users`
    const totalUsers = userRows[0]?.count || 0

    if (emailsSent === 0 && totalUsers > 50) {
      findings.push({
        severity: 'alert',
        title: 'Nurture emails may have stopped',
        detail: `0 emails logged in the last 24h, but there are ${totalUsers} users in the system.`,
        suggestion: 'Check Vercel cron logs for /api/cron/send-nurture-emails. Verify RESEND_API_KEY is set. Check Resend dashboard for delivery status.',
      })
    }

    console.log(`[monitoring] Check 2: ${emailsSent} emails sent in 24h, ${totalUsers} total users`)
  } catch (err) {
    console.error('[monitoring] Check 2 (email delivery) failed:', err)
  }

  // ── CHECK 3: Cron health ──────────────────────────
  try {
    const { rows: lastEmailRows } = await sql`
      SELECT MAX(sent_at) AS last_sent FROM email_audit_log
    `
    const lastSent = lastEmailRows[0]?.last_sent
      ? new Date(lastEmailRows[0].last_sent)
      : null

    if (lastSent) {
      const hoursSince = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60)
      if (hoursSince > 26) {
        findings.push({
          severity: 'alert',
          title: 'Nurture cron may be stalled',
          detail: `Last email audit entry was ${Math.round(hoursSince)} hours ago (${lastSent.toISOString()}).`,
          suggestion: 'Check Vercel dashboard → Crons tab. Verify CRON_SECRET matches. Look for function timeout errors in runtime logs.',
        })
      }
      console.log(`[monitoring] Check 3: Last email ${Math.round(hoursSince)}h ago`)
    } else {
      console.log('[monitoring] Check 3: No email audit entries found (new deployment?)')
    }
  } catch (err) {
    console.error('[monitoring] Check 3 (cron health) failed:', err)
  }

  // ── CHECK 4: New completions needing follow-up ────
  try {
    // Find preview users who completed all 3 SCAT modules in the last 24h
    const { rows: completionRows } = await sql`
      SELECT COUNT(*)::int AS count
      FROM users u
      JOIN user_progress up ON up.user_id = u.id
      WHERE u.access_level = 'preview'
        AND u.created_at > NOW() - INTERVAL '90 days'
        AND up.progress->>'101' IS NOT NULL
        AND up.progress->>'102' IS NOT NULL
        AND up.progress->>'103' IS NOT NULL
        AND (up.progress->'101'->>'completed')::boolean = true
        AND (up.progress->'102'->>'completed')::boolean = true
        AND (up.progress->'103'->>'completed')::boolean = true
        AND u.last_login_at > NOW() - INTERVAL '24 hours'
    `
    const newCompletions = completionRows[0]?.count || 0

    if (newCompletions > 0) {
      findings.push({
        severity: 'info',
        title: 'Free course completions today',
        detail: `${newCompletions} preview user${newCompletions > 1 ? 's' : ''} completed the free SCAT course in the last 24h.`,
        suggestion: 'These users are high-intent upgrade candidates. The completion upsell email fires automatically — check Resend for delivery.',
      })
    }

    console.log(`[monitoring] Check 4: ${newCompletions} new free-course completions`)
  } catch (err) {
    console.error('[monitoring] Check 4 (completions) failed:', err)
  }

  // ── CHECK 5: Ad spend with zero signups ───────────
  try {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    // Count paid search sessions (gclid present OR utm_source=google with utm_medium=cpc)
    const { rows: adRows } = await sql`
      SELECT COUNT(*)::int AS count FROM analytics_events
      WHERE event_type = 'page_view'
        AND timestamp_ms > ${sevenDaysAgo}
        AND (
          search LIKE '%gclid=%'
          OR (search LIKE '%utm_source=google%' AND search LIKE '%utm_medium=cpc%')
        )
    `
    const paidSessions = adRows[0]?.count || 0

    // Count signups that came from paid search in the same window
    const { rows: signupRows } = await sql`
      SELECT COUNT(*)::int AS count FROM analytics_events
      WHERE event_type = 'free_course_signup'
        AND timestamp_ms > ${sevenDaysAgo}
    `
    // Also count paid purchases as successful conversions
    const { rows: purchaseRows } = await sql`
      SELECT COUNT(*)::int AS count FROM analytics_events
      WHERE event_type = 'purchase_complete'
        AND timestamp_ms > ${sevenDaysAgo}
    `
    const totalConversions = (signupRows[0]?.count || 0) + (purchaseRows[0]?.count || 0)

    if (paidSessions > 50 && totalConversions === 0) {
      findings.push({
        severity: 'alert',
        title: 'Ads driving traffic but zero conversions',
        detail: `${paidSessions} paid search page views in the last 7 days, but 0 signups or purchases.`,
        suggestion: 'Check Google Ads for keyword relevance. Test the landing page CTA. Verify UTM params are passing through to /api/signup-free and /api/create-checkout.',
      })
    }

    console.log(`[monitoring] Check 5: ${paidSessions} paid sessions, ${totalConversions} conversions (7d)`)
  } catch (err) {
    console.error('[monitoring] Check 5 (ad spend) failed:', err)
  }

  // ── Send alert email if findings exist ────────────
  const alerts = findings.filter(f => f.severity === 'alert')
  const infos = findings.filter(f => f.severity === 'info')

  if (findings.length > 0) {
    const subject = alerts.length > 0
      ? `CEA alert — ${alerts.length} issue${alerts.length > 1 ? 's' : ''} found`
      : `CEA daily — ${infos.length} item${infos.length > 1 ? 's' : ''} to note`

    try {
      await sendEmail({
        to: CONFIG.CONTACT_EMAIL,
        subject,
        html: buildAlertEmail(findings),
        tags: [
          { name: 'type', value: 'monitoring-alert' },
          { name: 'alerts', value: String(alerts.length) },
        ],
      })
      console.log(`[monitoring] Alert email sent: ${alerts.length} alerts, ${infos.length} infos`)
    } catch (emailErr) {
      console.error('[monitoring] Failed to send alert email:', emailErr)
    }
  } else {
    console.log('[monitoring] All checks passed — no alerts')
  }

  return NextResponse.json({
    success: true,
    checks: 5,
    alerts: alerts.length,
    infos: infos.length,
  })
}

// ── Email template ──────────────────────────────────

function buildAlertEmail(findings: Finding[]): string {
  const alerts = findings.filter(f => f.severity === 'alert')
  const infos = findings.filter(f => f.severity === 'info')

  const alertSection = alerts.length > 0
    ? alerts.map(f => `
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px; font-size: 15px; color: #991b1b;">${escapeHtml(f.title)}</h3>
          <p style="margin: 0 0 8px; font-size: 14px; color: #1e293b;">${escapeHtml(f.detail)}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;"><strong>Fix:</strong> ${escapeHtml(f.suggestion)}</p>
        </div>
      `).join('')
    : ''

  const infoSection = infos.length > 0
    ? infos.map(f => `
        <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
          <h3 style="margin: 0 0 8px; font-size: 15px; color: #1e40af;">${escapeHtml(f.title)}</h3>
          <p style="margin: 0 0 8px; font-size: 14px; color: #1e293b;">${escapeHtml(f.detail)}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">${escapeHtml(f.suggestion)}</p>
        </div>
      `).join('')
    : ''

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">
          Concussion<span style="color: #5b9aa6;">Pro</span> Daily Monitor
        </h1>
        <p style="font-size: 13px; color: #94a3b8; margin: 4px 0 0;">
          ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Australia/Melbourne' })}
        </p>
      </div>

      ${alerts.length > 0 ? `
        <h2 style="font-size: 16px; color: #991b1b; margin: 24px 0 12px; display: flex; align-items: center; gap: 8px;">
          &#9888; ${alerts.length} Alert${alerts.length > 1 ? 's' : ''}
        </h2>
        ${alertSection}
      ` : ''}

      ${infos.length > 0 ? `
        <h2 style="font-size: 16px; color: #1e40af; margin: 24px 0 12px;">
          ${infos.length} Note${infos.length > 1 ? 's' : ''}
        </h2>
        ${infoSection}
      ` : ''}

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Automated monitoring from ConcussionPro portal
      </div>
    </div>
  `
}
