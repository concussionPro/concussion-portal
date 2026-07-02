// Permanently remove a single email address from ALL outreach.
// Usage:  node scripts/remove-from-outreach.mjs info@aeon-health.com.au
//
// Covers every surface that could email the address:
//   1. email_suppression  — canonical do-not-contact; preflight.ts blocks
//      any suppressed address on EVERY cold-send path.
//   2. prospect_clinics    — terminal status 'archived' + audit note so the
//      cold engine pulls the clinic from the sequence and the dashboard
//      reflects the removal.
//   3. users.nurture_unsubscribed — stops lifecycle / nurture sends.
//   4. partner_institutions — status 'archived' + audit note so the partner
//      engine (initials AND followups) never touches the address again.
// Idempotent. Reports what existed before acting.
import { config } from 'dotenv'
config({ path: '.env.local' })
import { sql } from '@vercel/postgres'

const email = (process.argv[2] || '').trim().toLowerCase()
if (!email || !email.includes('@')) {
  console.error('pass an email, e.g. node scripts/remove-from-outreach.mjs info@aeon-health.com.au')
  process.exit(1)
}
const today = new Date().toISOString().slice(0, 10)

// ── 1. report current state ────────────────────────────────────────────────
const { rows: alreadySupp } = await sql`SELECT email, reason, source FROM email_suppression WHERE LOWER(email) = ${email}`
const { rows: clinics } = await sql`
  SELECT id, short_name, status, contact_email FROM prospect_clinics WHERE LOWER(contact_email) = ${email}`
const { rows: users } = await sql`
  SELECT id, email, nurture_unsubscribed FROM users WHERE LOWER(email) = ${email}`
const { rows: partners } = await sql`
  SELECT id, name, status, contact_email FROM partner_institutions WHERE LOWER(contact_email) = ${email}`

console.log(`\n=== Removing ${email} from all outreach (${today}) ===`)
console.log(`email_suppression : ${alreadySupp.length ? 'already present (' + alreadySupp[0].reason + ')' : 'not present'}`)
console.log(`prospect_clinics  : ${clinics.length} matching row(s)`)
clinics.forEach(c => console.log(`    - #${c.id} ${c.short_name} [status=${c.status}]`))
console.log(`users (nurture)   : ${users.length} matching row(s)`)
users.forEach(u => console.log(`    - ${u.id} [nurture_unsubscribed=${u.nurture_unsubscribed}]`))
console.log(`partner_institutions : ${partners.length} matching row(s)`)
partners.forEach(p => console.log(`    - #${p.id} ${p.name} [status=${p.status}]`))

// ── 2. suppress (canonical do-not-contact) ──────────────────────────────────
await sql`
  INSERT INTO email_suppression (email, reason, source)
  VALUES (${email}, 'manual-removal-do-not-contact', 'admin')
  ON CONFLICT (email) DO NOTHING`
console.log(`\n[1/4] suppression  : ensured (reason=manual-removal-do-not-contact)`)

// ── 3. pull any prospect_clinics rows from the sequence ─────────────────────
let clinicsArchived = 0
for (const c of clinics) {
  if (['archived', 'won', 'lost', 'engaged-elsewhere'].includes(c.status)) continue
  await sql`
    UPDATE prospect_clinics
    SET status = 'archived',
        next_template_slug = NULL,
        notes = COALESCE(notes, '') || E'\n[removed=admin/' || ${today} || '] manual do-not-contact — pulled from cold sequence',
        updated_at = NOW()
    WHERE id = ${c.id}`
  clinicsArchived++
}
console.log(`[2/4] prospect rows: ${clinicsArchived} archived${clinics.length - clinicsArchived ? ', ' + (clinics.length - clinicsArchived) + ' already terminal' : ''}`)

// ── 4. unsubscribe any nurture user ─────────────────────────────────────────
const { rowCount: usersUnsub } = await sql`
  UPDATE users SET nurture_unsubscribed = true WHERE LOWER(email) = ${email} AND nurture_unsubscribed IS NOT TRUE`
console.log(`[3/4] nurture user : ${usersUnsub ?? 0} updated${users.length && !usersUnsub ? ' (already unsubscribed)' : ''}`)

// ── 5. pull any partner_institutions rows from the partner engine ───────────
// The partner cron already skips suppressed addresses, but archive the row
// too so "removed from ALL outreach" is true at the pipeline level (and the
// partner dashboard reflects the removal, mirroring the prospect step).
let partnersArchived = 0
for (const p of partners) {
  if (['archived', 'won'].includes(p.status)) continue
  await sql`
    UPDATE partner_institutions
    SET status = 'archived',
        notes = COALESCE(notes, '') || E'\n[removed=admin/' || ${today} || '] manual do-not-contact — pulled from partner outreach'
    WHERE id = ${p.id}`
  partnersArchived++
}
console.log(`[4/4] partner rows : ${partnersArchived} archived${partners.length - partnersArchived ? ', ' + (partners.length - partnersArchived) + ' already terminal' : ''}`)

console.log(`\n✓ ${email} removed from all outreach.\n`)
process.exit(0)
