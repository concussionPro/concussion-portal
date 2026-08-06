/**
 * POST /api/admin/nomination-campaign — founder-triggered nomination push.
 *
 * NOMINATION MODEL (2026-07-02): every city is buyable anytime; a workshop
 * date launches when a city hits CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD paid
 * nominations. Sparse cities (WA / Adelaide / Byron) may take MONTHS to fill,
 * so the campaign leads with the LADDER, never with "pre-pay and wait":
 *
 *   segment 'interest' (workshop_interest registrants):
 *     online-first framing — start CCM Online ($497) today, add the workshop
 *     for the early-bird difference when the city's date launches; locking
 *     the Complete Course now is offered second, with a fair-warning line.
 *
 *   segment 'upgrade' (online-only owners):
 *     primary CTA = the NO-CHARGE dashboard city nomination (counts toward
 *     launching the city's date, first notice); locking the $693 early-bird
 *     upgrade at /upgrade is one sentence, never the lead.
 *
 * Body: { segment: 'interest' | 'upgrade', mode?: 'dry-run' | 'send',
 *         city?: string, limit?: number }
 * DEFAULT MODE IS DRY-RUN — 'send' must be explicit. Dry-run does everything
 * except send and writes NO audit rows.
 *
 * Mechanics:
 *   - Admin auth via isAdminRequest (cookie / x-admin-key / Bearer).
 *   - Suppression + unsubscribe checks run in the candidate SQL itself; if
 *     the query fails, nothing sends (fail closed).
 *   - Claim-first idempotency: audit_key `nomination_campaign_{segment}_
 *     {lower(email)}` inserted with ON CONFLICT DO NOTHING BEFORE the send;
 *     the row is deleted if sendEmail returns false/throws (retryable).
 *   - Never twice: any prior `nomination_campaign_%` audit entry (either
 *     segment) excludes the address.
 *   - Don't stack on Agent B: a completer_convert_* audit entry in the last
 *     21 days excludes the address.
 *   - Momentum sentence ("{n} of 8 places are taken") only when the TRUE
 *     enrolled count is >= 5 — a low count is anti-social-proof.
 *   - Cap per invocation (default 50, body.limit). List-Unsubscribe headers
 *     + footer link on every send. NEVER the word "free".
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail, escapeHtml } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { EmailScheduler } from '@/lib/email-scheduler'
import { CONFIG, workshopPriceFor, upgradePriceFor } from '@/lib/config'
import { getEnrollmentCount } from '@/lib/users'

export const maxDuration = 300

const VALID_CITIES = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa'] as const
const MOMENTUM_MIN_ENROLLED = 5
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 200

type Segment = 'interest' | 'upgrade'

interface Candidate {
  email: string // lowercased
  name: string | null
  city: string | null // interest segment only
  suppressed: boolean
  unsubscribed: boolean
  alreadyOwns: boolean
  alreadyContacted: boolean
  recentAgentB: boolean
}

function cityLabelFor(slug: string): string {
  const loc = Object.values(CONFIG.LOCATIONS).find((l) => l.slug === slug)
  return loc?.city ?? slug
}

function firstNameOf(name: string | null, email: string): string {
  const first = (name || '').trim().split(/\s+/)[0]
  if (first && first.length >= 2 && !first.includes('@')) return first
  const fromEmail = email.split('@')[0]
  return fromEmail || 'there'
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  const shown = (local || '').slice(0, 3)
  return `${shown}***@${domain || '???'}`
}

// ─── Candidate queries (exclusion flags computed in SQL — a query failure
//     means NOTHING sends: fail closed) ──────────────────────────────────────

// OWNER DIRECTIVE (Zac, 2026-07-02): do NOT pitch the Sydney interest group
// via this campaign — excluded even from an all-cities send. Remove the slug
// from this list only on an explicit new instruction from Zac.
const EXCLUDED_CITIES = ['sydney']

async function interestCandidates(city: string | null): Promise<Candidate[]> {
  if (city && EXCLUDED_CITIES.includes(city)) return []
  const { rows } = await sql<{
    email: string
    name: string | null
    city: string
    suppressed: boolean
    unsubscribed: boolean
    already_owns: boolean
    already_contacted: boolean
    recent_agent_b: boolean
  }>`
    WITH latest AS (
      SELECT DISTINCT ON (LOWER(email))
        LOWER(email) AS email, name, city
      FROM workshop_interest
      WHERE ${city}::text IS NULL OR city = ${city}
      ORDER BY LOWER(email), created_at DESC
    )
    SELECT
      l.email,
      l.name,
      l.city,
      EXISTS (
        SELECT 1 FROM email_suppression s WHERE LOWER(s.email) = l.email
      ) AS suppressed,
      EXISTS (
        SELECT 1 FROM users u
        WHERE LOWER(u.email) = l.email AND COALESCE(u.nurture_unsubscribed, false) = true
      ) AS unsubscribed,
      -- Owns a seat at the SHARED practical day, EITHER stream. A CRM
      -- Complete/upgrade buyer keeps access_level 'preview' (isolated streams,
      -- lib/crm-course.ts), so the access_level test alone pitched the
      -- nomination ladder to someone who had already bought the seat.
      (EXISTS (
        SELECT 1 FROM users u
        WHERE LOWER(u.email) = l.email AND u.access_level = 'full-course'
      ) OR EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = l.email AND cp.course_slug = 'crm-practical'
      )) AS already_owns,
      EXISTS (
        SELECT 1 FROM email_audit_log a
        WHERE a.audit_key IN (
          'nomination_campaign_interest_' || l.email,
          'nomination_campaign_upgrade_' || l.email
        )
      ) AS already_contacted,
      EXISTS (
        SELECT 1
        FROM users u
        JOIN email_audit_log a ON a.audit_key IN (
          'completer_convert_price_' || u.id,
          'completer_convert_relevance_' || u.id,
          'completer_convert_workshop_' || u.id
        )
        WHERE LOWER(u.email) = l.email
          AND a.sent_at >= NOW() - INTERVAL '21 days'
      ) AS recent_agent_b
    FROM latest l
    ORDER BY l.city, l.email
  `
  return rows
    // Owner directive: excluded cities never receive this campaign, even on
    // an all-cities send (see EXCLUDED_CITIES above).
    .filter((r) => !EXCLUDED_CITIES.includes(r.city))
    .map((r) => ({
      email: r.email,
      name: r.name,
      city: r.city,
      suppressed: r.suppressed,
      unsubscribed: r.unsubscribed,
      alreadyOwns: r.already_owns,
      alreadyContacted: r.already_contacted,
      recentAgentB: r.recent_agent_b,
    }))
}

async function upgradeCandidates(): Promise<Candidate[]> {
  const { rows } = await sql<{
    email: string
    name: string | null
    suppressed: boolean
    unsubscribed: boolean
    already_owns: boolean
    already_contacted: boolean
    recent_agent_b: boolean
  }>`
    SELECT DISTINCT ON (LOWER(u.email))
      LOWER(u.email) AS email,
      u.name,
      EXISTS (
        SELECT 1 FROM email_suppression s WHERE LOWER(s.email) = LOWER(u.email)
      ) AS suppressed,
      COALESCE(u.nurture_unsubscribed, false) AS unsubscribed,
      -- Seat-holder in EITHER stream — see interestCandidates above.
      (EXISTS (
        SELECT 1 FROM users u2
        WHERE LOWER(u2.email) = LOWER(u.email) AND u2.access_level = 'full-course'
      ) OR EXISTS (
        SELECT 1 FROM course_purchases cp
        WHERE LOWER(cp.user_email) = LOWER(u.email) AND cp.course_slug = 'crm-practical'
      )) AS already_owns,
      EXISTS (
        SELECT 1 FROM email_audit_log a
        WHERE a.audit_key IN (
          'nomination_campaign_interest_' || LOWER(u.email),
          'nomination_campaign_upgrade_' || LOWER(u.email)
        )
      ) AS already_contacted,
      EXISTS (
        SELECT 1 FROM email_audit_log a
        WHERE a.audit_key IN (
          'completer_convert_price_' || u.id,
          'completer_convert_relevance_' || u.id,
          'completer_convert_workshop_' || u.id
        )
          AND a.sent_at >= NOW() - INTERVAL '21 days'
      ) AS recent_agent_b
    FROM users u
    WHERE u.access_level = 'online-only'
    ORDER BY LOWER(u.email)
  `
  return rows.map((r) => ({
    email: r.email,
    name: r.name,
    city: null,
    suppressed: r.suppressed,
    unsubscribed: r.unsubscribed,
    alreadyOwns: r.already_owns,
    alreadyContacted: r.already_contacted,
    recentAgentB: r.recent_agent_b,
  }))
}

// ─── Email builders — plain-text-styled HTML, no images ─────────────────────

const EMAIL_WRAP_TOP = `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px 20px; color: #1e293b; font-size: 15px; line-height: 1.7;">`

function emailFooter(unsubscribeUrl: string): string {
  return `
  <p style="margin: 28px 0 0; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 14px; line-height: 1.6;">
    Concussion Education Australia &middot; Concussion Clinical Mastery is endorsed by Osteopathy Australia<br>
    <a href="${unsubscribeUrl}" style="color: #94a3b8;">Unsubscribe</a>
  </p>
</div>`
}

interface InterestEmailOpts {
  firstName: string
  citySlug: string
  enrolled: number
  baseUrl: string
  unsubscribeUrl: string
}

function buildInterestEmail(opts: InterestEmailOpts): { subject: string; html: string } {
  const cityLabel = cityLabelFor(opts.citySlug)
  const threshold = CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD
  const online = CONFIG.COURSE.PRICE_ONLINE
  const completePrice = workshopPriceFor(opts.citySlug) // $1,190 early-bird for collecting cities
  const upgradeDiff = upgradePriceFor(opts.citySlug) // $693
  const link = `${opts.baseUrl}/pricing?location=${opts.citySlug}&utm_source=email&utm_campaign=nomination_launch`
  // Momentum sentence ONLY when genuinely motivating (real count >= 5 of 8)
  const momentum =
    opts.enrolled >= MOMENTUM_MIN_ENROLLED
      ? ` &mdash; ${opts.enrolled} of ${threshold} places are taken`
      : ''

  const subject = `The ${cityLabel} round is moving — here's the smart way in`
  const html = `${EMAIL_WRAP_TOP}
  <p style="margin: 0 0 16px;">Hi ${escapeHtml(opts.firstName)},</p>

  <p style="margin: 0 0 16px;">You asked to hear when the ${escapeHtml(cityLabel)} concussion workshop was next moving. Here's where it stands: ${escapeHtml(cityLabel)}'s round opens as enrolments build${momentum}.</p>

  <p style="margin: 0 0 16px;">The smart way in: start the online course today ($${online} &mdash; 8 CPD hours, everything except the hands-on day). When ${escapeHtml(cityLabel)}'s date launches, you add the workshop for the $${upgradeDiff} early-bird difference &mdash; $${completePrice.toLocaleString()} all up, and you'll have first notice before it opens publicly.</p>

  <p style="margin: 0 0 16px;">Prefer to lock the whole thing now? You can &mdash; enrol in the Complete Course at $${completePrice.toLocaleString()}, start the online modules today, and your workshop seat is reserved for ${escapeHtml(cityLabel)}'s round when it launches. Fair warning: the date follows demand, so if you'd rather not commit to the day before it's scheduled, start online.</p>

  <p style="margin: 24px 0;">
    <a href="${link}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start the online course &mdash; $${online}</a>
  </p>

  <p style="margin: 0 0 16px;">Either way your early-bird rate holds. If the timing's wrong, no action needed &mdash; you'll hear the moment a ${escapeHtml(cityLabel)} date is announced.</p>

  <p style="margin: 24px 0 0;">Zac Lewis<br>
  Osteopath &middot; Concussion Education Australia<br>
  Concussion Clinical Mastery &mdash; endorsed by Osteopathy Australia &middot; AHPRA-aligned CPD</p>
${emailFooter(opts.unsubscribeUrl)}`
  return { subject, html }
}

interface UpgradeEmailOpts {
  firstName: string
  baseUrl: string
  unsubscribeUrl: string
}

function buildUpgradeEmail(opts: UpgradeEmailOpts): { subject: string; html: string } {
  const upgradeDiff = upgradePriceFor(null) // $693 early-bird difference
  const standardDiff = CONFIG.COURSE.PRICE_REGULAR - CONFIG.COURSE.PRICE_ONLINE // $903
  const dashboardLink = `${opts.baseUrl}/dashboard?utm_source=email&utm_campaign=nomination_upgrade`
  const upgradeLink = `${opts.baseUrl}/upgrade?utm_source=email&utm_campaign=nomination_upgrade`

  const subject = 'Your workshop day: nominate your city (takes 10 seconds)'
  const html = `${EMAIL_WRAP_TOP}
  <p style="margin: 0 0 16px;">Hi ${escapeHtml(opts.firstName)},</p>

  <p style="margin: 0 0 16px;">You own the online course &mdash; 8 CPD hours, done at your pace. The hands-on day that completes the full 16 CPD hours now runs city by city: each city's date launches once enough clinicians are ready.</p>

  <p style="margin: 0 0 16px;">First step: nominate your city from your dashboard. Nominating costs nothing, counts toward launching your city's date, and you get first notice the moment it's scheduled.</p>

  <p style="margin: 24px 0;">
    <a href="${dashboardLink}" style="display: inline-block; background: #0d9488; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">Nominate your city &mdash; 10 seconds</a>
  </p>

  <p style="margin: 0 0 16px;">Want to lock the $${upgradeDiff} early-bird rate now regardless of the date? You can upgrade anytime at <a href="${upgradeLink}" style="color: #0d9488;">${opts.baseUrl.replace(/^https?:\/\//, '')}/upgrade</a> &mdash; the rate is locked from the moment you do, and the final two weeks before a scheduled workshop revert to the standard $${standardDiff} difference.</p>

  <p style="margin: 0 0 16px;">The day itself: SCAT6, VOMS and BESS on real people under supervision, with correction in the moment. It's the part that turns the theory you've done into clinical confidence.</p>

  <p style="margin: 24px 0 0;">Zac Lewis<br>
  Osteopath &middot; Concussion Education Australia</p>
${emailFooter(opts.unsubscribeUrl)}`
  return { subject, html }
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    // empty body → validation below rejects
  }

  const segment = body.segment as Segment | undefined
  if (segment !== 'interest' && segment !== 'upgrade') {
    return NextResponse.json(
      { error: "segment must be 'interest' or 'upgrade'" },
      { status: 400 }
    )
  }

  // DEFAULT IS DRY-RUN — 'send' must be explicit
  const mode: 'dry-run' | 'send' = body.mode === 'send' ? 'send' : 'dry-run'

  let city: string | null = null
  if (body.city !== undefined) {
    if (
      typeof body.city !== 'string' ||
      !(VALID_CITIES as readonly string[]).includes(body.city)
    ) {
      return NextResponse.json(
        { error: `city must be one of: ${VALID_CITIES.join(', ')}` },
        { status: 400 }
      )
    }
    city = body.city
  }

  const rawLimit = typeof body.limit === 'number' ? Math.floor(body.limit) : DEFAULT_LIMIT
  const limit = Math.min(Math.max(rawLimit, 1), MAX_LIMIT)

  // Candidate selection — any failure here aborts the run (fail closed)
  let candidates: Candidate[]
  try {
    candidates =
      segment === 'interest' ? await interestCandidates(city) : await upgradeCandidates()
  } catch (err) {
    console.error('[nomination-campaign] candidate query failed — aborting (fail closed):', err)
    return NextResponse.json(
      { error: 'Candidate selection failed — nothing sent (fail closed).' },
      { status: 500 }
    )
  }

  const skipped = {
    suppressed: 0,
    unsubscribed: 0,
    alreadyOwns: 0,
    alreadyContacted: 0,
    recentAgentB: 0,
  }
  const eligible: Candidate[] = []
  for (const c of candidates) {
    if (c.suppressed) { skipped.suppressed++; continue }
    if (c.unsubscribed) { skipped.unsubscribed++; continue }
    if (c.alreadyOwns) { skipped.alreadyOwns++; continue }
    if (c.alreadyContacted) { skipped.alreadyContacted++; continue }
    if (c.recentAgentB) { skipped.recentAgentB++; continue }
    eligible.push(c)
  }

  const toSend = eligible.slice(0, limit)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

  // Real enrolled counts per city — powers the momentum sentence (interest
  // segment). Fetched once per distinct city, never fabricated.
  const enrolledByCity = new Map<string, number>()
  if (segment === 'interest') {
    const distinctCities = [...new Set(toSend.map((c) => c.city).filter((s): s is string => !!s))]
    for (const slug of distinctCities) {
      try {
        enrolledByCity.set(slug, await getEnrollmentCount(slug))
      } catch {
        enrolledByCity.set(slug, 0) // 0 → momentum sentence simply omitted
      }
    }
  }

  let sent = 0
  const failures: Array<{ email: string; reason: string }> = []

  if (mode === 'send') {
    const scheduler = new EmailScheduler()

    for (const c of toSend) {
      // Claim-first idempotency: insert the audit row BEFORE sending
      const auditKey = `nomination_campaign_${segment}_${c.email}`
      const { rowCount: inserted } = await sql`
        INSERT INTO email_audit_log (audit_key, sent_at)
        VALUES (${auditKey}, NOW())
        ON CONFLICT (audit_key) DO NOTHING
      `
      if (!inserted || inserted === 0) {
        skipped.alreadyContacted++
        continue
      }

      let ok = false
      try {
        const unsubToken = generateUnsubscribeToken(c.email)
        const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(c.email)}&token=${unsubToken}`
        const firstName = firstNameOf(c.name, c.email)

        const { subject, html } =
          segment === 'interest'
            ? buildInterestEmail({
                firstName,
                citySlug: c.city as string,
                enrolled: enrolledByCity.get(c.city as string) ?? 0,
                baseUrl,
                unsubscribeUrl,
              })
            : buildUpgradeEmail({ firstName, baseUrl, unsubscribeUrl })

        ok = await sendEmail({
          to: c.email,
          scheduledAt: scheduler.next(c.email),
          subject,
          html,
          tags: [
            { name: 'sequence', value: 'nomination-campaign' },
            { name: 'segment', value: segment },
          ],
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })
      } catch (err) {
        failures.push({
          email: maskEmail(c.email),
          reason: err instanceof Error ? err.message : String(err),
        })
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
        continue
      }

      if (ok) {
        sent++
      } else {
        failures.push({ email: maskEmail(c.email), reason: 'sendEmail returned false (see Vercel logs)' })
        await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
      }
    }
  }

  return NextResponse.json({
    mode,
    segment,
    city,
    limit,
    candidates: candidates.length,
    eligible: eligible.length,
    sent,
    skipped,
    failures,
    sample: eligible.slice(0, 5).map((c) => maskEmail(c.email)),
  })
}
