import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'
import { sendEmail } from '@/lib/resend-client'
import { QUARTERLY_PRACTICAL_BLAST } from '@/lib/email-sequences'
import { isEmailSuppressed } from '@/lib/email-suppression'
import { CONFIG } from '@/lib/config'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'

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
const CONFIRM_FLAG = 'quarterly-practical-melbourne-2026-10-31'

type Recipient = { email: string; name: string; registered: boolean }

async function audience(): Promise<Recipient[]> {
  const out: Recipient[] = []
  const seen = new Set<string>()

  const push = (email: string | null, name: string | null, registered: boolean) => {
    const e = (email || '').trim().toLowerCase()
    if (!e || seen.has(e)) return
    // Partner and internal addresses are never campaign recipients.
    if (e.includes('embodia') || e.endsWith('@concussion-education-australia.com')) return
    seen.add(e)
    out.push({ email: e, name: (name || '').trim(), registered })
  }

  // 1. Registered interest — the segment the opening line is literally about.
  try {
    const { rows } = await sql<{ email: string; name: string | null }>`
      SELECT DISTINCT email, name FROM workshop_interest WHERE email IS NOT NULL
    `
    rows.forEach((r) => push(r.email, r.name, true))
  } catch { /* table absent → segment simply empty */ }

  // 2. Free-course completers and online-only owners who have NOT bought the
  //    practical. They never registered interest, so they get the other opening.
  const { rows: users } = await sql<{ email: string; name: string | null }>`
    SELECT email, name FROM users
    WHERE access_level IN ('preview', 'online-only')
      AND nurture_unsubscribed = false
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
  const bookLink = `${base}/pricing`
  const onlineLink = `${base}/pricing`

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
      subject: QUARTERLY_PRACTICAL_BLAST.subject,
      audience: {
        total: eligible.length,
        registeredInterest: eligible.filter((r) => r.registered).length,
        otherSegment: eligible.filter((r) => !r.registered).length,
        suppressedOrErrored: skipped.length,
      },
      sample: eligible.slice(0, 8).map((r) => ({ email: r.email, registered: r.registered })),
      previewHtml: QUARTERLY_PRACTICAL_BLAST.template('Sample', true, bookLink, onlineLink),
    })
  }

  let sent = 0
  const failed: string[] = []
  for (const r of eligible) {
    const token = generateUnsubscribeToken(r.email)
    const unsubscribeUrl = `${base}/api/unsubscribe?email=${encodeURIComponent(r.email)}&token=${token}`
    const html = QUARTERLY_PRACTICAL_BLAST
      .template(r.name, r.registered, bookLink, onlineLink)
      .replaceAll('{{unsubscribe_url}}', unsubscribeUrl)

    const ok = await sendEmail({
      to: r.email,
      subject: QUARTERLY_PRACTICAL_BLAST.subject,
      html,
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
