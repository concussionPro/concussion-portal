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
import { PDF_LEAD_TOOLS, PDF_LEAD_SEQUENCE, SCAT_MASTERY_SEQUENCE, POST_PURCHASE_SEQUENCE, ABANDONED_CHECKOUT_SEQUENCE, PRE_WORKSHOP_SEQUENCE, ONLINE_UPGRADE_SEQUENCE, REENGAGEMENT_EMAIL, WORKSHOP_RESERVATION_EMAIL, WORKSHOP_MOMENTUM_EMAILS, WORKSHOP_LOGISTICS_EMAIL, ALMOST_DONE_EMAIL, SCAT_COMPLETION_UPSELL, SCAT_MODULE1_LADDER, FREE_USER_REENGAGEMENT, FREE_LOGGED_IN_NO_PROGRESS, SCAT_DAY10_ENGAGEMENT, FREE_ALMOST_DONE, REFERENCE_UPGRADE_SEQUENCE, PAID_NO_PROGRESS_NUDGE, CRM_POST_PURCHASE_SEQUENCE, CRM_NO_PROGRESS_NUDGE, CRM_ALMOST_DONE_EMAIL, AI_SAFETY_CHECKLIST_DAY3, AI_SAFETY_CHECKLIST_DAY7, AI_SAFETY_CHECKLIST_DAY14 } from '@/lib/email-sequences'
import { getEnrollmentCount, loadWorkshopEnrolmentDates } from '@/lib/users'
import { crmOwnership } from '@/lib/crm-course'
import { holdsPracticalDaySeat } from '@/lib/practical-day-seat'
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

    // CRM (EP stream) ownership — lives in course_purchases, NEVER in
    // users.access_level (the streams are deliberately isolated, see
    // lib/crm-course.ts). Without this map every lane in this cron reads a
    // PAYING EP customer as a free-course lead, and every workshop lane is
    // blind to a CRM buyer who has paid for a seat at the SHARED practical day.
    //
    // FAIL CLOSED, exactly like the suppression set below: if we can't prove
    // who is paying, we do not run the cron rather than email a paying
    // customer a free-course pitch (or silently drop them from the lanes they
    // bought).
    const crmOwners = await crmOwnership()
    if (!crmOwners) {
      console.error('[Nurture] crmOwnership() failed — ABORTING run (fail closed)')
      return NextResponse.json(
        { error: 'CRM ownership load failed — run aborted (fail closed)' },
        { status: 503 }
      )
    }
    /** CRM entitlements for this user, or undefined. Keyed on lowercased email. */
    const crmFor = (email: string) => crmOwners.get(email.toLowerCase())
    /** Owns the online CRM COURSE CONTENT (progress ids 201-208 apply). */
    const ownsCrmCourse = (email: string) => !!crmFor(email)?.crmAt
    /**
     * Has paid CEA anything on the CRM side — course, practical seat, or both.
     * The predicate for every FREE-LEAD lane: a paying customer must never be
     * pitched the free-course ladder, whichever CRM product they bought.
     */
    const paysForCrm = (email: string) => !!crmFor(email)
    /**
     * Holds a seat at the SHARED practical day, whichever stream sold it.
     * A Clinic Hub Pack seat is 'full-course' but online-only, so it must NOT
     * receive venue logistics or "your seat is reserved" copy.
     */
    const holdsWorkshopSeat = (u: { accessLevel: string; email: string; hubPackSeatAt?: string }) =>
      holdsPracticalDaySeat({
        accessLevel: u.accessLevel,
        hubPackSeat: Boolean(u.hubPackSeatAt),
        ownsCrmPractical: !!crmFor(u.email)?.practicalAt,
      })

    // Completed-workshop ALUMNI are excluded from ALL nurture/lifecycle outreach
    // (Zac 2026-06-15): they've finished the workshop — no onboarding, momentum,
    // or prep emails. They sit in the alumni cohort, no action, until a Level 2
    // exists to offer them. Auto-applies to every workshop once its date passes.
    // CRM attendees sat in the SAME room — ownsCrmPractical puts them in the
    // same cohort instead of leaving them in new-buyer nurture forever.
    const allUsers = await loadUsers()
    // Seat purchase dates — also the round-scoping input for isWorkshopAlumnus
    // below, so a buyer for a round that HASN'T run isn't filtered out of every
    // lane as an alumnus. Loaded before the filter for exactly that reason.
    const enrolmentDates = await loadWorkshopEnrolmentDates()
    const alumniFilteredUsers = allUsers.filter(
      (u) =>
        !isWorkshopAlumnus({
          accessLevel: u.accessLevel,
          workshopLocation: u.workshopLocation,
          ownsCrmPractical: !!crmFor(u.email)?.practicalAt,
          registeredAt: enrolmentDates.get(u.email.toLowerCase()) ?? null,
        }) &&
        // Past attendees granted portal access (signup_source 'alumni-grant', and
        // any future 'alumni-*') are NOT new buyers — they did the course months
        // ago. Exclude from ALL nurture sequences so we never send a months-ago
        // attendee the new-buyer onboarding ("you picked up the course a few days
        // ago — start Module 1"). isWorkshopAlumnus misses them because granted
        // accounts have no workshopLocation. Bug fix 2026-06-26.
        !String(u.signupSource ?? '').startsWith('alumni') &&
        // Internal test accounts never get real sends (2026-08-05)
        !u.isTest,
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

    // Register-quiet (owner 2026-08-03: "those nurtures are f***ing annoying
    // for someone who's already registered"): anyone on the workshop-interest
    // register is date-waiting — their next touch is the date announcement,
    // not drip marketing. FAIL CLOSED like suppression.
    //
    // PER-LANE, not global (fix 2026-08-05): applying this to the shared users
    // array silenced TRANSACTIONAL workshop lanes (post-purchase/reservation,
    // pre-workshop prep, logistics, momentum) for PAID attendees who happen to
    // sit on the register, and the upgrade lane for online-only users who used
    // /api/workshop/nominate. It now gates ONLY the marketing lanes below
    // (SCAT drip, completion upsell, free-almost-done, reference-upgrade,
    // AI-checklist), and only for accessLevel === 'preview' — paying users
    // always get their lanes.
    let registerQuiet: Set<string>
    try {
      const { rows: regRows } = await sql<{ email: string }>`
        SELECT DISTINCT LOWER(email) AS email FROM workshop_interest
      `
      registerQuiet = new Set(regRows.map(r => r.email))
    } catch (err) {
      console.error('[Nurture] workshop_interest load failed — ABORTING (fail closed):', err)
      return NextResponse.json({ error: 'register load failed — run aborted' }, { status: 503 })
    }

    // Single global gate for every nurture/lifecycle lane: suppression.
    // (Register-quiet is applied per-lane below — marketing lanes only.)
    const users = alumniFilteredUsers.filter(
      (u) => !suppressedEmails.has(u.email.toLowerCase())
    )

    // WORKSHOP LANES RUN ON THE PURCHASE DATE, NOT THE ACCOUNT DATE.
    // The day-1 reservation email and the momentum sequence are triggered by
    // BUYING a seat, so their clock must start at the purchase / nomination —
    // course_purchases.purchased_at, else users.workshop_location_set_at.
    // Keying them on users.created_at meant an upgrader was measured from the
    // day they joined the free list: buy on day 56, and every workshop window
    // had already closed on the day the $693 cleared. Best-effort — an empty
    // map falls straight back to created_at (the pre-fix behaviour).
    /** Days since this user bought their seat (falls back to account age). */
    function daysSinceEnrolment(user: { email: string; createdAt: string }): number {
      const enrolled = enrolmentDates.get(user.email.toLowerCase())
      const from = enrolled ? new Date(enrolled) : new Date(user.createdAt)
      const t = from.getTime()
      const basis = Number.isFinite(t) ? t : new Date(user.createdAt).getTime()
      return Math.floor((now.getTime() - basis) / (1000 * 60 * 60 * 24))
    }

    // Section-1 audience allowlist (2026-08-05): the SCAT drip (and its Day-0
    // catch-up) assumes the user came for the free SCAT6 course/forms. Only
    // genuine SCAT-intender signup sources get it; legacy accounts predate
    // signup_source (null/undefined) and are included. Everything else has its
    // own lane or no drip at all: 'ep-course' → ep-nurture cron,
    // 'ai-safety-checklist' → dedicated sequence below, 'intl-syllabus',
    // 'sst-clinic', 'cpd-tracker', 'purchase', 'admin', 'alumni*' → none.
    const SCAT_DRIP_SOURCES = new Set(['free-course', 'squarespace', 'scat-export', 'preseason'])

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
      if (registerQuiet.has(user.email.toLowerCase())) continue  // register-quiet: marketing lane
      // A free lead who LATER bought CRM keeps signupSource 'free-course' and
      // access_level 'preview' (isolated streams), so the allowlist below waves
      // them through — straight into a free-course drip that upsells /pricing
      // to a paying customer. They have their own lifecycle (section 2).
      if (paysForCrm(user.email)) continue
      // Allowlist: SCAT intenders only (also gates the Day-0 catch-up below).
      // Covers the old ai-safety-checklist exclusion — it has its own sequence.
      if (user.signupSource && !SCAT_DRIP_SOURCES.has(user.signupSource)) continue

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

      // WHICH SEQUENCE. Someone who came for the SCAT6 PDF is not a course lead
      // who stalled — they never wanted a course. 183 of 285 users arrive that
      // way; 70 of 109 never opened a module, and the segment has converted
      // 0/46. SCAT_MASTERY_SEQUENCE pitches the course at every step, which is
      // why. PDF leads get PDF_LEAD_SEQUENCE instead: tools, then the club
      // baseline, and exactly one course mention on day 45.
      //
      // 'free-course' and 'preseason' signups asked for the course/tool
      // directly and DO engage (28 of 29 open a module), so they keep the
      // original drip.
      const camePdfHunting = user.signupSource === 'squarespace' || user.signupSource === 'scat-export'
      const sequence = camePdfHunting ? PDF_LEAD_SEQUENCE : SCAT_MASTERY_SEQUENCE
      const email = findCatchUp(sequence, daysSinceSignup)
      if (!email) continue

      // The PDF-lead track is self-contained: its templates take (name) only,
      // and the day-7 progress routing below is about course modules, which
      // this audience has deliberately not been asked to open.
      if (camePdfHunting) {
        // MIGRATION GUARD. This routing switched an EXISTING audience onto a
        // new track mid-flight. The two tracks use different audit-key
        // namespaces (`scat_day*` vs `pdflead_day*`), so nothing dedupes
        // across them — and their day numbers overlap (SCAT 0/3/7/10/14/28/42,
        // PDF 3/14/28/45). A lead who received `scat_day14` yesterday sits at
        // daysSince 15, which is still inside the day-14 catch-up window, so
        // they would receive `pdflead_day14` today: a second email on the same
        // beat, one day apart. Measured on 2026-08-06 against production: 14
        // live users were queued for exactly this on the next cron run
        // (e.g. jackson@propelphysiotherapy.com and
        // supremefunctionsportstherapy@gmail.com, both sent scat_day14 on
        // 08-05 and both at daysSince 15).
        //
        // Rule: the old lane's progress carries over. Skip any PDF-lead day the
        // old sequence has already reached, and pick the track up at its next
        // unsent beat. A brand-new PDF lead has only `scat_day0` (the welcome
        // catch-up), so day 3 still sends — only genuine overlap is suppressed.
        const { rows: priorScat } = await sql<{ max_day: number | null }>`
          SELECT MAX(NULLIF(regexp_replace(audit_key, '^scat_day([0-9]+)_.*$', '\\1'), audit_key)::int) AS max_day
          FROM email_audit_log
          WHERE audit_key LIKE ${'scat_day%_' + user.id}
        `
        const oldLaneReachedDay = priorScat[0]?.max_day ?? -1
        if (oldLaneReachedDay >= email.day) {
          console.log(
            `[Nurture] PDF-lead day ${email.day} skipped for ${redact(user.email)} — ` +
              `the SCAT lane already reached day ${oldLaneReachedDay}`,
          )
          continue
        }
        const auditKey = `pdflead_day${email.day}_${user.id}`
        const { rowCount: fresh } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (fresh === 0) continue
        const html = (email.template as (n: string) => string)(user.name)
          .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
        const sent = await sendOrRollbackAudit({
          to: user.email,
          scheduledAt: scheduler.next(user.email),
          subject: email.subject,
          html,
          tags: [
            { name: 'sequence', value: 'pdf-lead' },
            { name: 'day', value: String(email.day) },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }, auditKey, `PDF-lead day ${email.day}`)
        if (sent) {
          emailsSent++
          incrementWeeklySent(user.email)
          console.log(`[Nurture] PDF-lead day ${email.day} → ${redact(user.email)}`)
        }
        continue
      }

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
        // Someone who came for the PDF is not a course lead who stalled — they
        // never wanted the course. Both templates below ask them to go and
        // start Module 1, which is why this segment has never converted.
        // Offer them the tools instead (see PDF_LEAD_TOOLS). Course-intenders
        // ('free-course') keep the existing copy, and they DO engage: 28 of 29
        // open a module.
        const camePdfHunting = user.signupSource === 'squarespace' || user.signupSource === 'scat-export'
        const variant = camePdfHunting ? 'pdf_lead_tools' : ghoster ? 'reengagement' : 'logged_in_no_progress'
        const tpl = camePdfHunting
          ? PDF_LEAD_TOOLS
          : ghoster ? FREE_USER_REENGAGEMENT : FREE_LOGGED_IN_NO_PROGRESS
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
      // 3+ modules → standing promo code (default sequence)
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

      // Days 0-7: link to free course login. Days 14+: link to pricing/upgrade.
      const ctaLink = email.day <= 7 ? loginLink : upgradeLink
      const html = email.template(user.name, ctaLink).replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

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

    // ── 2. Post-Purchase Onboarding Sequence (paid users, BOTH streams) ──
    //
    // "Paid" is not "access_level !== preview". A CRM (EP stream) buyer keeps
    // access_level 'preview' by design, so that single test dropped every CRM
    // customer before the reservation email AND before the onboarding
    // sequence — their entire post-purchase lifecycle was the one inline
    // welcome the Stripe webhook sends, forever (fix 2026-08-05).
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.nurtureUnsubscribed) continue

      const crm = crmFor(user.email)
      const ccmPaid = user.accessLevel !== 'preview'
      if (!ccmPaid && !crm) continue

      // ONE onboarding track per person. A dual-stream owner (bought CCM, then
      // CRM) follows the CCM track — they already had the CRM welcome at
      // purchase, and two concurrent onboarding sequences would stack sends.
      const stream: 'ccm' | 'crm' = ccmPaid ? 'ccm' : 'crm'

      // Day counter. CCM keys off the account date because a CCM purchase
      // creates or upgrades the row. CRM keys off its OWN purchase timestamp:
      // a CRM buyer is usually an existing free lead whose account is months
      // old, which would put them past every window on the day they paid.
      const crmPurchasedAt = crm?.crmAt ?? crm?.practicalAt
      const anchor = stream === 'ccm' ? new Date(user.createdAt) : new Date(crmPurchasedAt!)
      const anchorMs = Number.isFinite(anchor.getTime()) ? anchor.getTime() : new Date(user.createdAt).getTime()
      const daysSinceSignup = Math.floor((now.getTime() - anchorMs) / (1000 * 60 * 60 * 24))

      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
      const unsubToken = generateUnsubscribeToken(user.email)
      const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

      // Day 1 for SEAT HOLDERS (CCM full-course OR CRM 'crm-practical' — the
      // practical day is shared, and both have paid for the same room): send
      // the workshop reservation email instead of generic onboarding. Measured
      // from the SEAT PURCHASE (daysSinceEnrolment) — an upgrader's account
      // date is not when they bought the workshop. The reservation copy is
      // stream-neutral (city, count, threshold, login link), and the magic link
      // lands a CRM owner on /ep-course by itself.
      // Workshop logistics emails are NOT affected by progressEmailsOptedOut
      const daysSinceSeat = daysSinceEnrolment(user)
      if (daysSinceSeat >= 1 && daysSinceSeat <= 1 + CATCHUP_WINDOW_DAYS && holdsWorkshopSeat(user) && user.workshopLocation) {
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

      // Generic post-purchase onboarding. Each stream runs its OWN sequence:
      // the CCM templates name the flagship's modules ("Module 1: Concussion
      // neuroscience", "Module 7: Rehabilitation by Phenotype"), so sending
      // them to an EP would name the wrong course. CRM_POST_PURCHASE_SEQUENCE
      // carries the EP module names and is filtered by the same `accessLevels`
      // shape via a 'crm' pseudo-level.
      const seq: ReadonlyArray<{ day: number; subject: string; template: (n: string, l: string) => string }> =
        stream === 'crm'
          ? CRM_POST_PURCHASE_SEQUENCE
          : POST_PURCHASE_SEQUENCE.filter(e => e.accessLevels.includes(user.accessLevel as 'online-only' | 'full-course'))
      const email = findCatchUp(seq, daysSinceSignup)
      if (!email) continue

      // Activation override: Day 3 + Day 7 emails assume the user has started
      // the course ("Continue your course", "You're halfway"). For paid users
      // who have NOT opened Module 1 yet, swap in the no-progress nudge so
      // we don't tell someone "keep going" when they haven't started. Every
      // paid user in the system is currently at 0/8 progress — this is the
      // single biggest engagement leak. Module ids are namespaced per stream:
      // CCM 1-8, CRM 201-208 (data/ep-module-meta.ts).
      let useEmail: { day: number; subject: string; template: (n: string, l: string) => string } = email
      if (email.day === 3 || email.day === 7) {
        try {
          const { rows: pr } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
          const firstModuleId = stream === 'crm' ? 201 : 1
          let mainModulesDone = 0
          if (pr.length > 0 && pr[0].progress) {
            for (let i = firstModuleId; i < firstModuleId + 8; i++) {
              if (pr[0].progress[String(i)]?.completed) mainModulesDone++
            }
          }
          if (mainModulesDone === 0) {
            useEmail = (stream === 'crm' ? CRM_NO_PROGRESS_NUDGE : PAID_NO_PROGRESS_NUDGE) as typeof useEmail
          }
        } catch (err) {
          console.error(`[Onboarding] Progress check failed for ${redact(user.email)}, defaulting to standard email:`, err)
        }
      }

      // Dedup via email_audit_log. Use a different audit key for the
      // activation variant so users who later progress can still get
      // the regular email if appropriate (avoids accidental dedup
      // collisions across variants). CRM keys are namespaced 'crm_onboard_'
      // so the two streams can never dedupe each other out.
      const variantSuffix = useEmail === email ? '' : '_activation'
      const keyPrefix = stream === 'crm' ? 'crm_onboard' : 'onboard'
      const onboardAuditKey = `${keyPrefix}_day${email.day}${variantSuffix}_${user.id}`
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
          { name: 'sequence', value: stream === 'crm' ? 'crm-post-purchase' : 'post-purchase' },
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
        console.log(`[Onboarding${stream === 'crm' ? ' CRM' : ''}] Day ${email.day}${useEmail !== email ? ' (activation)' : ''} → ${redact(user.email)}`)
      }
    }

    // ── 3. Pre-Workshop Prep Emails (seat holders, confirmed dates) ──
    // Both streams: the practical day is SHARED, so a CRM 'crm-practical'
    // buyer is standing in the same room and needs the same venue/what-to-bring
    // logistics. The prep + logistics copy is stream-neutral (8 online modules,
    // SCAT6/SCOAT6 on the day, CPD figures from CONFIG which are identical for
    // CCM and CRM) — it names neither course.
    for (const user of users) {
      if (!holdsWorkshopSeat(user)) continue
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
      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)

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

        const html = WORKSHOP_LOGISTICS_EMAIL.template(user.name, locationEntry.city, locationEntry.date, undefined, loginLink)
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

      const html = prepEmail.template(user.name, locationEntry.city, locationEntry.date, loginLink)
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

    // ── 4. Workshop Momentum Emails (seat holders in collecting cities) ──
    // Both streams — a CRM seat is a seat in the same shared room, and the
    // seat-count copy is the same number for everyone (getEnrollmentCount now
    // counts both). Only the "share the course" CTA differs, hence shareLink.
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (!holdsWorkshopSeat(user)) continue
      if (user.nurtureUnsubscribed) continue
      if (!user.workshopLocation) continue

      const locationConfig = Object.values(CONFIG.LOCATIONS).find(
        loc => loc.slug === user.workshopLocation
      )
      // Only send for collecting cities
      if (!locationConfig || locationConfig.status !== 'collecting') continue

      // Momentum runs from the SEAT PURCHASE, not the account date — this is a
      // "your city is filling up" sequence for someone who has already paid, so
      // day 0 is the day they paid. An upgrader keyed on created_at was past
      // every step in the sequence before it ever looked at them.
      const momentumEmail = findCatchUp(WORKSHOP_MOMENTUM_EMAILS, daysSinceEnrolment(user))
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

      const loginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'Student', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
      // Referral CTA must point at the course this attendee actually bought —
      // sending an EP's colleagues to the CCM pricing page names the wrong
      // course. CCM buyers keep the default (/pricing).
      const shareLink = user.accessLevel === 'full-course'
        ? undefined
        : `${baseUrl}/concussion-rehab-mastery`
      const subject = momentumEmail.subject(locationConfig.city, count, remaining)
      const html = momentumEmail.template(user.name, locationConfig.city, count, CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD, loginLink, shareLink)
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

    // ── 7. "Almost Done" Email (7 of 8 modules complete) ──
    // Runs per STREAM: CCM counts modules 1-8, CRM counts 201-208 (the EP
    // namespace, data/ep-module-meta.ts) and gets the CRM-worded email. A CRM
    // buyer's access_level is 'preview', so the old paid-level test made this
    // lane — like the rest of their lifecycle — unreachable for them.
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.nurtureUnsubscribed) continue
      if (user.progressEmailsOptedOut) continue

      const ccmPaid = user.accessLevel === 'online-only' || user.accessLevel === 'full-course'
      const crmPaid = ownsCrmCourse(user.email)
      if (!ccmPaid && !crmPaid) continue
      // One send per person: a dual-stream owner follows the CCM count, which
      // is the course their access_level entitles them to.
      const almostDoneStream: 'ccm' | 'crm' = ccmPaid ? 'ccm' : 'crm'
      const firstModuleId = almostDoneStream === 'crm' ? 201 : 1

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Count completed modules in this stream's namespace (8 either way)
        let completedCount = 0
        for (let i = firstModuleId; i < firstModuleId + 8; i++) {
          if (progress[String(i)]?.completed) {
            completedCount++
          }
        }

        if (completedCount === 7) {
          const tpl = almostDoneStream === 'crm' ? CRM_ALMOST_DONE_EMAIL : ALMOST_DONE_EMAIL
          // Namespaced audit key — the two streams must never dedupe each
          // other out for a buyer who owns both.
          const auditKey = almostDoneStream === 'crm' ? `crm_almost_done_${user.id}` : `almost_done_${user.id}`
          const { rowCount: almostDoneInserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
          if (almostDoneInserted === 0) continue // Already sent

          const almostDoneLoginLink = generateMagicLinkJWT(user.id, user.email, user.name || 'there', user.accessLevel as 'preview' | 'online-only' | 'full-course', baseUrl)
          const unsubToken = generateUnsubscribeToken(user.email)
          const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`

          const almostDoneHtml = tpl.template(user.name || 'there', almostDoneLoginLink)
            .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
          const sent = await sendOrRollbackAudit({
            to: user.email,
            scheduledAt: scheduler.next(user.email),
            subject: tpl.subject,
            html: almostDoneHtml,
            tags: [
              { name: 'sequence', value: almostDoneStream === 'crm' ? 'crm-almost-done' : 'almost-done' },
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
            console.log(`[Almost Done${almostDoneStream === 'crm' ? ' CRM' : ''}] Sent to ${redact(user.email)}`)
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
      if (registerQuiet.has(user.email.toLowerCase())) continue  // register-quiet: marketing lane
      // A CRM (EP stream) buyer's access_level stays 'preview' because the two
      // streams are isolated (lib/crm-course.ts). This is a FREE-LEAD lane —
      // never pitch the ladder to someone who has already paid for a course.
      if (paysForCrm(user.email)) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Check if all 3 SCAT modules (101-103) are completed.
        // This lane's copy states "You've finished the SCAT6 Mastery course",
        // so it must NOT be widened to partial completers — see the separate
        // stalled-after-module-1 lane below, which says something true instead.
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

    // ── 8b. Finished Module 1, stalled before finishing the course ──
    //
    // The $50 ladder code has only ever been offered to all-three completers:
    // 22 sends in its entire life, against 260 for the day-0 lane. Of everyone
    // who opened the free course, 116 started Module 1 and only 37 finished it
    // — so the offer sat past the point where two thirds had already stopped.
    //
    // This lane reaches those who FINISHED Module 1 but not the course, with
    // copy that says so truthfully (SCAT_COMPLETION_UPSELL opens "You've
    // finished the SCAT6 Mastery course" and must never be widened to them).
    // Lane 9 below handles 2-of-3; this is the 1-of-3 gap nobody covered.
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue
      if (registerQuiet.has(user.email.toLowerCase())) continue
      if (paysForCrm(user.email)) continue

      try {
        const { rows: progressRows } = await sql`SELECT progress FROM user_progress WHERE user_id = ${user.id} LIMIT 1`
        if (progressRows.length === 0) continue
        const progress = progressRows[0].progress
        if (!progress) continue

        // Finished module 1 …
        if (progress['101']?.completed !== true) continue
        // … but NOT the whole course (those get the real completion upsell) …
        if (progress['102']?.completed === true && progress['103']?.completed === true) continue
        // … and not already 2-of-3, which lane 9 ("Almost Done") owns, so the
        // two lanes cannot both fire at the same person in the same week.
        if (progress['102']?.completed === true) continue

        const auditKey = `scat_module1_ladder_${user.id}`
        const { rowCount: inserted } = await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW()) ON CONFLICT (audit_key) DO NOTHING`
        if (inserted === 0) continue

        const unsubToken = generateUnsubscribeToken(user.email)
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(user.email)}&token=${unsubToken}`
        // One-click resume. The whole point of this lane is that they stopped
        // mid-course; a link that lands on a login wall would recreate the
        // friction it exists to remove.
        const resumeLink = generateMagicLinkJWT(
          user.id,
          user.email,
          user.name || 'Student',
          user.accessLevel as 'preview' | 'online-only' | 'full-course',
          baseUrl,
        )
        const html = SCAT_MODULE1_LADDER.template(user.name || 'there', resumeLink, `${baseUrl}/pricing`)
          .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

        const sent = await sendOrRollbackAudit({
          to: user.email,
          scheduledAt: scheduler.next(user.email),
          subject: SCAT_MODULE1_LADDER.subject,
          html,
          tags: [
            { name: 'sequence', value: 'scat-module1-ladder' },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }, auditKey, 'Module 1 ladder')
        if (sent) {
          emailsSent++
          incrementWeeklySent(user.email)
          console.log(`[Module1 Ladder] → ${redact(user.email)}`)
        }
      } catch (err) {
        console.error(`[Module1 Ladder] Failed for ${redact(user.email)}:`, err)
      }
    }

    // ── 9. Free "Almost Done" (preview users with 2/3 SCAT modules) ──
    for (const user of users) {
      if (exceedsWeeklyCap(user.email)) continue  // per-user weekly cap (3/7d)
      if (user.accessLevel !== 'preview') continue
      if (user.nurtureUnsubscribed) continue
      if (registerQuiet.has(user.email.toLowerCase())) continue  // register-quiet: marketing lane
      // A CRM (EP stream) buyer's access_level stays 'preview' because the two
      // streams are isolated (lib/crm-course.ts). This is a FREE-LEAD lane —
      // never pitch the ladder to someone who has already paid for a course.
      if (paysForCrm(user.email)) continue

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
      if (registerQuiet.has(user.email.toLowerCase())) continue  // register-quiet: marketing lane
      // Bought into a course already, just not via access_level — the CRM (EP
      // stream) entitlement lives in course_purchases. This lane sells the
      // course ladder, so an owner must never be in it.
      if (paysForCrm(user.email)) continue
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
      // Register-quiet: marketing lane, preview only (paying users keep their lanes)
      if (user.accessLevel === 'preview' && registerQuiet.has(user.email.toLowerCase())) continue
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

      // CLAIM BEFORE SEND — the same doctrine every other lane in this cron
      // uses (email_audit_log INSERT-first, rolled back on failure). This lane
      // was the exception: it sent first and bumped `emails_sent` after, with
      // nothing keyed to the step. Two overlapping executions of this route (a
      // Vercel cron retry, or the admin trigger firing while the scheduled run
      // is still going — `rows` is SELECTed once at the top and the loop runs
      // for minutes) both read emails_sent = N and both sent email N+1 to the
      // same abandoned buyer.
      //
      // The compare-and-set makes the counter itself the claim: only one runner
      // can move N → N+1. `recovered = false` is re-checked here too, so a
      // buyer whose purchase webhook landed while this loop was running stops
      // getting "you left something behind" for a course they now own.
      const { rowCount: claimed } = await sql`
        UPDATE abandoned_checkouts
           SET emails_sent = emails_sent + 1
         WHERE id = ${checkout.id}
           AND emails_sent = ${checkout.emails_sent}
           AND recovered = false
      `
      if (!claimed) {
        console.log(`[Abandoned] Step ${checkout.emails_sent + 1} for ${redact(checkout.email)} already claimed (or recovered) — skipping`)
        continue
      }

      try {
        // sendEmail returns false (never throws) on failure — release the claim
        // so the next run retries instead of silently skipping the step.
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
          console.error(`[Abandoned Checkout] Send failed for ${redact(checkout.email)} — releasing claim, will retry next run`)
          await sql`
            UPDATE abandoned_checkouts SET emails_sent = ${checkout.emails_sent}
             WHERE id = ${checkout.id} AND emails_sent = ${checkout.emails_sent + 1}
          `
          continue
        }

        emailsSent++
        console.log(`[Abandoned] Email ${checkout.emails_sent + 1} → ${redact(checkout.email)}`)
      } catch (err) {
        console.error(`[Abandoned Checkout] Failed to send to ${redact(checkout.email)}:`, err)
        // Same release as the !sent path — a throw must not consume the step.
        try {
          await sql`
            UPDATE abandoned_checkouts SET emails_sent = ${checkout.emails_sent}
             WHERE id = ${checkout.id} AND emails_sent = ${checkout.emails_sent + 1}
          `
        } catch (releaseErr) {
          console.error('[Abandoned Checkout] Failed to release claim:', releaseErr)
        }
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
