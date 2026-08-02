/**
 * One-off founder send: CSEP Route 2 Email 1 (process + fee enquiry).
 * Copy source: docs/applications/CSEP-SUBMISSION-PACK.md — EMAIL 1 (ESSA-granted version, 2026-08-02).
 * Suppression check fails closed per repo rule, even for a 1:1 founder send.
 *
 * Usage: node scripts/send-csep-enquiry.mjs --live   (dry run without --live)
 */
import { Resend } from 'resend'
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
function parseEnv(path) {
  try {
    return Object.fromEntries(
      readFileSync(path, 'utf8')
        .split('\n')
        .filter((l) => l.includes('=') && !l.startsWith('#'))
        .map((l) => [
          l.slice(0, l.indexOf('=')),
          l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, ''),
        ])
    )
  } catch {
    return {}
  }
}
// Production env (vercel env pull) takes precedence; local is fallback.
const env = {
  ...parseEnv(join(__dirname, '..', '.env.local')),
  ...(process.env.PROD_ENV_FILE ? parseEnv(process.env.PROD_ENV_FILE) : {}),
}

const LIVE = process.argv.includes('--live')
const TO = 'info@csep.ca'
const FROM = 'Zac Lewis — Concussion Education Australia <zac@concussion-education-australia.com>'
const REPLY_TO = 'zac@concussion-education-australia.com'
const SUBJECT =
  'Route 2 accreditation enquiry — online concussion rehabilitation course for CSEP-CEP and CSEP-CPT members'

const TEXT = `Dear CSEP,

I am the founder of Concussion Education Australia, a specialist concussion-education provider. We deliver an online, self-paced course — Concussion Rehab Mastery — that trains exercise professionals to deliver heart-rate-threshold-guided aerobic rehabilitation after concussion, which the 2022 Amsterdam international consensus statement established as first-line treatment.

We would like to pursue Route 2 formal accreditation so the course can be reviewed by CSEP and promoted to CSEP Certified members, rather than relying only on member self-reporting through the PDC Tracker.

Could you please advise:

1. The process and documentation CSEP requires for a Route 2 accreditation request, and any application form we should use.
2. The fee, if any, for an overseas provider of online CPD.
3. The review turnaround and the term of accreditation once granted (per-course, annual, or otherwise).
4. How CSEP would like the PDC value expressed — our course comprises 480 minutes of assessed instructional content across eight modules, which we would claim as 8 PDCs at one credit per hour.
5. Whether CSEP has any preference for how an overseas course addresses Canadian scope of practice and provincial return-to-play legislation — we hold a Canadian-context annex for exactly this and are happy to align it to your expectations.

One point of context that may simplify your review: CSEP already grants equivalency to Exercise & Sports Science Australia's Accredited Exercise Physiologist (AEP) and Accredited Exercise Scientist (AES) credentials. This course is written to the ESSA AEP scope of practice, and ESSA granted its professional development endorsement of the course in July 2026, following independent review by two ESSA-appointed reviewers — the online course was credited 8 CPD points at one point per contact hour, with a further 8 for its optional face-to-face practical component.

Should it assist your review, the complete course is available to CSEP reviewers with no login at: https://portal.concussion-education-australia.com/demo/review-csep

A complete submission pack — learning outcomes, assessment specification, evidence base, author credentials and the Canadian annex — is ready and can be sent the same day.

Kind regards,

Zac Lewis
Registered Osteopath (AHPRA OST0001852866) · Director and founder
Concussion Education Australia Pty Ltd · ABN 74 688 155 508
2 Wordsworth St, Byron Bay NSW 2481, Australia
zac@concussion-education-australia.com · +61 449 186 579
concussion-education-australia.com`

const HTML = TEXT.split('\n\n')
  .map((p) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, '<br/>')}</p>`)
  .join('\n')
  .replace(
    'https://portal.concussion-education-australia.com/demo/review-csep',
    '<a href="https://portal.concussion-education-australia.com/demo/review-csep">https://portal.concussion-education-australia.com/demo/review-csep</a>'
  )

async function main() {
  // Suppression check — fail closed.
  try {
    const sql = neon(env.POSTGRES_URL)
    const rows = await sql`SELECT email FROM email_suppression WHERE lower(email) = ${TO}`
    if (rows.length > 0) {
      console.error(`ABORT: ${TO} is on the suppression list.`)
      process.exit(1)
    }
  } catch (e) {
    console.error('ABORT: suppression check failed (fail closed):', e.message)
    process.exit(1)
  }

  if (!LIVE) {
    console.log('DRY RUN — suppression check passed. Would send:')
    console.log({ to: TO, from: FROM, replyTo: REPLY_TO, subject: SUBJECT })
    console.log('\n--- TEXT ---\n' + TEXT)
    return
  }

  const resend = new Resend(env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TO,
    replyTo: REPLY_TO,
    subject: SUBJECT,
    text: TEXT,
    html: `<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">${HTML}</div>`,
    tags: [{ name: 'lane', value: 'accreditation-founder' }],
  })
  if (error) {
    console.error('SEND FAILED:', error)
    process.exit(1)
  }
  console.log('SENT. Resend id:', data.id)
}

main()
