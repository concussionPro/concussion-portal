/**
 * Shared core for prospect cold-outreach scheduled sends.
 *
 * Both the admin POST handler (`/api/admin/prospect-process-scheduled`) and
 * the Vercel cron GET handler (`/api/cron/prospect-process-scheduled`) call
 * into this. Logic isn't duplicated.
 *
 * Sequence model:
 *   T1 'initial'  → T2 'followup' (+7 business days) → T3 'final' (+8 BD) → DONE
 *
 * The cron sends whatever `next_template_slug` says, then advances state:
 *   - After 'initial' sent:  next='followup', scheduled = today + 7 BD, status='sent'
 *   - After 'followup' sent: next='final',    scheduled = today + 8 BD
 *   - After 'final' sent:    next=NULL,       scheduled=NULL  (sequence end)
 *
 * Gaps are FIXED. Standing rule (Zac): never compress the cadence on an
 * engagement signal — opens/clicks change template copy, not timing.
 *
 * Guardrails:
 *  - next_template_slug not NULL (anything else is sequence-complete / archived)
 *  - signoff required for the specific template being sent
 *  - status NOT IN ('archived','lost','bounced','engaged','won') — engaged
 *    clinics already clicked; auto-following-up would be aggressive. 'lost'
 *    and 'bounced' are opt-outs already handled by the suppression invariant.
 *  - high-confidence email source only (rejects info@/admin@/etc unless
 *    allowPatternGuess=true)
 *  - email_suppression check
 *  - daily cap (adaptive, computed in cron)
 *  - no double-send: NOT EXISTS outreach_log row for the same template
 *    (test-mode previews — audit_key contains ':test:' — are excluded so a
 *    preview never blocks the real send), PLUS an insert-first claim on a
 *    deterministic audit_key so concurrent runs can't race a duplicate.
 */
import { Resend } from 'resend'
import { sql } from '@vercel/postgres'
import {
  getClinicById,
  getTemplateSignoff,
  isSuppressed,
  logOutreach,
  setOutreachResendId,
  deleteOutreachByAuditKey,
} from '@/lib/prospect/repo'
import { EMAIL_TEMPLATES, mergeTemplate, eligibleSubjectKeys } from '@/lib/prospect/email-templates'
import { chooseSubjectKey, type VariantStat } from '@/lib/prospect/subject-optimizer'
import { preflightClinic, failureSummary } from '@/lib/prospect/preflight'
import { legacyAccessKey } from '@/lib/prospect/access-key'
import { generateUnsubscribeToken } from '@/lib/prospect/unsubscribe-token'
import type { EmailTemplateSlug } from '@/lib/prospect/types'

// 2026-06-09: switched From: partnerships@ -> zac@ — inbox-placement win.
// Generic role mailboxes look like bulk lists to spam filters + recipients.
// First-name @ company reads as personal correspondence.
const COLD_FROM = 'Zac Lewis <zac@concussion-education-australia.com>'
const REPLY_TO = 'zac@concussion-education-australia.com'
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://portal.concussion-education-australia.com'

// Cadence — busy clinicians. Fixed gaps regardless of engagement signal
// (standing rule per Zac: never compress on engagement signal — opens and
// clicks drive template VARIANT selection, never timing).
//   T1 → T2: 7 BD — they need time + a value drop to remember why we
//                   emailed.
//   T2 → T3: 8 BD — agreed breakup-email window for the cold cadence.
const FOLLOWUP_GAP_BUSINESS_DAYS = 7         // T1 → T2
const FINAL_GAP_BUSINESS_DAYS = 8            // T2 → T3

interface QueueRow {
  id: number
  slug: string
  short_name: string
  contact_email: string
  contact_first_name: string
  scheduled_send_at: string | null
  next_template_slug: string | null
  status: string
}

export interface ProcessScheduledOptions {
  dryRun: boolean
  dailyCap: number
  allowPatternGuess: boolean
  // Bypass the "scheduled_send_at <= NOW()" filter. Fires every eligible
  // clinic scheduled for the current UTC date regardless of time-of-day.
  // Used for manual "fire today's queue now" runs. Cron never sets this.
  force?: boolean
}

export interface ProcessScheduledResult {
  summary: {
    mode: 'dry-run' | 'production'
    due: number
    sent: number
    sentDryRun: number
    skippedLowConfidence: number
    skippedSuppressed: number
    skippedCap: number
    skippedSignoffMissing: number
    sendFailed: number
    dailyCap: number
    allowPatternGuess: boolean
    byTemplate: { initial: number; followup: number; final: number }
  }
  results: Array<{
    id: number
    slug: string
    shortName: string
    email: string
    template: EmailTemplateSlug | null
    decision:
      | 'skipped-suppressed'
      | 'skipped-low-confidence'
      | 'skipped-cap'
      | 'skipped-signoff-missing'
      | 'skipped-preflight'
      | 'skipped-duplicate'
      | 'sent'
      | 'send-failed'
      | 'sent-dryrun'
    resendId?: string
    reason?: string
  }>
}

function isLowConfidenceEmail(email: string): boolean {
  const lower = email.toLowerCase()
  return /^(info|admin|reception|office|bookings|enquiries|hello|contact|mail)@/.test(lower)
}

// If a clinic's data is too degraded to produce a competent personalised
// email, refuse to send. We REALLY can't ship "Hi Director," or "Concussion
// hub for Unknown" — both embarrassing real artifacts from the Apollo sweep
// when Apollo stuffed a job title into first_name or didn't populate city.
const BAD_NAME_PATTERN = /^(director|manager|principal|owner|founder|partner|ceo|md|head|chief|admin|reception|practice|clinic|info|unknown|n\/a|na|none|test|user|customer)$/i

function hasUnshippableData(row: { short_name?: string | null; contact_first_name?: string | null }): boolean {
  const sn = (row.short_name ?? '').trim()
  const fn = (row.contact_first_name ?? '').trim()
  if (!sn || /unknown/i.test(sn)) return true
  if (!fn) return true
  if (BAD_NAME_PATTERN.test(fn)) return true
  // Multi-word job titles (e.g. "Practice Manager")
  if (/^(director|manager|principal|owner|founder|partner|head|chief|practice|clinic|admin|reception)(\s+\w+)*$/i.test(fn)) return true
  return false
}

// Skip Sunday only. Saturday counts as a send day per Zac 2026-06-05:
// "extend outreach to clinics saturday 8am-1pm" — clinic owners often
// catch up on admin email Saturday morning. Result is at 00:00 UTC so
// the Mon-Sat morning cron picks it up (Sat 00:01 UTC = Sat 10am
// Melbourne AEST, 11am AEDT — within the 8am-1pm window).
function addBusinessDays(from: Date, n: number): Date {
  const d = new Date(from)
  d.setUTCHours(0, 0, 0, 0)
  let added = 0
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1)
    const dow = d.getUTCDay()
    if (dow !== 0) added += 1 // 0 = Sunday — skip; Saturday (6) counts
  }
  return d
}

function isValidTemplateSlug(s: string | null): s is EmailTemplateSlug {
  return s === 'initial' || s === 'followup' || s === 'final'
}

/**
 * Send-window check (AEST) — Mon-Sat morning only. Sun off.
 * Per Zacs cold-outreach cadence: clinicians batch-read on Sat mornings,
 * so we keep Sat in the window; Sun is the only off day.
 *
 * Uses NUMERIC date parts + UTC day arithmetic instead of locale weekday
 * strings — `toLocaleString(..., { weekday: 'short' }) === 'Sun'` is
 * ICU-fragile (rendering varies across ICU builds, e.g. trailing periods).
 */
function isInOptimalSendWindow(): boolean {
  const now = new Date()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Australia/Sydney',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const get = (type: string) => parseInt(parts.find((p) => p.type === type)?.value ?? '', 10)
  const year = get('year')
  const month = get('month')
  const day = get('day')
  let hour = get('hour')
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day) || Number.isNaN(hour)) {
    return false // can't establish Sydney time — fail closed, cron retries tomorrow
  }
  if (hour === 24) hour = 0 // some ICU builds report midnight as 24
  // Day-of-week of the Sydney calendar date via UTC arithmetic. 0 = Sunday.
  const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  if (dow === 0) return false
  return hour >= 6 && hour <= 12
}

/**
 * Defensive, idempotent schema bootstrap. Cheap (ALTER ... IF NOT EXISTS is
 * a no-op once applied) and mirrors the inline-ALTER pattern used by the
 * Resend webhook + prospect-verify-emails routes.
 *
 *  - email_events.user_agent: the prior-engagement lookup filters on it
 *    (COALESCE(user_agent,'')), but the table was created without the
 *    column — a missing column 42703-aborts the entire cron run.
 *  - prospect_clinics.access_key: stored portal keys (see access-key.ts).
 *    Backfills NULL/empty rows with the legacy slug-derived value so
 *    already-sent ?k= links keep working.
 */
async function ensureSchemaBootstrap(): Promise<void> {
  try {
    await sql`ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_agent TEXT`
  } catch (err) {
    console.error('[process-scheduled] email_events.user_agent bootstrap failed:', err)
  }
  // Self-optimizing subject engine: the chosen variant key is stamped on every
  // production send so the optimizer can score variants on real engagement.
  // Defensive ALTER mirrors the lazy one in logOutreach so the first write
  // can never 42703 on a DB that predates the engine.
  try {
    await sql`ALTER TABLE prospect_outreach_log ADD COLUMN IF NOT EXISTS subject_key TEXT`
  } catch (err) {
    console.error('[process-scheduled] prospect_outreach_log.subject_key bootstrap failed:', err)
  }
  try {
    await sql`ALTER TABLE prospect_clinics ADD COLUMN IF NOT EXISTS access_key TEXT`
    const { rows: missingKeys } = await sql<{ id: number; slug: string }>`
      SELECT id, slug FROM prospect_clinics
      WHERE access_key IS NULL OR access_key = ''
      LIMIT 500
    `
    for (const r of missingKeys) {
      await sql`
        UPDATE prospect_clinics
        SET access_key = ${legacyAccessKey(r.slug)}
        WHERE id = ${r.id} AND (access_key IS NULL OR access_key = '')
      `
    }
    // Targeted continuity fix — Advanced Health Buderim. The live
    // hand-built proposal site (app/proposals/advanced-health-buderim/
    // _shared.tsx) hardcodes ACCESS_KEY 'ah2026' in links already in the
    // wild, and /api/toolkit/download validates ?k= against
    // prospect_clinics.access_key. The legacy-derived backfill above
    // produces a DIFFERENT key for that row, so force the known value —
    // must run even when access_key is already non-null (it may have just
    // been backfilled with the derived value). Idempotent. Slug matched
    // with LIKE because the engine-side slug for this hand-built clinic
    // isn't pinned anywhere in the repo.
    await sql`
      UPDATE prospect_clinics
      SET access_key = 'ah2026'
      WHERE slug LIKE 'advanced-health%'
        AND access_key IS DISTINCT FROM 'ah2026'
    `
  } catch (err) {
    console.error('[process-scheduled] access_key bootstrap failed:', err)
  }
}

// Map a template slug to the utm_campaign its portal link carries, so a real
// portal visit is attributed to the touch that drove it.
const TOUCH_CAMPAIGN: Record<EmailTemplateSlug, string> = {
  initial: 'cold_t1',
  followup: 'cold_t2',
  final: 'cold_t3',
}

/**
 * Load live per-(template_slug, subject_key) performance for the optimizer.
 *
 *   sends     = production outreach-log rows that used this subject key for
 *               this touch (test previews — audit_key '%:test:%' — excluded).
 *   realViews = DISTINCT clinics with a scanner-filtered portal visit
 *               (duration_seconds >= 60 OR interaction_type = 'cta_click')
 *               whose utm_campaign matches the touch AND who received a send
 *               that used this subject key.
 *
 * Keyed `${template_slug}::${subject_key}`. Tolerant of a fresh DB: if
 * subject_key / interaction_type / utm_campaign columns don't exist yet the
 * query 42703s, we swallow it and return an empty map — the optimizer then
 * falls back to the deterministic slug-hash pick (uniform warmup).
 */
async function loadSubjectKeyStats(): Promise<Map<string, VariantStat>> {
  const out = new Map<string, VariantStat>()
  try {
    const { rows } = await sql<{
      template_slug: string
      subject_key: string
      sends: number
      real_views: number
    }>`
      WITH sent AS (
        SELECT template_slug, subject_key, clinic_id
        FROM prospect_outreach_log
        WHERE subject_key IS NOT NULL
          AND audit_key NOT LIKE '%:test:%'
      ),
      real_views AS (
        -- REAL engagement (Zac 2026-06-12): dwell lives in dwell_ms, NOT
        -- duration_seconds (which is never populated → was always 0, zeroing
        -- the whole metric). Scanners can't fire the exit/dwell beacon, so any
        -- dwell_ms is a real human; ≥10s = a genuine read.
        SELECT clinic_id, utm_campaign
        FROM prospect_portal_views
        WHERE (COALESCE(dwell_ms, 0) >= 10000 OR interaction_type = 'cta_click')
        GROUP BY clinic_id, utm_campaign
      )
      SELECT
        s.template_slug,
        s.subject_key,
        COUNT(*)::int AS sends,
        COUNT(DISTINCT CASE WHEN rv.clinic_id IS NOT NULL THEN s.clinic_id END)::int AS real_views
      FROM sent s
      LEFT JOIN real_views rv
        ON rv.clinic_id = s.clinic_id
        AND rv.utm_campaign = CASE s.template_slug
          WHEN 'initial' THEN 'cold_t1'
          WHEN 'followup' THEN 'cold_t2'
          WHEN 'final' THEN 'cold_t3'
        END
      GROUP BY s.template_slug, s.subject_key
    `
    for (const r of rows) {
      out.set(`${r.template_slug}::${r.subject_key}`, {
        sends: Number(r.sends ?? 0),
        realViews: Number(r.real_views ?? 0),
      })
    }
  } catch (err) {
    console.error('[process-scheduled] subject-key stats load failed — optimizer falls back to slug-hash:', err)
  }
  return out
}

// Bot/scanner UA filter — shared by the prior-engagement lookup and the
// intent-hint derivation. SafeLinks/Mimecast/etc fetch landing URLs but never
// execute the portal JS that fires section beacons, so section_view rows are
// inherently human; we still filter known bot UAs defensively (webhook rows
// carry NULL UA → COALESCE '' → no match → counted as human, intentional).
const BOT_UA_REGEX =
  '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|crawler|spider|slurp|facebook|linkedin|whatsapp|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'

// Sections that map to a 'toolkit' intent hint (practical-value viewers).
const TOOLKIT_SECTIONS = [
  'toolkit-pack',
  'toolkit-callout',
  'toolkit-clinical',
  'toolkit-admin',
  'toolkit-outreach',
  'learning-suite',
  'reference-library',
]

/**
 * Intent-aware follow-up hint (Zac 2026-06-14). Reads what this clinic
 * actually VIEWED on their portal (prospect_portal_views section beacons) and
 * derives the single strongest signal so the T2/T3 copy can speak to it:
 *   pricing  > trial (Module 1 opened) > toolkit/learning > null (generic).
 * Unlike email open/click (scanner noise — ignored), section beacons are
 * human: scanners don't run the page JS that fires them. Bot UAs are still
 * filtered defensively. Read-only, never throws — degrades to null so a lookup
 * hiccup just yields the generic follow-up, never kills the send run.
 */
async function deriveEngagementHint(
  clinicId: number,
): Promise<'pricing' | 'trial' | 'toolkit' | null> {
  try {
    const { rows } = await sql<{ section_visited: string | null }>`
      SELECT DISTINCT LOWER(section_visited) AS section_visited
      FROM prospect_portal_views
      WHERE clinic_id = ${clinicId}
        AND section_visited IS NOT NULL
        AND interaction_type IN ('view', 'section_view', 'cta_click')
        AND COALESCE(user_agent, '') !~* ${BOT_UA_REGEX}
    `
    const sections = new Set(rows.map((r) => r.section_visited ?? ''))
    if (sections.has('pricing')) return 'pricing'
    if (sections.has('module-1-trial')) return 'trial'
    if (TOOLKIT_SECTIONS.some((s) => sections.has(s))) return 'toolkit'
    return null
  } catch (err) {
    console.error(
      `[process-scheduled] engagement-hint lookup failed for clinic ${clinicId} — degrading to generic:`,
      err,
    )
    return null
  }
}

export async function processScheduledSends(
  opts: ProcessScheduledOptions,
): Promise<ProcessScheduledResult> {
  const { dryRun, dailyCap, allowPatternGuess, force = false } = opts

  await ensureSchemaBootstrap()

  // Send-window gate: Mon-Sat 06:00-12:00 AEST. Sun off. force=true bypasses.
  if (!force && !dryRun && !isInOptimalSendWindow()) {
    return {
      summary: {
        mode: 'production',
        due: 0,
        sent: 0,
        sentDryRun: 0,
        skippedLowConfidence: 0,
        skippedSuppressed: 0,
        skippedCap: 0,
        skippedSignoffMissing: 0,
        sendFailed: 0,
        dailyCap: dailyCap ?? 0,
        allowPatternGuess: !!allowPatternGuess,
        byTemplate: { initial: 0, followup: 0, final: 0 },
      },
      results: [],
    }
  }

  // Pre-load signoff state for every template so we can per-row skip
  // without re-querying.
  const signoffByTemplate = new Map<EmailTemplateSlug, boolean>()
  for (const slug of ['initial', 'followup', 'final'] as const) {
    const so = await getTemplateSignoff(slug)
    signoffByTemplate.set(slug, !!so.signedOffAt)
  }

  // NOTE: there is deliberately NO engagement-based acceleration sweep here.
  // Standing rule (Zac): never compress the cadence on an engagement signal.
  // Opens/clicks pick the template variant; scheduled_send_at stays put.

  // Driver query: every clinic whose next_template_slug says something is
  // due, that's not in a dead state, and that hasn't already had this
  // specific template logged.
  // Personal-lane exclusion: any prospect with intent_score ≥20 (warm+) is
  // pulled from the cold cron so Zac's personal email doesn't collide with
  // a templated send. Mirrors the scoring in /api/admin/b2b-outreach-targets.
  // 90-day lookback to match the dashboard signal window.
  const { rows: due } = force
    ? await sql<QueueRow>`
        SELECT pc.id, pc.slug, pc.short_name, pc.contact_email, pc.contact_first_name,
               pc.scheduled_send_at, pc.next_template_slug, pc.status
        FROM prospect_clinics pc
        WHERE pc.next_template_slug IS NOT NULL
          AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
          AND pc.scheduled_send_at IS NOT NULL
          AND (pc.scheduled_send_at AT TIME ZONE 'Australia/Sydney')::date <= (NOW() AT TIME ZONE 'Australia/Sydney')::date
          -- Intent gate removed (Zac 2026-06-11): it used scanner-polluted
          -- email opens/clicks and was zeroing the cold queue. Warm prospects
          -- are already excluded by status NOT IN (replied/engaged/won/...).
          -- HARD GATE: Hunter-clean only. Never email role mailboxes,
          -- accept-all domains, disposable, or score-below-80. These are
          -- the ones that bounce + get gateway-scanned + burn reputation.
          AND pc.verification_score IS NOT NULL
          AND pc.verification_score >= 80
          AND COALESCE(pc.verification_role, FALSE) = FALSE
          AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
          AND COALESCE(pc.verification_disposable, FALSE) = FALSE
          -- Test-mode previews (audit_key contains ':test:') go to Zac's
          -- inbox, not the prospect — they must NOT block the real send.
          AND NOT EXISTS (
            SELECT 1 FROM prospect_outreach_log ol
            WHERE ol.clinic_id = pc.id AND ol.template_slug = pc.next_template_slug
              AND ol.audit_key NOT LIKE '%:test:%'
          )
        -- Size-tier priority (Zac 2026-06-10): large clinics (on-site training
        -- pitch, >=6 clinical) > medium clinics (Hub Pack, 2-5) > individuals.
        -- Clinical sum must stay in lockstep with clinicalCount() in
        -- lib/prospect/pricing.ts (7 clinical keys, excludes practiceManager/admin).
        -- Category-balanced interleave (Zac 2026-06-16): every daily batch must
        -- represent on-site, hub AND individual — never all of one tier. We rank
        -- within each tier by conversion-stamped scheduled_send_at, then weight
        -- the rank so on-site is densest (highest value) but hub/individual
        -- always get slots. ~16 on-site / 9 hub / 5 individual per 30/day.
        ORDER BY
          (ROW_NUMBER() OVER (
             PARTITION BY CASE
               WHEN (COALESCE((pc.team->>'osteopaths')::int,0)+&+COALESCE((pc.team->>'chiropractors')::int,0)+COALESCE((pc.team->>'generalPractitioners')::int,0)+COALESCE((pc.team->>'sportsMedicineDoctors')::int,0)+COALESCE((pc.team->>'exercisePhys')::int,0)+COALESCE((pc.team->>'myotherapists')::int,0)+COALESCE((pc.team->>'remedialMassage')::int,0)) >= 8 THEN 0
               WHEN (COALESCE((pc.team->>'osteopaths')::int,0)+&+COALESCE((pc.team->>'chiropractors')::int,0)+COALESCE((pc.team->>'generalPractitioners')::int,0)+COALESCE((pc.team->>'sportsMedicineDoctors')::int,0)+COALESCE((pc.team->>'exercisePhys')::int,0)+COALESCE((pc.team->>'myotherapists')::int,0)+COALESCE((pc.team->>'remedialMassage')::int,0)) >= 2 THEN 1
               ELSE 2 END
             ORDER BY pc.scheduled_send_at ASC, pc.priority_wave ASC
           ) * CASE
               WHEN (COALESCE((pc.team->>'osteopaths')::int,0)+&+COALESCE((pc.team->>'chiropractors')::int,0)+COALESCE((pc.team->>'generalPractitioners')::int,0)+COALESCE((pc.team->>'sportsMedicineDoctors')::int,0)+COALESCE((pc.team->>'exercisePhys')::int,0)+COALESCE((pc.team->>'myotherapists')::int,0)+COALESCE((pc.team->>'remedialMassage')::int,0)) >= 8 THEN 1.0
               WHEN (COALESCE((pc.team->>'osteopaths')::int,0)+&+COALESCE((pc.team->>'chiropractors')::int,0)+COALESCE((pc.team->>'generalPractitioners')::int,0)+COALESCE((pc.team->>'sportsMedicineDoctors')::int,0)+COALESCE((pc.team->>'exercisePhys')::int,0)+COALESCE((pc.team->>'myotherapists')::int,0)+COALESCE((pc.team->>'remedialMassage')::int,0)) >= 2 THEN 1.7
               ELSE 2.6 END) ASC,
          pc.scheduled_send_at ASC, pc.priority_wave ASC
        LIMIT 50
      `
    : await sql<QueueRow>`
        SELECT pc.id, pc.slug, pc.short_name, pc.contact_email, pc.contact_first_name,
               pc.scheduled_send_at, pc.next_template_slug, pc.status
        FROM prospect_clinics pc
        WHERE pc.next_template_slug IS NOT NULL
          AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
          AND pc.scheduled_send_at IS NOT NULL
          -- Date-based, not <= NOW() (Zac 2026-06-11): a prospect scheduled for
          -- later TODAY (future time, today's date) was wrongly excluded by the
          -- <= NOW() clause, zeroing same-day runs. scheduled_send_at is a
          -- send-on-or-after DAY marker; the stagger + window guard handle time.
          AND (pc.scheduled_send_at AT TIME ZONE 'Australia/Sydney')::date <= (NOW() AT TIME ZONE 'Australia/Sydney')::date
          -- Intent gate removed (Zac 2026-06-11): it used scanner-polluted
          -- email opens/clicks and was zeroing the cold queue. Warm prospects
          -- are already excluded by status NOT IN (replied/engaged/won/...).
          -- HARD GATE: Hunter-clean only. Same rule as the force-mode query.
          AND pc.verification_score IS NOT NULL
          AND pc.verification_score >= 80
          AND COALESCE(pc.verification_role, FALSE) = FALSE
          AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
          AND COALESCE(pc.verification_disposable, FALSE) = FALSE
          -- Test-mode previews (audit_key contains ':test:') go to Zac's
          -- inbox, not the prospect — they must NOT block the real send.
          AND NOT EXISTS (
            SELECT 1 FROM prospect_outreach_log ol
            WHERE ol.clinic_id = pc.id AND ol.template_slug = pc.next_template_slug
              AND ol.audit_key NOT LIKE '%:test:%'
          )
        -- Size-tier priority (Zac 2026-06-10): large clinics (on-site training
        -- pitch, >=6 clinical) > medium clinics (Hub Pack, 2-5) > individuals.
        -- Clinical sum must stay in lockstep with clinicalCount() in
        -- lib/prospect/pricing.ts (7 clinical keys, excludes practiceManager/admin).
        ORDER BY
          CASE
            WHEN (COALESCE((pc.team->>'osteopaths')::int, 0)
                + & + COALESCE((pc.team->>'chiropractors')::int, 0)
                + COALESCE((pc.team->>'generalPractitioners')::int, 0)
                + COALESCE((pc.team->>'sportsMedicineDoctors')::int, 0)
                + COALESCE((pc.team->>'exercisePhys')::int, 0)
                + COALESCE((pc.team->>'myotherapists')::int, 0)
                + COALESCE((pc.team->>'remedialMassage')::int, 0)) >= 8 THEN 0
            WHEN (COALESCE((pc.team->>'osteopaths')::int, 0)
                + & + COALESCE((pc.team->>'chiropractors')::int, 0)
                + COALESCE((pc.team->>'generalPractitioners')::int, 0)
                + COALESCE((pc.team->>'sportsMedicineDoctors')::int, 0)
                + COALESCE((pc.team->>'exercisePhys')::int, 0)
                + COALESCE((pc.team->>'myotherapists')::int, 0)
                + COALESCE((pc.team->>'remedialMassage')::int, 0)) >= 2 THEN 1
            ELSE 2
          END ASC,
          pc.scheduled_send_at ASC, pc.priority_wave ASC
        LIMIT 50
      `

  const results: ProcessScheduledResult['results'] = []
  let sentCount = 0
  const resendKey = process.env.RESEND_API_KEY

  // ── Self-optimizing subject engine: load live per-(touch, variant-key)
  // performance ONCE for this run. The optimizer uses it to favour the
  // best-converting subject variant per touch — but only after each variant
  // has enough sends; until then it returns the deterministic slug-hash pick
  // (uniform warmup). A load failure → empty map → pure slug-hash fallback,
  // so the engine degrades to its prior behaviour, never blocks the send run.
  const subjectStats = await loadSubjectKeyStats()

  // ── Stagger: spread the day's cold sends 7-10 min apart instead of blasting
  // them in one cron tick. Apollo-style human-cadence — inbox providers flag
  // sender→burst patterns, and brand-new creative (the portal-led templates)
  // must prove its bounce/spam profile gradually. Resend schedules each email
  // for delivery at a future time (supports up to 72h ahead), so the cron just
  // queues them and returns; Resend handles the timed delivery.
  // Min/max gap configurable via env; defaults 7-10 min.
  const STAGGER_MIN_MS = (parseInt(process.env.COLD_STAGGER_MIN_MIN || '7', 10) || 7) * 60_000
  const STAGGER_MAX_MS = (parseInt(process.env.COLD_STAGGER_MAX_MIN || '10', 10) || 10) * 60_000
  const runStart = Date.now()
  let staggerCursorMs = 0 // offset from runStart for the NEXT send

  // ── Send window (Zac 2026-06-11): deliver Mon-Fri until 5:30pm AEST, Sat
  // until 1pm AEST, never Sunday. AEST = UTC+10 (no DST — AU east-coast winter /
  // QLD year-round). We stop QUEUEING once the next staggered slot would fall
  // past today's window-end; the leftover prospects wait for the next run
  // (9am Mon-Fri / 8am Sat). Env override COLD_WINDOW_END_HOUR for testing.
  const AEST_OFFSET_MS = 10 * 3_600_000
  const aestNow = new Date(runStart + AEST_OFFSET_MS)
  const aestDay = aestNow.getUTCDay() // 0=Sun … 6=Sat, evaluated in AEST
  const aestMidnightUtcMs =
    Date.UTC(aestNow.getUTCFullYear(), aestNow.getUTCMonth(), aestNow.getUTCDate()) - AEST_OFFSET_MS
  const windowEndHourAest = aestDay === 0 ? 0 : aestDay === 6 ? 13 : 17.5 // Sun none · Sat 1pm · wk 5:30pm
  const windowEndUtcMs = aestMidnightUtcMs + windowEndHourAest * 3_600_000

  for (const row of due) {
    // Stop queueing once the next staggered slot falls past today's window-end.
    if (runStart + staggerCursorMs > windowEndUtcMs) break
    const templateSlug = row.next_template_slug
    if (!isValidTemplateSlug(templateSlug)) {
      // Defensive — DB has a slug we don't know how to handle. Skip.
      continue
    }

    if (sentCount >= dailyCap) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-cap', reason: `daily cap ${dailyCap} reached`,
      })
      continue
    }
    if (!signoffByTemplate.get(templateSlug)) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-signoff-missing',
        reason: `${templateSlug} template not signed off — POST /api/admin/prospect-template-signoff`,
      })
      continue
    }
    if (await isSuppressed(row.contact_email)) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-suppressed', reason: 'on suppression list',
      })
      continue
    }
    // Belt-and-braces: refuse to send if first_name or short_name would
    // produce embarrassing copy ("Hi Director," / "Concussion hub for
    // Unknown"). The merger has defences too but this is the surer guard.
    if (hasUnshippableData(row)) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-low-confidence',
        reason: `unshippable data: short_name="${row.short_name}" first_name="${row.contact_first_name}" — needs manual fix`,
      })
      continue
    }
    if (isLowConfidenceEmail(row.contact_email) && !allowPatternGuess) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-low-confidence',
        reason: 'generic mailbox (info@/admin@/etc) — verify direct founder email first',
      })
      continue
    }

    if (dryRun) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'sent-dryrun', reason: `would send ${templateSlug} (dry run)`,
      })
      sentCount += 1
      continue
    }

    if (!resendKey) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: 'RESEND_API_KEY missing',
      })
      continue
    }

    const clinic = await getClinicById(row.id)
    if (!clinic) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: 'clinic vanished mid-query',
      })
      continue
    }

    // ─── PREFLIGHT GATE ──────────────────────────────────────────────────
    // Last-chance check before send. Verifies personalization data is
    // shippable AND email is deliverable (DNS MX + suppression + format
    // + disposable-domain). Per Zac: no mistakes, no generic terms — if
    // anything would render as fallback or bounce, quarantine instead.
    const preflight = await preflightClinic(clinic)
    if (preflight.severity === 'quarantine') {
      // Auto-quarantine — block this prospect from future sends
      try {
        await sql`
          UPDATE prospect_clinics
          SET status = 'archived',
              notes = COALESCE(notes || E'\\n', '') || ${'[preflight-quarantine ' + new Date().toISOString().slice(0, 10) + '] ' + failureSummary(preflight)},
              scheduled_send_at = NULL,
              updated_at = NOW()
          WHERE id = ${row.id}
        `
      } catch (err) {
        console.error('[preflight-quarantine] failed to update prospect:', err)
      }
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-preflight',
        reason: `preflight quarantine: ${failureSummary(preflight)}`,
      })
      continue
    }
    if (preflight.severity === 'enrich' && !allowPatternGuess) {
      // Soft fail — hold for enrichment (DNS error or role-only mailbox)
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-preflight',
        reason: `preflight enrich-needed: ${failureSummary(preflight)}`,
      })
      continue
    }

    const template = EMAIL_TEMPLATES.find((t) => t.slug === templateSlug)!
    const unsubToken = generateUnsubscribeToken(clinic.slug)

    // For followup + final sends, look up engagement signal from the
    // previous template. Drives variant selection in mergeTemplate:
    //   - clicked → strongest variant ("noticed you opened the {clinic} preview")
    //   - opened  → soft variant ("saw you took a look")
    //   - none    → generic followup
    // Bot/scanner UAs filtered out so SafeLinks pre-fetches don't trigger
    // the "we noticed you clicked" variant when no human actually engaged.
    // (Webhook rows never carry user_agent — NULL coalesces to '' which the
    // regex doesn't match, so those events count as human. Intentional.)
    // Wrapped in try/catch: variant selection is cosmetic — a lookup failure
    // degrades to the generic variant, it must never kill the send run.
    let priorEngagement: 'none' | 'opened' | 'clicked' = 'none'
    if (templateSlug !== 'initial') {
      try {
        const priorSlug = templateSlug === 'followup' ? 'initial' : 'followup'
        const { rows: priorSends } = await sql<{ resend_email_id: string | null }>`
          SELECT resend_email_id FROM prospect_outreach_log
          WHERE clinic_id = ${clinic.id}
            AND template_slug = ${priorSlug}
            AND resend_email_id IS NOT NULL
          ORDER BY sent_at DESC LIMIT 1
        `
        const priorResendId = priorSends[0]?.resend_email_id
        if (priorResendId) {
          const { rows: events } = await sql<{ event_type: string }>`
            SELECT event_type FROM email_events
            WHERE email_id = ${priorResendId}
              AND event_type IN ('opened', 'clicked')
              AND COALESCE(user_agent, '') !~* '(microsoft office|bingpreview|mimecast|barracuda|proofpoint|cloudmark|symantec|sophos|fortinet|trend micro|safelinks|headlesschrome|phantomjs|puppeteer|playwright|googlebot|bingbot|crawler|spider|slurp|facebook|linkedin|whatsapp|wget|curl|python-requests|node-fetch|axios|httpie|go-http-client|java/|okhttp|powershell)'
          `
          if (events.some((e) => e.event_type === 'clicked')) priorEngagement = 'clicked'
          else if (events.some((e) => e.event_type === 'opened')) priorEngagement = 'opened'
        }
      } catch (err) {
        console.error(
          `[process-scheduled] prior-engagement lookup failed for clinic ${clinic.id} — degrading to 'none':`,
          err,
        )
        priorEngagement = 'none'
      }
    }

    // ── DYNAMIC subject-line pick ──────────────────────────────────────
    // Candidate keys = the subject variants eligible for THIS clinic + touch
    // (after the unknown-data / ≤50-char guards). The optimizer favours the
    // best-converting one once warmed up, else the deterministic slug-hash
    // pick. Deterministic per slug, so a retry resolves to the same variant.
    const candidateKeys = eligibleSubjectKeys(templateSlug, clinic)
    const perKeyStats = new Map<string, VariantStat>()
    for (const k of candidateKeys) {
      perKeyStats.set(k, subjectStats.get(`${templateSlug}::${k}`) ?? { sends: 0, realViews: 0 })
    }
    const forceSubjectKey = candidateKeys.length
      ? chooseSubjectKey({ candidateKeys, slug: clinic.slug, stats: perKeyStats })
      : undefined

    // Intent-aware follow-up (Zac 2026-06-14): tailor ONE sentence of the
    // T2/T3 copy to what the prospect actually viewed on their portal. T1 has
    // no prior engagement, so we only look it up for followup/final touches.
    // Read-only + degrades to null → generic copy; never blocks the send.
    let engagementHint: 'pricing' | 'trial' | 'toolkit' | null = null
    if (templateSlug !== 'initial') {
      engagementHint = await deriveEngagementHint(clinic.id)
    }

    const { subject, html, text, subjectKey } = mergeTemplate(template, clinic, BASE_URL, unsubToken, {
      priorEngagement,
      forceSubjectKey,
      engagementHint,
    })
    // Deterministic key — concurrent runs (cron + manual fire-now, or two
    // overlapping cron invocations) collide on the UNIQUE audit_key instead
    // of double-sending. Insert-first: claim the key BEFORE the send; if the
    // claim conflicts another run already owns this send. The row is deleted
    // if the send fails so a retry can occur.
    const auditKey = `outreach:${clinic.slug}:${templateSlug}:prod`

    const claimed = await logOutreach({
      clinicId: clinic.id,
      templateSlug: templateSlug,
      emailSubject: subject,
      emailBody: text,
      resendEmailId: null,
      auditKey,
      subjectKey,
    })
    if (!claimed) {
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'skipped-duplicate',
        reason: `audit key ${auditKey} already claimed — concurrent run or prior send`,
      })
      continue
    }

    // Only the send call itself sits in this try/catch — if the email went
    // out, the claimed log row must NEVER be deleted (deleting it after a
    // post-send bookkeeping failure would re-queue an already-delivered
    // email on the next run).
    // Schedule this send at runStart + cursor (first email ~now, each later
    // one 7-10 min after the previous), then advance the cursor for the next.
    const scheduledAtIso = new Date(runStart + staggerCursorMs).toISOString()
    const gap = STAGGER_MIN_MS + Math.random() * (STAGGER_MAX_MS - STAGGER_MIN_MS)
    staggerCursorMs += gap

    let sendOutcome: Awaited<ReturnType<Resend['emails']['send']>>
    try {
      const resend = new Resend(resendKey)
      sendOutcome = await resend.emails.send({
        from: COLD_FROM,
        to: clinic.contactEmail,
        replyTo: REPLY_TO,
        subject,
        html,
        text,
        scheduledAt: scheduledAtIso,
        // Headers tuned for PRIMARY-inbox placement of a low-volume (30/day)
        // personal-style cold email. We deliberately do NOT send the bulk
        // markers (Precedence: bulk, List-ID, List-Unsubscribe-Post one-click,
        // X-Mailer) — those route a 1:1-looking note to Promotions/spam and are
        // only required above Google's 5,000/day bulk threshold, which we're far
        // under. A plain List-Unsubscribe (mailto + url) stays: it's the
        // functional unsubscribe the AU Spam Act expects, Gmail trusts senders
        // who honour it, and on its own it does NOT signal bulk marketing. The
        // body's "reply STOP" line is the second unsubscribe path.
        headers: {
          'List-Unsubscribe': `<${BASE_URL}/api/prospect/unsubscribe?t=${unsubToken}>, <mailto:unsubscribe@concussion-education-australia.com>`,
        },
        tags: [
          { name: 'prospect-id', value: String(clinic.id) },
          { name: 'template', value: templateSlug },
          { name: 'mode', value: 'production-cron' },
        ],
      })
    } catch (err) {
      // Failed send — release the claimed audit key so a retry can occur.
      // A failed send must never advance the sequence or leave a permanent
      // "sent" record.
      await deleteOutreachByAuditKey(auditKey).catch((e) =>
        console.error('[process-scheduled] failed to release audit key after send exception:', e),
      )
      const message = err instanceof Error ? err.message : String(err)
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: message,
      })
      continue
    }

    if (sendOutcome.error) {
      // Resend rejected the send — nothing went out. Release the key.
      await deleteOutreachByAuditKey(auditKey).catch((e) =>
        console.error('[process-scheduled] failed to release audit key after Resend error:', e),
      )
      results.push({
        id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
        template: templateSlug,
        decision: 'send-failed', reason: JSON.stringify(sendOutcome.error).slice(0, 200),
      })
      continue
    }

    // Email is out. Post-send bookkeeping failures are logged but the log
    // row stays put — better a stale next_template_slug (self-corrects via
    // the audit-key dedupe) than a duplicate cold email.
    try {
      await setOutreachResendId(auditKey, sendOutcome.data?.id ?? null)
      // Advance sequence state — drives the next cron run.
      await advanceSequenceAfterSend(clinic.id, templateSlug)
    } catch (err) {
      console.error(
        `[process-scheduled] post-send bookkeeping failed for clinic ${clinic.id} (${auditKey}):`,
        err,
      )
    }

    results.push({
      id: row.id, slug: row.slug, shortName: row.short_name, email: row.contact_email,
      template: templateSlug,
      decision: 'sent', resendId: sendOutcome.data?.id ?? undefined,
    })
    sentCount += 1
  }

  const byTemplate = { initial: 0, followup: 0, final: 0 }
  for (const r of results) {
    if (r.template && (r.decision === 'sent' || r.decision === 'sent-dryrun')) {
      byTemplate[r.template] += 1
    }
  }

  return {
    summary: {
      mode: dryRun ? 'dry-run' : 'production',
      due: due.length,
      sent: results.filter((r) => r.decision === 'sent').length,
      sentDryRun: results.filter((r) => r.decision === 'sent-dryrun').length,
      skippedLowConfidence: results.filter((r) => r.decision === 'skipped-low-confidence').length,
      skippedSuppressed: results.filter((r) => r.decision === 'skipped-suppressed').length,
      skippedCap: results.filter((r) => r.decision === 'skipped-cap').length,
      skippedSignoffMissing: results.filter((r) => r.decision === 'skipped-signoff-missing').length,
      sendFailed: results.filter((r) => r.decision === 'send-failed').length,
      dailyCap,
      allowPatternGuess,
      byTemplate,
    },
    results,
  }
}

/**
 * Advance the clinic's sequence pointer after a SUCCESSFUL production send.
 * Shared by the cron driver and the manual /api/admin/prospect-send route
 * so manual prod sends move the sequence exactly like cron sends do.
 */
export async function advanceSequenceAfterSend(
  clinicId: number,
  templateSlug: EmailTemplateSlug,
): Promise<void> {
  if (templateSlug === 'initial') {
    const nextScheduled = addBusinessDays(new Date(), FOLLOWUP_GAP_BUSINESS_DAYS).toISOString()
    await sql`
      UPDATE prospect_clinics
      SET next_template_slug = 'followup',
          scheduled_send_at = ${nextScheduled},
          status = CASE WHEN status IN ('researching', 'approved') THEN 'sent' ELSE status END,
          updated_at = NOW()
      WHERE id = ${clinicId}
    `
  } else if (templateSlug === 'followup') {
    const nextScheduled = addBusinessDays(new Date(), FINAL_GAP_BUSINESS_DAYS).toISOString()
    await sql`
      UPDATE prospect_clinics
      SET next_template_slug = 'final',
          scheduled_send_at = ${nextScheduled},
          updated_at = NOW()
      WHERE id = ${clinicId}
    `
  } else if (templateSlug === 'final') {
    await sql`
      UPDATE prospect_clinics
      SET next_template_slug = NULL,
          scheduled_send_at = NULL,
          updated_at = NOW()
      WHERE id = ${clinicId}
    `
  }
}

export interface GateBlockedBreakdown {
  /** Prospects that are otherwise due but fail the Hunter HARD GATE, by reason. */
  total: number
  unverified: number
  lowScore: number
  acceptAll: number
  role: number
  disposable: number
}

/**
 * Visibility for the Hunter HARD GATE: counts due prospects that the gate
 * is currently stranding, broken down by reason. A prospect can appear in
 * more than one reason bucket (e.g. role + accept-all); `total` is distinct
 * clinics. Read-only — never throws (degrades to zeros).
 */
export async function computeGateBlockedBreakdown(): Promise<GateBlockedBreakdown> {
  try {
    const { rows } = await sql<{
      total: number
      unverified: number
      low_score: number
      accept_all: number
      role: number
      disposable: number
    }>`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE verification_score IS NULL)::int AS unverified,
        COUNT(*) FILTER (WHERE verification_score IS NOT NULL AND verification_score < 80)::int AS low_score,
        COUNT(*) FILTER (WHERE COALESCE(verification_accept_all, FALSE) = TRUE)::int AS accept_all,
        COUNT(*) FILTER (WHERE COALESCE(verification_role, FALSE) = TRUE)::int AS role,
        COUNT(*) FILTER (WHERE COALESCE(verification_disposable, FALSE) = TRUE)::int AS disposable
      FROM prospect_clinics pc
      WHERE pc.next_template_slug IS NOT NULL
        AND pc.status NOT IN ('archived', 'lost', 'bounced', 'engaged', 'won', 'engaged-elsewhere', 'replied')
        AND pc.scheduled_send_at IS NOT NULL
        AND pc.scheduled_send_at <= NOW()
        AND NOT (
          pc.verification_score IS NOT NULL
          AND pc.verification_score >= 80
          AND COALESCE(pc.verification_role, FALSE) = FALSE
          AND COALESCE(pc.verification_accept_all, FALSE) = FALSE
          AND COALESCE(pc.verification_disposable, FALSE) = FALSE
        )
    `
    const r = rows[0]
    return {
      total: r?.total ?? 0,
      unverified: r?.unverified ?? 0,
      lowScore: r?.low_score ?? 0,
      acceptAll: r?.accept_all ?? 0,
      role: r?.role ?? 0,
      disposable: r?.disposable ?? 0,
    }
  } catch (err) {
    console.error('[process-scheduled] gateBlocked breakdown failed:', err)
    return { total: 0, unverified: 0, lowScore: 0, acceptAll: 0, role: 0, disposable: 0 }
  }
}
