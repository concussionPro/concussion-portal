import { config } from 'dotenv'
config({ path: '.env.local' }); config()
import { sql } from '@vercel/postgres'
const P = (t: string) => console.log(`\n=== ${t} ===`)

async function main() {
  // 1 — paid but no access
  P('1. PAID but access_level does not reflect it')
  const a = await sql`
    SELECT u.email, u.access_level, STRING_AGG(c.course_slug, ',') AS slugs
    FROM course_purchases c JOIN users u ON LOWER(u.email)=LOWER(c.user_email)
    WHERE c.course_slug LIKE 'ccm%' AND c.course_slug <> 'ccm-secure-seat'
      AND u.access_level = 'preview' AND u.is_test IS NOT TRUE
    GROUP BY u.email, u.access_level`
  console.log(a.rowCount ? a.rows : 'none')

  // 2 — access granted with no purchase record at all
  P('2. full-course / online-only with NO purchase row and no known grant source')
  const b = await sql`
    SELECT email, access_level, signup_source, created_at FROM users u
    WHERE u.access_level IN ('full-course','online-only') AND u.is_test IS NOT TRUE
      AND NOT EXISTS (SELECT 1 FROM course_purchases c WHERE LOWER(c.user_email)=LOWER(u.email))
      AND COALESCE(u.signup_source,'') NOT IN ('admin','squarespace','comp')
      AND u.hub_pack_seat_at IS NULL
    ORDER BY created_at DESC LIMIT 20`
  console.log(`${b.rowCount} rows`); for (const r of b.rows) console.log('  ', r.email, r.access_level, r.signup_source, String(r.created_at).slice(0,10))

  // 3 — duplicate humans across streams / addresses
  P('3. Same person, two accounts (name collision, different email)')
  const c = await sql`
    SELECT LOWER(TRIM(name)) AS n, COUNT(*) AS k, STRING_AGG(email || '=' || access_level, ' | ') AS who
    FROM users WHERE is_test IS NOT TRUE AND COALESCE(name,'') <> ''
    GROUP BY 1 HAVING COUNT(*) > 1 ORDER BY k DESC LIMIT 15`
  console.log(`${c.rowCount} rows`); for (const r of c.rows) console.log('  ', r.n, '→', r.who)

  // 4 — refunds that did not revoke
  P('4. Purchases refunded in Stripe terms but entitlement still held (deposit lane)')
  const d = await sql`
    SELECT user_email, course_slug, refunded_at, credited_at FROM course_purchases
    WHERE refunded_at IS NOT NULL OR credited_at IS NOT NULL`
  console.log(d.rowCount ? d.rows : 'none')

  // 5 — workshop_location pointing somewhere that cannot host them
  P('5. workshop_location values present in users')
  const e = await sql`
    SELECT workshop_location, COUNT(*) AS k, COUNT(*) FILTER (WHERE access_level='full-course') AS paid
    FROM users WHERE workshop_location IS NOT NULL AND is_test IS NOT TRUE
    GROUP BY 1 ORDER BY k DESC`
  for (const r of e.rows) console.log(`   ${String(r.workshop_location).padEnd(14)} ${r.k} users, ${r.paid} full-course`)

  // 6 — CRM owners and what access_level they carry
  P('6. CRM owners — access_level distribution (CRM should stay preview)')
  const f = await sql`
    SELECT c.course_slug, u.access_level, COUNT(*) AS k
    FROM course_purchases c JOIN users u ON LOWER(u.email)=LOWER(c.user_email)
    WHERE c.course_slug IN ('crm','crm-practical') AND u.is_test IS NOT TRUE
    GROUP BY 1,2 ORDER BY 1,2`
  for (const r of f.rows) console.log(`   ${String(r.course_slug).padEnd(14)} ${String(r.access_level).padEnd(12)} ${r.k}`)

  // 7 — anyone who would be double-charged: owns online AND a full-course row
  P('7. Owns BOTH an online and a complete purchase (possible double payment)')
  const g = await sql`
    SELECT user_email, STRING_AGG(course_slug || '@' || TO_CHAR(purchased_at,'YYYY-MM-DD') || ' $' || amount_aud, ' | ') AS bought
    FROM course_purchases GROUP BY user_email
    HAVING COUNT(*) FILTER (WHERE course_slug LIKE '%online%' OR course_slug='crm') > 0
       AND COUNT(*) FILTER (WHERE course_slug LIKE '%complete%' OR course_slug='crm-practical') > 0`
  console.log(g.rowCount ? g.rows : 'none')

  // 8 — email lanes a single user is currently eligible for
  P('8. Users with >1 pending workshop-email audit key (possible overlap)')
  const h = await sql`
    SELECT SPLIT_PART(audit_key, '_', 1) AS lane, COUNT(*) AS k
    FROM email_audit_log WHERE audit_key ~ 'workshop|deposit|upgrade'
    GROUP BY 1 ORDER BY k DESC`
  for (const r of h.rows) console.log(`   ${String(r.lane).padEnd(20)} ${r.k}`)
}
main().then(()=>process.exit(0)).catch(e=>{console.error('FAILED:', e.message);process.exit(1)})
