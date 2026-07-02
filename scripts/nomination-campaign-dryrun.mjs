/**
 * Nomination-campaign dry run — terminal sanity check, READ-ONLY.
 *
 * Mirrors the segment queries in app/api/admin/nomination-campaign/route.ts
 * (interest = workshop_interest registrants, upgrade = online-only owners)
 * and prints eligible counts per segment/city WITHOUT hitting the API and
 * WITHOUT writing anything (no audit rows, no sends).
 *
 * Usage:
 *   node scripts/nomination-campaign-dryrun.mjs
 *   node scripts/nomination-campaign-dryrun.mjs sydney   # filter interest segment to one city
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
const { sql } = await import('@vercel/postgres')

const cityArg = process.argv[2] || null
const VALID_CITIES = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa']
if (cityArg && !VALID_CITIES.includes(cityArg)) {
  console.error(`Unknown city "${cityArg}". Valid: ${VALID_CITIES.join(', ')}`)
  process.exit(1)
}

function tally(rows) {
  const t = {
    candidates: rows.length,
    eligible: 0,
    suppressed: 0,
    unsubscribed: 0,
    alreadyOwns: 0,
    alreadyContacted: 0,
    recentAgentB: 0,
  }
  for (const r of rows) {
    if (r.suppressed) { t.suppressed++; continue }
    if (r.unsubscribed) { t.unsubscribed++; continue }
    if (r.already_owns) { t.alreadyOwns++; continue }
    if (r.already_contacted) { t.alreadyContacted++; continue }
    if (r.recent_agent_b) { t.recentAgentB++; continue }
    t.eligible++
  }
  return t
}

function printTally(label, t) {
  console.log(`\n${label}`)
  console.log(`  candidates:        ${t.candidates}`)
  console.log(`  ELIGIBLE:          ${t.eligible}`)
  console.log(`  - suppressed:      ${t.suppressed}`)
  console.log(`  - unsubscribed:    ${t.unsubscribed}`)
  console.log(`  - already own CCM: ${t.alreadyOwns}`)
  console.log(`  - already contacted (nomination_campaign_*): ${t.alreadyContacted}`)
  console.log(`  - Agent B in last 21d: ${t.recentAgentB}`)
}

// ── Segment: interest (workshop_interest registrants) ───────────────────────
const { rows: interestRows } = await sql`
  WITH latest AS (
    SELECT DISTINCT ON (LOWER(email))
      LOWER(email) AS email, name, city
    FROM workshop_interest
    WHERE ${cityArg}::text IS NULL OR city = ${cityArg}
    ORDER BY LOWER(email), created_at DESC
  )
  SELECT
    l.email,
    l.city,
    EXISTS (
      SELECT 1 FROM email_suppression s WHERE LOWER(s.email) = l.email
    ) AS suppressed,
    EXISTS (
      SELECT 1 FROM users u
      WHERE LOWER(u.email) = l.email AND COALESCE(u.nurture_unsubscribed, false) = true
    ) AS unsubscribed,
    EXISTS (
      SELECT 1 FROM users u
      WHERE LOWER(u.email) = l.email AND u.access_level = 'full-course'
    ) AS already_owns,
    EXISTS (
      SELECT 1 FROM email_audit_log a
      WHERE a.audit_key IN (
        'nomination_campaign_interest_' || l.email,
        'nomination_campaign_upgrade_' || l.email
      )
    ) AS already_contacted,
    EXISTS (
      SELECT 1
      FROM users u
      JOIN email_audit_log a ON a.audit_key IN (
        'completer_convert_price_' || u.id,
        'completer_convert_relevance_' || u.id,
        'completer_convert_workshop_' || u.id
      )
      WHERE LOWER(u.email) = l.email
        AND a.sent_at >= NOW() - INTERVAL '21 days'
    ) AS recent_agent_b
  FROM latest l
  ORDER BY l.city, l.email
`

// OWNER DIRECTIVE (Zac, 2026-07-02): the Sydney interest group is NOT pitched
// by this campaign — the API route excludes it even on all-cities sends.
// Mirror that here so the dry run matches what would actually send.
const EXCLUDED_CITIES = ['sydney']

console.log('=== NOMINATION CAMPAIGN — DRY RUN (read-only) ===')
console.log(cityArg ? `City filter: ${cityArg}` : 'City filter: none (all cities)')

const sendableRows = interestRows.filter((r) => !EXCLUDED_CITIES.includes(r.city))
printTally("Segment 'interest' — TOTAL (after owner exclusions)", tally(sendableRows))

// Per-city breakdown for the interest segment
const byCity = new Map()
for (const r of interestRows) {
  if (!byCity.has(r.city)) byCity.set(r.city, [])
  byCity.get(r.city).push(r)
}
for (const [city, rows] of [...byCity.entries()].sort()) {
  if (EXCLUDED_CITIES.includes(city)) {
    console.log(`\n  interest / ${city} — EXCLUDED by owner directive (${rows.length} registrants, will NOT be emailed)`)
    continue
  }
  printTally(`  interest / ${city}`, tally(rows))
}

// ── Segment: upgrade (online-only owners) ────────────────────────────────────
const { rows: upgradeRows } = await sql`
  SELECT DISTINCT ON (LOWER(u.email))
    LOWER(u.email) AS email,
    EXISTS (
      SELECT 1 FROM email_suppression s WHERE LOWER(s.email) = LOWER(u.email)
    ) AS suppressed,
    COALESCE(u.nurture_unsubscribed, false) AS unsubscribed,
    EXISTS (
      SELECT 1 FROM users u2
      WHERE LOWER(u2.email) = LOWER(u.email) AND u2.access_level = 'full-course'
    ) AS already_owns,
    EXISTS (
      SELECT 1 FROM email_audit_log a
      WHERE a.audit_key IN (
        'nomination_campaign_interest_' || LOWER(u.email),
        'nomination_campaign_upgrade_' || LOWER(u.email)
      )
    ) AS already_contacted,
    EXISTS (
      SELECT 1 FROM email_audit_log a
      WHERE a.audit_key IN (
        'completer_convert_price_' || u.id,
        'completer_convert_relevance_' || u.id,
        'completer_convert_workshop_' || u.id
      )
        AND a.sent_at >= NOW() - INTERVAL '21 days'
    ) AS recent_agent_b
  FROM users u
  WHERE u.access_level = 'online-only'
  ORDER BY LOWER(u.email)
`

printTally("Segment 'upgrade' — online-only owners", tally(upgradeRows))

// Enrolled paid nominations per city (drives the ">= 5 of 8" momentum line)
const { rows: enrolledRows } = await sql`
  SELECT workshop_location AS city, COUNT(*)::int AS count
  FROM users
  WHERE access_level = 'full-course' AND workshop_location IS NOT NULL
  GROUP BY workshop_location
  ORDER BY workshop_location
`
console.log('\nPaid nominations per city (all-time, unscoped — the API round-scopes):')
for (const r of enrolledRows) console.log(`  ${r.city}: ${r.count}`)
console.log('\nNOTE: momentum sentence ("{n} of 8 places are taken") only renders when a city has >= 5 round-scoped enrolments.')
console.log('Done — nothing was written or sent.')
process.exit(0)
