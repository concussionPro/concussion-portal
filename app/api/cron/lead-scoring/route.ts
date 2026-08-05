/**
 * Nightly Lead Scoring Cron — /api/cron/lead-scoring
 *
 * Runs at 7am AEST (9pm UTC) via Vercel cron.
 * Scores every free (preview) user 0-100 and sends a morning briefing email.
 *
 * Scoring model (max 100):
 *   1. Module progress  — max 40pts (SCAT modules 101-103)
 *   2. Pricing page views — max 25pts (matched via signup IP)
 *   3. Return visits      — max 15pts (distinct visit days by IP)
 *   4. Recency            — max 10pts (last_login_at)
 *   5. Signup source      — max 10pts (paid search > campaign > referral > direct)
 *
 * Email sections:
 *   - HOT LEADS (>= 60)    — ready for personal follow-up
 *   - WARMING UP (30-59)    — let nurture sequence continue
 *   - DORMANT (< 30)        — summary count only
 *   - WORKSHOP PIPELINE     — paid practical-day seats per city vs threshold
 *                             (CCM full-course + CRM 'crm-practical' — the day
 *                              is shared, so both streams fill the same room)
 */

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { CONFIG } from '@/lib/config'
import { CRM_PRACTICAL_SLUG } from '@/lib/crm-course'

export const maxDuration = 60

interface ScoredLead {
  email: string
  name: string
  score: number
  breakdown: {
    moduleProgress: number
    pricingViews: number
    returnVisits: number
    recency: number
    signupSource: number
  }
  modulesCompleted: number
  modulesStarted: number
  pricingViewCount: number
  daysSinceSignup: number
  daysSinceLastLogin: number
  suggestedAction: string
}

export async function GET(request: NextRequest) {
  // ── Auth guard ──────────────────────────────────
  if (!process.env.CRON_SECRET) {
    console.error('[lead-scoring] CRON_SECRET not configured')
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

  console.log('[lead-scoring] Starting nightly lead scoring...')

  try {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const ninetyDaysAgoMs = Date.now() - 90 * 24 * 60 * 60 * 1000
  const now = Date.now()

  // ── Step 1: Get all preview users from last 90 days ────
  const { rows: users } = await sql`
    SELECT id, email, name, created_at, last_login_at, signup_source
    FROM users
    WHERE access_level = 'preview'
      -- CRM (EP stream) buyers carry access_level 'preview' (isolated streams,
      -- lib/crm-course.ts) — never treat a paying EP customer as a free lead.
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(email) AND cp.course_slug = 'crm'
      )
      AND created_at > ${ninetyDaysAgo.toISOString()}
      AND COALESCE(is_test, false) = false
    ORDER BY created_at DESC
  `

  if (users.length === 0) {
    console.log('[lead-scoring] No preview users to score')
    return NextResponse.json({ success: true, scored: 0 })
  }

  // ── Step 2: Get module progress for all preview users ────
  const { rows: progressRows } = await sql`
    SELECT up.user_id, up.progress
    FROM user_progress up
    JOIN users u ON up.user_id = u.id
    WHERE u.access_level = 'preview'
      -- A CRM (EP stream) buyer's access_level stays 'preview' because the two
      -- streams are isolated (lib/crm-course.ts). Excluded here so a PAYING EP
      -- customer is never swept into the free-course funnel.
      AND NOT EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(u.email) AND cp.course_slug = 'crm'
      )
      AND u.created_at > ${ninetyDaysAgo.toISOString()}
  `
  const progressMap = new Map<string, Record<string, { completed?: boolean }>>()
  for (const r of progressRows) {
    progressMap.set(r.user_id as string, r.progress as Record<string, { completed?: boolean }>)
  }

  // ── Step 3: Map users to IPs via free_course_signup events ────
  // The /api/signup-free route tracks a server-side event with the user's real IP.
  // We match by timestamp: the signup event within ±2min of user.created_at.
  const { rows: signupEvents } = await sql`
    SELECT ip, timestamp_ms
    FROM analytics_events
    WHERE event_type = 'free_course_signup'
      AND timestamp_ms > ${ninetyDaysAgoMs}
      AND ip IS NOT NULL
      AND ip != 'unknown'
    ORDER BY timestamp_ms DESC
  `

  const userIpMap = new Map<string, string>()
  for (const user of users) {
    const createdMs = new Date(user.created_at).getTime()
     
    const match = signupEvents.find(
      (e) => Math.abs(Number(e.timestamp_ms) - createdMs) < 2 * 60 * 1000
    )
    if (match) {
      userIpMap.set(user.id, match.ip)
    }
  }

  console.log(`[lead-scoring] Matched ${userIpMap.size}/${users.length} users to IPs`)

  // ── Step 4: Batch analytics queries by matched IPs ────
  const matchedIps = [...new Set(userIpMap.values())]
  const pricingViewsByIp = new Map<string, number>()
  const visitDaysByIp = new Map<string, number>()
  const sourceByIp = new Map<string, string>()

  if (matchedIps.length > 0) {
    const ipSet = new Set(matchedIps)

    // Pricing page views per IP (filter in JS since sql`` doesn't support array params)
    const { rows: pricingRows } = await sql`
      SELECT ip, COUNT(*)::int AS views
      FROM analytics_events
      WHERE event_type = 'page_view'
        AND path = '/pricing'
        AND timestamp_ms > ${ninetyDaysAgoMs}
        AND ip IS NOT NULL
      GROUP BY ip
    `
    for (const r of pricingRows) {
      if (ipSet.has(r.ip)) pricingViewsByIp.set(r.ip, r.views)
    }

    // Distinct visit days per IP
    const { rows: visitRows } = await sql`
      SELECT ip, COUNT(DISTINCT DATE(to_timestamp(timestamp_ms / 1000)))::int AS days
      FROM analytics_events
      WHERE event_type = 'page_view'
        AND timestamp_ms > ${ninetyDaysAgoMs}
        AND ip IS NOT NULL
      GROUP BY ip
    `
    for (const r of visitRows) {
      if (ipSet.has(r.ip)) visitDaysByIp.set(r.ip, r.days)
    }

    // First visit source per IP (referrer + search params reveal acquisition channel)
    const { rows: sourceRows } = await sql`
      SELECT DISTINCT ON (ip) ip, search, referrer
      FROM analytics_events
      WHERE event_type = 'page_view'
        AND timestamp_ms > ${ninetyDaysAgoMs}
        AND ip IS NOT NULL
      ORDER BY ip, timestamp_ms ASC
    `
    for (const row of sourceRows) {
      if (!ipSet.has(row.ip)) continue
      if (row.search?.includes('gclid=')) {
        sourceByIp.set(row.ip, 'paid_search')
      } else if (row.search?.includes('utm_source=')) {
        sourceByIp.set(row.ip, 'campaign')
      } else if (row.referrer && !row.referrer.includes('concussion-education')) {
        sourceByIp.set(row.ip, 'referral')
      } else {
        sourceByIp.set(row.ip, 'direct')
      }
    }
  }

  // ── Step 5: Score each user ────
  const scoredLeads: ScoredLead[] = []

  for (const user of users) {
    const progress = progressMap.get(user.id) || {}
    const ip = userIpMap.get(user.id)

    // 1. Module progress (max 40)
    //    Started = 5pts each, completed = additional ~8.3pts each
    let modulesStarted = 0
    let modulesCompleted = 0
    for (const moduleId of ['101', '102', '103']) {
      if (progress[moduleId]) {
        modulesStarted++
        if (progress[moduleId]?.completed) modulesCompleted++
      }
    }
    const moduleScore = Math.min(40, Math.round(modulesStarted * 5 + modulesCompleted * 8.33))

    // 2. Pricing page views (max 25)
    const pricingViewCount = ip ? (pricingViewsByIp.get(ip) || 0) : 0
    let pricingScore = 0
    if (pricingViewCount >= 6) pricingScore = 25
    else if (pricingViewCount >= 4) pricingScore = 20
    else if (pricingViewCount >= 2) pricingScore = 15
    else if (pricingViewCount >= 1) pricingScore = 10

    // 3. Return visits (max 15)
    const visitDays = ip ? (visitDaysByIp.get(ip) || 1) : 1
    let visitScore = 0
    if (visitDays >= 5) visitScore = 15
    else if (visitDays >= 3) visitScore = 10
    else if (visitDays >= 2) visitScore = 5

    // 4. Recency (max 10)
    const lastLogin = user.last_login_at
      ? new Date(user.last_login_at).getTime()
      : new Date(user.created_at).getTime()
    const daysSinceLogin = (now - lastLogin) / (1000 * 60 * 60 * 24)
    let recencyScore = 0
    if (daysSinceLogin <= 1) recencyScore = 10
    else if (daysSinceLogin <= 3) recencyScore = 7
    else if (daysSinceLogin <= 7) recencyScore = 4
    else if (daysSinceLogin <= 14) recencyScore = 2

    // 5. Signup source (max 10)
    const source = ip ? (sourceByIp.get(ip) || 'direct') : 'direct'
    let sourceScore = 3 // default: direct
    if (source === 'paid_search') sourceScore = 10
    else if (source === 'campaign') sourceScore = 7
    else if (source === 'referral') sourceScore = 5

    const totalScore = Math.min(100, moduleScore + pricingScore + visitScore + recencyScore + sourceScore)

    // Suggested action based on behaviour signals
    let suggestedAction: string
    if (modulesCompleted === 3 && pricingViewCount > 0) {
      suggestedAction = 'Completed course + viewed pricing — highest conversion potential'
    } else if (modulesCompleted === 3) {
      suggestedAction = 'Completed course but no pricing views — send personalised follow-up'
    } else if (pricingViewCount >= 3) {
      suggestedAction = 'Repeated pricing views without purchase — may need objection handling'
    } else if (modulesStarted > 0 && daysSinceLogin > 7) {
      suggestedAction = 'Started but stalled — re-engagement email may help'
    } else if (modulesStarted === 0 && daysSinceLogin <= 3) {
      suggestedAction = 'New signup, hasn\'t started — verify Day 0 email delivered'
    } else if (modulesStarted === 0) {
      suggestedAction = 'Never started the course'
    } else {
      suggestedAction = 'In progress — let nurture sequence continue'
    }

    const daysSinceSignup = Math.floor(
      (now - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )

    scoredLeads.push({
      email: user.email,
      name: user.name || user.email.split('@')[0],
      score: totalScore,
      breakdown: {
        moduleProgress: moduleScore,
        pricingViews: pricingScore,
        returnVisits: visitScore,
        recency: recencyScore,
        signupSource: sourceScore,
      },
      modulesCompleted,
      modulesStarted,
      pricingViewCount,
      daysSinceSignup,
      daysSinceLastLogin: Math.round(daysSinceLogin),
      suggestedAction,
    })
  }

  // Sort by score descending
  scoredLeads.sort((a, b) => b.score - a.score)

  const hotLeads = scoredLeads.filter(l => l.score >= 60)
  const warmingUp = scoredLeads.filter(l => l.score >= 30 && l.score < 60)
  const dormant = scoredLeads.filter(l => l.score < 30)

  // ── Step 6: Workshop pipeline ────
  let workshopPipeline: { location: string; paid: number; interested: number }[] = []
  try {
    // PAID practical-day seats per city — BOTH streams. The day is shared
    // between CCM and CRM, and a CRM Complete/upgrade buyer keeps access_level
    // 'preview' (isolated streams, lib/crm-course.ts), so the access_level
    // test alone reported a paid CRM seat as zero demand for that city.
    const { rows: paidRows } = await sql`
      SELECT location, COUNT(*)::int AS count FROM (
        SELECT DISTINCT u.id, u.workshop_location AS location
        FROM users u
        LEFT JOIN course_purchases cp
          ON LOWER(cp.user_email) = LOWER(u.email)
         AND cp.course_slug = ${CRM_PRACTICAL_SLUG}
        WHERE u.workshop_location IS NOT NULL
          AND u.workshop_location != ''
          AND (u.access_level = 'full-course' OR cp.id IS NOT NULL)
      ) seats
      GROUP BY location
    `
    const { rows: interestRows } = await sql`
      SELECT city AS location, COUNT(*)::int AS count
      FROM workshop_interest
      GROUP BY city
    `

    const locationMap = new Map<string, { paid: number; interested: number }>()
    for (const r of paidRows) {
      locationMap.set(r.location, { paid: r.count, interested: 0 })
    }
    for (const r of interestRows) {
      const existing = locationMap.get(r.location) || { paid: 0, interested: 0 }
      existing.interested = r.count
      locationMap.set(r.location, existing)
    }
    workshopPipeline = [...locationMap.entries()].map(([location, data]) => ({
      location,
      ...data,
    }))
  } catch (err) {
    console.warn('[lead-scoring] Workshop pipeline query failed:', err)
  }

  // ── Step 7: Send briefing email ────
  const subject = hotLeads.length > 0
    ? `${hotLeads.length} hot lead${hotLeads.length > 1 ? 's' : ''} — CEA morning briefing`
    : `CEA morning briefing — ${scoredLeads.length} leads scored`

  try {
    await sendEmail({
      to: CONFIG.CONTACT_EMAIL,
      subject,
      html: buildBriefingEmail(hotLeads, warmingUp, dormant, workshopPipeline),
      tags: [
        { name: 'type', value: 'lead-scoring' },
        { name: 'hot', value: String(hotLeads.length) },
      ],
    })
    console.log(`[lead-scoring] Briefing sent: ${hotLeads.length} hot, ${warmingUp.length} warming, ${dormant.length} dormant`)
  } catch (emailErr) {
    console.error('[lead-scoring] Failed to send briefing:', emailErr)
  }

  return NextResponse.json({
    success: true,
    scored: scoredLeads.length,
    hot: hotLeads.length,
    warming: warmingUp.length,
    dormant: dormant.length,
  })

  } catch (err) {
    const errMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err)
    console.error('[lead-scoring] Fatal error:', errMsg)
    return NextResponse.json({ error: 'Lead scoring failed', detail: errMsg.slice(0, 200) }, { status: 500 })
  }
}

// ── Email template ──────────────────────────────────

function buildBriefingEmail(
  hotLeads: ScoredLead[],
  warmingUp: ScoredLead[],
  dormant: ScoredLead[],
  workshopPipeline: { location: string; paid: number; interested: number }[],
): string {
  const total = hotLeads.length + warmingUp.length + dormant.length
  const threshold = CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD

  const scoreBar = (score: number) => {
    const pct = Math.min(100, score)
    const color = score >= 60 ? '#10b981' : score >= 30 ? '#f59e0b' : '#94a3b8'
    return `<div style="background: #f1f5f9; border-radius: 4px; height: 8px; width: 100px; display: inline-block; vertical-align: middle;">
      <div style="background: ${color}; border-radius: 4px; height: 8px; width: ${pct}px;"></div>
    </div>`
  }

  const leadRow = (lead: ScoredLead) => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 8px; font-size: 13px;">
        <strong>${escapeHtml(lead.name)}</strong><br>
        <span style="color: #64748b; font-size: 12px;">${escapeHtml(lead.email)}</span>
      </td>
      <td style="padding: 10px 8px; font-size: 13px; text-align: center;">
        <strong>${lead.score}</strong> ${scoreBar(lead.score)}
      </td>
      <td style="padding: 10px 8px; font-size: 12px; color: #64748b;">
        ${lead.modulesCompleted}/3 done${lead.pricingViewCount > 0 ? ` &middot; ${lead.pricingViewCount} pricing view${lead.pricingViewCount > 1 ? 's' : ''}` : ''}
        &middot; ${lead.daysSinceLastLogin === 0 ? 'today' : `${lead.daysSinceLastLogin}d ago`}
      </td>
      <td style="padding: 10px 8px; font-size: 12px; color: #475569;">
        ${escapeHtml(lead.suggestedAction)}
      </td>
    </tr>
  `

  const tableHeader = `
    <tr style="background: #f8fafc;">
      <th style="padding: 8px; text-align: left; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Lead</th>
      <th style="padding: 8px; text-align: center; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Score</th>
      <th style="padding: 8px; text-align: left; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Activity</th>
      <th style="padding: 8px; text-align: left; font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase;">Suggested Action</th>
    </tr>
  `

  const hotSection = hotLeads.length > 0
    ? `
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; color: #059669; margin: 0 0 12px; display: flex; align-items: center; gap: 6px;">
          &#128293; ${hotLeads.length} Hot Lead${hotLeads.length > 1 ? 's' : ''} <span style="font-size: 12px; color: #94a3b8; font-weight: 400;">(score &ge; 60)</span>
        </h2>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px;">
          ${tableHeader}
          ${hotLeads.map(leadRow).join('')}
        </table>
      </div>
    `
    : ''

  const warmSection = warmingUp.length > 0
    ? `
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; color: #d97706; margin: 0 0 12px;">
          &#9832; ${warmingUp.length} Warming Up <span style="font-size: 12px; color: #94a3b8; font-weight: 400;">(score 30-59)</span>
        </h2>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px;">
          ${tableHeader}
          ${warmingUp.slice(0, 10).map(leadRow).join('')}
          ${warmingUp.length > 10 ? `<tr><td colspan="4" style="padding: 10px; text-align: center; font-size: 12px; color: #94a3b8;">+ ${warmingUp.length - 10} more</td></tr>` : ''}
        </table>
      </div>
    `
    : ''

  const dormantSection = dormant.length > 0
    ? `
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; color: #94a3b8; margin: 0 0 8px;">
          &#128164; ${dormant.length} Dormant <span style="font-size: 12px; font-weight: 400;">(score &lt; 30)</span>
        </h2>
        <p style="font-size: 13px; color: #64748b; margin: 0;">
          ${dormant.filter(l => l.modulesStarted === 0).length} never started
          &middot; ${dormant.filter(l => l.daysSinceLastLogin > 14).length} inactive 14+ days
        </p>
      </div>
    `
    : ''

  const workshopSection = workshopPipeline.length > 0
    ? `
      <div style="margin-bottom: 28px;">
        <h2 style="font-size: 16px; color: #1e40af; margin: 0 0 12px;">
          &#127891; Workshop Pipeline
        </h2>
        ${workshopPipeline.map(w => {
          const pct = Math.min(100, Math.round((w.paid / threshold) * 100))
          const cityName = w.location.charAt(0).toUpperCase() + w.location.slice(1).replace(/-/g, ' ')
          return `
            <div style="background: #f0f9ff; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <strong style="font-size: 14px; color: #1e293b;">${escapeHtml(cityName)}</strong>
                <span style="font-size: 13px; color: #64748b;">${w.paid}/${threshold} paid${w.interested > 0 ? ` + ${w.interested} interested` : ''}</span>
              </div>
              <div style="background: #dbeafe; border-radius: 4px; height: 8px;">
                <div style="background: #3b82f6; border-radius: 4px; height: 8px; width: ${pct}%;"></div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
    : ''

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 40px 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0;">
          Concussion<span style="color: #5b9aa6;">Pro</span> Lead Briefing
        </h1>
        <p style="font-size: 13px; color: #94a3b8; margin: 4px 0 0;">
          ${new Date().toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Australia/Melbourne' })}
        </p>
      </div>

      <!-- Summary stats -->
      <div style="display: flex; gap: 12px; margin-bottom: 28px; text-align: center;">
        <div style="flex: 1; background: #f0fdf4; border-radius: 8px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #059669;">${hotLeads.length}</div>
          <div style="font-size: 12px; color: #64748b;">Hot</div>
        </div>
        <div style="flex: 1; background: #fffbeb; border-radius: 8px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #d97706;">${warmingUp.length}</div>
          <div style="font-size: 12px; color: #64748b;">Warming</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #94a3b8;">${dormant.length}</div>
          <div style="font-size: 12px; color: #64748b;">Dormant</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px;">
          <div style="font-size: 28px; font-weight: 700; color: #1e293b;">${total}</div>
          <div style="font-size: 12px; color: #64748b;">Total</div>
        </div>
      </div>

      ${hotSection}
      ${warmSection}
      ${dormantSection}
      ${workshopSection}

      <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        Lead scores: modules (40) + pricing views (25) + return visits (15) + recency (10) + source (10)<br>
        Automated lead scoring from ConcussionPro portal
      </div>
    </div>
  `
}
