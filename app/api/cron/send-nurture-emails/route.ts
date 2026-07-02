/**
 * Cron Job: Send All Automated Email Sequences
 *
 * Vercel Cron: Runs daily at 9am AEDT (UTC 22:00)
 * Configured in vercel.json
 *
 * Handles:
 * 1. SCAT6 Mastery nurture sequence (preview/free users)
 * 2. Post-purchase onboarding sequence (paid users)
 * 3. Abandoned checkout recovery emails
 * 4. Pre-workshop prep emails (full-course users)
 */

import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { loadUsers } from '@/lib/users'
import { sendEmail } from '@/lib/resend-client'
import { SCAT_MASTERY_SEQUENCE, POST_PURCHASE_SEQUENCE, ABANDONED_CHECKOUT_SEQUENCE, PRE_WORKSHOP_SEQUENCE, ONLINE_UPGRADE_SEQUENCE, REENGAGEMENT_EMAIL, WORKSHOP_RESERVATION_EMAIL, WORKSHOP_MOMENTUM_EMAILS, WORKSHOP_LOGISTICS_EMAIL, ALMOST_DONE_EMAIL, SCAT_COMPLETION_UPSELL, FREE_USER_REENGAGEMENT, FREE_LOGGED_IN_NO_PROGRESS, SCAT_DAY10_ENGAGEMENT, FREE_ALMOST_DONE, REFERENCE_UPGRADE_SEQUENCE, PAID_NO_PROGRESS_NUDGE, AI_SAFETY_CHECKLIST_DAY3, AI_SAFETY_CHECKLIST_DAY7, AI_SAFETY_CHECKLIST_DAY14 } from '@/lib/email-sequences'
import { getEnrollmentCount } from '@/lib/users'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { generateMagicLinkJWT } from '@/lib/magic-link-jwt'
import { isWorkshopAlumnus } from '@/lib/workshop-alumni'
import { sql } from '@/lib/db'
import { CONFIG } from '@/lib/config'
import { EmailScheduler } from '@/lib/email-scheduler'

function redact(e: string) { return e.length > 3 ? e.slice(0, 3) + '***' : '***' }

// Catch-up window: a missed cron day must not permanently skip a step.
// Match when daysSince is within [e.day, e.day + CATCHUP_WINDOW_DAYS]. The
// per-step email_audit_log dedupe key (keyed on the step's day, not the
// calendar day it was sent) prevents double-sends inside the window. Pick
// the LATEST eligible step so adjacent windows (e.g. post-purchase day 1 →
// day 3) prefer the current step over a stale one.
const CATCHUP_WINDOW_DAYS = 2
function findCatchUp<T extends { day: number }>(seq: readonly T[], daysSince: number): T | undefined {
  let match: T | undefined
  for (const e of seq) {
    if (daysSince >= e.day && daysSince <= e.day + CATCHUP_WINDOW_DAYS) {
      if (!match || e.day > match.day) match = e
    }
  }
  return match
}

/**
 * Send + honour sendEmail's boolean contract. sendEmail never throws — it
 * returns false on failure — so the audit-log dedupe row inserted BEFORE the
 * send must be explicitly rolled back here, otherwise a failed send is
 * permanently marked as sent and never retried.
 */
async function sendOrRollbackAudit(
  options: Parameters<typeof sendEmail>[0],
  auditKey: string,
  label: string,
): Promise<boolean> {
  let sent = false
  try {
    sent = await sendEmail(options)
  } catch (err) {
    console.error(`[Nurture] ${label} send threw:`, err)
  }
  if (!sent) {
    console.error(`[Nurture] ${label} → ${redact(options.to)} failed — rolling back audit row so next run retries`)
    try {
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
    } catch (err) {
      console.error(`[Nurture] Failed to roll back audit row ${auditKey}:`, err)
    }
  }
  return sent
}

export const maxDuration = 120

export async function GET(request: Request) {
  try {
    // Guard: only run on the primary project (concussion-portal with custom domain)
    // Prevents duplicate cron runs from the second Vercel project
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

    // Ensure audit table exists (prevents silent failures if table was dropped/never created)
    await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

    // Completed-workshop ALUMNI are excluded from ALL nurture/lifecycle outreach
    // (Zac 2026-06-15): they've finished the workshop — no onboarding, momentum,
    // or prep emails. They sit in the alumni cohort, no action, until a Level 2
    // exists to offer them. Auto-applies to every workshop once its date passes.
    const allUsers = await loadUsers()
    const alumniFilteredUsers = allUsers.filter(
      (u) =>
        !isWorkshopAlumnus({ accessLevel: u.accessLevel, workshopLocation: u.workshopLocation }) &&
        // Past attendees granted portal access (signup_source 'alumni-grant', and
        // any future 'alumni-*') are NOT new buyers — they did the course months
        // ago. Exclude from ALL nurture sequences so we never send a months-ago
        // attendee the new-buyer onboarding ("you picked up the course a few days
        // ago — start Module 1"). isWorkshopAlumnus misses them because granted
        // accounts have no workshopLocation. Bug fix 2026-06-26.
        !String(u.signupSource ?? '').startsWith('alumni'),
    )
    const now = new Date()
    let emailsSent = 0
    const errors: string[] = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

    // ── PER-USER WEEKLY CAP ──
    // Hard ceiling on how many nurture emails any single user can receive
    // in a rolling 7-day window. Across all the nurture sequences (SCAT
    // mastery, post-purchase, abandoned-checkout, pre-workshop, online
    // upgrade, re-engagement, reference upgrade, AI safety checklist),
    // a heavy user could otherwise stack up 4-5 emails in a week. Cap at
    // MAX_PER_USER_PER_WEEK to protect domain reputation + avoid the
    // "annoying sender" perception that tanks reply rate.
    const MAX_PER_USER_PER_WEEK = 3
    // Count 'delivered' — the webhook subscribes delivered/opened/clicked/
    // bounced/complained and never writes 'sent' rows, so counting only
    // 'sent' made the cap a no-op. 'sent' stays in the IN list in case we
    // ever subscribe to email.sent.
    const { rows: weeklyCounts } = await sql<{ recipient: string; n: number }>`
      SELECT LOWER(recipient) AS recipient, COUNT(*)::int AS n
      FROM email_events
      WHERE event_type IN ('sent', 'delivered')
        AND created_at > NOW() - INTERVAL '7 days'
        AND COALESCE(project, 'cea') = 'cea'
      GROUP BY LOWER(recipient)
    `
    const recipientSendsThisWeek = new Map<string, number>(
      weeklyCounts.map(r => [r.recipient, r.n] as const)
    )
    function exceedsWeeklyCap(email: string): boolean {
      const n = recipientSendsThisWeek.get(email.toLowerCase()) ?? 0
      return n >= MAX_PER_USER_PER_WEEK
    }
    function incrementWeeklySent(email: string): void {
      const k = email.toLowerCase()
      recipientSendsThisWeek.set(k, (recipientSendsThisWeek.get(k) ?? 0) + 1)
    }

    // Global suppression list (hard bounces / complaints / manual opt-outs).
    // MASTER BLACKLIST (2026-07-02): gates EVERY lane in this cron — the users
    // array is filtered against it once below, and the per-lane checks
    // (section 3 transactional, abandoned-checkout section 5) stay as
    // belt-and-braces. FAIL CLOSED: if the table can't be read we abort the
    // run rather than proceed with an empty set (which would email suppressed
    // addresses). Unsubs are zero-tolerance.
    let suppressedEmails: Set<string>
    try {
      const { rows: suppressionRows } = await sql<{ email: string }>`
        SELECT LOWER(email) AS email FROM email_suppression
      `
      suppressedEmails = new Set(suppressionRows.map(r => r.email))
    } catch (err) {
      console.error('[Nurture] Failed to load email_suppression — ABORTING run (fail closed):', err)
      return NextResponse.json(
        { error: 'email_suppression load failed — run aborted (fail closed)' },
        { status: 503 }
      )
    }

    // Single global suppression gate for every nurture/lifecycle lane.
    const users = alumniFilteredUsers.filter(
      (u) => !suppressedEmails.has(u.email.toLowerCase())
    )

    // Stagger nurture sends across ~30-45 min with per-domain throttling so
    // the daily batch doesn't read as a marketing blast to inbox providers.
    // Resend holds each send until its scheduledAt timestamp.
    const scheduler = new EmailScheduler()

    // ── 1. SCAT6 Mastery Nurture Sequence (preview users) ──
    // Routes Day 7 and Day 10 to variant emails based on user activity/progress
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue
      // AI Safety Checklist signups have their own dedicated sequence below — skip here
      if (user.signupSource === 'ai-safety-checklist') continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      // Skip Day 0 — welcome email is sent by the signup-free API or sync endpoint
      if (daysSinceSignup === 0) continue

      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
      const upgradeLink = `${baseUrl}/pricing`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Catch-up: if Day 0 welcome was never sent (e.g. Squarespace sync failure), send it now
      const day0AuditKey = `scat_day0_${user.id}`
      const { rows: day0Check } = await sql`SELECT 1 FROM email_audit_log WHERE audit_key = ${day0AuditKey}`
      if (day0Check.length === 0) {
        const day0Email = SCAT_MASTERY_SEQUENCE.find(e => e.day === 0)
        if (day0Email) {
          const { rowCount: day0Inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${day0AuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (day0Inserted && day0Inserted > 0) {
            const html = day0Email.template(user.name, loginLink).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
            const sent = await sendOrRollbackAudit({
              to: user.email,
              scheduledAt: scheduler.next(user.email),
              subject: day0Email.subject,
              html,
              tags: [
                { name: 'sequence', value: 'scat-mastery' },
                { name: 'day', value: '0' },
                { name: 'variant', value: 'catch-up' },
              ],
              headers: {
                'List-Unsubscribe': `<${unsubscribeUrl}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }, day0AuditKey, 'Day 0 catch-up')
            if (sent) {
              emailsSent++
              incrementWeeklySent(user.email)
              console.log(`[Nurture] Day 0 catch-up → ${redact(user.email)}`)
            }
          }
        }
        continue // They'll get their scheduled day email on the next cron run
      }

      const email = findCatchUp(SCAT_MASTERY_SEQUENCE, daysSinceSignup)
      if (!email) continue

      // Load user progress for routing decisions (Day 7+)
      let scatCompletedCount = 0
      if (daysSinceSignup >= 7) {
        try {
          const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
          if (progressRows.length > 0 && progressRows[0].progress) {
            const progress = progressRows[0].progress
            for (let i = 101; i <= 103; i++) {
              if (progress[String(i)]?.completed) scatCompletedCount++
            }
          }
        } catch (err) {
          console.error(`[Nurture] Failed to load progress for ${redact(user.email)}:`, err)
        }
      }

      // ── Day 7: Three-way route based on login + progress ──
      //   never logged in       → FREE_USER_REENGAGEMENT (door-not-opened copy)
      //   logged in, 0 modules  → FREE_LOGGED_IN_NO_PROGRESS (door-opened-but-no-step copy)
      //   1+ SCAT modules done  → clinical case study (default sequence — handled below)
      if (email.day === 7 && (!user.lastLoginAt || scatCompletedCount === 0)) {
        const ghoster = !user.lastLoginAt
        const variant = ghoster ? 'reengagement' : 'logged_in_no_progress'
        const tpl = ghoster ? FREE_USER_REENGAGEMENT : FREE_LOGGED_IN_NO_PROGRESS
        const auditKey = `scat_day7_${variant}_${user.id}`
        const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (inserted === 0) continue

        const html = tpl.template(user.name, loginLink)
          .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

        const sent = await sendOrRollbackAudit({
          to: user.email,
          scheduledAt: scheduler.next(user.email),
          subject: tpl.subject,
          html,
          tags: [
            { name: 'sequence', value: 'scat-mastery' },
            { name: 'day', value: '7' },
            { name: 'variant', value: variant },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }, auditKey, `Day 7 (${variant})`)
        if (sent) {
          emailsSent++
          incrementWeeklySent(user.email)
          console.log(`[Nurture] Day 7 (${variant}) → ${redact(user.email)}`)
        }
        continue
      }

      // ── Day 10: Route based on module completion ──
      // <3 modules → engagement push (SCAT_DAY10_ENGAGEMENT)
      // 3+ modules → promo code with 72h deadline (default sequence)
      if (email.day === 10 && scatCompletedCount < 3) {
        const auditKey = `scat_day10_engagement_${user.id}`
        const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (inserted === 0) continue

        const html = SCAT_DAY10_ENGAGEMENT.template(user.name, loginLink, scatCompletedCount)
          .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

        const sent = await sendOrRollbackAudit({
          to: user.email,
          scheduledAt: scheduler.next(user.email),
          subject: SCAT_DAY10_ENGAGEMENT.subject,
          html,
          tags: [
            { name: 'sequence', value: 'scat-mastery' },
            { name: 'day', value: '10' },
            { name: 'variant', value: 'engagement' },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }, auditKey, 'Day 10 engagement')
        if (sent) {
          emailsSent++
          incrementWeeklySent(user.email)
          console.log(`[Nurture] Day 10 (engagement, ${scatCompletedCount} modules) → ${redact(user.email)}`)
        }
        continue
      }

      // ── Default sequence (Days 3, 7 active, 10 with 3+ modules, 14, 28, 42) ──
      const auditKey = `scat_day${email.day}_${user.id}`
      const { rowCount: scatInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (scatInserted === 0) continue // Already sent

      // Calculate 72h expiry date for Day 10 and Day 28 promo emails
      let expiryDate: string | undefined
      if (email.day === 10 || email.day === 28) {
        const expiry = new Date(now.getTime() + 72 * 60 * 60 * 1000)
        expiryDate = expiry.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
      }

      // Days 0-7: link to free course login. Days 14+: link to pricing/upgrade.
      const ctaLink = email.day <= 7 ? loginLink : upgradeLink
      const html = (email.day === 10 || email.day === 28)
        ? email.template(user.name, ctaLink, expiryDate).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
        : email.template(user.name, ctaLink).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject: email.subject,
        html,
        tags: [
          { name: 'sequence', value: 'scat-mastery' },
          { name: 'day', value: String(email.day) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, auditKey, `Day ${email.day}`)
      if (sent) {
        emailsSent++
        incrementWeeklySent(user.email)
        console.log(`[Nurture] Day ${email.day} → ${redact(user.email)}`)
      }
    }

    // ── 2. Post-Purchase Onboarding Sequence (paid users) ──
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel === 'preview') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Day 1 for full-course users: send workshop reservation email instead of generic onboarding
      // Workshop logistics emails are NOT affected by progressEmailsOptedOut
      if (daysSinceSignup >= 1 && daysSinceSignup <= 1 + CATCHUP_WINDOW_DAYS && user.accessLevel === 'full-course' && user.workshopLocation) {
        const locationConfig = Object.values(CONFIG.LOCATIONS).find(loc => loc.slug === user.workshopLocation)
        if (locationConfig && locationConfig.status === 'collecting') {
          const workshopResAuditKey = `workshop_reservation_${user.id}`
          const { rowCount: wsResInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${workshopResAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (wsResInserted === 0) continue // Already sent

          const count = await getEnrollmentCount(user.workshopLocation)
          const html = WORKSHOP_RESERVATION_EMAIL.template(
            user.name, loginLink, locationConfig.city, count, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD
          ).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

          const sent = await sendOrRollbackAudit({
            to: user.email,
            scheduledAt: scheduler.next(user.email),
            subject: WORKSHOP_RESERVATION_EMAIL.subject,
            html,
            tags: [
              { name: 'sequence', value: 'workshop-reservation' },
              { name: 'day', value: '1' },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }, workshopResAuditKey, 'Workshop reservation Day 1')
          if (sent) {
            emailsSent++
            incrementWeeklySent(user.email)
            console.log(`[Workshop Reservation] Day 1 → ${redact(user.email)} (${locationConfig.city})`)
          }
          continue // Skip generic Day 1 onboarding for this user
        }
      }

      // Progress email opt-out only blocks onboarding nudges, not workshop logistics above
      if (user.progressEmailsOptedOut) continue

      // Generic post-purchase onboarding (online-only users, or confirmed city full-course)
      const email = findCatchUp(
        POST_PURCHASE_SEQUENCE.filter(e => e.accessLevels.includes(user.accessLevel as 'online-only' | 'full-course')),
        daysSinceSignup
      )
      if (!email) continue

      // Activation override: Day 3 + Day 7 emails assume the user has started
      // the course ("Continue your course", "You're halfway"). For paid users
      // who have NOT opened Module 1 yet, swap in PAID_NO_PROGRESS_NUDGE so
      // we don't tell someone "keep going" when they haven't started. Every
      // paid user in the system is currently at 0/8 progress — this is the
      // single biggest engagement leak.
      let useEmail: { day: number; subject: string; template: (n: string, l: string) => string } = email
      if (email.day === 3 || email.day === 7) {
        try {
          const { rows: pr } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
          let mainModulesDone = 0
          if (pr.length > 0 && pr[0].progress) {
            for (let i = 1; i <= 8; i++) if (pr[0].progress[String(i)]?.completed) mainModulesDone++
          }
          if (mainModulesDone === 0) {
            useEmail = PAID_NO_PROGRESS_NUDGE as typeof useEmail
          }
        } catch (err) {
          console.error(`[Onboarding] Progress check failed for ${redact(user.email)}, defaulting to standard email:`, err)
        }
      }

      // Dedup via email_audit_log. Use a different audit key for the
      // activation variant so users who later progress can still get
      // the regular email if appropriate (avoids accidental dedup
      // collisions across variants).
      const variantSuffix = useEmail === email ? '' : '_activation'
      const onboardAuditKey = `onboard_day${email.day}${variantSuffix}_${user.id}`
      const { rowCount: onboardInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${onboardAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (onboardInserted === 0) continue // Already sent

      const html = useEmail.template(user.name, loginLink)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject: useEmail.subject,
        html,
        tags: [
          { name: 'sequence', value: 'post-purchase' },
          { name: 'day', value: String(email.day) },
          ...(useEmail !== email ? [{ name: 'variant', value: 'activation' }] : []),
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, onboardAuditKey, `Onboarding Day ${email.day}`)
      if (sent) {
        emailsSent++
        incrementWeeklySent(user.email)
        console.log(`[Onboarding] Day ${email.day}${useEmail !== email ? ' (activation)' : ''} → ${redact(user.email)}`)
      }
    }

    // ── 3. Pre-Workshop Prep Emails (full-course with confirmed dates) ──
    for (const user of users) {
      if (user.accessLevel !== 'full-course') continue
      // TRANSACTIONAL, not marketing: these are operational logistics for a
      // workshop the user has already paid to attend (venue, what to bring,
      // "see you tomorrow"). A marketing unsubscribe (nurture_unsubscribed)
      // or the weekly marketing cap must NOT block them. The only skip is a
      // permanent entry in email_suppression (hard bounce / complaint) —
      // we couldn't deliver to that address anyway.
      if (suppressedEmails.has(user.email.toLowerCase())) continue
      if (!user.workshopLocation) continue

      // Find matching location config with a confirmed date
      const locationEntry = Object.values(CONFIG.LOCATIONS).find(
        loc => loc.slug === user.workshopLocation && loc.status === 'confirmed' && loc.dateObj
      )
      if (!locationEntry || !locationEntry.dateObj) continue

      const daysUntilWorkshop = Math.floor(
        (locationEntry.dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      )

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Check for logistics email (6 weeks = 42 days before). Catch-up
      // window: a missed cron day must not silently drop the email — match
      // up to CATCHUP_WINDOW_DAYS late (per-step audit key dedupes).
      if (
        daysUntilWorkshop <= WORKSHOP_LOGISTICS_EMAIL.daysBefore &&
        daysUntilWorkshop >= WORKSHOP_LOGISTICS_EMAIL.daysBefore - CATCHUP_WINDOW_DAYS
      ) {
        const logisticsAuditKey = `workshop_logistics_${user.id}`
        const { rowCount: logisticsInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${logisticsAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (logisticsInserted === 0) continue // Already sent

        const html = WORKSHOP_LOGISTICS_EMAIL.template(user.name, locationEntry.city, locationEntry.date)
          .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

        const sent = await sendOrRollbackAudit({
          to: user.email,
          scheduledAt: scheduler.next(user.email),
          subject: WORKSHOP_LOGISTICS_EMAIL.subject,
          html,
          tags: [
            { name: 'sequence', value: 'workshop-logistics' },
            { name: 'days-before', value: String(daysUntilWorkshop) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }, logisticsAuditKey, 'Workshop logistics')
        if (sent) {
          emailsSent++
          incrementWeeklySent(user.email)
          console.log(`[Workshop Logistics] ${daysUntilWorkshop}d before → ${redact(user.email)}`)
        }
        continue
      }

      // Existing pre-workshop prep emails (7 days, 1 day before). Catch-up
      // window matches up to CATCHUP_WINDOW_DAYS late, floored at 1 day out
      // so day-of sends never get "tomorrow" copy. Prefer the latest step.
      const prepEmail = PRE_WORKSHOP_SEQUENCE
        .filter(e => daysUntilWorkshop <= e.daysBefore && daysUntilWorkshop >= Math.max(1, e.daysBefore - CATCHUP_WINDOW_DAYS))
        .sort((a, b) => a.daysBefore - b.daysBefore)[0]
      if (!prepEmail) continue

      const prepAuditKey = `pre_workshop_${prepEmail.daysBefore}_${user.id}`
      const { rowCount: prepInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${prepAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (prepInserted === 0) continue // Already sent

      const html = prepEmail.template(user.name, locationEntry.city, locationEntry.date)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject: prepEmail.subject,
        html,
        tags: [
          { name: 'sequence', value: 'pre-workshop' },
          { name: 'days-before', value: String(daysUntilWorkshop) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, prepAuditKey, `Workshop prep ${prepEmail.daysBefore}d`)
      if (sent) {
        emailsSent++
        incrementWeeklySent(user.email)
        console.log(`[Workshop Prep] ${daysUntilWorkshop}d before → ${redact(user.email)}`)
      }
    }

    // ── 4. Workshop Momentum Emails (full-course users in collecting cities) ──
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue
      if (!user.workshopLocation) continue

      const locationConfig = Object.values(CONFIG.LOCATIONS).find(
        loc => loc.slug === user.workshopLocation
      )
      // Only send for collecting cities
      if (!locationConfig || locationConfig.status !== 'collecting') continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))

      const momentumEmail = findCatchUp(WORKSHOP_MOMENTUM_EMAILS, daysSinceSignup)
      if (!momentumEmail) continue

      // Dedup via email_audit_log (INSERT-first, using audit_key pattern).
      // Keyed on the STEP day (momentumEmail.day), not the calendar day, so
      // the catch-up window can't double-send the same step.
      const auditKey = `workshop_momentum_d${momentumEmail.day}_${user.id}`
      const { rowCount: momentumInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (momentumInserted === 0) continue // Already sent

      const count = await getEnrollmentCount(user.workshopLocation)
      const remaining = Math.max(0, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD - count)

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const subject = momentumEmail.subject(locationConfig.city, count, remaining)
      const html = momentumEmail.template(user.name, locationConfig.city, count, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject,
        html,
        tags: [
          { name: 'sequence', value: 'workshop-momentum' },
          { name: 'day', value: String(momentumEmail.day) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, auditKey, `Workshop momentum Day ${momentumEmail.day}`)
      if (sent) {
        emailsSent++
        incrementWeeklySent(user.email)
        console.log(`[Workshop Momentum] Day ${momentumEmail.day} → ${redact(user.email)} (${locationConfig.city}: ${count}/${CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD})`)
      }
    }

    // ── 5. Abandoned Checkout Recovery Emails ──
    try {
      const abandonedEmailsSent = await processAbandonedCheckouts(baseUrl, scheduler, suppressedEmails)
      emailsSent += abandonedEmailsSent
    } catch (err) {
      // Log but don't fail the entire cron — other sequences already sent
      console.error('Abandoned checkout processing error:', err)
      errors.push(`Abandoned checkout: ${err}`)
    }

    // ── Online-only / full-course user sequences (upgrade nudge + re-engagement) ──
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'online-only' && user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue

      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
      const upgradeLink = user.accessLevel === 'online-only' ? `${baseUrl}/upgrade` : `${baseUrl}/pricing`
      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Upgrade nudge sequence (marketing — not affected by progressEmailsOptedOut)
      // Only applicable to online-only users
      if (user.accessLevel === 'online-only') {
        const upgradeEmail = findCatchUp(ONLINE_UPGRADE_SEQUENCE, daysSinceSignup)
        if (upgradeEmail) {
          const upgradeAuditKey = `upgrade_day${upgradeEmail.day}_${user.id}`
          const { rowCount: upgradeInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${upgradeAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (upgradeInserted === 0) continue // Already sent

          const html = upgradeEmail.template(user.name, upgradeLink)
            .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
          const sent = await sendOrRollbackAudit({
            to: user.email,
            scheduledAt: scheduler.next(user.email),
            subject: upgradeEmail.subject,
            html,
            tags: [
              { name: 'sequence', value: 'online-upgrade' },
              { name: 'day', value: String(upgradeEmail.day) },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }, upgradeAuditKey, `Upgrade nudge Day ${upgradeEmail.day}`)
          if (sent) {
            emailsSent++
            incrementWeeklySent(user.email)
            console.log(`Sent upgrade nudge (Day ${upgradeEmail.day}) to ${redact(user.email)}`)
          }
        }
      }

      // Re-engagement: 14-16 days since signup, hasn't logged in for 7+ days
      // Blocked by progressEmailsOptedOut (this is a progress nudge)
      if (user.progressEmailsOptedOut) continue
      if (daysSinceSignup >= 14 && daysSinceSignup <= 16) {
        const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null
        const daysSinceLogin = lastLogin
          ? Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24))
          : daysSinceSignup
        if (daysSinceLogin >= 7) {
          const reengagementAuditKey = `reengagement_${user.id}`
          const { rowCount: reengInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${reengagementAuditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (reengInserted === 0) continue // Already sent

          const html = REENGAGEMENT_EMAIL.template(user.name, loginLink)
            .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
          const sent = await sendOrRollbackAudit({
            to: user.email,
            scheduledAt: scheduler.next(user.email),
            subject: REENGAGEMENT_EMAIL.subject,
            html,
            tags: [
              { name: 'sequence', value: 'reengagement' },
              { name: 'day', value: String(daysSinceSignup) },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }, reengagementAuditKey, 'Re-engagement')
          if (sent) {
            emailsSent++
            incrementWeeklySent(user.email)
            console.log(`Sent re-engagement to ${redact(user.email)} (${daysSinceLogin} days since login)`)
          }
        }
      }
    }

    // ── 7. "Almost Done" Email (users who completed 7 of 8 modules) ──
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'online-only' && user.accessLevel !== 'full-course') continue
      if (user.nurtureUnsubscribed) continue
      if (user.progressEmailsOptedOut) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Count completed modules (1-8)
        let completedCount = 0
        for (let i = 1; i <= 8; i++) {
          if (progress[String(i)]?.completed) {
            completedCount++
          }
        }

        if (completedCount === 7) {
          const auditKey = `almost_done_${user.id}`
          const { rowCount: almostDoneInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (almostDoneInserted === 0) continue // Already sent

          const almostDoneLoginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'there', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
          const unsubToken = generateUnsubscribeToken(user.email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

          const almostDoneHtml = ALMOST_DONE_EMAIL.template(user.name || 'there', almostDoneLoginLink)
            .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
          const sent = await sendOrRollbackAudit({
            to: user.email,
            scheduledAt: scheduler.next(user.email),
            subject: ALMOST_DONE_EMAIL.subject,
            html: almostDoneHtml,
            tags: [
              { name: 'sequence', value: 'almost-done' },
              { name: 'trigger', value: 'progress-7of8' },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }, auditKey, 'Almost done')
          if (sent) {
            emailsSent++
            incrementWeeklySent(user.email)
            console.log(`[Almost Done] Sent to ${redact(user.email)}`)
          }
        }
      } catch (err) {
        console.error(`[Almost Done] Failed to check progress for ${redact(user.email)}:`, err)
      }
    }

    // ── 8. SCAT6 Mastery Completion Upsell (cron fallback) ──
    // Catches preview users who completed all 3 modules but didn't trigger upsell
    // via the certificate endpoint (e.g. downloaded PDF only, or never clicked certificate)
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Check if all 3 SCAT modules (101-103) are completed
        let allScatDone = true
        for (let i = 101; i <= 103; i++) {
          if (!progress[String(i)]?.completed) {
            allScatDone = false
            break
          }
        }
        if (!allScatDone) continue

        // Dedup — may have already been sent by the certificate endpoint
        const auditKey = `scat_completion_upsell_${user.id}`
        const { rowCount: upsellInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (upsellInserted === 0) continue // Already sent

        const pricingLink = `${baseUrl}/pricing`
        const unsubToken = generateUnsubscribeToken(user.email)
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

        const html = SCAT_COMPLETION_UPSELL.template(user.name || 'there', pricingLink)
          .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

        const sent = await sendOrRollbackAudit({
          to: user.email,
          scheduledAt: scheduler.next(user.email),
          subject: SCAT_COMPLETION_UPSELL.subject,
          html,
          tags: [
            { name: 'sequence', value: 'scat-completion-upsell' },
            { name: 'trigger', value: 'cron-fallback' },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }, auditKey, 'Completion upsell')
        if (sent) {
          emailsSent++
          incrementWeeklySent(user.email)
          console.log(`[Completion Upsell] Cron fallback → ${redact(user.email)}`)
        }
      } catch (err) {
        console.error(`[Completion Upsell] Failed for ${redact(user.email)}:`, err)
      }
    }

    // ── 9. Free "Almost Done" (preview users with 2/3 SCAT modules) ──
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Count completed SCAT modules (101-103)
        let scatDone = 0
        for (let i = 101; i <= 103; i++) {
          if (progress[String(i)]?.completed) scatDone++
        }

        if (scatDone === 2) {
          const auditKey = `free_almost_done_${user.id}`
          const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (inserted === 0) continue // Already sent

          const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
          const unsubToken = generateUnsubscribeToken(user.email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

          const html = FREE_ALMOST_DONE.template(user.name || 'there', loginLink)
            .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

          const sent = await sendOrRollbackAudit({
            to: user.email,
            scheduledAt: scheduler.next(user.email),
            subject: FREE_ALMOST_DONE.subject,
            html,
            tags: [
              { name: 'sequence', value: 'free-almost-done' },
              { name: 'trigger', value: 'progress-2of3' },
            ],
            headers: {
              'List-Unsubscribe': `<${unsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }, auditKey, 'Free almost done')
          if (sent) {
            emailsSent++
            incrementWeeklySent(user.email)
            console.log(`[Free Almost Done] 2/3 SCAT modules → ${redact(user.email)}`)
          }
        }
      } catch (err) {
        console.error(`[Free Almost Done] Failed for ${redact(user.email)}:`, err)
      }
    }

    // ── 10. Reference+Toolkit → Course Upgrade Funnel ──
    // Users who bought the book but haven't bought the course. The A$100
    // bundle credit is already auto-applied server-side at checkout — these
    // emails just surface the offer. Stops automatically if they upgrade
    // (accessLevel changes) or unsubscribe.
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'preview') continue // upgraded → stop
      if (user.nurtureUnsubscribed) continue
      if (!user.referenceBookPurchasedAt) continue

      const purchaseDate = new Date(user.referenceBookPurchasedAt)
      const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

      const candidate = findCatchUp(REFERENCE_UPGRADE_SEQUENCE, daysSincePurchase)
      if (!candidate) continue

      const auditKey = `ref_upgrade_day${candidate.day}_${user.id}`
      const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (!inserted || inserted === 0) continue

      const pricingLink = `${baseUrl}/pricing`
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      const html = candidate.template(user.name || 'there', pricingLink)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject: candidate.subject,
        html,
        tags: [
          { name: 'sequence', value: 'reference-upgrade' },
          { name: 'day', value: String(candidate.day) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, auditKey, `Reference upgrade Day ${candidate.day}`)
      if (sent) {
        emailsSent++
        incrementWeeklySent(user.email)
        console.log(`[Reference Upgrade] Day ${candidate.day} → ${redact(user.email)}`)
      } else {
        errors.push(`ref-upgrade day${candidate.day}: send failed`)
      }
    }

    // ── AI Safety Checklist Nurture Sequence ──
    // Day 0 fires from /api/lead-magnet/ai-safety-checklist transactionally.
    // Day 3, 7, 14 fire here, gated by signupSource + audit-log idempotency.
    const aiChecklistSchedule: Array<{ day: number; tpl: typeof AI_SAFETY_CHECKLIST_DAY3 | typeof AI_SAFETY_CHECKLIST_DAY7 | typeof AI_SAFETY_CHECKLIST_DAY14; tag: string }> = [
      { day: 3,  tpl: AI_SAFETY_CHECKLIST_DAY3,  tag: 'day3' },
      { day: 7,  tpl: AI_SAFETY_CHECKLIST_DAY7,  tag: 'day7' },
      { day: 14, tpl: AI_SAFETY_CHECKLIST_DAY14, tag: 'day14' },
    ]
    const aiCourseLink = `${baseUrl}/courses/ai-in-clinical-practice`
    const heidiVsLyrebirdBlog = `${baseUrl}/blog/heidi-vs-lyrebird-ai-scribe-australian-clinicians`

    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.signupSource !== 'ai-safety-checklist') continue
      if (user.nurtureUnsubscribed) continue
      const signupDate = new Date(user.createdAt)
      const daysSinceSignup = Math.floor((now.getTime() - signupDate.getTime()) / (1000 * 60 * 60 * 24))
      const slot = findCatchUp(aiChecklistSchedule, daysSinceSignup)
      if (!slot) continue

      const auditKey = `ai_checklist_${slot.tag}_${user.id}`
      const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
      if (inserted === 0) continue

      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Day 3 + Day 14 use (name, courseLink); Day 7 uses (name, blogLink, courseLink)
      const html = (slot.day === 7
        ? (AI_SAFETY_CHECKLIST_DAY7.template(user.name, heidiVsLyrebirdBlog, aiCourseLink))
        : (slot.tpl as typeof AI_SAFETY_CHECKLIST_DAY3).template(user.name, aiCourseLink)
      ).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      const sent = await sendOrRollbackAudit({
        to: user.email,
        scheduledAt: scheduler.next(user.email),
        subject: slot.tpl.subject,
        html,
        tags: [
          { name: 'sequence', value: 'ai-safety-checklist' },
          { name: 'day', value: String(slot.day) },
        ],
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }, auditKey, `AI checklist ${slot.tag}`)
      if (sent) {
        emailsSent++
        incrementWeeklySent(user.email)
        console.log(`[AI Checklist] ${slot.tag} → ${redact(user.email)}`)
      } else {
        errors.push(`ai-checklist ${slot.tag}: send failed`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsSent,
      totalUsers: users.length,
      ...(errors.length > 0 ? { errors } : {}),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ error: 'Failed to send emails' }, { status: 500 })
  }
}

/**
 * Process abandoned checkout recovery emails via Postgres
 */
async function processAbandonedCheckouts(baseUrl: string, scheduler: EmailScheduler, suppressedEmails: Set<string>): Promise<number> {
  let emailsSent = 0

  const { rows } = await sql`
    SELECT * FROM abandoned_checkouts
    WHERE recovered = false AND emails_sent < ${ABANDONED_CHECKOUT_SEQUENCE.length}
    ORDER BY abandoned_at ASC
  `

  if (rows.length === 0) return 0

  const now = Date.now()

  for (const checkout of rows) {
    const hoursSinceAbandoned = (now - new Date(checkout.abandoned_at).getTime()) / (1000 * 60 * 60)
    const nextEmail = ABANDONED_CHECKOUT_SEQUENCE[checkout.emails_sent]

    if (hoursSinceAbandoned >= nextEmail.hoursAfter) {
      // Global suppression check — abandoned checkouts often have NO users
      // row, so the users.nurture_unsubscribed check below can't catch a
      // bounced/complained address. email_suppression can.
      if (suppressedEmails.has(String(checkout.email || '').toLowerCase())) {
        await sql`UPDATE abandoned_checkouts SET emails_sent = ${ABANDONED_CHECKOUT_SEQUENCE.length} WHERE id = ${checkout.id}`
        console.log(`[Abandoned] Skipped ${redact(checkout.email)} — suppressed`)
        continue
      }

      // Check if user has unsubscribed
      try {
        const { rows: userRows } = await sql`
          SELECT nurture_unsubscribed FROM users WHERE email = ${checkout.email} LIMIT 1
        `
        if (userRows.length > 0 && userRows[0].nurture_unsubscribed) {
          // Mark as fully sent so we stop processing
          await sql`UPDATE abandoned_checkouts SET emails_sent = ${ABANDONED_CHECKOUT_SEQUENCE.length} WHERE id = ${checkout.id}`
          console.log(`[Abandoned] Skipped ${redact(checkout.email)} — unsubscribed`)
          continue
        }
      } catch (err) {
        console.error(`[Abandoned] Unsubscribe check failed for ${redact(checkout.email)}, skipping to be safe:`, err)
        continue
      }

      const unsubToken = generateUnsubscribeToken(checkout.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(checkout.email)}&token=${unsubToken}`
      // recovery_url (Stripe-hosted, re-opens the exact checkout) is stored by
      // the expired-session webhook; rows pre-dating the column fall back to /pricing.
      const html = nextEmail.template(checkout.name, checkout.recovery_url || undefined)
        .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

      try {
        // sendEmail returns false (never throws) on failure — only advance
        // the emails_sent counter on a real send, so failures retry next run.
        const sent = await sendEmail({
          to: checkout.email,
          scheduledAt: scheduler.next(checkout.email),
          subject: nextEmail.subject,
          html,
          tags: [
            { name: 'sequence', value: 'abandoned-checkout' },
            { name: 'email-number', value: String(checkout.emails_sent + 1) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })

        if (!sent) {
          console.error(`[Abandoned Checkout] Send failed for ${redact(checkout.email)} — will retry next run`)
          continue
        }

        await sql`
          UPDATE abandoned_checkouts SET emails_sent = emails_sent + 1 WHERE id = ${checkout.id}
        `

        emailsSent++
        console.log(`[Abandoned] Email ${checkout.emails_sent + 1} → ${redact(checkout.email)}`)
      } catch (err) {
        console.error(`[Abandoned Checkout] Failed to send to ${redact(checkout.email)}:`, err)
      }
    }
  }

  // Clean up old entries (> 7 days and fully sent)
  await sql`
    DELETE FROM abandoned_checkouts
    WHERE abandoned_at < now() - interval '7 days'
      AND emails_sent >= ${ABANDONED_CHECKOUT_SEQUENCE.length}
  `

  return emailsSent
}
