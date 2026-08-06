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

// ─────────────────────────────────────────────────────────────────────────────
// OWNER DIRECTIVE 2026-08-03: "DO NOT SEND THE OTHERS BY RESEND."
// This lane is CLOSED for new enterprise first-touches. The two entries below
// are retained as a RECORD of what was sent on 2026-08-03 only. All remaining
// enterprise emails (Habit, Healthia, Gensolve, any future target) are drafted
// into Zac's Mac Mail for his personal edit + send — never through this script.
// The live-send path below is disabled.
// ─────────────────────────────────────────────────────────────────────────────
const LANE_CLOSED = true

const SENDS = {
  proactive: {
    to: 'nick.m@pro-active.com.au',
    subject: 'Concussion care your contract managers can evidence',
    text: `Nick — concussion rehab changed in 2022 (prescribed sub-symptom exercise, first-line), and scheme-funded work increasingly asks for evidence of current training and standardised outcomes reporting.

We certify clinical teams in the updated protocol — Concussion Clinical Mastery, Osteopathy Australia-endorsed, plus a separate ESSA-accredited rehab stream for exercise physiologists — with a platform that produces the documentation — GP letters and return-to-activity reports generated from measured session data.

Worth 20 minutes, or is this one for your clinical advisory board?

Zac Lewis
Osteopath · Founder, Concussion Education Australia
zac@concussion-education-australia.com · +61 449 186 579`,
  },
  sportsspinal: {
    to: 'andrew@sportsandspinalphysio.com.au',
    subject: 'The concussion protocol your sports clinicians were trained before',
    text: `Andrew — the athletes you work with are exactly where the 2022 concussion consensus bites: first-line treatment is now measured-threshold aerobic prescription, and most clinicians trained earlier never learned the testing layer.

We certify teams in the updated protocol — Concussion Clinical Mastery, Osteopathy Australia-endorsed, plus a separate ESSA-accredited rehab stream for exercise physiologists — and license the delivery tool — measured thresholds, monitored home sessions, auto-drafted GP clearance letters.

Worth 20 minutes across your clinics?

Zac Lewis
Osteopath · Founder, Concussion Education Australia
zac@concussion-education-australia.com · +61 449 186 579`,
  },
  // habit: REMOVED 2026-08-03 — drafted into Zac's Mac Mail instead (owner sends personally).
}

const textToHtml = (t) =>
  '<div style="font-family:Georgia,serif;font-size:15px;line-height:1.55;color:#1a1a1a;max-width:640px;">' +
  t.split('\n\n').map((p) => `<p style="margin:0 0 1em 0;">${p.replace(/\n/g, '<br/>')}</p>`).join('') +
  '</div>'

async function main() {
  if (LANE_CLOSED && LIVE) {
    console.error('LANE CLOSED (owner directive 2026-08-03): enterprise sends go via Mac Mail drafts only. Refusing to send.')
    process.exit(1)
  }
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
