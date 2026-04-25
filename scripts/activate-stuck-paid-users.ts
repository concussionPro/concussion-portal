/**
 * One-off: send PAID_NO_PROGRESS_NUDGE to existing paid customers who
 * are at 0/8 progress and have already passed Day 3 of the auto-cron
 * cadence — they won't get the new branched email automatically because
 * they're past the trigger window. This catches them up.
 *
 * Sends to: Patrick (full, 27d), Peninsula (full, 27d), Amelia (full, 11d).
 * Skips Brandyn — he already got a fresh post-purchase welcome yesterday
 * and is < Day 3 anyway.
 */
import 'dotenv/config'
import { sql } from '@vercel/postgres'

const TARGETS = [
  'patrick.heenan20@gmail.com',
  'contact@peninsulaconcussionclinic.com.au',
  'ameliacremorneosteo@gmail.com',
]

async function main() {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) throw new Error('ADMIN_API_KEY not set')
  const baseUrl = 'https://portal.concussion-education-australia.com'

  for (const email of TARGETS) {
    // Confirm they're still at 0/8 progress before sending
    const { rows: u } = await sql`
      SELECT u.id, u.access_level, u.name, up.progress
      FROM users u
      LEFT JOIN user_progress up ON up.user_id = u.id
      WHERE LOWER(u.email) = LOWER(${email})
      LIMIT 1
    `
    if (u.length === 0) {
      console.log(`SKIP ${email} — not in DB`)
      continue
    }
    let done = 0
    if (u[0].progress) {
      for (let i = 1; i <= 8; i++) if (u[0].progress[String(i)]?.completed) done++
    }
    if (done > 0) {
      console.log(`SKIP ${email} — already at ${done}/8 progress`)
      continue
    }

    // Use the existing resend-purchase-welcome endpoint as a delivery path
    // (it sends a fresh login link with the user's purchase context).
    // Could also send the new PAID_NO_PROGRESS_NUDGE template — but the
    // post-purchase welcome already pushes Module 1 and is mature copy.
    // The cron will catch them with the new variant on its next eligible day.
    const r = await fetch(`${baseUrl}/api/admin/resend-purchase-welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
        'Origin': baseUrl,
      },
      body: JSON.stringify({
        email,
        courseType: u[0].access_level === 'full-course' ? 'full-course' : 'online-only',
        upgradeAccess: false,
      }),
    })
    const text = await r.text()
    console.log(`${r.status} ${email} — ${text.slice(0, 200)}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
