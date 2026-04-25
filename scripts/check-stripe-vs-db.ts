/**
 * Cross-reference this week's Stripe-completed customers against the users
 * table to find which webhook event (if any) failed to write.
 */
import 'dotenv/config'
import { sql } from '@vercel/postgres'

const TARGETS = [
  'bdchiropractic@hotmail.com',
  'contact@peninsulaconcussionclinic.com.au',
  'patrick.heenan20@gmail.com',
]

async function main() {
  for (const email of TARGETS) {
    const { rows } = await sql`
      SELECT id, email, name, access_level, stripe_customer_id, workshop_location,
             created_at, signup_source
      FROM users
      WHERE LOWER(email) = LOWER(${email})
      LIMIT 1
    `
    if (rows.length === 0) {
      console.log(`❌ MISSING: ${email}`)
    } else {
      const u = rows[0]
      console.log(`✅ ${email}`)
      console.log(`   access=${u.access_level}  source=${u.signup_source}  created=${new Date(u.created_at).toISOString()}  loc=${u.workshop_location || '-'}`)
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
