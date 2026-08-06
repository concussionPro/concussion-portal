/**
 * POST /api/admin/acc-followup — schedule the ACC round-2 follow-ups (T2).
 *
 * Round 1 went via Mac Mail 2026-07-28 (24 sends). T2 threads on each org's
 * round-1 subject and is SCHEDULED via Resend for Wed 2026-08-06 10:00 NZST
 * (the T1→T2 cadence point). Runs in production because the valid
 * RESEND_API_KEY lives here (the local copy is rotated/stale).
 *
 * Idempotent via email_audit_log (acc_t2_<email>); suppression FAIL CLOSED;
 * brad@whateverittakes.co.nz excluded (bounced round 1 — jolene is the swap).
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { sendEmail } from '@/lib/resend-client'
import { isAdminRequest } from '@/lib/require-admin'
import { generateUnsubscribeToken } from '@/app/api/unsubscribe/route'
import { CONFIG } from '@/lib/config'

export const maxDuration = 120

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || CONFIG.SEO.SITE_URL

const SCHEDULED_AT = '2026-08-05T22:00:00.000Z' // Wed 2026-08-06 10:00 NZST

const MAP: [string, string][] = [
  ['referrals@srsltd.co.nz', 'Your ACC884s, written as the care happens'],
  ['jessica.lange@tbihealth.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['referrals@abi-rehab.co.nz', 'Your ACC884s, written as the care happens'],
  ['admin@coastalrehabservices.co.nz', 'Your ACC884s, written as the care happens'],
  ['jolene@whateverittakes.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['sportshub@motushealth.co.nz', 'Your ACC884s, written as the care happens'],
  ['referrals@advantagesouth.co.nz', 'Your ACC884s, written as the care happens'],
  ['emma.davidson@apmworkcare.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['mail@astechnz.com', 'Your ACC884s, written as the care happens'],
  ['admin@aptrehab.co.nz', 'Your ACC884s, written as the care happens'],
  ['admin@rehabtaranaki.co.nz', 'Your ACC884s, written as the care happens'],
  ['performance@focusonpotential.com', 'Your ACC884s, written as the care happens'],
  ['referrals@tuialliedhealth.co.nz', 'Your ACC884s, written as the care happens'],
  ['admin@bodyinmotion.co.nz', 'Your ACC884s, written as the care happens'],
  ['contracts@alignhealth.co.nz', 'Your ACC884s, written as the care happens'],
  ['kathryn.jones@lfbit.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['pauline.penney@activeplus.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['info@axissportsmedicine.co.nz', 'Your ACC884s, written as the care happens'],
  ['julie@ropeneurorehab.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['admin@bayrehab.co.nz', 'Your ACC884s, written as the care happens'],
  ['info@genevahealth.com', 'Your ACC884s, written as the care happens'],
  ['scott@hemispherehealth.co.nz', 'Improved sub-threshold rehab for concussion'],
  ['charmeyne@whateverittakes.co.nz', 'Improved sub-threshold rehab for concussion'],
]

const GENERIC = /^(referrals|admin|info|mail|sportshub|performance|contracts)@/

function greet(email: string): string {
  if (GENERIC.test(email)) return 'Hi team,'
  const first = email.split('@')[0].split('.')[0]
  return 'Hi ' + first[0].toUpperCase() + first.slice(1) + ','
}

function body(email: string): string {
  return `${greet(email)}

Following up briefly. SST Trainer is a patient app plus a clinician dashboard for measured sub-threshold concussion rehab — built for ACC-contracted clinics.

Your patient tests and trains on the watch they already own; every session verifies as it happens; and the ACC884 client summary content compiles itself from the episode.

Worth a look before your next ACC reporting round? The demo is open, no login:

portal.concussion-education-australia.com/acc

Zac Lewis · Osteopath · Member, Sports Medicine Australia
Founder, Concussion Education Australia`
}

function toHtml(text: string): string {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const linked = esc.replace(
    /portal\.concussion-education-australia\.com\/acc/g,
    '<a href="https://portal.concussion-education-australia.com/acc">portal.concussion-education-australia.com/acc</a>',
  )
  return linked
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 1em 0;font-family:inherit;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let suppressed: Set<string>
  try {
    const { rows } = await sql`SELECT LOWER(email) AS e FROM email_suppression`
    suppressed = new Set(rows.map((r) => r.e as string))
  } catch (err) {
    console.error('[acc-t2] suppression load failed — ABORT (fail closed):', err)
    return NextResponse.json({ error: 'suppression load failed' }, { status: 503 })
  }

  await sql`CREATE TABLE IF NOT EXISTS email_audit_log (audit_key TEXT PRIMARY KEY, sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`

  const scheduled: string[] = []
  const skipped: string[] = []
  for (const [email, subj] of MAP) {
    if (suppressed.has(email.toLowerCase())) { skipped.push(`${email} (suppressed)`); continue }
    const auditKey = `acc_t2_${email.toLowerCase()}`
    const { rowCount } = await sql`
      INSERT INTO email_audit_log (audit_key, sent_at) VALUES (${auditKey}, NOW())
      ON CONFLICT (audit_key) DO NOTHING`
    if (!rowCount) { skipped.push(`${email} (already scheduled)`); continue }
    // A cold outreach blast with a `sequence` tag and no List-Unsubscribe left
    // "reply STOP" as the only opt-out (AU Spam Act / Google bulk-sender gap,
    // 2026-08-06 audit). Same token the public /api/unsubscribe route parses,
    // plus the mailto fallback the prospect engine already uses.
    const unsubUrl = `${BASE_URL}/api/unsubscribe?email=${encodeURIComponent(email)}&token=${generateUnsubscribeToken(email)}`
    const ok = await sendEmail({
      to: email,
      subject: 'Re: ' + subj,
      html: toHtml(body(email)),
      scheduledAt: SCHEDULED_AT,
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe@concussion-education-australia.com>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'type', value: 'acc-followup' },
        { name: 'sequence', value: 'acc-t2' },
      ],
    })
    if (ok) scheduled.push(email)
    else {
      await sql`DELETE FROM email_audit_log WHERE audit_key = ${auditKey}`
      skipped.push(`${email} (send failed — retryable)`)
    }
  }
  return NextResponse.json({ scheduledFor: SCHEDULED_AT, scheduled, skipped })
}
