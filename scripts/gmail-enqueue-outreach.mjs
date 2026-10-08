/**
 * Stage the verified clinic outreach list into the Gmail outbox as DRAFTS.
 *
 * Drafts only — nothing sends until Zac approves the rows, and the cron then
 * paces them (45s average gap, 120s per-domain, 100/day). Arming is sending,
 * so this script can never create an approved row.
 *
 *   node --env-file=.env.local scripts/gmail-enqueue-outreach.mjs \
 *        --copy ./outreach-t1.txt --segment EP --limit 40 [--commit]
 *
 * The copy file is YOUR text. Placeholders: {first}, {clinic}, {line}
 *   {line} = the true sentence captured from that clinic's own website.
 * Without --commit it prints what it WOULD queue and writes nothing.
 */
import { readFileSync } from 'node:fs'
import { sql } from '@vercel/postgres'

/** Mirrors lib/gmail/outbox.ts enqueueGmail — kept as raw SQL because the
 *  '@/...' path aliases in that module only resolve inside Next. */
async function enqueueGmail(i) {
  const { rows } = await sql`
    INSERT INTO gmail_outbox (recipient, subject, text, html, sequence, audit_key, status, not_before)
    VALUES (${i.to.trim().toLowerCase()}, ${i.subject}, ${i.text}, ${i.html ?? null},
            ${i.sequence ?? null}, ${i.auditKey ?? null}, ${i.status ?? 'draft'}, null)
    ON CONFLICT (audit_key) DO NOTHING
    RETURNING id`
  return rows[0]?.id ?? null
}
/** FAIL CLOSED: a suppression lookup that throws must never allow a send. */
async function isEmailSuppressed(email) {
  try {
    const { rows } = await sql`SELECT 1 FROM email_suppression WHERE lower(email) = ${email.trim().toLowerCase()} LIMIT 1`
    return rows.length > 0
  } catch (err) {
    console.error('  suppression check FAILED — treating as suppressed:', err.message)
    return true
  }
}

const arg = (n, d = null) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d }
const has = (n) => process.argv.includes(n)
const COPY = arg('--copy'), SEG = arg('--segment', 'ALL'), LIMIT = Number(arg('--limit', '40')), COMMIT = has('--commit')
if (!COPY) { console.error('--copy <file> is required'); process.exit(1) }

const raw = readFileSync(COPY, 'utf8')
const [subjectLine, ...bodyLines] = raw.split('\n')
if (!/^subject:/i.test(subjectLine)) { console.error('First line of the copy file must be "Subject: ..."'); process.exit(1) }
const SUBJECT = subjectLine.replace(/^subject:\s*/i, '').trim()
const BODY = bodyLines.join('\n').replace(/^\n+/, '')

const CLUB = /academy|tennis|cricket club|football club|golf|coaching/i
const isClubOrg = (r) => CLUB.test(r.name) && !/physio|osteo|chiro|rehab|health|sports medicine/i.test(r.name)
const segOf = (r) => isClubOrg(r) ? 'CLUB' : r.ep.length ? 'EP' : r.team.length ? 'CLUB-CONN'
  : (r.osteo.length && r.sport.length >= 2) ? 'OSTEO' : 'GENERAL'

const all = JSON.parse(readFileSync('/tmp/cea-national-list.json', 'utf8')).filter(r => r.verdict === 'CONFIRMED')
let pool = all.map(r => ({ ...r, seg: segOf(r) }))
  .filter(r => SEG === 'ALL' ? ['EP', 'CLUB-CONN', 'OSTEO'].includes(r.seg) : r.seg === SEG)
  .sort((a, b) => (b.ep.length * 2 + b.team.length) - (a.ep.length * 2 + a.team.length))

// Gmail's own shape: one <div> per line, <div><br></div> for blanks, no styling.
const toGmailHtml = (t) => t.split('\n').map(l => l.trim() === '' ? '<div><br></div>' : `<div>${l
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`).join('')

const out = []
for (const r of pool) {
  if (out.length >= LIMIT) break
  if (await isEmailSuppressed(r.contact_email)) { console.log(`  skip (suppressed) ${r.contact_email}`); continue }
  const first = (r.contact_first_name || (r.contact_full_name || '').split(/\s+/)[0] || '').trim()
  if (!first) { console.log(`  skip (no first name) ${r.contact_email}`); continue }
  const line = (r.evidence || '').trim()
  if (BODY.includes('{line}') && !line) { console.log(`  skip (no verified line) ${r.contact_email}`); continue }
  const text = BODY.replace(/\{first\}/g, first).replace(/\{clinic\}/g, r.name).replace(/\{line\}/g, line)
  out.push({ r, text })
}

console.log(`\nsegment=${SEG}  limit=${LIMIT}  ready=${out.length}  ${COMMIT ? 'COMMITTING AS DRAFTS' : '(dry run — nothing written)'}\n`)
for (const { r } of out.slice(0, 5)) console.log(`  ${r.contact_full_name} <${r.contact_email}> — ${r.name}`)
if (out.length > 5) console.log(`  …and ${out.length - 5} more`)

if (!COMMIT) { console.log('\nAdd --commit to stage these as DRAFTS (still requires your approval to send).'); process.exit(0) }
let staged = 0
for (const { r, text } of out) {
  const id = await enqueueGmail({
    to: r.contact_email, subject: SUBJECT, text, html: toGmailHtml(text),
    sequence: `clinic-outreach-${r.seg.toLowerCase()}`,
    auditKey: `clinic-outreach:t1:${r.id}`,   // idempotent: re-running never double-queues
    status: 'draft',
  })
  if (id) staged++
}
console.log(`\nstaged ${staged} DRAFTS. Nothing sends until you approve them.`)
