/**
 * Enterprise first-touch sends — founder lane, 1:1, ≤3/day.
 * Copy source: ~/Documents/CEA_2026/enterprise/first-touch-drafts.md (doctrine:
 * <80 words, zero links, one question). Suppression fails closed per repo rule.
 *
 * Usage: node scripts/send-enterprise-wave.mjs [--live] [--only proactive,sportsspinal]
 * PROD_ENV_FILE=<path to vercel env pull output> for the live Resend key.
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
        .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')])
    )
  } catch {
    return {}
  }
}
const env = {
  ...parseEnv(join(__dirname, '..', '.env.local')),
  ...(process.env.PROD_ENV_FILE ? parseEnv(process.env.PROD_ENV_FILE) : {}),
}

const LIVE = process.argv.includes('--live')
const onlyArg = process.argv.indexOf('--only')
const ONLY = onlyArg > -1 ? process.argv[onlyArg + 1].split(',') : null

const FROM = 'Zac Lewis — Concussion Education Australia <zac@concussion-education-australia.com>'
const REPLY_TO = 'zac@concussion-education-australia.com'

const SENDS = {
  proactive: {
    to: 'nick.m@pro-active.com.au',
    subject: 'Concussion care your contract managers can evidence',
    text: `Nick — concussion rehab changed in 2022 (prescribed sub-symptom exercise, first-line), and scheme-funded work increasingly asks for evidence of current training and standardised outcomes reporting.

We certify clinical teams in the updated protocol (Osteopathy Australia-endorsed, ESSA-accredited) with a platform that produces the documentation — GP letters and return-to-activity reports generated from measured session data.

Worth 20 minutes, or is this one for your clinical advisory board?

Zac Lewis
Osteopath · Founder, Concussion Education Australia
zac@concussion-education-australia.com · +61 449 186 579`,
  },
  sportsspinal: {
    to: 'andrew@sportsandspinalphysio.com.au',
    subject: 'The concussion protocol your sports clinicians were trained before',
    text: `Andrew — the athletes you work with are exactly where the 2022 concussion consensus bites: first-line treatment is now measured-threshold aerobic prescription, and most clinicians trained earlier never learned the testing layer.

We certify teams in the updated protocol (Osteopathy Australia-endorsed, ESSA-accredited) and license the delivery tool — measured thresholds, monitored home sessions, auto-drafted GP clearance letters.

Worth 20 minutes across your clinics?

Zac Lewis
Osteopath · Founder, Concussion Education Australia
zac@concussion-education-australia.com · +61 449 186 579`,
  },
  habit: {
    // HOLD until 2026-08-06 (ACC round-1 follow-up slot — this IS Habit's escalation)
    to: 'julie.cameron@habit.health',
    subject: 'Current-consensus concussion care across your ACC Concussion Service',
    text: `Julie — Habit delivers the ACC Concussion Service nationwide, which makes one 2022 shift directly yours: first-line treatment is now measured sub-symptom exercise prescription, and published surveys show only ~1 in 3 rehab clinicians prescribe it.

We certify clinical teams in the updated protocol (published, open-access) and license the delivery platform — measured thresholds, monitored sessions, and ACC-format reporting (884/885) generated from real data.

Worth 20 minutes with you or your concussion service lead?

Zac Lewis
Osteopath · Founder, Concussion Education Australia
zac@concussion-education-australia.com · +61 449 186 579`,
  },
}

const textToHtml = (t) =>
  '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">' +
  t.split('\n\n').map((p) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, '<br/>')}</p>`).join('') +
  '</div>'

async function main() {
  const keys = Object.keys(SENDS).filter((k) => !ONLY || ONLY.includes(k))
  const sql = neon(env.POSTGRES_URL)
  for (const k of keys) {
    const s = SENDS[k]
    // Suppression — fail closed.
    try {
      const rows = await sql`SELECT email FROM email_suppression WHERE lower(email) = ${s.to.toLowerCase()}`
      if (rows.length > 0) {
        console.error(`SKIP ${k}: ${s.to} is suppressed.`)
        continue
      }
    } catch (e) {
      console.error(`ABORT ${k}: suppression check failed (fail closed):`, e.message)
      continue
    }
    if (!LIVE) {
      console.log(`DRY RUN ${k} → ${s.to} · "${s.subject}" (suppression clear)`)
      continue
    }
    const resend = new Resend(env.RESEND_API_KEY)
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: s.to,
      replyTo: REPLY_TO,
      subject: s.subject,
      text: s.text,
      html: textToHtml(s.text),
      tags: [{ name: 'lane', value: 'enterprise-founder' }, { name: 'target', value: k }],
    })
    if (error) console.error(`FAIL ${k}:`, error)
    else console.log(`SENT ${k} → ${s.to} · Resend ${data.id}`)
  }
}
main()
