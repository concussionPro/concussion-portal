import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { sendEmail } from '@/lib/resend-client'
import { isEmailSuppressed } from '@/lib/email-suppression'

/**
 * POST /api/admin/send-sst-sequence-preview  { to?, dryRun? }
 * One email containing the full SST T1–T3 sequence for owner review.
 * These strings are the canonical sequence copy — the engine templates
 * load from here when the sequence ships. (owner review 2026-07-06)
 */

export const SST_SEQUENCE = {
  t1: {
    subjects: [
      'Data-backed concussion rehab',
      'Compliant patients recover ~10 days faster',
      'Verified home rehab for concussion patients',
    ],
    body: `Hi {firstName},

Two findings from the sub-threshold exercise literature: patients who completed their prescribed home sessions recovered in a median 12 days, versus 21.5 for those who didn't — and nearly 4 in 10 didn't. On a paper diary, that only surfaces at re-test.

SST Trainer closes the between-visit gap. The patient's own watch holds their measured heart-rate band at home, every session verifies itself, and symptom flares reach you the same day they happen.

We're onboarding a founding group of clinics now — set up within the week, founding terms locked in for good. Reply "interested" and I'll take care of the rest.

Zac Lewis — Osteopath, Concussion Education Australia`,
  },
  t2: {
    hot: {
      subject: 'Setting up {clinicName}',
      body: `You spent some time with our material, so I'll keep this short. Founding setup is one email from us: your clinic code, patient links and QR the same day, and your first patient on a measured program that week. Reply "set us up" and it's done — or tell me what's holding you back.`,
    },
    warmPricing: {
      subject: 'What SST Trainer costs a clinic',
      body: `Straightforward: your first three patients are free — whole team, no card, no time limit. After that it's the founding rate, locked for good. Most clinics find one retained concussion patient covers the year. Reply "set us up" and your clinic code is live this week.`,
    },
    warmTrial: {
      subject: 'Run a graded test on yourself',
      body: `The demo code DEMO00 runs the full graded test — 10 minutes with any heart-rate source. The threshold it measures on you is the same instrument your patients train against at home. When you've tried it, reply "interested" and I'll set your clinic up.`,
    },
    cool: {
      subject: 'The GP report writes itself',
      body: `One thing clinics ask about most: at episode end, SST Trainer produces the single-page report you already owe the referring GP — measured threshold trajectory, symptom tables per session, and a clearance-or-extend recommendation, ready for your signature. Reply "sample" and I'll send you one generated from demo data.`,
    },
  },
  t3: {
    subject: 'Closing the founding group',
    body: `We're capping the founding group at {N} clinics so we can work directly with each one — {remaining} places are left as I write this. Founding clinics keep their terms for good and steer what gets built next. If the timing's wrong, no hard feelings — one reply either way and I'll stop writing.`,
  },
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const to = ((body.to as string | undefined) || 'z.lew87@gmail.com').trim()
  const dryRun = body.dryRun === true
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: 'A valid "to" address is required' }, { status: 400 })
  }
  // MASTER BLACKLIST — `to` is body-supplied, so this is a send lane like any
  // other and gets the same fail-closed gate (isEmailSuppressed returns true on
  // a DB error). Skipped for dryRun, which sends nothing.
  if (!dryRun && (await isEmailSuppressed(to))) {
    return NextResponse.json(
      { error: 'That address is on the suppression list — refusing to send.' },
      { status: 409 },
    )
  }
  const mode = (body.mode as string | undefined) || 'full'

  // 't1-live': the actual T1 a prospect would receive, plus the live pitch/
  // landing link so the owner can walk the whole cold-pitch experience.
  if (mode === 't1-live') {
    const s = SST_SEQUENCE
    const landing = 'https://portal.concussion-education-australia.com/clinical-suite'
    const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    const html = `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:560px;color:#1e293b;line-height:1.6;font-size:14px">
      <p style="font-size:11px;color:#64748b;margin:0 0 14px">PROSPECT VIEW · T1 as sent, plus the landing link (cold email itself carries NO link — this is for your review)</p>
      <p><strong>Subject:</strong> ${esc(s.t1.subjects[0])}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:12px 0">
      <div style="white-space:pre-wrap">${esc(s.t1.body.replace('{firstName}', 'Dr Chen'))}</div>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0">
      <p style="margin:0 0 6px"><strong>Walk the pitch page a prospect lands on:</strong></p>
      <p style="margin:0 0 16px"><a href="${landing}" style="display:inline-block;background:#16243f;color:#fff;font-weight:700;padding:12px 22px;border-radius:10px;text-decoration:none">${landing}</a></p>
      <p style="font-size:12px;color:#64748b">Check: value prop clear? animated demo present + working? does the clinic-code / trial flow make sense? would you enrol?</p>
    </div>`
    if (dryRun) return NextResponse.json({ ok: true, dryRun: true, to, mode, bytes: html.length })
    const ok = await sendEmail({ to, subject: `[REVIEW] ${s.t1.subjects[0]} — with pitch-page link`, html })
    return NextResponse.json({ ok, to, mode })
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const block = (title: string, subject: string, text: string, note?: string) => `
    <div style="margin:0 0 22px">
      <p style="margin:0 0 2px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0d7377">${title}</p>
      ${note ? `<p style="margin:0 0 6px;font-size:11px;color:#b45309">${note}</p>` : ''}
      <div style="border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
        <p style="margin:0 0 8px;font-size:13px"><strong>Subject:</strong> ${esc(subject)}</p>
        <p style="margin:0;font-size:13px;line-height:1.6;white-space:pre-wrap">${esc(text)}</p>
      </div>
    </div>`

  const s = SST_SEQUENCE
  const html = `<div style="font-family:-apple-system,'Segoe UI',sans-serif;max-width:640px;color:#1e293b">
    <h2 style="font-size:17px;margin:0 0 4px">SST cold sequence — full copy for review</h2>
    <p style="margin:0 0 18px;font-size:12.5px;color:#64748b">Cadence: T1 → T2 at 7 business days → T3 at 8 more. Engine picks the T2 variant from scanner-proof portal behaviour. No links, no tracking pixels, plain-text sends, reply-CTA only. Pricing in warm-pricing is the PROPOSED $49/mo clinic + 30-day trial — confirm before load.</p>
    ${block('T1 — all prospects', s.t1.subjects.join('  ·  '), s.t1.body, 'Three subject variants rotate; engine self-optimises on replies.')}
    ${block('T2 · HOT (returned / next-step / pricing ≥45s)', s.t2.hot.subject, s.t2.hot.body)}
    ${block('T2 · WARM-PRICING (viewed pricing once)', s.t2.warmPricing.subject, s.t2.warmPricing.body, 'Names the proposed price — only variant that does.')}
    ${block('T2 · WARM-TRIAL (opened the demo)', s.t2.warmTrial.subject, s.t2.warmTrial.body)}
    ${block('T2 · COOL (read, no strong signal)', s.t2.cool.subject, s.t2.cool.body)}
    ${block('T3 — final touch', s.t3.subject, s.t3.body, '{N} = founding cap (your number, enforced); {remaining} computed live, never faked.')}
    <p style="font-size:12px;color:#64748b">Reply with edits, or "load it" to wire into the engine with the analytics segment.</p>
  </div>`

  if (dryRun) return NextResponse.json({ ok: true, dryRun: true, to, bytes: html.length })
  const ok = await sendEmail({ to, subject: 'REVIEW — SST cold sequence T1–T3 (proposed pricing inside)', html })
  return NextResponse.json({ ok, to })
}
