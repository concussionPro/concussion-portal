// Per-prospect engagement detail — what a clinic actually spent time on.
// Usage:  node scripts/engagement-detail.mjs "on the mend"
// Read-only. Filters scanner/bot user-agents so the numbers reflect HUMANS
// (mirrors the bot filter the outreach engine uses for engagementHint).
import { config } from 'dotenv'
config({ path: '.env.local' })
import { sql } from '@vercel/postgres'

const needle = (process.argv[2] || '').trim()
if (!needle) { console.error('pass a clinic name fragment, e.g. "on the mend"'); process.exit(1) }

const BOT = '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|crawler|spider|slurp|facebook|linkedin|whatsapp|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'

const { rows: clinics } = await sql`
  SELECT id, short_name, status, contact_email, city, state, team, clinic_website_url
  FROM prospect_clinics WHERE short_name ILIKE ${'%' + needle + '%'} LIMIT 5`
if (!clinics.length) { console.log('no clinic matched', needle); process.exit(0) }

// 7 clinical roles, in lockstep with clinicalCount() in lib/prospect/pricing.ts
const CLINICAL = ['osteopaths','physiotherapists','exercisePhys','generalPractitioners','sportsMedicineDoctors','myotherapists','remedialMassage']
for (const c of clinics) {
  console.log(`\n=== ${c.short_name} (id ${c.id}, status ${c.status}) ===`)
  const team = c.team || {}
  const clinicalSum = CLINICAL.reduce((n, k) => n + (Number(team[k]) || 0), 0)
  const pkg = clinicalSum >= 6 ? 'ON-SITE team training (≥6 clinical)'
    : clinicalSum >= 2 ? 'HUB PACK (2–5 clinical)'
    : 'INDIVIDUAL self-paced course (≤1)'
  console.log(`  WHERE: ${c.city ?? '?'}, ${c.state ?? '?'}   site: ${c.clinic_website_url ?? '—'}`)
  console.log(`  TEAM: clinical=${clinicalSum}  →  PACKAGE PITCHED: ${pkg}`)
  console.log('  team breakdown:', JSON.stringify(team))
  // Per-section time spent (human-only). duration_seconds is the per-section
  // dwell; exclude the page_exit beacon rows (those carry total session ms).
  const { rows: secs } = await sql.query(
    `SELECT section_visited,
            COUNT(*)::int AS human_views,
            COALESCE(SUM(duration_seconds),0)::int AS total_secs,
            COALESCE(MAX(duration_seconds),0)::int AS max_secs
     FROM prospect_portal_views
     WHERE clinic_id = $1
       AND section_visited <> 'exit'
       AND COALESCE(user_agent,'') !~* $2
     GROUP BY section_visited
     ORDER BY total_secs DESC NULLS LAST`,
    [c.id, BOT])
  console.log('  time spent per section (human UA only):')
  console.table(secs)
  // Session dwell (the unfakeable signal) + bot vs human split.
  const { rows: ses } = await sql.query(
    `SELECT
       COUNT(*) FILTER (WHERE COALESCE(user_agent,'') !~* $2)::int AS human_rows,
       COUNT(*) FILTER (WHERE COALESCE(user_agent,'') ~* $2)::int  AS bot_rows,
       ROUND(MAX(COALESCE(dwell_ms,0))/1000.0)::int AS longest_session_secs
     FROM prospect_portal_views WHERE clinic_id = $1`,
    [c.id, BOT])
  console.table(ses)

  // ── Will the next touch fire, and with which hint? ──────────────────────
  const { rows: q } = await sql.query(
    `SELECT next_template_slug, scheduled_send_at, status,
            verification_score, verification_role, verification_accept_all, verification_disposable
     FROM prospect_clinics WHERE id = $1`, [c.id])
  const r = q[0]
  const TERMINAL = ['archived','lost','bounced','engaged','won','engaged-elsewhere','replied']
  const gateOk =
    r.verification_score != null && r.verification_score >= 80 &&
    !r.verification_role && !r.verification_accept_all && !r.verification_disposable
  const eligible = !!r.next_template_slug && !TERMINAL.includes(r.status) && gateOk
  // Replicate deriveEngagementHint exactly (pricing > trial > toolkit).
  const TOOLKIT = ['toolkit-pack','toolkit-callout','toolkit-clinical','toolkit-admin','toolkit-outreach','learning-suite','reference-library']
  const { rows: hintRows } = await sql.query(
    `SELECT DISTINCT LOWER(section_visited) s FROM prospect_portal_views
     WHERE clinic_id=$1 AND section_visited IS NOT NULL
       AND interaction_type IN ('view','section_view','cta_click')
       AND COALESCE(user_agent,'') !~* $2`, [c.id, BOT])
  const secset = new Set(hintRows.map(x => x.s))
  const hint = secset.has('pricing') ? 'pricing'
    : secset.has('module-1-trial') ? 'trial'
    : TOOLKIT.some(s => secset.has(s)) ? 'toolkit' : null
  console.log('  NEXT-TOUCH ELIGIBILITY:')
  console.table([{ next_template: r.next_template_slug, scheduled: r.scheduled_send_at,
    status: r.status, gate_clean: gateOk, ELIGIBLE_TO_SEND: eligible, ENGAGEMENT_HINT: hint }])
  if (!eligible) console.log('  ⚠️  NOT eligible — they will get NO follow-up. Reason:',
    !r.next_template_slug ? 'no next_template_slug (sequence exhausted/unset)'
    : TERMINAL.includes(r.status) ? `status='${r.status}' is excluded from the queue`
    : 'failed verification gate (score<80 / role / accept_all / disposable)')
}
process.exit(0)
