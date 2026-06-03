/**
 * Postgres-backed repository for prospect clinics + outreach log.
 * Uses @vercel/postgres which is already in deps.
 *
 * Helpers are server-only — never import from a client component.
 */
import 'server-only'
import { sql } from '@vercel/postgres'
import type {
  ProspectClinic,
  ClinicTeam,
  LocalTarget,
  State,
  TravelBand,
  CohortRecommendation,
  ProspectStatus,
  ResearchSource,
  Discipline,
  EmailTemplateSlug,
} from './types'
import { travelSurchargeFor } from './pricing'

// ─────────────────────────────────────────────────────────────────────────────
// CLINIC ROW MAPPING
// ─────────────────────────────────────────────────────────────────────────────

interface DbClinicRow {
  id: number
  slug: string
  access_key: string
  name: string
  short_name: string
  city: string
  state: string
  region: string
  contact_first_name: string
  contact_full_name: string
  contact_email: string
  contact_role: string | null
  contact_discipline: string
  clinic_website_url: string
  team: ClinicTeam
  local_targets: LocalTarget[]
  travel_band: string
  travel_surcharge: number
  cohort_recommendation: string
  status: string
  research_source: string
  valid_until: Date
  notes: string | null
  created_at: Date
  updated_at: Date
  priority_wave: string | null
}

function mapRow(row: DbClinicRow): ProspectClinic {
  return {
    id: row.id,
    slug: row.slug,
    accessKey: row.access_key,
    name: row.name,
    shortName: row.short_name,
    city: row.city,
    state: row.state as State,
    region: row.region,
    contactFirstName: row.contact_first_name,
    contactFullName: row.contact_full_name,
    contactEmail: row.contact_email,
    contactRole: row.contact_role ?? undefined,
    contactDiscipline: row.contact_discipline as Discipline,
    clinicWebsiteUrl: row.clinic_website_url,
    team: row.team,
    localTargets: row.local_targets,
    travelBand: row.travel_band as TravelBand,
    travelSurcharge: row.travel_surcharge,
    cohortRecommendation: row.cohort_recommendation as CohortRecommendation,
    status: row.status as ProspectStatus,
    researchSource: row.research_source as ResearchSource,
    validUntil: row.valid_until,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    priorityWave: row.priority_wave ?? undefined,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD
// ─────────────────────────────────────────────────────────────────────────────

export async function getClinicBySlug(slug: string): Promise<ProspectClinic | null> {
  const { rows } = await sql<DbClinicRow>`
    SELECT * FROM prospect_clinics WHERE slug = ${slug} LIMIT 1
  `
  return rows[0] ? mapRow(rows[0]) : null
}

export async function getClinicById(id: number): Promise<ProspectClinic | null> {
  const { rows } = await sql<DbClinicRow>`
    SELECT * FROM prospect_clinics WHERE id = ${id} LIMIT 1
  `
  return rows[0] ? mapRow(rows[0]) : null
}

export async function listClinics(limit = 100): Promise<ProspectClinic[]> {
  const { rows } = await sql<DbClinicRow>`
    SELECT * FROM prospect_clinics ORDER BY updated_at DESC LIMIT ${limit}
  `
  return rows.map(mapRow)
}

export interface CreateClinicInput {
  slug: string
  accessKey: string
  name: string
  shortName: string
  city: string
  state: State
  region: string
  contactFirstName: string
  contactFullName: string
  contactEmail: string
  contactRole?: string
  contactDiscipline: Discipline
  clinicWebsiteUrl: string
  team: ClinicTeam
  localTargets?: LocalTarget[]
  travelBand: TravelBand
  cohortRecommendation?: CohortRecommendation
  status?: ProspectStatus
  researchSource?: ResearchSource
  validUntil: Date
  notes?: string
}

export async function createClinic(input: CreateClinicInput): Promise<ProspectClinic> {
  const surcharge = travelSurchargeFor(input.travelBand)
  const { rows } = await sql<DbClinicRow>`
    INSERT INTO prospect_clinics (
      slug, access_key, name, short_name, city, state, region,
      contact_first_name, contact_full_name, contact_email, contact_role, contact_discipline,
      clinic_website_url, team, local_targets,
      travel_band, travel_surcharge, cohort_recommendation,
      status, research_source, valid_until, notes
    ) VALUES (
      ${input.slug}, ${input.accessKey}, ${input.name}, ${input.shortName}, ${input.city}, ${input.state}, ${input.region},
      ${input.contactFirstName}, ${input.contactFullName}, ${input.contactEmail}, ${input.contactRole ?? null}, ${input.contactDiscipline},
      ${input.clinicWebsiteUrl}, ${JSON.stringify(input.team)}::jsonb, ${JSON.stringify(input.localTargets ?? [])}::jsonb,
      ${input.travelBand}, ${surcharge}, ${input.cohortRecommendation ?? 'recommended'},
      ${input.status ?? 'researching'}, ${input.researchSource ?? 'manual'}, ${input.validUntil.toISOString()}, ${input.notes ?? null}
    )
    RETURNING *
  `
  return mapRow(rows[0])
}

export async function updateClinicStatus(id: number, status: ProspectStatus): Promise<void> {
  await sql`
    UPDATE prospect_clinics
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────

export async function isSuppressed(email: string): Promise<boolean> {
  const { rows } = await sql`
    SELECT 1 FROM email_suppression WHERE email = ${email.toLowerCase()} LIMIT 1
  `
  return rows.length > 0
}

export async function suppress(email: string, reason: string, source?: string): Promise<void> {
  await sql`
    INSERT INTO email_suppression (email, reason, source)
    VALUES (${email.toLowerCase()}, ${reason}, ${source ?? null})
    ON CONFLICT (email) DO NOTHING
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE SIGNOFF
// ─────────────────────────────────────────────────────────────────────────────

export async function getTemplateSignoff(slug: EmailTemplateSlug): Promise<{ signedOffAt: Date | null; signedOffBy: string | null }> {
  const { rows } = await sql<{ signed_off_at: Date | null; signed_off_by: string | null }>`
    SELECT signed_off_at, signed_off_by FROM email_template_signoff WHERE slug = ${slug} LIMIT 1
  `
  if (!rows[0]) return { signedOffAt: null, signedOffBy: null }
  return {
    signedOffAt: rows[0].signed_off_at,
    signedOffBy: rows[0].signed_off_by,
  }
}

export async function signOffTemplate(slug: EmailTemplateSlug, by: string, notes?: string): Promise<void> {
  await sql`
    UPDATE email_template_signoff
    SET signed_off_at = NOW(), signed_off_by = ${by}, notes = ${notes ?? null}
    WHERE slug = ${slug}
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// OUTREACH LOG
// ─────────────────────────────────────────────────────────────────────────────

export async function logOutreach(input: {
  clinicId: number
  templateSlug: string
  emailSubject: string
  emailBody: string
  resendEmailId: string | null
  auditKey: string
}): Promise<void> {
  await sql`
    INSERT INTO prospect_outreach_log (clinic_id, template_slug, email_subject, email_body, resend_email_id, audit_key)
    VALUES (${input.clinicId}, ${input.templateSlug}, ${input.emailSubject}, ${input.emailBody}, ${input.resendEmailId}, ${input.auditKey})
    ON CONFLICT (audit_key) DO NOTHING
  `
}

export async function recordPortalView(input: {
  clinicId: number
  viewerIp?: string
  userAgent?: string
  section: string
}): Promise<void> {
  await sql`
    INSERT INTO prospect_portal_views (clinic_id, viewer_ip, user_agent, section_visited)
    VALUES (${input.clinicId}, ${input.viewerIp ?? null}, ${input.userAgent ?? null}, ${input.section})
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY VOLUME CAP
// ─────────────────────────────────────────────────────────────────────────────

export async function todaysSentCount(): Promise<number> {
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*) AS count FROM prospect_outreach_log
    WHERE sent_at::date = CURRENT_DATE
  `
  return parseInt(rows[0]?.count ?? '0', 10)
}
