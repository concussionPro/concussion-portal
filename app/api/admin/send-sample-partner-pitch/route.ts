/**
 * POST /api/admin/send-sample-partner-pitch
 *
 * Sends Zac a sample of the PARTNERSHIP outreach (the telehealth-funnel pitch to
 * a sports institution) so he can review it. Mirrors the new cold structure:
 * value-first text + ONE clean per-institution link to /partners/<slug>, no
 * tracking params. Defaults to Hunter Academy of Sport (lead #1).
 *
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 30

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.RESEND_API_KEY
  if (!key) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const slug: string = body.slug || 'hunter-academy-of-sport'
  const name: string = body.name || 'Hunter Academy of Sport'
  const firstName: string = body.firstName || 'Sallie'
  const link = `${BASE}/partners/${slug}`

  // Partner T1 — value-first (free athlete resource), institution-free, the
  // telehealth backup framed last as a safety net, ONE clean link. Matches the
  // partner page structure. Plain text, no tracking.
  const subject = `Concussion resource for ${name}'s athletes`
  const text = [
    `Hi ${firstName},`,
    ``,
    `I run Concussion Education Australia — we train Australia's clinicians in concussion management (Osteopathy Australia endorsed).`,
    ``,
    `I've set ${name} up with a concussion resource for your athletes:`,
    ` • Season-long baseline cognitive testing`,
    ` • The fillable SCAT6/SCOAT6 assessment forms`,
    ` • A short concussion refresher for your trainers`,
    ``,
    `If one of your athletes is concussed, the tools above help flag whether they need an assessment. I offer telehealth assessments exclusively to partners — I review the athlete, write up a report, and connect them with a local clinician suited to their rehabilitation.`,
    ``,
    `Here's what it looks like for ${name} — take a look, and there's a time to book on the page if you'd like to set it up: ${link}`,
    ``,
    `Zac Lewis, Osteopath`,
    `Concussion Education Australia`,
  ].join('\n')

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#0f172a">`
    + text.split('\n').map((l) => l === '' ? '<br>' : `<div>${l.replace(/ • /, '&nbsp;&bull; ')}</div>`).join('')
    + `</div>`

  const zacInbox = process.env.ZAC_INBOX ?? 'zac@concussion-education-australia.com'
  try {
    const resend = new Resend(key)
    const result = await resend.emails.send({
      from: 'Zac Lewis <partnerships@concussion-education-australia.com>',
      to: zacInbox,
      replyTo: 'zac@concussion-education-australia.com',
      subject: `[SAMPLE] ${subject}`,
      text,
      html,
    })
    if (result.error) return NextResponse.json({ ok: false, error: result.error.message }, { status: 502 })
    return NextResponse.json({ ok: true, sentTo: zacInbox, subject, link, id: result.data?.id })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
