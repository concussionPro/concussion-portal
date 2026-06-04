/**
 * POST /api/admin/prospect-bootstrap-targets
 *
 * Bulk-inserts the P1-P6 target list from `data/prospect-targets.ts` into
 * prospect_clinics. Idempotent — slugs already in the DB are skipped.
 *
 * After insert, runs `buildSendSchedule` to populate scheduled_send_at +
 * next_template_slug='initial' so the schedule view in /admin/analytics
 * shows the planned send cadence.
 *
 * Auth: admin header / cookie.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import { createClinic, getClinicBySlug } from '@/lib/prospect/repo'
import { PROSPECT_TARGETS, buildSendSchedule, type ProspectSeed } from '@/data/prospect-targets'

const ACCESS_KEY_ALPHABET = 'abcdefghijkmnopqrstuvwxyz23456789'
function generateAccessKey(slug: string, length = 6): string {
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

  let body: { startDate?: string; dailyCap?: number; dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const startDate = body.startDate ? new Date(body.startDate) : nextBusinessDay(new Date())
  const dailyCap = body.dailyCap ?? 5
  const dryRun = body.dryRun === true

  const schedule = buildSendSchedule(startDate, dailyCap)
  const results: Array<{
    slug: string
    ok: boolean
    skipped?: boolean
    id?: number
    accessKey?: string
    scheduledFor?: string
    error?: string
  }> = []

  for (const target of PROSPECT_TARGETS) {
    try {
      const scheduledAt = schedule.get(target.slug) // undefined for archived
      if (dryRun) {
        results.push({
          slug: target.slug,
          ok: true,
          scheduledFor: scheduledAt?.toISOString(),
        })
        continue
      }

      const existing = await getClinicBySlug(target.slug)
      if (existing) {
        // Full refresh: update every field that may have changed since the
        // initial seed (research agent's findings, archive flag, contact
        // email source, team counts etc).
        await sql`
          UPDATE prospect_clinics
          SET
              name = ${target.name},
              short_name = ${target.shortName},
              city = ${target.city},
              state = ${target.state},
              region = ${target.region},
              contact_first_name = ${target.contactFirstName},
              contact_full_name = ${target.contactFullName},
              contact_email = ${target.contactEmail},
              contact_role = ${target.contactRole ?? null},
              contact_discipline = ${target.contactDiscipline},
              clinic_website_url = ${target.clinicWebsiteUrl},
              team = ${JSON.stringify(target.team)}::jsonb,
              travel_band = ${target.travelBand},
              cohort_recommendation = ${target.cohortRecommendation},
              status = ${target.status},
              notes = ${target.notes ?? null},
              scheduled_send_at = ${scheduledAt?.toISOString() ?? null},
              next_template_slug = COALESCE(next_template_slug, 'initial'),
              priority_wave = ${target.priorityWave},
              pitch_variant = ${target.pitchVariant},
              updated_at = NOW()
          WHERE id = ${existing.id}
        `
        results.push({
          slug: target.slug,
          ok: true,
          skipped: true,
          id: existing.id,
          accessKey: existing.accessKey,
          scheduledFor: scheduledAt?.toISOString(),
        })
        continue
      }

      const accessKey = generateAccessKey(target.slug)
      const created = await createClinic({
        slug: target.slug,
        accessKey,
        name: target.name,
        shortName: target.shortName,
        city: target.city,
        state: target.state,
        region: target.region,
        contactFirstName: target.contactFirstName,
        contactFullName: target.contactFullName,
        contactEmail: target.contactEmail,
        contactRole: target.contactRole,
        contactDiscipline: target.contactDiscipline,
        clinicWebsiteUrl: target.clinicWebsiteUrl,
        team: target.team,
        localTargets: [],
        travelBand: target.travelBand,
        cohortRecommendation: target.cohortRecommendation,
        status: target.status,
        researchSource: 'manual',
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        notes: target.notes,
      })

      // Set schedule + priority on the new row (skip schedule if archived)
      await sql`
        UPDATE prospect_clinics
        SET scheduled_send_at = ${scheduledAt?.toISOString() ?? null},
            next_template_slug = 'initial',
            priority_wave = ${target.priorityWave},
            pitch_variant = ${target.pitchVariant},
            updated_at = NOW()
        WHERE id = ${created.id}
      `

      results.push({
        slug: target.slug,
        ok: true,
        id: created.id,
        accessKey: created.accessKey,
        scheduledFor: scheduledAt?.toISOString(),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({ slug: target.slug, ok: false, error: message })
    }
  }

  const created = results.filter((r) => r.ok && !r.skipped).length
  const skipped = results.filter((r) => r.skipped).length
  const failed = results.filter((r) => !r.ok).length

  return NextResponse.json({
    summary: { total: PROSPECT_TARGETS.length, created, skipped, failed, dryRun, startDate: startDate.toISOString(), dailyCap },
    results,
  })
}

function nextBusinessDay(from: Date): Date {
  const d = new Date(from)
  d.setHours(9, 30, 0, 0)
  // If now is past 9:30am today, start tomorrow
  if (from.getHours() >= 9 || (from.getHours() === 9 && from.getMinutes() >= 30)) {
    d.setDate(d.getDate() + 1)
  }
  // Skip weekends (Mon–Fri only).
  while ([0, 6].includes(d.getDay())) {
    d.setDate(d.getDate() + 1)
  }
  return d
}

/**
 * Unused but kept for future ProspectSeed-typed callers.
 */
export type { ProspectSeed }
