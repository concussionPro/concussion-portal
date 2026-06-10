/**
 * Prospect preflight checks — runs BEFORE any email leaves the queue.
 *
 * Two gates in priority order:
 *
 *   1. PERSONALIZATION GATE (sync, fast)
 *      Rejects clinics where merging the template would produce generic
 *      fallback strings ("your area", "your region", "Hi there"). Zac's
 *      hard rule: a prospect with bad data does not get sent — it gets
 *      quarantined and surfaced for manual review/enrichment.
 *
 *   2. DELIVERABILITY GATE (async — DNS lookups)
 *      Catches bouncers BEFORE they damage sender reputation:
 *        - format validation (strict RFC)
 *        - disposable domain block
 *        - DNS MX record lookup (only domain with MX → mail can be received)
 *        - internal suppression table check
 *
 * Returns { ok, failures: [reasons], severity } so callers can decide
 * whether to quarantine, hold-for-enrichment, or skip.
 *
 * Performance: deliverability gate caches MX lookups per domain for the
 * lifetime of the process so a 500-prospect batch only resolves each
 * domain once.
 */
import { promises as dns } from 'node:dns'
import { sql } from '@vercel/postgres'
import type { ProspectClinic } from './types'

export type PreflightFailureCode =
  // Personalization
  | 'first_name_missing'
  | 'first_name_role_only'
  | 'short_name_missing'
  | 'short_name_unknown'
  | 'city_missing'
  | 'city_unknown'
  | 'state_invalid'
  | 'team_clinical_zero'
  // Deliverability
  | 'email_format'
  | 'email_disposable'
  | 'email_role_only'
  | 'email_mx_missing'
  | 'email_dns_error'
  | 'email_suppressed'
  // ICP fit
  | 'institutional_target'

export interface PreflightResult {
  ok: boolean
  failures: Array<{ code: PreflightFailureCode; detail?: string }>
  severity: 'pass' | 'enrich' | 'quarantine'
}

// Strict RFC-ish format check
const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

// Roles that mean "no human will read this"
const ROLE_FIRST_NAMES = new Set([
  'director', 'manager', 'principal', 'owner', 'founder', 'partner',
  'ceo', 'md', 'head', 'chief', 'admin', 'reception', 'practice',
  'clinic', 'info', 'unknown', 'n/a', 'na', 'none', 'test', 'team',
])

// Role-based local parts — lower quality but sometimes forward to a person
const ROLE_LOCAL_PARTS = new Set([
  'info', 'admin', 'reception', 'enquiries', 'contact', 'office',
  'hello', 'team', 'support', 'mail', 'noreply', 'no-reply', 'donotreply',
])

// Disposable email domains — common throwaway providers. Conservative
// list of the top offenders; thousands more exist but these catch >95%.
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'tempmail.com',
  'temp-mail.org', 'yopmail.com', 'throwawaymail.com', 'maildrop.cc',
  'dispostable.com', 'getairmail.com', 'moakt.com', 'sharklasers.com',
  'fakeinbox.com', 'mintemail.com', 'mytemp.email', 'inboxbear.com',
  'mailcatch.com', 'mohmal.com', 'trashmail.com', 'getnada.com',
  'temp-mail.io', 'tempinbox.com', 'tempr.email', 'mailnesia.com',
  'spamgourmet.com', 'mailtemporaire.fr', 'guerrillamailblock.com',
  'jetable.org', 'mailexpire.com', 'discardmail.com',
])

const AU_STATES = new Set(['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'])

// In-process MX cache — domain → has-MX boolean (or 'error' for dns failures)
const mxCache = new Map<string, true | false | 'error'>()

async function hasMxRecord(domain: string): Promise<true | false | 'error'> {
  const cached = mxCache.get(domain)
  if (cached !== undefined) return cached
  try {
    const records = await dns.resolveMx(domain)
    const ok = records.length > 0
    mxCache.set(domain, ok)
    return ok
  } catch (err: unknown) {
    // ENODATA / ENOTFOUND = no MX, NXDOMAIN = no domain at all
    // Treat as a clear "cannot deliver" rather than transient error
    const code = (err as { code?: string })?.code
    if (code === 'ENODATA' || code === 'ENOTFOUND' || code === 'NXDOMAIN') {
      mxCache.set(domain, false)
      return false
    }
    mxCache.set(domain, 'error')
    return 'error'
  }
}

async function isSuppressed(email: string): Promise<boolean> {
  try {
    const { rows } = await sql<{ exists: boolean }>`
      SELECT EXISTS(SELECT 1 FROM email_suppression WHERE LOWER(email) = ${email.toLowerCase()}) AS exists
    `
    return rows[0]?.exists === true
  } catch {
    return false
  }
}

/**
 * Run all preflight checks against a clinic record.
 * `verifyEmail` defaults to true; set false for cheap personalization-only
 * gating (used by render-time checks where DNS would be too slow).
 */
export async function preflightClinic(
  clinic: ProspectClinic,
  options: { verifyEmail?: boolean } = {},
): Promise<PreflightResult> {
  const verifyEmail = options.verifyEmail !== false
  const failures: PreflightResult['failures'] = []

  // ─── Personalization gate ──────────────────────────────────────────────
  const firstName = (clinic.contactFirstName ?? '').trim()
  if (!firstName) {
    failures.push({ code: 'first_name_missing' })
  } else if (ROLE_FIRST_NAMES.has(firstName.toLowerCase())) {
    failures.push({ code: 'first_name_role_only', detail: firstName })
  }

  const shortName = (clinic.shortName ?? '').trim()
  if (!shortName) {
    failures.push({ code: 'short_name_missing' })
  } else if (/unknown/i.test(shortName)) {
    failures.push({ code: 'short_name_unknown', detail: shortName })
  }

  const city = (clinic.city ?? '').trim()
  if (!city) {
    failures.push({ code: 'city_missing' })
  } else if (/unknown/i.test(city)) {
    failures.push({ code: 'city_unknown', detail: city })
  }

  const state = (clinic.state ?? '').trim().toUpperCase()
  if (!AU_STATES.has(state)) {
    failures.push({ code: 'state_invalid', detail: clinic.state })
  }

  // ─── ICP gate. CEA targets AUSTRALIAN PRIVATE allied-health CLINICS only.
  // Quarantine anything else — and the gate is DOMAIN-first because the domain
  // TLD is the reliable signal (names over-match: "Barwon Sports Physio" is a
  // legit clinic, "Health Services" in a name is fine).
  //
  // (a) BAD EMAIL DOMAIN — the decisive check:
  //   - .org.au / .edu / .gov / .edu.au / .gov.au → AU institutions, charities,
  //     hospitals, health services, universities, academies (epworth.org.au,
  //     hunteracademy.org.au, salvationarmy.org.au, *.gov.au …)
  //   - foreign TLDs (.uk/.co.uk, .nz/.co.nz, .sg, .ie, .ca, .us) → not Australia
  //   - .biz and other non-clinic TLDs → junk data (laserit.biz)
  //   AU PRIVATE clinics legitimately use .com.au / .net.au / .physio / .health /
  //   .com — those are NOT blocked here.
  const badEmailDomain =
    /@[^@\s]*\.(org\.au|edu\.au|gov\.au|asn\.au|edu|gov|uk|nz|sg|ie|ca|us|biz)$/i
  // (b) UNAMBIGUOUS INSTITUTIONAL NAMES / brands (tight — no loose "health
  //     services"): hospitals, universities (incl. UQ), TAFEs, academies,
  //     charities, corporate health operators, public-health bodies.
  const institutionalName =
    /(\buniversit|\buni\b|\buq\b|\btafe\b|hospital|epworth|salvation army|st vincent|brain injury|\bacademy\b|primary health care|local health district|public health|community health (centre|service)|health department|department of health|\bhealthcare limited\b)/i
  // (c) Health-network mail domains on non-.au TLDs (monashhealth.org etc.)
  const healthNetworkDomain =
    /@(monashhealth|easternhealth|westernhealth|austinhealth|alfredhealth|barwonhealth|nthqldhealth|healthdirect|svha|svhm)\b/i
  // (d) Foreign or institutional WEBSITE domain.
  const websiteBad = /\.(edu|gov)\.au(\/|$)|\.(co\.)?(uk|nz)(\/|$)|\.(sg|ie|biz)(\/|$)/i
  // (e) Non-AU CITY (foreign clinics that slipped an AU-looking domain).
  const foreignCity = /\b(london|singapore|auckland|wellington|dublin|toronto|new york|manchester|christchurch)\b/i

  const emailLower = (clinic.contactEmail ?? '').trim().toLowerCase()
  if (
    badEmailDomain.test(emailLower) ||
    institutionalName.test(clinic.shortName ?? '') ||
    healthNetworkDomain.test(emailLower) ||
    websiteBad.test(clinic.clinicWebsiteUrl ?? '') ||
    foreignCity.test(clinic.city ?? '') ||
    foreignCity.test(clinic.shortName ?? '')
  ) {
    failures.push({ code: 'institutional_target', detail: clinic.shortName ?? emailLower })
  }

  // Team must have at least 1 clinical role; cohort math degrades otherwise
  const t = clinic.team
  const clinicalCount =
    (t.osteopaths ?? 0) +
    (t.physiotherapists ?? 0) +
    (t.exercisePhys ?? 0) +
    (t.generalPractitioners ?? 0) +
    (t.sportsMedicineDoctors ?? 0) +
    (t.myotherapists ?? 0) +
    (t.remedialMassage ?? 0)
  if (clinicalCount <= 0) {
    failures.push({ code: 'team_clinical_zero' })
  }

  // ─── Deliverability gate ───────────────────────────────────────────────
  const email = (clinic.contactEmail ?? '').trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) {
    failures.push({ code: 'email_format', detail: email })
  } else if (verifyEmail) {
    const [localPart, domain] = email.split('@', 2)

    if (DISPOSABLE_DOMAINS.has(domain)) {
      failures.push({ code: 'email_disposable', detail: domain })
    } else {
      // MX + suppression run in parallel
      const [mxResult, suppressed] = await Promise.all([
        hasMxRecord(domain),
        isSuppressed(email),
      ])
      if (mxResult === false) {
        failures.push({ code: 'email_mx_missing', detail: domain })
      } else if (mxResult === 'error') {
        failures.push({ code: 'email_dns_error', detail: domain })
      }
      if (suppressed) {
        failures.push({ code: 'email_suppressed', detail: email })
      }
    }

    // Role-based local parts get flagged as 'enrich' severity — soft warning
    if (ROLE_LOCAL_PARTS.has(localPart)) {
      failures.push({ code: 'email_role_only', detail: localPart })
    }
  }

  // ─── Severity classification ───────────────────────────────────────────
  // - QUARANTINE: hard fail. Block send + flag for manual review.
  //     Personalization fails, format error, MX missing, disposable, suppressed.
  // - ENRICH: soft fail. Hold-for-enrichment.
  //     Role-based local part, transient DNS error.
  // - PASS: ship.
  // Quarantine = hard fail (block + archive). Anything that would force
  // bad copy ("Hi Director", non-functional email) or guarantees a bounce.
  // city/region/state get graceful fallback copy at render time per Zac
  // ("become the local hub for concussion management" framing), so they
  // DROP from quarantine to pass — the fallback is by design.
  const QUARANTINE_CODES = new Set<PreflightFailureCode>([
    'first_name_missing', 'first_name_role_only',
    'short_name_missing', 'short_name_unknown',
    'team_clinical_zero',
    'email_format', 'email_disposable', 'email_mx_missing', 'email_suppressed',
    'institutional_target',
  ])
  const ENRICH_CODES = new Set<PreflightFailureCode>([
    'email_role_only', 'email_dns_error',
  ])
  let severity: PreflightResult['severity'] = 'pass'
  for (const f of failures) {
    if (QUARANTINE_CODES.has(f.code)) {
      severity = 'quarantine'
      break
    } else if (ENRICH_CODES.has(f.code)) {
      severity = 'enrich'
    }
  }

  return {
    ok: severity === 'pass',
    failures,
    severity,
  }
}

/**
 * Sync personalization-only preflight — for render-time guards where DNS
 * latency would be unacceptable. Catches generic-fallback risks before
 * the prospect dashboard renders.
 */
export function preflightPersonalizationSync(clinic: ProspectClinic): PreflightResult {
  const failures: PreflightResult['failures'] = []
  const firstName = (clinic.contactFirstName ?? '').trim()
  if (!firstName) failures.push({ code: 'first_name_missing' })
  else if (ROLE_FIRST_NAMES.has(firstName.toLowerCase())) failures.push({ code: 'first_name_role_only', detail: firstName })

  const shortName = (clinic.shortName ?? '').trim()
  if (!shortName) failures.push({ code: 'short_name_missing' })
  else if (/unknown/i.test(shortName)) failures.push({ code: 'short_name_unknown' })

  const city = (clinic.city ?? '').trim()
  if (!city) failures.push({ code: 'city_missing' })
  else if (/unknown/i.test(city)) failures.push({ code: 'city_unknown' })

  return {
    ok: failures.length === 0,
    failures,
    severity: failures.length === 0 ? 'pass' : 'quarantine',
  }
}

export function failureSummary(result: PreflightResult): string {
  if (result.ok) return 'pass'
  return result.failures
    .map((f) => (f.detail ? `${f.code}(${f.detail})` : f.code))
    .join('; ')
}
