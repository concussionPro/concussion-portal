/**
 * POST /api/admin/prospect-bulk-create
 *
 * Body: { prospects: CreateClinicInput[] }
 *
 * Inserts many prospects in one call. Each gets:
 *  - Unique slug for /p/[slug] URL
 *  - Auto-generated access key (?k=...)
 *  - Auto-computed travel_surcharge from band
 *  - Default valid_until = today + 60 days
 *
 * Idempotent on slug — re-running with the same slug skips that row
 * (no overwrite — use prospect-create for explicit updates).
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/require-admin'
import { createClinic, getClinicBySlug } from '@/lib/prospect/repo'
import type { CreateClinicInput } from '@/lib/prospect/repo'

const ACCESS_KEY_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789' // unambiguous, no 1/l/0/o

function generateAccessKey(slug: string, length = 6): string {
  // Deterministic-ish: seed off the slug so re-runs produce stable keys.
  let key = ''
  for (let i = 0; i < length; i++) {
    const charCode = (slug.charCodeAt(i % slug.length) + i * 37) % ACCESS_KEY_ALPHABET.length
    key += ACCESS_KEY_ALPHABET[charCode]
  }
  return key
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { prospects?: Array<Partial<CreateClinicInput> & { validUntil?: string }> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const list = body.prospects
  if (!Array.isArray(list) || list.length === 0) {
    return NextResponse.json({ error: 'prospects[] required' }, { status: 400 })
  }
  if (list.length > 200) {
    return NextResponse.json({ error: 'Max 200 per call' }, { status: 400 })
  }

  const results: Array<{
    slug?: string
    ok: boolean
    id?: number
    accessKey?: string
    portalUrl?: string
    error?: string
    skipped?: boolean
  }> = []

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

  for (const raw of list) {
    try {
      const required: Array<keyof CreateClinicInput> = [
        'slug', 'name', 'shortName', 'city', 'state', 'region',
        'contactFirstName', 'contactFullName', 'contactEmail', 'contactDiscipline',
        'clinicWebsiteUrl', 'team', 'travelBand',
      ]
      const missing = required.filter((k) => raw[k] === undefined || raw[k] === null)
      if (missing.length) {
        results.push({ slug: raw.slug, ok: false, error: `Missing: ${missing.join(', ')}` })
        continue
      }

      // Skip if slug already exists
      const existing = await getClinicBySlug(raw.slug!)
      if (existing) {
        results.push({
          slug: raw.slug,
          ok: true,
          skipped: true,
          id: existing.id,
          accessKey: existing.accessKey,
          portalUrl: `${baseUrl}/p/${existing.slug}?k=${existing.accessKey}`,
        })
        continue
      }

      const accessKey = raw.accessKey ?? generateAccessKey(raw.slug!)
      const validUntil = raw.validUntil ? new Date(raw.validUntil) : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)

      const created = await createClinic({
        slug: raw.slug!,
        accessKey,
        name: raw.name!,
        shortName: raw.shortName!,
        city: raw.city!,
        state: raw.state!,
        region: raw.region!,
        contactFirstName: raw.contactFirstName!,
        contactFullName: raw.contactFullName!,
        contactEmail: raw.contactEmail!,
        contactRole: raw.contactRole,
        contactDiscipline: raw.contactDiscipline!,
        clinicWebsiteUrl: raw.clinicWebsiteUrl!,
        team: raw.team!,
        localTargets: raw.localTargets,
        travelBand: raw.travelBand!,
        cohortRecommendation: raw.cohortRecommendation,
        status: raw.status ?? 'approved',
        researchSource: raw.researchSource ?? 'manual',
        validUntil,
        notes: raw.notes,
      })

      results.push({
        slug: created.slug,
        ok: true,
        id: created.id,
        accessKey: created.accessKey,
        portalUrl: `${baseUrl}/p/${created.slug}?k=${created.accessKey}`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ slug: raw.slug, ok: false, error: message })
    }
  }

  const created = results.filter((r) => r.ok && !r.skipped).length
  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => !r.ok).length

  return NextResponse.json({
    summary: { total: list.length, created, skipped, failed },
    results,
  })
}
