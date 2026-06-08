/**
 * POST /api/admin/prospect-requeue-named
 *
 * For prospect_clinics rows where the current contact is a role mailbox
 * (info@, reception@, admin@), an accept-all domain, or scanner-suspect
 * (bot-only signals), find a named contact at the same clinic via
 * Hunter Domain Search and create a fresh prospect row with the personal
 * email.
 *
 * Why: shared/role inboxes get heavily mail-gateway-scanned (Defender
 * ATP, Mimecast, Cloudflare Email Security) which inflates open/click
 * metrics with bot pre-fetches and tanks real reply rates. A direct
 * named contact at the same clinic is the cleanest path to actual
 * inbox-level engagement.
 *
 * Process per source clinic:
 *   1. Skip if already has a non-role direct named contact
 *   2. Call Hunter Domain Search for the clinic's domain
 *   3. Pick the senior clinical contact (directors/owners > seniors >
 *      others; prefer named-mailbox local-parts over generics)
 *   4. Create a new prospect_clinics row with the named contact
 *      (status='approved'), referencing the source clinic in notes
 *   5. Mark the source clinic notes with the re-queue reference
 *
 * Body: { clinicIds?: number[], limit?: 5, dryRun?: bool=true }
 * Auth: admin.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'

export const maxDuration = 90

const HUNTER_BASE = 'https://api.hunter.io/v2'

interface HunterDomainSearchResponse {
  data?: {
    domain?: string
    organization?: string
    emails?: Array<{
      value: string
      type?: 'personal' | 'generic'
      confidence?: number
      first_name?: string
      last_name?: string
      position?: string
      department?: string
      seniority?: 'senior' | 'executive' | 'junior' | null
    }>
  }
  meta?: object
  errors?: Array<{ details?: string }>
}

interface Body {
  clinicIds?: number[]
  limit?: number
  dryRun?: boolean
}

interface ResultRow {
  sourceClinicId: number
  sourceShortName: string
  sourceEmail: string
  domain: string
  decision:
    | 'skipped-already-named'
    | 'skipped-no-domain'
    | 'no-hunter-match'
    | 'requeued'
    | 'dry-requeued'
    | 'api-error'
    | 'duplicate-found'
  newClinicId?: number
  newContactEmail?: string
  newContactName?: string
  newContactRole?: string
  errorDetail?: string
}

const ROLE_LOCAL_PARTS = [
  'info', 'admin', 'reception', 'enquiries', 'office',
  'contact', 'hello', 'mail', 'team', 'support', 'sales',
  'help', 'enquiry', 'bookings', 'appointments',
]

function isRoleLocalPart(email: string): boolean {
  const local = (email.split('@')[0] || '').toLowerCase()
  return ROLE_LOCAL_PARTS.includes(local)
}

function pickBestNamedEmail(domain: string, emails: NonNullable<HunterDomainSearchResponse['data']>['emails']) {
  if (!emails || emails.length === 0) return null
  // Filter to non-generic, non-role mailbox-name emails with reasonable confidence
  const named = emails.filter(e =>
    e.type === 'personal' &&
    e.confidence && e.confidence >= 70 &&
    !isRoleLocalPart(e.value)
  )
  if (named.length === 0) return null

  // Senior/exec gets priority. Then position contains director/owner/founder/principal.
  const SENIORITY_RANK: Record<string, number> = { executive: 3, senior: 2, junior: 1 }
  const positionKeywords = ['director', 'owner', 'founder', 'principal', 'lead', 'head', 'senior', 'manager']

  const scored = named.map(e => {
    const seniorityScore = e.seniority ? (SENIORITY_RANK[e.seniority] ?? 0) : 0
    const pos = (e.position || '').toLowerCase()
    const positionScore = positionKeywords.reduce((acc, kw) => acc + (pos.includes(kw) ? 1 : 0), 0)
    const confidenceScore = (e.confidence ?? 0) / 10
    const hasNameBonus = (e.first_name && e.last_name) ? 5 : 0
    return {
      email: e,
      score: seniorityScore * 10 + positionScore * 5 + confidenceScore + hasNameBonus,
    }
  })
  scored.sort((a, b) => b.score - a.score)
  void domain
  return scored[0].email
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const key = process.env.HUNTER_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'HUNTER_API_KEY not set' }, { status: 500 })
  }

  let body: Body
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const limit = Math.max(1, Math.min(body.limit ?? 5, 30))
  const dryRun = body.dryRun !== false

  // Pick source clinics — explicit IDs OR auto-pick (role/accept-all/
  // low Hunter score, no existing requeue note).
  const { rows: sources } = body.clinicIds && body.clinicIds.length > 0
    ? await sql<{ id: number; short_name: string; contact_email: string; team: object; state: string; city: string; region: string; cohort_recommendation: string; access_key: string }>`
        SELECT id, short_name, contact_email, team, state, city, region, cohort_recommendation, access_key
        FROM prospect_clinics
        WHERE id = ANY(string_to_array(${body.clinicIds.join(',')}, ',')::int[])
          AND status NOT IN ('won', 'lost', 'archived')
      `
    : await sql<{ id: number; short_name: string; contact_email: string; team: object; state: string; city: string; region: string; cohort_recommendation: string; access_key: string }>`
        SELECT id, short_name, contact_email, team, state, city, region, cohort_recommendation, access_key
        FROM prospect_clinics
        WHERE status NOT IN ('won', 'lost', 'archived', 'engaged-elsewhere')
          AND COALESCE(notes, '') NOT LIKE '%[requeued-named=%'
          AND (
            verification_role = TRUE
            OR verification_accept_all = TRUE
            OR verification_score < 80
          )
          AND verification_status IS NOT NULL
        LIMIT ${limit}
      `

  const results: ResultRow[] = []

  for (const src of sources) {
    const domain = (src.contact_email.split('@')[1] || '').toLowerCase()
    if (!domain) {
      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain: '',
        decision: 'skipped-no-domain',
      })
      continue
    }

    // Skip if there's already a non-role direct contact at this domain
    const { rows: existing } = await sql<{ id: number }>`
      SELECT id FROM prospect_clinics
      WHERE LOWER(SPLIT_PART(contact_email, '@', 2)) = ${domain}
        AND id != ${src.id}
        AND status NOT IN ('won', 'lost', 'archived')
        AND (
          verification_role IS NULL OR verification_role = FALSE
        )
      LIMIT 1
    `
    if (existing.length > 0) {
      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain,
        decision: 'duplicate-found',
        newClinicId: existing[0].id,
      })
      continue
    }

    // Hunter Domain Search
    let hunterData: HunterDomainSearchResponse | null = null
    try {
      const url = `${HUNTER_BASE}/domain-search?domain=${encodeURIComponent(domain)}&api_key=${key}&limit=15`
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      hunterData = await res.json() as HunterDomainSearchResponse
    } catch (e) {
      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain,
        decision: 'api-error',
        errorDetail: e instanceof Error ? e.message : String(e),
      })
      continue
    }

    const picked = pickBestNamedEmail(domain, hunterData?.data?.emails)
    if (!picked) {
      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain,
        decision: 'no-hunter-match',
      })
      continue
    }

    const newEmail = picked.value.toLowerCase()
    const newFirstName = picked.first_name || newEmail.split('@')[0].split('.')[0]
    const newLastName = picked.last_name || ''
    const newFullName = [newFirstName, newLastName].filter(Boolean).join(' ').trim()
    const newRole = picked.position || ''

    if (dryRun) {
      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain,
        decision: 'dry-requeued',
        newContactEmail: newEmail,
        newContactName: newFullName,
        newContactRole: newRole,
      })
      continue
    }

    // Create the new prospect row with a slug variant
    const newSlug = `${src.short_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${newFirstName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)}-${Date.now().toString(36)}`
    const newAccessKey = `${newSlug}-${Math.random().toString(36).slice(2, 10)}`

    try {
      const { rows: insertRows } = await sql<{ id: number }>`
        INSERT INTO prospect_clinics (
          slug, access_key, name, short_name, city, state, region,
          contact_first_name, contact_full_name, contact_email, contact_role,
          contact_discipline, team, travel_band, cohort_recommendation,
          status, research_source, notes, created_at, updated_at,
          next_template_slug
        )
        SELECT
          ${newSlug}, ${newAccessKey}, name, short_name, city, state, region,
          ${newFirstName}, ${newFullName || newFirstName}, ${newEmail}, ${newRole},
          contact_discipline, team, travel_band, cohort_recommendation,
          'approved', 'hunter-requeue',
          COALESCE(notes, '') || E'\n[requeued-from=' || ${src.id} || '/' || ${src.contact_email} || '/' || ${new Date().toISOString().slice(0, 10)} || '] re-queued via Hunter Domain Search',
          NOW(), NOW(),
          'initial'
        FROM prospect_clinics WHERE id = ${src.id}
        RETURNING id
      `

      // Mark source as superseded
      await sql`
        UPDATE prospect_clinics
        SET notes = COALESCE(notes, '') || E'\n[requeued-named=' || ${newSlug} || '/' || ${newEmail} || '/' || ${new Date().toISOString().slice(0, 10)} || '] superseded by named-contact requeue',
            status = CASE WHEN status IN ('researching', 'approved', 'sent', 'opened') THEN 'archived' ELSE status END,
            updated_at = NOW()
        WHERE id = ${src.id}
      `

      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain,
        decision: 'requeued',
        newClinicId: insertRows[0]?.id,
        newContactEmail: newEmail,
        newContactName: newFullName,
        newContactRole: newRole,
      })
    } catch (e) {
      results.push({
        sourceClinicId: src.id,
        sourceShortName: src.short_name,
        sourceEmail: src.contact_email,
        domain,
        decision: 'api-error',
        errorDetail: e instanceof Error ? e.message : String(e),
      })
    }

    // Hunter API: be a good citizen
    await new Promise(r => setTimeout(r, 200))
  }

  const summary = {
    mode: dryRun ? 'dry-run' : 'applied',
    examined: results.length,
    requeued: results.filter(r => r.decision === 'requeued' || r.decision === 'dry-requeued').length,
    duplicateFound: results.filter(r => r.decision === 'duplicate-found').length,
    noHunterMatch: results.filter(r => r.decision === 'no-hunter-match').length,
    skippedAlreadyNamed: results.filter(r => r.decision === 'skipped-already-named').length,
    apiErrors: results.filter(r => r.decision === 'api-error').length,
    hunterCreditsConsumed: results.length - results.filter(r => r.decision === 'api-error' || r.decision === 'skipped-no-domain').length,
  }

  return NextResponse.json({ summary, results })
}
