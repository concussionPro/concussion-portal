/**
 * GET /api/cron/partner-process-scheduled
 *
 * The PARTNERSHIP send lane — runs IN PARALLEL with the clinic cold engine but
 * independent: its own small daily cap, its own recipients (partner_institutions),
 * its own pitch (free athlete concussion resource → /partners/<slug>).
 *
 * Deliverability safety: partnerships go to school/academy domains (stricter
 * filters), so this is deliberately LOW volume (PARTNER_DAILY_MAX, default 6),
 * staggered, and the COMBINED domain health is still guarded by the same
 * complaint/bounce reality — if the domain's 30-day complaint rate is at the
 * Gmail red line, this lane backs off too (shares the adaptive-cap signal).
 *
 * Auth: Vercel cron Bearer CRON_SECRET, or manual x-admin-key.
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'
import { sql } from '@/lib/db'
import { computeAdaptiveCap } from '@/lib/prospect/adaptive-cap'

export const maxDuration = 300

const BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.concussion-education-australia.com'
const FROM = 'Zac Lewis <partnerships@concussion-education-australia.com>'
const REPLY_TO = 'zac@concussion-education-australia.com'
const PARTNER_DAILY_MAX = parseInt(process.env.PARTNER_DAILY_MAX || '6', 10) || 6
const STAGGER_MIN_MS = 8 * 60_000
const STAGGER_MAX_MS = 12 * 60_000

function buildPitch(name: string, slug: string, firstName: string) {
  const link = `${BASE}/partners/${slug}`
  const text = [
    `Hi ${firstName},`,
    ``,
    `I run Concussion Education Australia — we train Australia's clinicians in concussion management (Osteopathy Australia endorsed).`,
    ``,
    `I've set ${name} up with a free concussion resource for your athletes — at no cost:`,
    ` • Season-long baseline cognitive testing`,
    ` • The fillable SCAT6/SCOAT6 assessment forms`,
    ` • A short concussion refresher for your trainers`,
    ``,
    `If one of your athletes is concussed, the tools above help flag whether they need an assessment. I offer telehealth assessments exclusively to partners — I review the athlete, write up a report, and connect them with a local clinician suited to their rehabilitation.`,
    ``,
    `Here's what it looks like for ${name} — there's a time to book on the page if you'd like to set it up: ${link}`,
    ``,
    `Zac Lewis, Osteopath`,
    `Concussion Education Australia`,
  ].join('\n')
  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#0f172a">`
    + text.split('\n').map((l) => (l === '' ? '<br>' : `<div>${l.replace(/ • /, '&nbsp;&bull; ')}</div>`)).join('')
    + `</div>`
  return { subject: `Free concussion resource for ${name}'s athletes`, text, html }
}

export async function GET(request: NextRequest) {
  // Auth — admin OR cron secret.
  const adminKey = request.headers.get('x-admin-key')
  const adminSecret = process.env.ADMIN_API_KEY
  const isAdmin = !!adminKey && !!adminSecret && adminKey.length === adminSecret.length &&
    crypto.timingSafeEqual(Buffer.from(adminKey), Buffer.from(adminSecret))
  if (!isAdmin) {
    const auth = request.headers.get('authorization')
    const expected = `Bearer ${process.env.CRON_SECRET}`
    if (!process.env.CRON_SECRET || !auth || auth.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(auth), Buffer.from(expected))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 })

  // Shared deliverability guard: if the domain is at the complaint/bounce red
  // line, the adaptive cap returns 0 — partnerships back off too.
  const cap = await computeAdaptiveCap()
  if (cap.cap === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: `domain throttled: ${cap.reason}` })
  }

  // Schema: a partner_outreach_log to prevent double-sends (idempotent).
  await sql`CREATE TABLE IF NOT EXISTS partner_outreach_log (
    id SERIAL PRIMARY KEY, institution_id INT NOT NULL, sent_at TIMESTAMPTZ DEFAULT NOW(),
    resend_email_id TEXT, UNIQUE(institution_id))`

  // Eligible: lead status, has a contact email, not already sent.
  const { rows: due } = await sql`
    SELECT id, name, slug, contact_email, contact_name
    FROM partner_institutions pi
    WHERE pi.status = 'lead'
      AND pi.contact_email IS NOT NULL AND pi.contact_email <> ''
      AND NOT EXISTS (SELECT 1 FROM partner_outreach_log ol WHERE ol.institution_id = pi.id)
    ORDER BY pi.tier ASC, pi.id ASC
    LIMIT ${PARTNER_DAILY_MAX}`

  const resend = new Resend(resendKey)
  const runStart = Date.now()
  // First send is ~5 min out (must be strictly FUTURE for Resend scheduledAt),
  // then 8-12 min apart — founder-paced, never a blast.
  let staggerMs = 5 * 60_000
  const results: Array<{ name: string; outcome: string }> = []

  for (const inst of due) {
    // Space the API CALLS to stay under Resend's 2 req/sec limit (the stagger
    // above is delivery time; this delay is the call rate).
    await new Promise((r) => setTimeout(r, 700))
    const firstName = (inst.contact_name && !/reception|office|general/i.test(inst.contact_name))
      ? inst.contact_name.split(' ')[0] : 'there'
    const { subject, text, html } = buildPitch(inst.name, inst.slug, firstName)
    const scheduledAt = new Date(runStart + staggerMs).toISOString()
    staggerMs += STAGGER_MIN_MS + Math.random() * (STAGGER_MAX_MS - STAGGER_MIN_MS)
    try {
      const out = await resend.emails.send({
        from: FROM, to: inst.contact_email, replyTo: REPLY_TO, subject, text, html,
        scheduledAt,
      })
      if (out.error) { results.push({ name: inst.name, outcome: `error: ${out.error.message}` }); continue }
      await sql`INSERT INTO partner_outreach_log (institution_id, resend_email_id) VALUES (${inst.id}, ${out.data?.id ?? null}) ON CONFLICT (institution_id) DO NOTHING`
      await sql`UPDATE partner_institutions SET status='contacted' WHERE id=${inst.id}`
      results.push({ name: inst.name, outcome: 'sent' })
    } catch (err) {
      results.push({ name: inst.name, outcome: `error: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  return NextResponse.json({ ok: true, due: due.length, sent: results.filter((r) => r.outcome === 'sent').length, cap: PARTNER_DAILY_MAX, results })
}
