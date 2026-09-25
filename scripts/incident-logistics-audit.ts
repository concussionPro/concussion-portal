import { config } from 'dotenv'
config({ path: '.env.local' }); config()
import { sql } from '@vercel/postgres'
import { isWorkshopAlumnus } from '@/lib/workshop-alumni'

// Verifies the created_at fallback reclassifies the 10 prior-round attendees
// without touching the 2 genuine Round-4 buyers.
async function main() {
  const { rows } = await sql`
    SELECT u.id, u.name, u.email, u.access_level, u.workshop_location, u.created_at,
           COALESCE(
             (SELECT MAX(c.purchased_at) FROM course_purchases c
               WHERE LOWER(c.user_email)=LOWER(u.email)),
             u.workshop_location_set_at
           ) AS old_date,
           COALESCE(
             (SELECT MAX(c.purchased_at) FROM course_purchases c
               WHERE LOWER(c.user_email)=LOWER(u.email)),
             u.workshop_location_set_at, u.created_at
           ) AS new_date
    FROM users u WHERE u.workshop_location='melbourne' ORDER BY u.created_at`
  let before=0, after=0
  console.log('name                   before-fix   after-fix   registered')
  console.log('-'.repeat(74))
  for (const r of rows) {
    const mk = (d: unknown) => isWorkshopAlumnus({
      accessLevel: r.access_level, workshopLocation: r.workshop_location,
      ownsCrmPractical: false, registeredAt: d as string | null })
    const b = mk(r.old_date), a = mk(r.new_date)
    if (!b) before++
    if (!a) after++
    console.log(`${String(r.name).slice(0,22).padEnd(22)} ${(b?'alumnus':'GETS EMAIL').padEnd(12)} ${(a?'alumnus':'GETS EMAIL').padEnd(11)} ${String(r.new_date).slice(0,10)}`)
  }
  console.log('-'.repeat(74))
  console.log(`In the Round-4 nurture cohort:  before ${before}   after ${after}`)
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e.message);process.exit(1)})
