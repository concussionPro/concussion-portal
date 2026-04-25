/**
 * Cross-reference recent Squarespace contacts against portal users table.
 * Identifies anyone visible in the Squarespace dashboard who isn't getting
 * Resend nurture emails because they're missing from the users table.
 */
import 'dotenv/config'
import { sql } from '@vercel/postgres'

// First 50 from Squarespace contacts (newest first), pulled from the dashboard
// view the user shared. Used to verify the cron sync is keeping pace.
const RECENT_SS_CONTACTS = [
  'mmilosev@gmail.com',
  'jazmynanderson@u-46.org',
  'siobhan.brodrick@gmail.com',
  'ryanmarcevans@hotmail.com',
  'adam@minthealthcare.com.au',
  'markbenton13@gmail.com',
  'emalloy@thayer.org',
  'nplmclaughlin@cardiffmet.ac.uk',
  'wiedmacj@gmail.com',
  'isaac.trow@anystagephysio.com',
  'omer.hussein4@outlook.com',
  'jasmine.collier223@gmail.com',
  'ameliacremorneosteo@gmail.com',
  'lydia.radich@npphysio.co.nz',
  'stephen@sportstecclinic.com.au',
  'cchettle100@gmail.com',
  'gregor.kelling21@gmail.com',
  'jadd_skate28@hotmail.com',
  'bdpons89@gmail.com',
  'johannewilson@yahoo.co.uk',
  'daniel.florisson@mbmc.com.au',
  'danielflorisson@me.com',
  'sarah@informphysio.com.au',
  'jose@yarratrailmedical.com.au',
  'jonwe747@gmail.com',
  'callum.m.hogan@gmail.com',
  'ngo_jackie@hotmail.com',
  'kakoenig16@gmail.com',
  'haydntill@gmail.com',
  'hwajswelner@swin.edu.au',
  'k.yashvi01@gmail.com',
  'clairelouise78@hotmail.com',
  'paulfen78@gmail.com',
  'm.i.stewart@doctors.org.uk',
  'annabel.askin17@gmail.com',
  'annabel.askin@gh.org.au',
  'stephanie@bespokephysiotherapy.co.nz',
  'lia.gio@bigpond.com',
  'sarahfrance38@gmail.com',
  'kcamobreco@gmail.com',
  'anniehoward@gmail.com',
  'scarlettcummane@gmail.com',
  'joe@physiobydesign.co.nz',
  'mandy_reid82@hotmail.com',
  'katie@dalbyalliedhealth.com.au',
  'shawry808@gmail.com',
  'sallybrennan001@gmail.com',
  'ciska_helm@yahoo.co.uk',
  'patrick.heenan20@gmail.com',
  'brad@reformhealth.com.au',
]

async function main() {
  // Top-line stats
  const { rows: totals } = await sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE signup_source = 'squarespace')::int AS sq,
      COUNT(*) FILTER (WHERE signup_source = 'free-course')::int AS free,
      COUNT(*) FILTER (WHERE signup_source = 'scat-export')::int AS scat,
      COUNT(*) FILTER (WHERE signup_source = 'preseason')::int AS preseason,
      COUNT(*) FILTER (WHERE signup_source = 'purchase')::int AS purchased,
      COUNT(*) FILTER (WHERE signup_source = 'admin')::int AS admin,
      COUNT(*) FILTER (WHERE signup_source IS NULL)::int AS unknown,
      COUNT(*) FILTER (WHERE access_level = 'preview')::int AS preview,
      COUNT(*) FILTER (WHERE nurture_unsubscribed = true)::int AS unsubscribed
    FROM users
  `
  const t = totals[0]
  console.log('\n═══ Portal users by source ═══')
  console.log(`  Total users:           ${t.total}`)
  console.log(`  signup_source = squarespace: ${t.sq}`)
  console.log(`  signup_source = free-course: ${t.free}`)
  console.log(`  signup_source = scat-export: ${t.scat}`)
  console.log(`  signup_source = preseason:   ${t.preseason}`)
  console.log(`  signup_source = purchase:    ${t.purchased}`)
  console.log(`  signup_source = admin:       ${t.admin}`)
  console.log(`  signup_source IS NULL:       ${t.unknown}`)
  console.log(`  access_level = preview:      ${t.preview}`)
  console.log(`  nurture_unsubscribed = true: ${t.unsubscribed}`)
  console.log(`  (Squarespace dashboard reports 558 contacts, 493 subscribers, 17 customers)`)

  // Cross-reference recent SS contacts
  console.log('\n═══ Recent Squarespace contacts — present in DB? ═══')
  const missing: string[] = []
  const presentNoSrc: string[] = []
  for (const email of RECENT_SS_CONTACTS) {
    const { rows } = await sql`
      SELECT email, signup_source, access_level, nurture_unsubscribed,
             created_at
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `
    if (rows.length === 0) {
      console.log(`  ❌ MISSING: ${email}`)
      missing.push(email)
    } else {
      const r = rows[0]
      const srcOk = r.signup_source === 'squarespace'
      const tag = srcOk ? '✅' : '⚠️ '
      const flags = []
      if (r.nurture_unsubscribed) flags.push('UNSUB')
      console.log(`  ${tag} ${email}  src=${r.signup_source || 'null'} access=${r.access_level} ${flags.join(' ')}`)
      if (!srcOk) presentNoSrc.push(email)
    }
  }

  console.log(`\n═══ Summary ═══`)
  console.log(`  Of ${RECENT_SS_CONTACTS.length} recent Squarespace contacts:`)
  console.log(`  - ${RECENT_SS_CONTACTS.length - missing.length - presentNoSrc.length} present with squarespace source ✅`)
  console.log(`  - ${presentNoSrc.length} present but with different source (still gets nurture) ⚠️`)
  console.log(`  - ${missing.length} MISSING from DB entirely ❌`)
  if (missing.length > 0) {
    console.log(`  → These won't receive Resend nurture emails. Run cron sync.`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })
