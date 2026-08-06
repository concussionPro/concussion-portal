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
  // Totum + Purpose are founder-led, hand-managed pitches. They now exist as
  // REAL prospect_clinics rows (so portal engagement actually tracks) but with
  // status='engaged' + next_template_slug=NULL — terminal, excluded from every
  // cold-send/enqueue/hunter path — and their placeholder emails are suppressed.
  // So they render and track like any prospect, but the engine can never email
  // them. The old synthetic short-circuits are retired (Zac 2026-06-27).
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

/**
 * Bulk-insert clinics in a single SQL statement using a JSONB array
 * parameter. Replaces N sequential createClinic() calls which were
 * exhausting Vercel Postgres connections at scale (the prospect-pool
 * importer's chunk-2 502s were caused by 372 sequential inserts in
 * chunk 1 leaving the lambda in a degraded state).
 *
 * Returns the number of inserted rows. Conflicts on slug are silently
 * skipped (ON CONFLICT DO NOTHING) so re-runs are idempotent.
 *
 * Import screens (2026-07-02):
 *  - email_suppression: a suppressed address must never re-enter the pool
 *    under a fresh slug (unsubs are zero-tolerance).
 *  - LOWER(contact_email) dedupe against existing clinics AND within the
 *    batch itself: the same clinic re-imported under a new slug must not
 *    restart a T1 sequence.
 */
export async function bulkCreateClinics(inputs: CreateClinicInput[]): Promise<number> {
  if (inputs.length === 0) return 0
  const payload = inputs.map((input) => ({
    slug: input.slug,
    access_key: input.accessKey,
    name: input.name,
    short_name: input.shortName,
    city: input.city,
    state: input.state,
    region: input.region,
    contact_first_name: input.contactFirstName,
    contact_full_name: input.contactFullName,
    contact_email: input.contactEmail,
    contact_role: input.contactRole ?? null,
    contact_discipline: input.contactDiscipline,
    clinic_website_url: input.clinicWebsiteUrl,
    team: input.team,
    local_targets: input.localTargets ?? [],
    travel_band: input.travelBand,
    travel_surcharge: travelSurchargeFor(input.travelBand),
    cohort_recommendation: input.cohortRecommendation ?? 'recommended',
    status: input.status ?? 'researching',
    research_source: input.researchSource ?? 'manual',
    valid_until: input.validUntil.toISOString(),
    notes: input.notes ?? null,
  }))

  const payloadJson = JSON.stringify(payload)
  const { rowCount } = await sql`
    INSERT INTO prospect_clinics (
      slug, access_key, name, short_name, city, state, region,
      contact_first_name, contact_full_name, contact_email, contact_role, contact_discipline,
      clinic_website_url, team, local_targets,
      travel_band, travel_surcharge, cohort_recommendation,
      status, research_source, valid_until, notes
    )
    SELECT DISTINCT ON (LOWER(elem->>'contact_email'))
      (elem->>'slug')::text,
      (elem->>'access_key')::text,
      (elem->>'name')::text,
      (elem->>'short_name')::text,
      (elem->>'city')::text,
      (elem->>'state')::text,
      (elem->>'region')::text,
      (elem->>'contact_first_name')::text,
      (elem->>'contact_full_name')::text,
      (elem->>'contact_email')::text,
      (elem->>'contact_role')::text,
      (elem->>'contact_discipline')::text,
      (elem->>'clinic_website_url')::text,
      (elem->'team')::jsonb,
      (elem->'local_targets')::jsonb,
      (elem->>'travel_band')::text,
      (elem->>'travel_surcharge')::int,
      (elem->>'cohort_recommendation')::text,
      (elem->>'status')::text,
      (elem->>'research_source')::text,
      (elem->>'valid_until')::timestamptz,
      (elem->>'notes')::text
    FROM jsonb_array_elements(${payloadJson}::jsonb) AS elem
    -- Suppression screen: never re-import an address on the master blacklist.
    -- LOWER(TRIM()) both sides — same reason as isSuppressed() below: the
    -- column has no lowercase constraint, so comparing it raw would re-import
    -- a clinic that had unsubscribed under a mixed-case stored address.
    WHERE NOT EXISTS (
        SELECT 1 FROM email_suppression es
        WHERE LOWER(TRIM(es.email)) = LOWER(TRIM(elem->>'contact_email'))
      )
      -- Email-level dedupe: the same clinic re-imported under a NEW slug
      -- (so ON CONFLICT (slug) can't catch it) must not restart a sequence.
      AND NOT EXISTS (
        SELECT 1 FROM prospect_clinics existing
        WHERE LOWER(existing.contact_email) = LOWER(elem->>'contact_email')
      )
    ORDER BY LOWER(elem->>'contact_email'), (elem->>'slug')
    ON CONFLICT (slug) DO NOTHING
  `
  return rowCount ?? 0
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPPRESSION
// ─────────────────────────────────────────────────────────────────────────────

export async function isSuppressed(email: string): Promise<boolean> {
  try {
    // LOWER(TRIM()) ON THE COLUMN, not just on the input (2026-08-06 residual
    // sweep). email_suppression is plain TEXT with no lowercase constraint, and
    // lib/email-suppression.ts — the canonical checker every other send lane
    // uses — matches `LOWER(TRIM(email))` precisely because "a mixed-case row
    // from a manual insert or an import must still match". This copy, which
    // guards the COLD OUTREACH lane, compared the raw column instead, so a
    // suppressed address stored as `Tim@Clinic.com.au` (or with a trailing
    // space) would not have matched and the clinic would have been mailed.
    // Verified 2026-08-06: 0 of the 101 live rows are mixed-case, so nothing
    // has leaked yet — this closes it before an import creates one. Unsubs are
    // zero-tolerance; the two checkers must not disagree.
    const { rows } = await sql`
      SELECT 1 FROM email_suppression
      WHERE LOWER(TRIM(email)) = ${email.trim().toLowerCase()} LIMIT 1
    `
    return rows.length > 0
  } catch (err) {
    // FAIL CLOSED (2026-07-02): a transient DB error used to throw here and
    // 500 the whole send run. Instead treat the address as suppressed — the
    // caller skips just this row and it retries on the next run. Unsubs are
    // zero-tolerance; never send when the blacklist can't be read.
    console.error(`[prospect repo] isSuppressed check failed for ${email.slice(0, 3)}*** — treating as suppressed (fail closed):`, err)
    return true
  }
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

/**
 * Insert an outreach log row. Returns true if the row was inserted, false
 * if the audit_key already existed (ON CONFLICT DO NOTHING) — callers use
 * the false case to skip a duplicate send when two runs race on the same
 * deterministic key.
 */
export async function logOutreach(input: {
  clinicId: number
  templateSlug: string
  emailSubject: string
  emailBody: string
  resendEmailId: string | null
  auditKey: string
  /** Stable, clinic-agnostic subject-variant key — feeds the optimizer. */
  subjectKey?: string | null
  /** Intent category the follow-up copy was chosen for (hot/warm/cool) — lets us
   *  later measure which intent tier actually converts. Null for T1. */
  followupCategory?: 'hot' | 'warm' | 'cool' | null
}): Promise<boolean> {
  // Lazy columns (mirrors recordPortalView's inline-ALTER pattern) so any
  // caller path works on a DB that predates these engine features.
  await sql`ALTER TABLE prospect_outreach_log ADD COLUMN IF NOT EXISTS subject_key TEXT`
  await sql`ALTER TABLE prospect_outreach_log ADD COLUMN IF NOT EXISTS followup_category TEXT`
  const { rowCount } = await sql`
    INSERT INTO prospect_outreach_log (clinic_id, template_slug, email_subject, email_body, resend_email_id, audit_key, subject_key, followup_category)
    VALUES (${input.clinicId}, ${input.templateSlug}, ${input.emailSubject}, ${input.emailBody}, ${input.resendEmailId}, ${input.auditKey}, ${input.subjectKey ?? null}, ${input.followupCategory ?? null})
    ON CONFLICT (audit_key) DO NOTHING
  `
  return (rowCount ?? 0) > 0
}

/** Attach the Resend email id to an insert-first log row after the send succeeds. */
export async function setOutreachResendId(auditKey: string, resendEmailId: string | null): Promise<void> {
  await sql`
    UPDATE prospect_outreach_log
    SET resend_email_id = ${resendEmailId}
    WHERE audit_key = ${auditKey}
  `
}

/**
 * Remove an insert-first log row after a FAILED send so the sequence can
 * retry — a failed send must never leave a permanent "sent" record.
 */
export async function deleteOutreachByAuditKey(auditKey: string): Promise<void> {
  await sql`
    DELETE FROM prospect_outreach_log WHERE audit_key = ${auditKey}
  `
}

export async function recordPortalView(input: {
  clinicId: number
  viewerIp?: string
  userAgent?: string
  section: string
  utmSource?: string
  utmCampaign?: string
  utmTerm?: string
}): Promise<void> {
  // utm_* captured so a real portal visit is attributed back to the outreach
  // touch (T1/T2/T3 = utm_campaign) and the link position that drove it
  // (utm_term). Lazy columns — idempotent, safe on every call.
  await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS utm_source TEXT`
  await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS utm_campaign TEXT`
  await sql`ALTER TABLE prospect_portal_views ADD COLUMN IF NOT EXISTS utm_term TEXT`
  // utm_* is attacker-controllable query input — clamp before persisting.
  await sql`
    INSERT INTO prospect_portal_views (clinic_id, viewer_ip, user_agent, section_visited, utm_source, utm_campaign, utm_term)
    VALUES (${input.clinicId}, ${input.viewerIp ?? null}, ${input.userAgent ?? null}, ${input.section}, ${input.utmSource?.slice(0, 128) ?? null}, ${input.utmCampaign?.slice(0, 128) ?? null}, ${input.utmTerm?.slice(0, 128) ?? null})
  `
}

// ─────────────────────────────────────────────────────────────────────────────
// DAILY VOLUME CAP
// ─────────────────────────────────────────────────────────────────────────────

export async function todaysSentCount(): Promise<number> {
  // Test-mode previews (audit_key contains ':test:') go to Zac's inbox, not
  // prospects — they must not consume the production daily cap.
  //
  // "Today" is the SYDNEY calendar day (2026-07-02): the old
  // `sent_at::date = CURRENT_DATE` compared in UTC, so the 9am and 11am AEST
  // runs straddled UTC midnight — the second run saw a fresh "day" and sent a
  // full second batch (double the intended daily volume).
  const { rows } = await sql<{ count: string }>`
    SELECT COUNT(*) AS count FROM prospect_outreach_log
    WHERE (sent_at AT TIME ZONE 'Australia/Sydney')::date = (NOW() AT TIME ZONE 'Australia/Sydney')::date
      AND audit_key NOT LIKE '%:test:%'
  `
  return parseInt(rows[0]?.count ?? '0', 10)
}
