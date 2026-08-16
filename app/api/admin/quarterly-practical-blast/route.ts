import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { sendEmail } from '@/lib/resend-client'
import { QUARTERLY_PRACTICAL_BLAST } from '@/lib/email-sequences'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { CONFIG } from '@/lib/config'
import { nominateClickUrl } from '@/app/api/workshop/nominate-click/route'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { EmailScheduler } from '@/lib/email-scheduler'

/**
 * QUARTERLY PRACTICAL BLAST — the structural announcement.
 *
 *   GET                       → audience preview, NO SENDS
 *   POST                      → audience preview, NO SENDS (same as GET)
 *   POST ?confirm=<flag>      → actually fires
 *
 * DRY RUN IS THE DEFAULT IN BOTH VERBS, and the confirm flag is hardcoded
 * below. That is the same shape as the AI-course blast, for the same reason: a
 * one-off blast route with a send-on-POST default is one mis-click from mailing
 * the whole list, and there is no recall.
 *
 * WHO IS EXCLUDED, and why each matters:
 *  - anyone suppressed (fail-closed: a suppression-check error excludes)
 *  - anyone who has unsubscribed from nurture
 *  - anyone who already owns the full course — they have the practical
 *  - partner and internal addresses
 *
 * THE `registered` FLAG. The opening line claims the recipient registered
 * interest. That is TRUE for the workshop-interest segment and FALSE for
 * free-course completers, so the audience is split and each half gets the
 * matching opening. Sending the interest line to someone who never registered
 * is a false statement the sharper readers will catch.
 */

// Bump this to re-arm. Firing requires it verbatim, so a stale flag fails safe.
const CONFIRM_FLAG = 'quarterly-practical-melbourne-2026-11-07'

// The FLOATED Melbourne date. Deliberately NOT read from CONFIG.LOCATIONS —
// the date is offered to the warm list to gauge numbers BEFORE the Rydges
// contract is signed and before it appears anywhere public (owner 2026-08-15).
const MEL_DATE_LABEL = 'Saturday 7 November'

type Recipient = { email: string; name: string; registered: boolean; city: string | null }

async function audience(): Promise<Recipient[]> {
  const out: Recipient[] = []
  const seen = new Set<string>()

  // PAID EXCLUSIONS, applied to EVERY segment — the header always claimed
  // "anyone who already owns the full course" was excluded, but nothing
  // enforced it and five June-round alumni sat in the interest register
  // (found on the owner's full-list audit, 2026-08-15). Full-course owners
  // either attended a round (alumni) or are personally managed (Ring 1);
  // online-only owners get the same pitch at their real UPGRADE price in
  // their own ring — this blast's CTA quotes the full-course number.
  // bailey@: attended the June Melbourne round; the Jun-16 purchase record
  // postdates the room (owner: "he DID attend that mel course").
  const paid = new Set<string>(['bailey@reformhealth.com.au'])
  try {
    const { rows } = await sql<{ email: string }>`
      SELECT LOWER(email) AS email FROM users
      WHERE access_level IN ('full-course', 'online-only')
    `
    rows.forEach((r) => paid.add(r.email))
  } catch {
    // If the exclusion list cannot load, sending would risk pitching seats
    // to people who already hold them — fail closed on the whole audience.
    throw new Error('paid-exclusion query failed — refusing to build audience')
  }

  const push = (email: string | null, name: string | null, registered: boolean, city: string | null = null) => {
    const e = (email || '').trim().toLowerCase()
    if (!e || seen.has(e)) return
    // Partner and internal addresses are never campaign recipients.
    if (e.includes('embodia') || e.endsWith('@concussion-education-australia.com')) return
    if (paid.has(e)) return
    seen.add(e)
    out.push({ email: e, name: (name || '').trim(), registered, city })
  }

  // 1. Registered interest — the segment the opening line is literally about.
  try {
    // Most recent registration wins when someone registered two cities — two
    // of the twenty-five did, and the later choice is the better signal.
    const { rows } = await sql<{ email: string; name: string | null; city: string | null }>`
      SELECT DISTINCT ON (lower(email)) email, name, city
      FROM workshop_interest
      WHERE email IS NOT NULL
      ORDER BY lower(email), created_at DESC
    `
    rows.forEach((r) => push(r.email, r.name, true, r.city))
  } catch { /* table absent → segment simply empty */ }

  // 2. Free users from the LAST 60 DAYS (owner: "recent users (60 days)").
  //    ONLINE-ONLY owners are deliberately NOT here: the CTA quotes the
  //    full-course early-bird, but their real price is the UPGRADE — they get
  //    the same Melbourne pitch in their own ring at the correct number.
  const { rows: users } = await sql<{ email: string; name: string | null }>`
    SELECT email, name FROM users
    WHERE nurture_unsubscribed = false
      AND email NOT LIKE 'z.lew87+%'
      AND COALESCE(is_test, false) = false
      AND access_level = 'preview'
      AND created_at >= NOW() - INTERVAL '60 days'
  `
  users.forEach((u) => push(u.email, u.name, false))

  return out
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return run(request, false)
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const confirm = request.nextUrl.searchParams.get('confirm')
  return run(request, confirm === CONFIRM_FLAG)
}

async function run(request: NextRequest, willSend: boolean) {
  const base = CONFIG.APP_URL
  const bookLink = `${base}/pricing?location=melbourne#pricing-cards`
  const onlineLink = `${base}/pricing#pricing-cards`

  // TEST MODE: ?testTo=<email> sends exactly ONE fully-rendered sample (real
  // nominate links for that address, real unsubscribe link, the same
  // List-Unsubscribe headers the live send carries) with a [TEST] subject.
  // No audience build, no audit rows, no confirm flag — admin auth only.
  const testTo = request.nextUrl.searchParams.get('testTo')?.trim().toLowerCase()
  if (testTo) {
    const token = generateUnsubscribeToken(testTo)
    const unsubscribeUrl = `${base}/api/unsubscribe?email=${encodeURIComponent(testTo)}&token=${token}`
    const html = QUARTERLY_PRACTICAL_BLAST
      .template(
        'Zac', bookLink, onlineLink,
        {
          sydney: nominateClickUrl(testTo, 'sydney'),
          byron: nominateClickUrl(testTo, 'byron-bay'),
        },
        MEL_DATE_LABEL,
        true,
      )
      .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)
    const ok = await sendEmail({
      to: testTo,
      subject: `[TEST] ${QUARTERLY_PRACTICAL_BLAST.subject(MEL_DATE_LABEL)}`,
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@concussion-education-australia.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [{ name: 'sequence', value: 'quarterly-practical-blast-test' }],
    })
    return NextResponse.json({ test: true, to: testTo, sent: ok === true || ok !== false })
  }

  const all = await audience()

  // Suppression is checked for EVERY recipient before anything is sent, and an
  // error excludes rather than includes — the standing rule for every send lane.
  const eligible: Recipient[] = []
  const skipped: string[] = []
  for (const r of all) {
    try {
      if (await isEmailSuppressed(r.email)) { skipped.push(r.email); continue }
    } catch {
      skipped.push(r.email)
      continue
    }
    eligible.push(r)
  }

  if (!willSend) {
    return NextResponse.json({
      dryRun: true,
      note: `NO EMAILS SENT. To fire: POST ?confirm=${CONFIRM_FLAG}`,
      subject: QUARTERLY_PRACTICAL_BLAST.subject(MEL_DATE_LABEL),
      audience: {
        total: eligible.length,
        registeredInterest: eligible.filter((r) => r.registered).length,
        otherSegment: eligible.filter((r) => !r.registered).length,
        suppressedOrErrored: skipped.length,
      },
      sample: eligible.slice(0, 8).map((r) => ({ email: r.email, registered: r.registered, city: r.city })),
      byCity: eligible.reduce<Record<string, number>>((acc, r) => {
        const k = r.city || '(no city)'
        acc[k] = (acc[k] ?? 0) + 1
        return acc
      }, {}),
      previewHtml: QUARTERLY_PRACTICAL_BLAST.template(
        'Sample', bookLink, onlineLink,
        {
          sydney: nominateClickUrl('sample@example.com', 'sydney'),
          byron: nominateClickUrl('sample@example.com', 'byron-bay'),
        },
        MEL_DATE_LABEL,
        true,
      ),
    })
  }

  // DELIVERABILITY. Two things every other send lane in this codebase does and
  // this one did not:
  //
  //  1. LIST-UNSUBSCRIBE header. Google, Yahoo and Microsoft bulk-sender rules
  //     require one-click unsubscribe on bulk mail. A footer link in the body
  //     is not that — without the header the send is a spam-folder candidate
  //     before anyone reads a word, and it is the exact omission the 2026-08-06
  //     audit found on the neuro lane.
  //  2. SPACING. Every recipient fired in a tight loop lands as a burst from one
  //     domain, which is what a filter is built to notice. EmailScheduler
  //     staggers per recipient domain with jitter; Resend holds each send until
  //     its scheduledAt.
  //
  // The list is small enough that neither is urgent, and both are how a domain
  // reputation is kept rather than repaired.
  const scheduler = new EmailScheduler()
  let sent = 0
  const failed: string[] = []
  for (const r of eligible) {
    const token = generateUnsubscribeToken(r.email)
    const unsubscribeUrl = `${base}/api/unsubscribe?email=${encodeURIComponent(r.email)}&token=${token}`
    const html = QUARTERLY_PRACTICAL_BLAST
      .template(
        r.name, bookLink, onlineLink,
        {
          sydney: nominateClickUrl(r.email, 'sydney'),
          byron: nominateClickUrl(r.email, 'byron-bay'),
        },
        MEL_DATE_LABEL,
        r.registered,
      )
      .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

    // Campaign audit — the /admin/q4-campaign tracker counts sends from
    // these keys; ON CONFLICT keeps re-runs from double-counting.
    try {
      await sql`INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${'q4-mel-nov7:' + (r.registered ? 'registered' : 'other') + ':' + r.email}, NOW()) ON CONFLICT DO NOTHING`
    } catch { /* counting must never block a send */ }
    const ok = await sendEmail({
      to: r.email,
      scheduledAt: scheduler.next(r.email),
      subject: QUARTERLY_PRACTICAL_BLAST.subject(MEL_DATE_LABEL),
      html,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:unsubscribe@concussion-education-australia.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'sequence', value: 'quarterly-practical-blast' },
        { name: 'segment', value: r.registered ? 'registered-interest' : 'other' },
      ],
    })
    if (ok) sent++
    else failed.push(r.email)
  }

  return NextResponse.json({
    dryRun: false,
    sent,
    failed: failed.length,
    suppressedOrErrored: skipped.length,
  })
}
