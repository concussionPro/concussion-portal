/**
 * POST /api/admin/prospect-quarantine-bad-data
 *
 * Defensive halt for prospects whose data is too degraded to ship a
 * professional cold-outreach email. Sets scheduled_send_at=NULL and
 * appends a notes audit line so the cron will skip them until a follow-up
 * backfill (city/region/team) cleans them up.
 *
 * Triggered by the Friday 2026-06-05 morning cron firing two
 * embarrassing emails:
 *   - "Concussion hub for Unknown" (Ocean View — Apollo city missing)
 *   - "Hi Director," (Elite HP — Apollo stored title in first_name)
 *
 * Quarantine criteria (any-of):
 *  - city IS NULL or '' or matches 'unknown' (case-insensitive)
 *  - region IS NULL or '' or matches 'unknown'
 *  - short_name IS NULL or '' or matches 'unknown'
 *  - contact_first_name is empty or matches job-title patterns
 *  - research_source='imported' AND team is the all-zero-plus-one
 *    placeholder shape (one discipline at exactly 4, all others 0,
 *    no admin/PM) — the Apollo sweep default
 *
 * Body: { dryRun?: boolean } default true.
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'
import { isAdminRequest } from '@/lib/require-admin'
import type { ClinicTeam } from '@/lib/prospect/types'

export const maxDuration = 60

interface ClinicRow {
  id: number
  slug: string
  short_name: string
  city: string | null
  region: string | null
  contact_first_name: string | null
  research_source: string | null
  team: ClinicTeam
  scheduled_send_at: string | null
  status: string
}

const BAD_NAME_RE = /^(director|manager|principal|owner|founder|partner|ceo|md|head|chief|admin|reception|practice|clinic|info|unknown|n\/a|na|none|test|user|customer)(\s|$)/i

function badCity(v: string | null): boolean {
  if (!v) return true
  return /unknown/i.test(v) || v.trim() === ''
}
function badRegion(v: string | null): boolean {
  if (!v) return true
  return /unknown/i.test(v) || v.trim() === ''
}
function badShortName(v: string | null): boolean {
  if (!v) return true
  return /unknown/i.test(v) || v.trim() === ''
}
function badFirstName(v: string | null): boolean {
  if (!v) return true
  const t = v.trim()
  if (!t) return true
  return BAD_NAME_RE.test(t)
}
function placeholderTeam(team: ClinicTeam | null | undefined, researchSource: string | null): boolean {
  // Apollo sweep default: exactly one discipline at 4, all others 0,
  // research_source='imported'. That's the placeholder shape.
  if (researchSource !== 'imported') return false
  if (!team) return true
  const nonZero = (Object.keys(team) as (keyof ClinicTeam)[]).filter((k) => (team[k] ?? 0) > 0)
  if (nonZero.length !== 1) return false
  return team[nonZero[0]] === 4
}

export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { dryRun?: boolean }
  try {
    body = await req.json().catch(() => ({}))
  } catch {
    body = {}
  }
  const dryRun = body.dryRun !== false

  const { rows: clinics } = await sql<ClinicRow>`
    SELECT id, slug, short_name, city, region, contact_first_name, research_source,
           team, scheduled_send_at, status
    FROM prospect_clinics
    WHERE status NOT IN ('archived', 'lost', 'bounced', 'won')
  `

  const flagged: Array<{
    id: number
    slug: string
    shortName: string
    reasons: string[]
    wasScheduled: boolean
  }> = []

  for (const c of clinics) {
    const reasons: string[] = []
    if (badCity(c.city)) reasons.push('bad-city')
    if (badRegion(c.region)) reasons.push('bad-region')
    if (badShortName(c.short_name)) reasons.push('bad-short-name')
    if (badFirstName(c.contact_first_name)) reasons.push('bad-first-name')
    if (placeholderTeam(c.team, c.research_source)) reasons.push('placeholder-team')
    if (reasons.length > 0) {
      flagged.push({
        id: c.id,
        slug: c.slug,
        shortName: c.short_name,
        reasons,
        wasScheduled: !!c.scheduled_send_at,
      })
    }
  }

  let quarantined = 0
  if (!dryRun && flagged.length > 0) {
    const ids = flagged.map((f) => f.id)
    const idsJson = JSON.stringify(ids)
    const note = `\n[quarantine] ${new Date().toISOString()} scheduled_send_at cleared — data audit failed (city/region/first_name/team placeholder). Re-run backfill before scheduling.`
    const r = await sql`
      UPDATE prospect_clinics
      SET scheduled_send_at = NULL,
          notes = COALESCE(notes, '') || ${note},
          updated_at = NOW()
      WHERE id::text = ANY(SELECT jsonb_array_elements_text(${idsJson}::jsonb))
        AND scheduled_send_at IS NOT NULL
    `
    quarantined = r.rowCount ?? 0
  }

  // Summary by reason
  const byReason: Record<string, number> = {}
  for (const f of flagged) for (const r of f.reasons) byReason[r] = (byReason[r] ?? 0) + 1

  return NextResponse.json({
    summary: {
      mode: dryRun ? 'dry-run' : 'applied',
      totalActiveExamined: clinics.length,
      flagged: flagged.length,
      flaggedAndScheduled: flagged.filter((f) => f.wasScheduled).length,
      byReason,
      quarantined,
    },
    sample: flagged.slice(0, 30),
  })
}
