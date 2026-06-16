/**
 * POST /api/admin/apollo-recover-emails
 *
 * Recovers the Apollo contacts whose email was LOCKED at import time (~608) by
 * running Hunter domain-search against each clinic's domain — Hunter has its own
 * crawl, so it finds a real, named, deliverable address that Apollo wouldn't
 * reveal. Each recovered clinic is imported as status='categorizing' (inert)
 * so the website categorizer + verify → promote → send engine take over.
 *
 * Runs in PROD where Vercel injects HUNTER_API_KEY (not available locally). The
 * locked-email queue is built first by scripts/apollo-recover-queue.mjs.
 *
 * Bounded + resumable: processes `limit` pending queue rows per call (Hunter
 * credits + the 300s function cap), marks each 'recovered' / 'no-email' /
 * 'error', and returns stats. Re-invoke until pending = 0.
 *
 * Auth: admin (x-admin-key / Bearer / admin_session cookie).
 */
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

const HUNTER = 'https://api.hunter.io/v2/domain-search'
// Prefer decision-makers, then any clinician; skip generic mailboxes entirely.
const DECISION = /owner|principal|director|founder|practice manager|practice owner|head of|lead /i
const CLINICIAN = /physio|osteo|chiro|exercise physiolog|myotherap|sports/i

function kebab(s: string) { return (s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 42) }
function discipline(title: string) {
  const x = (title || '').toLowerCase()
  if (/osteo/.test(x)) return 'osteopaths'
  if (/exercise|physiolog/.test(x) && !/physiother/.test(x)) return 'exercisePhys'
  if (/myo/.test(x)) return 'myotherapists'
  if (/manager|owner|director|principal|reception|admin/.test(x)) return 'practiceManager'
  return 'physiotherapists'
}
function placeholderTeam(disc: string) {
  const t: Record<string, number> = { osteopaths: 0, physiotherapists: 0, generalPractitioners: 0, sportsMedicineDoctors: 0, exercisePhys: 0, myotherapists: 0, remedialMassage: 0, practiceManager: 0, admin: 0 }
  t[disc] = 1
  return t
}

interface HunterEmail { value?: string; type?: string; confidence?: number; first_name?: string; last_name?: string; position?: string }

/** Pick the best deliverable, named, PERSONAL email: decision-makers first,
 *  then clinicians, then any high-confidence personal address. */
function pickEmail(emails: HunterEmail[]): HunterEmail | null {
  const personal = emails.filter((e) => e.value && e.type !== 'generic' && (e.confidence ?? 0) >= 70 && e.first_name)
  if (personal.length === 0) return null
  const score = (e: HunterEmail) => (DECISION.test(e.position ?? '') ? 100 : CLINICIAN.test(e.position ?? '') ? 60 : 20) + (e.confidence ?? 0) / 10
  return personal.sort((a, b) => score(b) - score(a))[0]
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.HUNTER_API_KEY
  if (!key) return NextResponse.json({ error: 'HUNTER_API_KEY not set' }, { status: 500 })

  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') || '40', 10) || 40, 80)

  // existing-domain guard so we never double-import a clinic we already have.
  const ex = await sql<{ d: string }>`SELECT DISTINCT lower(regexp_replace(regexp_replace(coalesce(clinic_website_url,''),'^https?://(www\\.)?',''),'/.*$','')) d FROM prospect_clinics`
  const exDom = new Set(ex.rows.map((r) => r.d).filter(Boolean))

  const { rows: pending } = await sql<{ domain: string; org_name: string; city: string; state: string }>`
    SELECT domain, org_name, city, state FROM apollo_recover_queue
    WHERE status = 'pending' ORDER BY created_at LIMIT ${limit}`

  const out = { processed: 0, recovered: 0, noEmail: 0, dupe: 0, errors: 0, creditExhausted: false }
  const due = new Date(Date.now() + 90 * 864e5).toISOString()

  for (const q of pending) {
    out.processed++
    if (exDom.has(q.domain)) { await mark(q.domain, 'dupe'); out.dupe++; continue }
    let data: { emails?: HunterEmail[] } | null = null
    try {
      const res = await fetch(`${HUNTER}?domain=${encodeURIComponent(q.domain)}&api_key=${key}&limit=15`, { signal: AbortSignal.timeout(10000) })
      if (res.status === 429) { out.creditExhausted = true; break }
      const json = await res.json()
      if (json?.errors?.some((e: { code?: number; details?: string }) => e.code === 429 || /credit|usage|quota|rate/i.test(e.details || ''))) { out.creditExhausted = true; break }
      data = json?.data ?? null
    } catch { out.errors++; await mark(q.domain, 'error'); continue }

    const pick = pickEmail(data?.emails ?? [])
    if (!pick || !pick.value) { out.noEmail++; await mark(q.domain, 'no-email'); continue }

    const disc = discipline(pick.position ?? '')
    const fullName = `${pick.first_name ?? ''} ${pick.last_name ?? ''}`.trim() || q.org_name
    const slug = `${kebab(q.org_name) || 'clinic'}-${crypto.randomBytes(2).toString('hex')}`
    try {
      await sql`INSERT INTO prospect_clinics (
        slug, access_key, name, short_name, city, state, region,
        contact_first_name, contact_full_name, contact_email, contact_role, contact_discipline,
        clinic_website_url, team, local_targets, travel_band, travel_surcharge, cohort_recommendation,
        status, research_source, valid_until, notes
      ) VALUES (
        ${slug}, ${crypto.randomBytes(5).toString('hex')}, ${q.org_name}, ${q.org_name.slice(0, 60)},
        ${q.city || 'Unknown'}, ${q.state || 'NSW'}, 'Unknown',
        ${pick.first_name || 'there'}, ${fullName}, ${pick.value.toLowerCase()}, ${(pick.position || '').slice(0, 80)}, ${disc},
        ${'https://' + q.domain}, ${JSON.stringify(placeholderTeam(disc))}::jsonb, '[]'::jsonb,
        'flight-domestic', 1500, 'recommended',
        'categorizing', 'apollo-import', ${due},
        ${`[apollo-import locked-email recovered via Hunter ${new Date().toISOString().slice(0, 10)}] pending website review`}
      ) ON CONFLICT (slug) DO NOTHING`
      exDom.add(q.domain)
      await mark(q.domain, 'recovered', pick.value.toLowerCase())
      out.recovered++
    } catch { out.errors++; await mark(q.domain, 'error') }

    await new Promise((r) => setTimeout(r, 350)) // be a good Hunter citizen
  }

  const { rows: rem } = await sql`SELECT COUNT(*)::int n FROM apollo_recover_queue WHERE status='pending'`
  return NextResponse.json({ ...out, pendingRemaining: rem[0]?.n ?? 0 })
}

async function mark(domain: string, status: string, email?: string) {
  await sql`UPDATE apollo_recover_queue SET status=${status}, recovered_email=${email ?? null}, attempted_at=NOW() WHERE domain=${domain}`
}
