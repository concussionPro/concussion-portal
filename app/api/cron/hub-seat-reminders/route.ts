/**
 * Cron Job: Hub Pack seat-uptake reminders (owner-facing)
 *
 * Vercel Cron: daily at UTC 22:20 (9:20am AEDT) — configured in vercel.json.
 *
 * Problem this solves: a clinic buys N seats, the buyer never forwards the
 * key, and the paid seats die silently. For every hub purchased ≥3 days ago
 * that still has unclaimed clinician seats, email the OWNER once at day 3 and
 * once at day 10 with the seat status + the forwardable key + /join-clinic
 * link.
 *
 * Sent-state: reuses the standing email_audit_log dedupe pattern (INSERT-first
 * with ON CONFLICT DO NOTHING), keyed `hub_seat_reminder_{stage}_{code}` —
 * i.e. UNIQUE(key, stage). A hub that's already ≥10 days old on first pass
 * gets ONLY the day-10 email; the day-3 row is inserted as consumed so it can
 * never fire stale later.
 *
 * Suppression: email_suppression is checked before every send and FAILS
 * CLOSED — if the table can't be read the whole run aborts (CLAUDE.md:
 * unsubs are zero-tolerance). users.nurture_unsubscribed is also honoured.
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import {
  HUB_SEAT_REMINDER_EMAILS,
  eligibleHubReminderStages,
} from '@/lib/email-sequences'

function redact(e: string) { return e.length > 3 ? e.slice(0, 3) + '***' : '***' }

export const maxDuration = 60

export async function GET(request: Request) {
  try {
    // Guard: only run on the primary project (same convention as the other crons)
    const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || ''
    if (prodUrl && !prodUrl.includes('concussion-education-australia.com')) {
      return NextResponse.json({ skipped: true, reason: 'Not primary project' })
    }

    // Guard: CRON_SECRET must be set
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET not configured — refusing to run')
      return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
    }

    // Verify cron secret (timing-safe)
    const authHeader = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (!authHeader || authHeader.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sent-state table (shared with every other lifecycle lane)
    await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

    // Global suppression list — FAIL CLOSED: if it can't be read, abort the
    // run rather than proceed with an empty set.
    let suppressedEmails: Set<string>
    try {
      const { rows: suppressionRows } = await sql<{ email: string }>`
        SELECT LOWER(email) AS email FROM email_suppression
      `
      suppressedEmails = new Set(suppressionRows.map(r => r.email))
    } catch (err) {
      console.error('[HubSeatReminders] Failed to load email_suppression — ABORTING run (fail closed):', err)
      return NextResponse.json(
        { error: 'email_suppression load failed — run aborted (fail closed)' },
        { status: 503 }
      )
    }

    // Every hub old enough for the first reminder, with its clinician seat
    // usage and the owner's name (captured when their own seat was claimed at
    // purchase) resolved in one pass.
    const { rows: hubs } = await sql<{
      code: string
      owner_email: string
      clinic_name: string | null
      clinician_seats: number
      created_at: string
      clinician_used: number
      owner_name: string | null
    }>`
      SELECT h.code, h.owner_email, h.clinic_name, h.clinician_seats, h.created_at,
             (SELECT COUNT(*)::int FROM course_hub_members m
              WHERE m.hub_code = h.code AND m.role = 'clinician') AS clinician_used,
             (SELECT m.name FROM course_hub_members m
              WHERE m.hub_code = h.code AND m.email = h.owner_email LIMIT 1) AS owner_name
      FROM course_hubs h
      WHERE h.created_at <= NOW() - INTERVAL '3 days'
      ORDER BY h.created_at ASC
    `

    const now = Date.now()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
    let emailsSent = 0
    let skipped = 0
    const errors: string[] = []

    for (const hub of hubs) {
      const claimed = hub.clinician_used
      const cap = hub.clinician_seats
      // Fully-redeemed hub — nothing to recover, stop reminding forever.
      if (claimed >= cap) { skipped++; continue }

      const ownerEmail = hub.owner_email.toLowerCase()

      // Suppression gate (belt-and-braces: set loaded fail-closed above)
      if (suppressedEmails.has(ownerEmail)) {
        console.log(`[HubSeatReminders] Skipped ${redact(ownerEmail)} — suppressed`)
        skipped++
        continue
      }

      // Honour the standing marketing opt-out on the owner's user record.
      // On lookup failure, skip — never send when the opt-out state is unknown.
      try {
        const { rows: userRows } = await sql<{ nurture_unsubscribed: boolean | null }>`
          SELECT nurture_unsubscribed FROM users WHERE email = ${ownerEmail} LIMIT 1
        `
        if (userRows.length > 0 && userRows[0].nurture_unsubscribed) {
          console.log(`[HubSeatReminders] Skipped ${redact(ownerEmail)} — nurture unsubscribed`)
          skipped++
          continue
        }
      } catch (err) {
        console.error(`[HubSeatReminders] Opt-out check failed for ${redact(ownerEmail)}, skipping (fail closed):`, err)
        skipped++
        continue
      }

      const ageDays = Math.floor((now - new Date(hub.created_at).getTime()) / (1000 * 60 * 60 * 24))
      const stages = eligibleHubReminderStages(ageDays)
      if (stages.length === 0) continue

      // Claim ALL eligible stage rows, send only the LATEST newly-claimed one.
      // (First pass on an old hub: day3 row is consumed silently, day10 sends.)
      let stageToSend: (typeof stages)[number] | null = null
      let auditKey = ''
      for (const stage of stages) {
        const key = `hub_seat_reminder_${stage}_${hub.code}`
        const { rowCount } = await sql`
          INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${key}, NOW())
          ON CONFLICT (audit_key) DO NOTHING
        `
        if (rowCount && rowCount > 0) {
          stageToSend = stage
          auditKey = key
        }
      }
      if (!stageToSend) continue // both stages already sent

      const tpl = HUB_SEAT_REMINDER_EMAILS[stageToSend]
      const redeemUrl = `${baseUrl}/join-clinic?key=${hub.code}`
      const unsubToken = generateUnsubscribeToken(ownerEmail)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(ownerEmail)}&token=${unsubToken}`

      const html = tpl.template({
        name: hub.owner_name || ownerEmail.split('@')[0],
        claimed,
        cap,
        hubKey: hub.code,
        redeemUrl,
        clinicName: hub.clinic_name,
      }).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      // sendEmail returns false (never throws) on failure — roll back the
      // audit row so the next run retries instead of marking it sent forever.
      let sent = false
      try {
        sent = await sendEmail({
          to: ownerEmail,
          subject: tpl.subject(claimed, cap),
          html,
          tags: [
            { name: 'sequence', value: 'hub-seat-reminder' },
            { name: 'stage', value: stageToSend },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
      } catch (err) {
        console.error(`[HubSeatReminders] ${stageToSend} send threw for ${redact(ownerEmail)}:`, err)
      }

      if (sent) {
        emailsSent++
        console.log(`[HubSeatReminders] ${stageToSend} → ${redact(ownerEmail)} (${hub.code}: ${claimed}/${cap} claimed)`)
      } else {
        errors.push(`${stageToSend} ${hub.code}: send failed`)
        try {
          await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
        } catch (err) {
          console.error(`[HubSeatReminders] Failed to roll back audit row ${auditKey}:`, err)
        }
      }
    }

    return NextResponse.json({
      success: true,
      hubsChecked: hubs.length,
      emailsSent,
      skipped,
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (error) {
    console.error('[HubSeatReminders] Cron job error:', error)
    return NextResponse.json({ error: 'Failed to send hub seat reminders' }, { status: 500 })
  }
}
