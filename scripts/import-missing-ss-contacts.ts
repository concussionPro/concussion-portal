/**
 * One-off: import the 12 recent Squarespace contacts the broken cron missed.
 * Hits /api/admin/import-contacts on prod which creates preview users with
 * signup_source='squarespace' and sends the Day 0 welcome email (entry to
 * the SCAT Mastery nurture sequence).
 */
import 'dotenv/config'

const MISSING = [
  { email: 'mmilosev@gmail.com',                date: '2026-04-25' },
  { email: 'jazmynanderson@u-46.org',           date: '2026-04-25' },
  { email: 'siobhan.brodrick@gmail.com',        date: '2026-04-24' },
  { email: 'ryanmarcevans@hotmail.com',         date: '2026-04-23' },
  { email: 'adam@minthealthcare.com.au',        date: '2026-04-22' },
  { email: 'markbenton13@gmail.com',            date: '2026-04-21' },
  { email: 'emalloy@thayer.org',                date: '2026-04-18' },
  { email: 'nplmclaughlin@cardiffmet.ac.uk',    date: '2026-04-17' },
  { email: 'wiedmacj@gmail.com',                date: '2026-04-17' },
  { email: 'daniel.florisson@mbmc.com.au',      date: '2026-03-31' },
  { email: 'danielflorisson@me.com',            date: '2026-03-31' },
  { email: 'sarah@informphysio.com.au',         date: '2026-03-31' },
]

async function main() {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) throw new Error('ADMIN_API_KEY not set')

  const baseUrl = 'https://portal.concussion-education-australia.com'
  const res = await fetch(`${baseUrl}/api/admin/import-contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey,
      // CSRF middleware requires same-origin — script must declare its origin
      'Origin': baseUrl,
    },
    body: JSON.stringify({ contacts: MISSING }),
  })
  const text = await res.text()
  console.log('HTTP', res.status)
  console.log(text.slice(0, 2000))
}
main().catch((e) => { console.error(e); process.exit(1) })
