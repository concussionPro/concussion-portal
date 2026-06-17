/**
 * POST /api/admin/partner-find-contacts
 *
 * Unstalls the school/academy partnership lane (Zac 2026-06-17). 36 partner
 * leads have a domain parked in their notes ([domain: vis.org.au]) but NO
 * sendable contact, so the partner cron can't pitch them. This runs Hunter
 * domain-search per domain to find a named sport/wellbeing decision-maker
 * (Director of Sport, Head of Co-curricular, Athlete Wellbeing, etc.), writes
 * contact_name/email/role, and leaves status='lead' — the partner cron (which
 * has its own Hunter pre-send verification gate) then pitches them.
 *
 * Runs in PROD where Vercel injects HUNTER_API_KEY. Bounded + resumable
 * (processes `limit` leads/run, skips ones already given a contact or marked
 * no-contact). Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { isAdminRequest } from '@/lib/require-admin'

export const runtime = 'nodejs'
export const maxDuration = 300

const HUNTER = 'https://api.hunter.io/v2/domain-search'
// Sport / athlete-welfare decision-makers at a school or academy, best first.
const SPORT_ROLE = /director of sport|head of sport|head of co-?curricular|sport.?s? coordinator|sport.?s? administrat|head of (performance|wellbeing|pe|pdhpe|health)|athlete (wellbeing|development|welfare)|strength and conditioning|high performance|sports? science|performance manager/i
const SENIOR = /principal|deputy|director|head of|ceo|chief|general manager|registrar|business manager/i

interface HEmail { value?: string; type?: string; confidence?: number; first_name?: string; last_name?: string; position?: string }

function pick(emails: HEmail[]): HEmail | null {
  const named = emails.filter((e) => e.value && e.type !== 'generic' && (e.confidence ?? 0) >= 65 && e.first_name)
  if (!named.length) return null
  const score = (e: HEmail) =>
    (SPORT_ROLE.test(e.position ?? '') ? 100 : SENIOR.test(e.position ?? '') ? 50 : 15) + (e.confidence ?? 0) / 10
  return named.sort((a, b) => score(b) - score(a))[0]
}

function domainFromNotes(notes: string | null): string | null {
  if (!notes) return null
  const m = notes.match(/\[domain:\s*([a-z0-9.-]+\.[a-z]{2,})/i)
  return m ? m[1].toLowerCase() : null
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const key = process.env.HUNTER_API_KEY
  if (!key) return NextResponse.json({ error: 'HUNTER_API_KEY not set' }, { status: 500 })
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') || '40', 10) || 40, 60)

  // Leads with a domain in notes, no contact yet, not already attempted.
  const { rows: leads } = await sql<{ id: number; name: string; notes: string | null }>`
    SELECT id, name, notes FROM partner_institutions
    WHERE status = 'lead'
      AND (contact_email IS NULL OR contact_email = '')
      AND notes LIKE '%[domain:%'
      AND COALESCE(notes,'') NOT LIKE '%[contact-search:%'
    ORDER BY id LIMIT ${limit}`

  const out = { processed: 0, found: 0, noContact: 0, noDomain: 0, errors: 0, creditExhausted: false }
  for (const lead of leads) {
    out.processed++
    const domain = domainFromNotes(lead.notes)
    if (!domain) { out.noDomain++; await mark(lead.id, 'no-domain'); continue }
    let emails: HEmail[] = []
    try {
      const res = await fetch(`${HUNTER}?domain=${encodeURIComponent(domain)}&api_key=${key}&limit=20`, { signal: AbortSignal.timeout(10000) })
      if (res.status === 429) { out.creditExhausted = true; break }
      const j = await res.json()
      if (j?.errors?.some((e: { code?: number; details?: string }) => e.code === 429 || /credit|usage|quota|rate/i.test(e.details || ''))) { out.creditExhausted = true; break }
      emails = j?.data?.emails ?? []
    } catch { out.errors++; continue }

    const best = pick(emails)
    if (!best || !best.value) { out.noContact++; await mark(lead.id, 'no-contact'); continue }
    await sql`UPDATE partner_institutions
      SET contact_name = ${`${best.first_name ?? ''} ${best.last_name ?? ''}`.trim()},
          contact_email = ${best.value.toLowerCase()},
          contact_role = ${(best.position ?? '').slice(0, 80)},
          notes = COALESCE(notes,'') || ${`\n[contact-search: found ${best.position ?? 'contact'} ${new Date().toISOString().slice(0, 10)}]`}
      WHERE id = ${lead.id}`
    out.found++
    await new Promise((r) => setTimeout(r, 350))
  }
  const { rows: rem } = await sql<{ n: number }>`SELECT COUNT(*)::int n FROM partner_institutions
    WHERE status='lead' AND (contact_email IS NULL OR contact_email='') AND notes LIKE '%[domain:%' AND COALESCE(notes,'') NOT LIKE '%[contact-search:%'`
  return NextResponse.json({ ...out, pendingRemaining: rem[0]?.n ?? 0 })
}

async function mark(id: number, outcome: string) {
  await sql`UPDATE partner_institutions SET notes = COALESCE(notes,'') || ${`\n[contact-search: ${outcome} ${new Date().toISOString().slice(0, 10)}]`} WHERE id = ${id}`
}
