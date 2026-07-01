import { config } from 'dotenv'
config({ path: '.env.local' })
import { sql } from '@vercel/postgres'

const email = (process.argv[2] || 'queenstownosteo@gmail.com').trim().toLowerCase()

// 1. The interest registration row
const { rows: interest } = await sql`
  SELECT email, name, city, source, created_at
  FROM workshop_interest WHERE LOWER(email) = ${email}`
console.log('=== workshop_interest ===')
console.log(interest.length ? interest : 'no row')

// 2. City-wide count (this is what the "Total Interested" notification shows)
if (interest[0]) {
  const { rows: c } = await sql`SELECT COUNT(*)::int AS n FROM workshop_interest WHERE city = ${interest[0].city}`
  console.log(`\n=== total interest rows for city='${interest[0].city}' === ${c[0].n}`)
}

// 3. Analytics events tied to this email — IP, session, nav path
const { rows: ev } = await sql`
  SELECT to_timestamp(timestamp_ms/1000) AS ts, event_type, path, ip, city, region, country, session_id, referrer, user_agent
  FROM analytics_events
  WHERE LOWER(user_email) = ${email}
  ORDER BY timestamp_ms ASC`
console.log(`\n=== analytics_events by user_email (${ev.length}) ===`)
ev.forEach(e => console.log(`${e.ts?.toISOString?.() ?? e.ts} | ${e.event_type} | ${e.path} | ip=${e.ip} | ${e.city},${e.region},${e.country} | sess=${String(e.session_id).slice(0,8)} | ref=${e.referrer ?? '-'}`))

// 4. If we have IP(s) or session(s), pull the FULL nav history for those (anonymous events too)
const ips = [...new Set(ev.map(e => e.ip).filter(Boolean))]
const sessions = [...new Set(ev.map(e => e.session_id).filter(Boolean))]
console.log(`\nips=${JSON.stringify(ips)}  sessions=${sessions.map(s=>String(s).slice(0,8))}`)

for (const sid of sessions) {
  const { rows: nav } = await sql`
    SELECT to_timestamp(timestamp_ms/1000) AS ts, event_type, path, search, ip
    FROM analytics_events WHERE session_id = ${sid} ORDER BY timestamp_ms ASC`
  console.log(`\n--- full nav for session ${String(sid).slice(0,8)} (${nav.length} events) ---`)
  nav.forEach(n => console.log(`${n.ts?.toISOString?.() ?? n.ts} | ${n.event_type} | ${n.path}${n.search||''} | ip=${n.ip}`))
}

// 5. Other sessions from the same IP (could reveal repeat visits / other people same network)
for (const ip of ips) {
  const { rows: ipSess } = await sql`
    SELECT session_id, COUNT(*)::int AS n, MIN(to_timestamp(timestamp_ms/1000)) AS first, MAX(to_timestamp(timestamp_ms/1000)) AS last
    FROM analytics_events WHERE ip = ${ip} GROUP BY session_id ORDER BY first ASC`
  console.log(`\n--- sessions seen from ip ${ip} (${ipSess.length}) ---`)
  ipSess.forEach(s => console.log(`sess=${String(s.session_id).slice(0,8)} events=${s.n} ${s.first?.toISOString?.()} → ${s.last?.toISOString?.()}`))
}
process.exit(0)
