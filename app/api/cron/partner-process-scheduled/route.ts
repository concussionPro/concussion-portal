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
import { verifyEmailAddress, HunterRateLimitError } from '@/lib/prospect/hunter-verify'

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
    `I've set ${name} up with a concussion resource for your athletes:`,
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
  return { subject: `Concussion resource for ${name}'s athletes`, text, html }
}

function wrapHtml(text: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;color:#0f172a">`
    + text.split('\n').map((l) => (l === '' ? '<br>' : `<div>${l}</div>`)).join('')
    + `</div>`
}

/** Followup touches (Zac 2026-07-01). Gentle, value-first, no "free", never
 *  references browsing. The final touch offers a clean opt-out. */
function buildFollowup(stage: 'followup' | 'final', name: string, slug: string, firstName: string) {
  const link = `${BASE}/partners/${slug}`
  if (stage === 'followup') {
    const text = [
      `Hi ${firstName},`, ``,
      `Circling back on the concussion resource I set up for ${name} — the season-long baseline testing, the SCAT6/SCOAT6 forms and a short trainer refresher are ready whenever you'd like to switch them on: ${link}`, ``,
      `The part most academies find useful: if an athlete's concussed, your trainers can flag it fast, and I pick it up via telehealth and connect them with a local clinician for rehab.`, ``,
      `There's a time to book on the page if it's worth a look. No rush either way.`, ``,
      `Zac Lewis, Osteopath`, `Concussion Education Australia`,
    ].join('\n')
    return { subject: `Following up — concussion cover for ${name}'s athletes`, text, html: wrapHtml(text) }
  }
  const text = [
    `Hi ${firstName},`, ``,
    `Last note from me on this — the athlete concussion resource for ${name} stays available: baseline testing, the SCAT6/SCOAT6 tools, and telehealth assessments for your athletes, all here: ${link}`, ``,
    `If concussion cover isn't a priority this season, no problem at all — just reply and I'll leave it there.`, ``,
    `Zac Lewis, Osteopath`, `Concussion Education Australia`,
  ].join('\n')
  return { subject: `Athlete concussion resource for ${name}`, text, html: wrapHtml(text) }
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
  // Followup migration (Zac 2026-07-01): the original UNIQUE(institution_id)
  // capped every partner at ONE email ever — the root cause of 0 engagement.
  // Add a stage column and re-key uniqueness on (institution_id, stage) so each
  // of initial/followup/final logs once. Existing rows backfill to 'initial'.
  await sql`ALTER TABLE partner_outreach_log ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'initial'`
  await sql`ALTER TABLE partner_outreach_log DROP CONSTRAINT IF EXISTS partner_outreach_log_institution_id_key`
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS partner_outreach_log_inst_stage_uidx ON partner_outreach_log(institution_id, stage)`

  // TRUE daily cap (Zac 2026-06-17): subtract today's partner sends so the
  // 11:30am backup schedule only sends the remainder of a missed 9:30am run —
  // never a second full batch (would be 12/day). Idempotency already prevents
  // re-pitching the same institution; this keeps the daily VOLUME at 6.
  const { rows: todayRows } = await sql<{ n: number }>`
    SELECT COUNT(*)::int n FROM partner_outreach_log WHERE sent_at::date = CURRENT_DATE`
  const remainingToday = Math.max(0, PARTNER_DAILY_MAX - (todayRows[0]?.n ?? 0))
  if (remainingToday === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: `daily cap ${PARTNER_DAILY_MAX} already met today` })
  }

  const resend = new Resend(resendKey)
  const runStart = Date.now()
  // First send is ~5 min out (must be strictly FUTURE for Resend scheduledAt),
  // then 8-12 min apart — founder-paced, never a blast.
  let staggerMs = 5 * 60_000
  const results: Array<{ name: string; outcome: string }> = []
  let capLeft = remainingToday

  // ── FOLLOWUPS FIRST (Zac 2026-07-01) ──────────────────────────────────────
  // Contacted partners with no reply get a 2nd (+~10 days) then 3rd touch — the
  // fix for the single-touch dead pipeline. Already Hunter-verified + delivered
  // on the initial, so no re-verification. NOTE: this lane has no inbound reply
  // detection, so a partner that engages must be moved OFF status='contacted'
  // (e.g. to 'lead-warm'/'won') for followups to stop.
  const { rows: followRows } = await sql<{ id: number; name: string; slug: string; contact_email: string; contact_name: string; touches: number; last_sent: string }>`
    SELECT pi.id, pi.name, pi.slug, pi.contact_email, pi.contact_name,
           (SELECT COUNT(*)::int FROM partner_outreach_log ol WHERE ol.institution_id = pi.id) AS touches,
           (SELECT MAX(sent_at) FROM partner_outreach_log ol WHERE ol.institution_id = pi.id) AS last_sent
    FROM partner_institutions pi
    WHERE pi.status = 'contacted'
      AND pi.contact_email IS NOT NULL AND pi.contact_email <> ''
    ORDER BY pi.tier ASC, pi.id ASC`
  const FOLLOWUP_GAP_MS = 10 * 24 * 60 * 60 * 1000 // ~7 business days between touches
  const followEligible = followRows.filter((p) =>
    p.touches >= 1 && p.touches < 3 && p.last_sent &&
    (runStart - new Date(p.last_sent).getTime()) >= FOLLOWUP_GAP_MS
  ).slice(0, capLeft)

  for (const inst of followEligible) {
    await new Promise((r) => setTimeout(r, 700))
    const stage: 'followup' | 'final' = inst.touches === 1 ? 'followup' : 'final'
    const firstName = (inst.contact_name && !/reception|office|general/i.test(inst.contact_name))
      ? inst.contact_name.split(' ')[0] : 'there'
    const { subject, text, html } = buildFollowup(stage, inst.name, inst.slug, firstName)
    const scheduledAt = new Date(runStart + staggerMs).toISOString()
    staggerMs += STAGGER_MIN_MS + Math.random() * (STAGGER_MAX_MS - STAGGER_MIN_MS)
    try {
      const out = await resend.emails.send({ from: FROM, to: inst.contact_email, replyTo: REPLY_TO, subject, text, html, scheduledAt })
      if (out.error) { results.push({ name: inst.name, outcome: `error: ${out.error.message}` }); continue }
      await sql`INSERT INTO partner_outreach_log (institution_id, stage, resend_email_id) VALUES (${inst.id}, ${stage}, ${out.data?.id ?? null}) ON CONFLICT (institution_id, stage) DO NOTHING`
      if (stage === 'final') await sql`UPDATE partner_institutions SET status='sequence-complete' WHERE id=${inst.id}`
      capLeft--
      results.push({ name: inst.name, outcome: `sent ${stage}` })
    } catch (err) {
      results.push({ name: inst.name, outcome: `error: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  // ── INITIAL sends — leads not yet contacted, with whatever cap remains. ────
  const { rows: due } = capLeft > 0 ? await sql`
    SELECT id, name, slug, contact_email, contact_name
    FROM partner_institutions pi
    WHERE pi.status = 'lead'
      AND pi.contact_email IS NOT NULL AND pi.contact_email <> ''
      AND NOT EXISTS (SELECT 1 FROM partner_outreach_log ol WHERE ol.institution_id = pi.id)
    ORDER BY pi.tier ASC, pi.id ASC
    LIMIT ${capLeft}` : { rows: [] }

  for (const inst of due) {
    // Space the API CALLS to stay under Resend's 2 req/sec limit (the stagger
    // above is delivery time; this delay is the call rate).
    await new Promise((r) => setTimeout(r, 700))

    // HARD GATE (Zac 2026-06-16): school/academy contacts were pattern-guessed
    // (smclean@terrace.qld.edu.au) and went out UNVERIFIED — three bounced onto
    // the shared domain on the first batch. Verify every address against Hunter
    // before sending, mirroring the clinic lane. Undeliverable/invalid/disposable
    // → suppress permanently (status='bounced'); catch-all/unknown/low-score →
    // hold as a lead (no send, no DB change) so it can be re-checked or replaced.
    let verdict
    try {
      verdict = await verifyEmailAddress(inst.contact_email)
    } catch (err) {
      if (err instanceof HunterRateLimitError) {
        results.push({ name: inst.name, outcome: 'skipped: hunter credits exhausted' })
        break
      }
      results.push({ name: inst.name, outcome: `skipped: verify error` })
      continue
    }
    if (verdict.bounce) {
      // Undeliverable / invalid / disposable — a real bounce. Suppress forever.
      await sql`UPDATE partner_institutions SET status='bounced' WHERE id=${inst.id}`
      results.push({ name: inst.name, outcome: `suppressed: ${verdict.status}/${verdict.result}` })
      continue
    }
    // Partnership rule (looser than the clinic lane on purpose): a catch-all
    // edu/gov domain ACCEPTS mail, so it won't bounce — sending there is safe.
    // Only genuine uncertainty (status/result 'unknown', not deliverable, not
    // catch-all) is held. We deliberately DON'T suppress holds: the mailbox may
    // be real, so it stays a 'lead' for a contact upgrade rather than burning it.
    const sendable = verdict.result === 'deliverable' || verdict.status === 'accept_all'
    if (!sendable) {
      await sql`UPDATE partner_institutions SET status='needs_contact' WHERE id=${inst.id}`
      results.push({ name: inst.name, outcome: `held: ${verdict.status}/${verdict.result} score=${verdict.score}` })
      continue
    }

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
      await sql`INSERT INTO partner_outreach_log (institution_id, stage, resend_email_id) VALUES (${inst.id}, 'initial', ${out.data?.id ?? null}) ON CONFLICT (institution_id, stage) DO NOTHING`
      await sql`UPDATE partner_institutions SET status='contacted' WHERE id=${inst.id}`
      results.push({ name: inst.name, outcome: 'sent' })
    } catch (err) {
      results.push({ name: inst.name, outcome: `error: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  return NextResponse.json({ ok: true, due: due.length, followups: followEligible.length, sent: results.filter((r) => r.outcome.startsWith('sent')).length, cap: PARTNER_DAILY_MAX, results })
}
