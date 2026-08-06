/**
 * PREVIEW ONLY — sends the three workshop date-announce variants to
 * z.lew87@gmail.com for founder review. NOTHING goes to the list from this
 * script. The live send (post-approval) will be a separate lane that derives
 * dates from CONFIG.LOCATIONS, dedupes, and checks email_suppression
 * fail-closed.
 */
import fs from 'fs'
if (!process.env.RESEND_API_KEY) for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const PREVIEW_TO = 'z.lew87@gmail.com'
const FROM = 'Concussion Education Australia <zac@concussion-education-australia.com>'
const BASE = 'https://portal.concussion-education-australia.com'
import crypto from 'crypto'

// Mirrors lib/workshop-votes.ts voteToken — MUST be signed with the PROD
// SESSION_SECRET for links to validate on the live site.
function voteToken(email, city) {
  const secret = process.env.SESSION_SECRET || process.env.MAGIC_LINK_SECRET
  if (!secret) throw new Error('SESSION_SECRET required to sign vote links')
  return crypto.createHmac('sha256', secret).update(`workshop-vote:${email.trim().toLowerCase()}:${city}`).digest('hex').slice(0, 24)
}
function voteLink(email, city) {
  return `${BASE}/api/workshops/date-vote?city=${city}&e=${encodeURIComponent(email)}&t=${voteToken(email, city)}&s=nov-dates-2026`
}
function voteRow(email) {
  const btn = (city, label, bg) => `<a href="${voteLink(email, city)}" style="display:inline-block;margin:4px;padding:11px 16px;background:${bg};color:#fff;text-decoration:none;border-radius:9px;font-weight:600;font-size:13.5px;">${label}</a>`
  return `
    <p style="margin:22px 0 4px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;text-align:center;">One click — which date would you come to?</p>
    <p style="margin:0 0 8px;font-size:12.5px;color:#64748b;text-align:center;">Not a booking — it just tells us your numbers so dates lock in.</p>
    <p style="text-align:center;margin:0;">
      ${btn('melbourne', 'Melbourne · Sat 7 Nov', '#0d9488')}
      ${btn('byron-bay', 'Byron Bay · Sat 14 Nov', '#0f766e')}
      ${btn('sydney', 'Sydney · Sat 21 Nov', '#115e59')}
    </p>
    <p style="text-align:center;margin:8px 0 0;"><a href="${voteLink(email, 'none')}" style="font-size:12.5px;color:#64748b;text-decoration:underline;">None of these work — keep me posted</a></p>`
}

// ⚠ PLANNED dates — placeholders for review. The live send derives from CONFIG.LOCATIONS.
const DATES = [
  { city: 'Melbourne', date: 'Saturday 7 November', note: '$1,190 early-bird until Fri 24 Oct' },
  { city: 'Byron Bay', date: 'Saturday 14 November', note: '$1,190 early-bird until Fri 31 Oct' },
  { city: 'Sydney', date: 'Saturday 21 November', note: '$1,190 early-bird until Fri 7 Nov' },
]

const utm = (content) => `utm_source=resend&utm_medium=email&utm_campaign=nov-dates-2026&utm_content=${content}`

const datesTable = DATES.map(d => `
  <tr>
    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${d.city}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#334155;">${d.date}</td>
    <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px;">${d.note}</td>
  </tr>`).join('')

const shared = {
  // ACCURACY (2026-08-06, Register C). This read "…the one concussion program
  // accredited across both professions." Two defects in one clause: it is an
  // unsubstantiated superlative (banned by docs/brand-voice.md and the AHPRA
  // advertising guidelines), and it collapses two DIFFERENT products into one —
  // Osteopathy Australia endorses Concussion Clinical Mastery only, ESSA
  // accredits Concussion Rehab Mastery only, and no single course holds both.
  credStrip: `<p style="margin:18px 0 0;font-size:12.5px;color:#64748b;text-align:center;">Concussion Clinical Mastery &mdash; endorsed by Osteopathy Australia &middot; Concussion Rehab Mastery &mdash; accredited by ESSA.</p>`,
  dayBlock: `
    <p style="margin:20px 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;">The practical day</p>
    <p style="margin:0;font-size:14.5px;color:#334155;line-height:1.6;">Supervised hands-on assessment on real cases &mdash; SCAT6, VOMS, BESS, cervical and oculomotor &mdash; plus return-to-play decision pathways, finishing with OSCE-assessed competency. You leave signed off, not just informed. <strong>Each day is capped at 12</strong> &mdash; that&rsquo;s the supervised format, not a marketing number.</p>`,
  platformBlock: `
    <p style="margin:18px 0 6px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#0f172a;">Included with enrolment</p>
    <p style="margin:0;font-size:14.5px;color:#334155;line-height:1.6;">The working clinical platform: the <strong>SST Trainer</strong> (measured heart-rate-threshold rehab your patients run on their own phone) and <strong>Preseason Baseline &amp; Serial Testing</strong> &mdash; the instruments to deliver what the course teaches, from day one.</p>`,
  paNote: `<p style="margin:16px 0 0;font-size:13.5px;color:#64748b;">Perth &amp; Adelaide &mdash; nominations are open, and you&rsquo;re welcome at any listed date. We&rsquo;ll also be at the OA Conference on 17 October.</p>`,
  footer: `<div style="margin-top:28px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12.5px;color:#94a3b8;">Zac Lewis &middot; Registered Osteopath &middot; Concussion Education Australia<br>You&rsquo;re receiving this because you registered interest in a practical day. [List-Unsubscribe + unsubscribe link inserted by the live send]</div>`,
}

function shell(inner) {
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1e293b;">
    <div style="height:4px;background:linear-gradient(90deg,#0d9488,#0ea5e9);border-radius:2px;margin-bottom:24px;"></div>
    ${inner}
    ${shared.footer}
  </div>`
}

const dateTableHtml = `<table style="width:100%;border-collapse:collapse;margin:14px 0;background:#f8fafc;border-radius:12px;overflow:hidden;">${datesTable}</table>`

const variants = [
  {
    tag: 'paid-unfulfilled',
    subject: 'Your practical day — pick your date',
    html: shell(`
      <h2 style="margin:0 0 12px;font-size:21px;color:#0f172a;">Live dates are set — and your seat is already paid.</h2>
      <p style="font-size:15px;color:#334155;line-height:1.65;">Hi {{firstName}},</p>
      <p style="font-size:15px;color:#334155;line-height:1.65;">You enrolled in the Complete course, which includes the hands-on practical day. Dates are now live &mdash; just reply and tell me which one suits you:</p>
      ${dateTableHtml}
      ${shared.dayBlock}
      <p style="text-align:center;margin:26px 0 0;">
        <a href="mailto:zac@concussion-education-australia.com?subject=My%20practical%20day%20date" style="display:inline-block;padding:13px 26px;background:#0d9488;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Reply with your date &rarr;</a>
      </p>
      ${shared.paNote}
      ${shared.credStrip}`),
  },
  {
    tag: 'online-upgrade',
    subject: 'Live dates announced — complete your certification in person',
    html: shell(`
      <h2 style="margin:0 0 12px;font-size:21px;color:#0f172a;">The practical day now has dates. Your online work already counts.</h2>
      <p style="font-size:15px;color:#334155;line-height:1.65;">Hi {{firstName}},</p>
      <p style="font-size:15px;color:#334155;line-height:1.65;">You own the online course (8 CPD hours). Adding the practical day takes you to the full 16 CPD hours and the hands-on, OSCE-assessed certification &mdash; the upgrade is <strong>$693</strong> at early-bird (the difference to the Complete price, nothing lost on what you&rsquo;ve paid).</p>
      ${dateTableHtml}
      ${voteRow(PREVIEW_TO)}
      ${shared.dayBlock}
      ${shared.platformBlock}
      <p style="text-align:center;margin:26px 0 0;">
        <a href="${BASE}/pricing?${utm('online-upgrade')}" style="display:inline-block;padding:13px 26px;background:#0d9488;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Upgrade &amp; pick your city &rarr;</a>
      </p>
      ${shared.paNote}
      ${shared.credStrip}`),
  },
  {
    tag: 'interest-list',
    subject: 'Live dates: Melbourne & Byron Bay — early-bird open',
    html: shell(`
      <h2 style="margin:0 0 12px;font-size:21px;color:#0f172a;">The dates you registered for are live.</h2>
      <p style="font-size:15px;color:#334155;line-height:1.65;">Hi {{firstName}},</p>
      <p style="font-size:15px;color:#334155;line-height:1.65;">You asked to be told when a practical day was scheduled. Two are now locked, with Sydney announced at the OA Conference:</p>
      ${dateTableHtml}
      ${voteRow(PREVIEW_TO)}
      <p style="font-size:14.5px;color:#334155;line-height:1.6;"><strong>$1,190 early-bird</strong> until the date shown for each city, then $1,400 in the final fortnight. The Complete course is the full 8-module online program (start today) plus your practical day &mdash; 16 CPD hours all up. <strong>These are the last practical days of 2026</strong> &mdash; the next round is next year.</p>
      <p style="font-size:14.5px;color:#334155;line-height:1.6;">One more thing worth saying plainly: every region ends up with a clinic GPs send concussion to. The clinician who can show a measured heart-rate-threshold recovery &mdash; not an estimate &mdash; and a documented return-to-play record tends to become that clinic. That capability is what the course and the included SST Trainer are for.</p>
      ${shared.dayBlock}
      ${shared.platformBlock}
      <p style="text-align:center;margin:26px 0 0;">
        <a href="${BASE}/pricing?${utm('interest-list')}" style="display:inline-block;padding:13px 26px;background:#0d9488;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Enrol &mdash; $1,190 early-bird &rarr;</a>
      </p>
      ${shared.paNote}
      ${shared.credStrip}`),
  },
]

for (const v of variants) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [PREVIEW_TO],
      subject: `[PREVIEW · ${v.tag}] ${v.subject}`,
      html: `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:10px 14px;margin:0 auto 8px;max-width:560px;font-family:sans-serif;font-size:12px;color:#92400e;"><strong>PREVIEW — segment: ${v.tag}.</strong> Dates are PLANNED placeholders (Melb 31 Oct / BB 21 Nov) — live send derives from CONFIG.LOCATIONS after you confirm. Nothing has been sent to the list.</div>` + v.html.replace(/\{\{firstName\}\}/g, 'Zac'),
    }),
  })
  const out = await res.json()
  console.log(v.tag, res.status, out.id || out.message || '')
}
