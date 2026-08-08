import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { CONFIG, SST_TIERS, sstTierAllowance } from '@/lib/config'
import { SST_INCLUDED_PERIOD_ENDING } from '@/lib/email-sequences'

/**
 * Tells a clinic that its INCLUDED Clinical Testing period is ending.
 *
 * WHY (2026-08-06, item 6 of the approved plan).
 *
 * A course enrolment includes INCLUDED_PLATFORM_MONTHS of the suite. Nothing
 * ever said so, and nothing ever said when it ended — so 25 clinics sit on
 * plan:'active' with no subscription, and the measured result is 0 SST
 * subscriptions against 25 active clinics. The platform is given away
 * permanently by default, which is not a pricing decision anyone made.
 *
 * TWO THINGS KEEP THIS INERT, DELIBERATELY.
 *
 * 1. FEATURES.SST_RENEWAL_PROMPT_LIVE is false. This asks real clinics —
 *    several of them alumni and early supporters — for money. The copy is the
 *    owner's call before it goes anywhere.
 *
 * 2. Even armed, it would currently reach NOBODY. Measured today: 26 clinics,
 *    ZERO with an `included_until` date. The column exists and new provisioning
 *    stamps it, but every existing clinic predates the field. That is the same
 *    "mechanism exists, reach is zero" failure as the $50 discount, which sent
 *    22 emails in its entire life because of where its gate sat. Backfilling
 *    those dates is a production write and a business decision — which date,
 *    counted from when — so it is the owner's, not mine.
 *
 * The route is written and scheduled now so that arming it is one flag and one
 * backfill, rather than a build.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/** Send at 30 days out, then once more at 7. Never more than twice. */
const WINDOWS = [30, 7] as const

function isAuthorised(request: NextRequest): boolean {
  if (request.headers.get('x-vercel-cron')) return true
  const key = process.env.ADMIN_API_KEY
  if (!key) return false
  const supplied =
    request.headers.get('x-admin-key') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return !!supplied && supplied === key
}

export async function GET(request: NextRequest) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CONFIG.FEATURES.SST_RENEWAL_PROMPT_LIVE) {
    return NextResponse.json({
      ok: true,
      armed: false,
      note: 'SST_RENEWAL_PROMPT_LIVE is false — no email sent. Arming also requires included_until to be backfilled.',
    })
  }

  const base = CONFIG.SEO.SITE_URL.replace(/\/$/, '')
  let considered = 0
  let sent = 0
  const skipped: string[] = []

  // `to_jsonb(c) ->> 'included_until'` rather than naming the column: the
  // column is added by a lazy ALTER, and naming it directly throws on any
  // deployment that has not run that yet — which once took the whole clinic
  // mirror down. Same reason as every other included_until read.
  const { rows } = await sql<{
    code: string
    clinic_name: string | null
    contact_name: string | null
    email: string | null
    plan: string | null
    stripe_subscription_id: string | null
    included_until: string | null
  }>`
    SELECT code, clinic_name, contact_name, email, plan, stripe_subscription_id,
           (to_jsonb(c) ->> 'included_until') AS included_until
    FROM sst_clinics c
    WHERE email IS NOT NULL
  `

  for (const c of rows) {
    if (!c.included_until || !c.email) continue
    // A clinic that already pays is not prompted to start paying.
    if (c.stripe_subscription_id) { skipped.push(`${c.code}: has a subscription`); continue }

    const endsAt = new Date(c.included_until)
    if (Number.isNaN(endsAt.getTime())) { skipped.push(`${c.code}: unparseable included_until`); continue }
    const daysLeft = Math.ceil((endsAt.getTime() - Date.now()) / 86_400_000)
    const window = WINDOWS.find((w) => daysLeft <= w && daysLeft > w - 7)
    if (window === undefined) continue
    considered++

    // Suppression is checked on every lane, fail-closed: an error here means
    // DO NOT SEND (CLAUDE.md — unsubscribes are zero-tolerance).
    try {
      if (await isEmailSuppressed(c.email)) { skipped.push(`${c.code}: suppressed`); continue }
    } catch {
      skipped.push(`${c.code}: suppression lookup failed — treated as suppressed`)
      continue
    }

    const auditKey = `sst_included_ending_${window}_${c.code}`
    const { rowCount } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING
    `
    if (!rowCount) continue

    // Derived from CONFIG, never written out — the tiers changed this month
    // (50% launch discount dropped) and any hardcoded price here would be a
    // false quote to a customer.
    // Quote-only tiers carry no price, so they are described as such rather
    // than rendered as "$null/mo".
    const tiers = SST_TIERS.map(
      (t) =>
        `<strong>${t.name}</strong> — ${t.monthlyAud === null ? 'price on application' : `$${t.monthlyAud}/mo`} · ` +
        sstTierAllowance(t),
    ).join('<br>')

    const ok = await sendEmail({
      to: c.email,
      subject: SST_INCLUDED_PERIOD_ENDING.subject(c.clinic_name || 'Your clinic'),
      html: SST_INCLUDED_PERIOD_ENDING.template(
        c.contact_name || 'there',
        c.clinic_name || 'your clinic',
        endsAt.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }),
        tiers,
        `${base}/clinical-testing/subscribe`,
      ),
    })
    if (ok) sent++
    else {
      // Roll the audit row back so a transport failure is retried rather than
      // silently swallowed by the dedup key.
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
      skipped.push(`${c.code}: send failed`)
    }
  }

  return NextResponse.json({ ok: true, armed: true, considered, sent, skipped })
}
