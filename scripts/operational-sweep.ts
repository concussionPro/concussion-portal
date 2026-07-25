/**
 * Full operational sweep — probes every external integration and the DB
 * for actual runtime failures (the kind static checks/typescript miss).
 * Read-only. Reports a punch list.
 */
import 'dotenv/config'
import Stripe from 'stripe'
import { sql } from '@vercel/postgres'

const PROD = 'https://portal.concussion-education-australia.com'

interface Finding {
  level: 'CRIT' | 'WARN' | 'INFO'
  area: string
  msg: string
}
const findings: Finding[] = []
const add = (level: Finding['level'], area: string, msg: string) =>
  findings.push({ level, area, msg })

async function probe(name: string, fn: () => Promise<void>) {
  try {
    await fn()
  } catch (e) {
    add('CRIT', name, `Probe threw: ${(e as Error).message}`)
  }
}

async function main() {
  // ── 1. Squarespace API ─────────────────────────────────────
  await probe('Squarespace API', async () => {
    const apiKey = process.env.SQUARESPACE_API_KEY
    if (!apiKey) return add('CRIT', 'Squarespace API', 'SQUARESPACE_API_KEY not set')
    const r = await fetch('https://api.squarespace.com/1.0/profiles?sortField=createdOn&sortDirection=dsc', {
      headers: { Authorization: `Bearer ${apiKey}`, 'User-Agent': 'sweep' },
      signal: AbortSignal.timeout(10000),
    })
    if (r.status === 200) {
      const d = (await r.json()) as { profiles?: unknown[] }
      add('INFO', 'Squarespace API', `OK — ${d.profiles?.length ?? 0} profiles fetched`)
    } else {
      const txt = await r.text()
      add('CRIT', 'Squarespace API', `HTTP ${r.status} — ${txt.slice(0, 200)}`)
    }
  })

  // ── 2. Stripe webhook subscription ─────────────────────────
  await probe('Stripe Webhooks', async () => {
    const sk = process.env.STRIPE_SECRET_KEY
    if (!sk) return add('CRIT', 'Stripe Webhooks', 'STRIPE_SECRET_KEY not set')
    const stripe = new Stripe(sk)
    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 })
    const liveEps = endpoints.data.filter((e) => e.url.includes('concussion-education-australia'))
    if (liveEps.length === 0) return add('CRIT', 'Stripe Webhooks', 'No webhook endpoint pointing to portal domain')
    const REQUIRED = [
      'checkout.session.completed',
      'checkout.session.expired',
      'checkout.session.async_payment_failed',
      'payment_intent.payment_failed',
      'charge.refunded',
    ]
    for (const ep of liveEps) {
      const status = ep.status === 'enabled' ? 'enabled' : `DISABLED (${ep.status})`
      add('INFO', 'Stripe Webhooks', `${ep.url} — ${status}`)
      for (const ev of REQUIRED) {
        if (!(ep.enabled_events as string[]).includes(ev) && !(ep.enabled_events as string[]).includes('*')) {
          add('CRIT', 'Stripe Webhooks', `${ep.url}: NOT subscribed to ${ev}`)
        }
      }
    }
  })

  // ── 3. Resend domain tracking config ───────────────────────
  await probe('Resend domain', async () => {
    const rk = process.env.RESEND_API_KEY
    if (!rk) return add('CRIT', 'Resend domain', 'RESEND_API_KEY not set')
    const r = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${rk}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!r.ok) return add('CRIT', 'Resend domain', `Domains list HTTP ${r.status}`)
    type ResendDomain = { name: string; status: string; click_tracking: boolean; open_tracking: boolean }
    const d = (await r.json()) as { data?: ResendDomain[] }
    const ours = (d.data || []).find((x) => String(x.name).includes('concussion-education-australia'))
    if (!ours) return add('CRIT', 'Resend domain', 'Domain not found in Resend account')
    add('INFO', 'Resend domain', `${ours.name} status=${ours.status} click=${ours.click_tracking ? 'ON' : 'off'} open=${ours.open_tracking ? 'ON' : 'off'}`)
    if (ours.click_tracking) add('WARN', 'Resend domain', 'Click tracking is ON — track.* subdomain blocked by Brave Shields / privacy tools. Disable in dashboard.')
  })

  // ── 4. Local-only env note ─────────────────────────────────
  // Skip CRIT for missing webhook secrets / cron secret — those live in
  // Vercel env, not .env.local, and prod is provably working if the
  // Stripe ↔ DB and cron-health probes are green.

  // ── 6. DB integrity: orphans / missing access levels ───────
  await probe('Users table', async () => {
    const { rows: missing } = await sql<{ email: string; signup_source: string | null; created_at: Date }>`
      SELECT email, signup_source, created_at FROM users
      WHERE access_level IS NULL OR access_level = ''
    `
    if (missing.length > 0) add('CRIT', 'Users table', `${missing.length} users missing access_level: ${missing.slice(0, 5).map((r) => r.email).join(', ')}`)

    const { rows: paidNoLoc } = await sql<{ email: string }>`
      SELECT email FROM users
      WHERE access_level = 'full-course' AND (workshop_location IS NULL OR workshop_location = '')
    `
    if (paidNoLoc.length > 0) add('WARN', 'Users table', `${paidNoLoc.length} full-course users with no workshop_location: ${paidNoLoc.slice(0, 5).map((r) => r.email).join(', ')}`)
  })

  // ── 7. Recent Stripe activity vs DB ─────────────────────────
  await probe('Stripe ↔ DB reconciliation', async () => {
    const sk = process.env.STRIPE_SECRET_KEY
    if (!sk) return
    const stripe = new Stripe(sk)
    const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
    const sessions: Stripe.Checkout.Session[] = []
    for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
      if (s.status === 'complete') sessions.push(s)
    }
    let provisioned = 0
    const missingFromDb: string[] = []
    for (const s of sessions) {
      const email = s.customer_details?.email || s.customer_email
      if (!email) continue
      const { rows } = await sql`SELECT 1 FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1`
      if (rows.length > 0) provisioned++
      else missingFromDb.push(email)
    }
    add('INFO', 'Stripe ↔ DB', `${sessions.length} completed sessions in last 30d, ${provisioned} provisioned in DB`)
    if (missingFromDb.length > 0) {
      add('CRIT', 'Stripe ↔ DB', `Paid customers not in DB: ${missingFromDb.join(', ')}`)
    }
  })

  // ── 8. Abandoned checkout pipeline ─────────────────────────
  await probe('Abandoned checkouts', async () => {
    const sk = process.env.STRIPE_SECRET_KEY
    if (!sk) return
    const stripe = new Stripe(sk)
    const since = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
    let expired = 0
    for await (const s of stripe.checkout.sessions.list({ created: { gte: since }, limit: 100 })) {
      if (s.status === 'expired' && s.customer_details?.email) expired++
    }
    const { rows } = await sql`SELECT COUNT(*)::int AS n FROM abandoned_checkouts WHERE abandoned_at >= NOW() - INTERVAL '7 days'`
    const captured = rows[0].n
    add('INFO', 'Abandoned checkouts', `Stripe expired (with email): ${expired}, abandoned_checkouts rows: ${captured}`)
    if (expired > 0 && captured === 0) {
      add('CRIT', 'Abandoned checkouts', 'Expired sessions exist on Stripe but none captured — checkout.session.expired event not subscribed in Stripe webhook')
    }
  })

  // ── 9. Cron last-run health (via email_audit_log) ──────────
  await probe('Cron health', async () => {
    const { rows } = await sql`
      SELECT MAX(sent_at) AS latest FROM email_audit_log
    `
    const latest = rows[0]?.latest
    if (!latest) {
      add('WARN', 'Cron health', 'email_audit_log is empty — no nurture emails ever sent or table just created')
    } else {
      const hoursAgo = (Date.now() - new Date(latest).getTime()) / 3600000
      add('INFO', 'Cron health', `Last nurture email: ${new Date(latest).toISOString()} (${hoursAgo.toFixed(1)}h ago)`)
      if (hoursAgo > 48) add('CRIT', 'Cron health', `Nurture cron hasn't sent anything in ${hoursAgo.toFixed(0)}h — likely broken`)
    }
  })

  // ── 10. Email-events ingestion (Resend webhook) ─────────────
  // Cross-checks: cron sent N emails in last 7d, Resend webhook should have
  // written ~N delivered events. If cron is firing but no events arrive,
  // the webhook signature is failing or the endpoint was disabled.
  await probe('Resend webhook ingestion', async () => {
    const { rows } = await sql`
      SELECT event_type, COUNT(*)::int AS n, MAX(created_at) AS latest
      FROM email_events
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY event_type
    `
    const map: Record<string, number> = {}
    for (const r of rows as Array<{ event_type: string; n: number }>) map[r.event_type] = r.n

    const { rows: lastEvent } = await sql`
      SELECT MAX(created_at) AS latest FROM email_events
    `
    const lastEverIso = lastEvent[0]?.latest
    const hoursSinceLastEvent = lastEverIso ? (Date.now() - new Date(lastEverIso).getTime()) / 3600000 : Infinity

    const { rows: cronCount } = await sql`
      SELECT COUNT(*)::int AS n FROM email_audit_log WHERE sent_at >= NOW() - INTERVAL '7 days'
    `
    const cronSent7d = cronCount[0]?.n || 0

    add('INFO', 'Resend webhook', `Last 7d email_events: delivered=${map.delivered || 0} opened=${map.opened || 0} clicked=${map.clicked || 0} bounced=${map.bounced || 0}`)
    add('INFO', 'Resend webhook', `Cron sent ${cronSent7d} emails in last 7d. Last email_event ever: ${lastEverIso ? new Date(lastEverIso).toISOString() + ` (${hoursSinceLastEvent.toFixed(0)}h ago)` : 'never'}`)

    if (cronSent7d > 5 && (map.delivered || 0) === 0) {
      add('CRIT', 'Resend webhook', `${cronSent7d} emails sent by cron but ZERO email_events ingested — Resend webhook signature failing or endpoint disabled. Check Resend dashboard → Webhooks → status.`)
    }
    if ((map.delivered || 0) > 50 && (map.opened || 0) === 0) {
      add('WARN', 'Resend webhook', 'Delivered events flowing but ZERO opened — email.opened event not subscribed in Resend webhook')
    }
    if ((map.delivered || 0) > 50 && (map.clicked || 0) === 0) {
      add('WARN', 'Resend webhook', 'Delivered events flowing but ZERO clicked — email.clicked event not subscribed (also possible: tracking-blocker)')
    }
  })

  // ── 12. Squarespace ↔ DB scale gap ─────────────────────────
  // Squarespace dashboard (visible to user): 558 contacts, 17 customers.
  // Anything < ~480 in the users table for non-customers means the cron
  // never finished the historical backfill or has been failing for a while.
  await probe('Squarespace ↔ DB scale', async () => {
    const { rows } = await sql`
      SELECT COUNT(*)::int AS n FROM users WHERE signup_source = 'squarespace'
    `
    const n = rows[0].n
    add('INFO', 'Squarespace ↔ DB', `Portal users with signup_source='squarespace': ${n}`)
    if (n < 100) {
      add('CRIT', 'Squarespace ↔ DB', `Only ${n} squarespace users — Squarespace dashboard shows 558 contacts. Backfill never ran or sync auth-failed for weeks.`)
    }
  })

  // ── 11. Workshop interest count vs Melbourne capacity ──────
  await probe('Workshop pipeline', async () => {
    const { rows: paid } = await sql`SELECT COUNT(*)::int AS n FROM users WHERE workshop_location='melbourne' AND access_level='full-course'`
    const { rows: interest } = await sql`SELECT COUNT(*)::int AS n FROM workshop_interest WHERE city='melbourne'`
    add('INFO', 'Workshop pipeline', `Melbourne paid: ${paid[0].n}, interest registered: ${interest[0].n}`)
  })

  // ── Output ─────────────────────────────────────────────────
  console.log('\n═══ OPERATIONAL SWEEP REPORT ═══')
  for (const f of findings) {
    const icon = f.level === 'CRIT' ? '🔴' : f.level === 'WARN' ? '🟡' : '🟢'
    console.log(`${icon} [${f.area}] ${f.msg}`)
  }
  const crits = findings.filter((f) => f.level === 'CRIT').length
  const warns = findings.filter((f) => f.level === 'WARN').length
  console.log(`\n${crits} critical, ${warns} warning, ${findings.length - crits - warns} info\n`)
}

main().catch((e) => { console.error(e); process.exit(1) })
