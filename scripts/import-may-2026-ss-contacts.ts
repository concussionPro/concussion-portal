/**
 * One-off: import 42 recent Squarespace contacts directly into the users table
 * as preview/squarespace, WITHOUT firing the Day 0 welcome email. Each gets
 * a scat_day0_<userId> audit-log row so the nurture cron skips Day 0 and
 * picks them up from Day 1 onward.
 *
 * Run with:  npx tsx scripts/import-may-2026-ss-contacts.ts
 * Requires:  POSTGRES_URL in .env.local
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

import { sql } from '@vercel/postgres'
import { createUser, findUserByEmail } from '../lib/users'

interface Contact { email: string; name?: string }

const CONTACTS: Contact[] = [
  { email: 'tessavanroy@hotmail.com' },
  { email: 'drgunjarjain@gmail.com' },
  { email: 'karol.palka@gmail.com' },
  { email: 'mirwaismehrab@gmail.com' },
  { email: 'neiljain@ymail.com' },
  { email: 'anna@jambrich.net' },
  { email: 'sport_medicine@outlook.com' },
  { email: 'asaad.qaddori@outlook.com' },
  { email: 'jinoo.physio@gmail.com' },
  { email: 'nightowlat@outlook.com' },
  { email: 'stabilityphysio@gmail.com' },
  { email: 'msyyh3@nottingham.ac.uk' },
  { email: 'peterchitti@gmail.com' },
  { email: 'tomh@wchphysionorthbeach.com.au', name: 'Tom H' },
  { email: 'danielkhouchaba@gmail.com' },
  { email: 'mcarmont@hotmail.com' },
  { email: 'sami.razavi1@gmail.com' },
  { email: 'brendanmccannot@gmail.com' },
  { email: 'sharada@balancephysio.co.nz' },
  { email: 'hcollier01@hotmail.com' },
  { email: 'neurokids@ncwa.com.au' },
  { email: 'adyrland@gmail.com' },
  { email: 'podzey@gmail.com' },
  { email: 'pgstone63@gmail.com' },
  { email: 'faye.harrison@hotmail.co.uk' },
  { email: 'jane.knobloch@hpsnz.org.nz' },
  { email: 'louise@cape-sportsmed.com' },
  { email: 'natasha@perthsportsphysio.com', name: 'Natasha' },
  { email: 'jason.rosa.4@hotmail.com' },
  { email: 'victoria@ole.co.nz' },
  { email: 'performancelabphysio@gmail.com' },
  { email: 'john@adaptperformance.com.au' },
  { email: 'zacs1999@gmail.com' },
  { email: 'bashaw@whitnall.com' },
  { email: 'cknathantso@gmail.com' },
  { email: 'ovandenberg7@gmail.com' },
  { email: 'nathan.grima0801@gmail.com', name: 'Nathan Grima' },
  { email: 'info@mosmanphysio.com.au' },
  { email: 'rick@rickfielke.com.au' },
  { email: 'stephy.paolino@gmail.com' },
  { email: 'juan.ascencio-lane@ths.tas.gov.au' },
  { email: 'bianca.a.white00@gmail.com' },
]

async function main() {
  let created = 0
  let skipped = 0
  let errors = 0

  for (const c of CONTACTS) {
    const email = c.email.trim().toLowerCase()
    try {
      const existing = await findUserByEmail(email)
      if (existing) {
        console.log(`= skipped (exists)  ${email}`)
        skipped++
        continue
      }

      const name = c.name?.trim() || email.split('@')[0]
      const userId = await createUser({
        email,
        name,
        accessLevel: 'preview',
        signupSource: 'squarespace',
      })

      // Block the cron from firing Day 0 — user is entering the nurture flow
      // at whatever day-N matches their created_at (= NOW), starting tomorrow.
      await sql`
        INSERT INTO email_audit_log (audit_key, sent_at)
        VALUES (${`scat_day0_${userId}`}, NOW())
        ON CONFLICT (audit_key) DO NOTHING
      `

      console.log(`+ created          ${email}  (${name})`)
      created++
    } catch (err) {
      console.error(`! error            ${email}`, err)
      errors++
    }
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped (already in portal), ${errors} errors.`)
}

main().catch((e) => { console.error(e); process.exit(1) })
