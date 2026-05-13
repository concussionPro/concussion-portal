/**
 * Parses Squarespace form-submission notification emails (the ones currently
 * landing in info@concussion-education-australia.com) into structured records
 * we can insert into the workshop_interest table.
 *
 * The Squarespace email format is consistent across forms:
 *
 *   Subject: "New Form Submission - <Form Name>" or similar
 *   Body (plain text):
 *     Sent via form submission from Concussion Education Australia
 *
 *     Name: <full name>
 *     Email: <email>, accepts marketing: true|false
 *     Location: <free text>         (optional, depends on form)
 *     State: <Western Australia|South Australia>  (optional, on combined SA/WA form)
 *
 *     [footer with Manage Submissions / Report Spam links]
 *
 * Routing precedence:
 *   1. Subject form-name match (exact) → city slug
 *   2. State field (combined SA/WA form) → wa | adelaide
 *   3. Location free text contains a known city name → city slug
 *   4. Fail with a diagnostic error so the route handler can email Zac for
 *      manual classification rather than silently dropping the lead.
 */

export type ValidCity = 'sydney' | 'melbourne' | 'byron-bay' | 'adelaide' | 'wa'

const VALID_CITIES: ValidCity[] = ['sydney', 'melbourne', 'byron-bay', 'adelaide', 'wa']

// Form-name (subject) → city slug. Match is case-insensitive on the *normalised*
// form name (lowercased, em-dashes stripped, extra spaces collapsed). The
// special value 'lookup-state' means "this is a combined form, find the State
// field in the body."
const FORM_TO_CITY: Record<string, ValidCity | 'lookup-state'> = {
  sydney: 'sydney',
  'workshop interest sydney': 'sydney',
  'workshop interest - sydney': 'sydney',

  melbourne: 'melbourne',
  'workshop interest melbourne': 'melbourne',
  'workshop interest - melbourne': 'melbourne',

  'byron bay': 'byron-bay',
  byron: 'byron-bay',
  'workshop interest byron bay': 'byron-bay',
  'workshop interest - byron bay': 'byron-bay',
  'workshop interest byron': 'byron-bay',

  wa: 'wa',
  'western australia': 'wa',
  'workshop interest wa': 'wa',
  'workshop interest - western australia': 'wa',

  sa: 'adelaide',
  'south australia': 'adelaide',
  adelaide: 'adelaide',
  'workshop interest sa': 'adelaide',
  'workshop interest - south australia': 'adelaide',
  'workshop interest - adelaide': 'adelaide',

  // Combined form — needs body-field disambiguation
  'sa / wa': 'lookup-state',
  'sa wa': 'lookup-state',
  'workshop interest sa wa': 'lookup-state',
  'workshop interest - sa / wa': 'lookup-state',
}

const STATE_TO_CITY: Record<string, ValidCity> = {
  'western australia': 'wa',
  wa: 'wa',
  'south australia': 'adelaide',
  sa: 'adelaide',
}

// Free-text Location keywords → city. Only unambiguous matches; "North Beach"
// is intentionally absent because it could be WA or NSW.
const LOCATION_KEYWORDS: Array<{ pattern: RegExp; city: ValidCity }> = [
  { pattern: /\bperth\b/i, city: 'wa' },
  { pattern: /\bfremantle\b/i, city: 'wa' },
  { pattern: /\b(western\s+australia|wa)\b/i, city: 'wa' },
  { pattern: /\badelaide\b/i, city: 'adelaide' },
  { pattern: /\b(south\s+australia|sa)\b/i, city: 'adelaide' },
  { pattern: /\bsydney\b/i, city: 'sydney' },
  { pattern: /\bmelbourne\b/i, city: 'melbourne' },
  { pattern: /\bbyron\b/i, city: 'byron-bay' },
]

function normaliseFormName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[–——–]/g, '-') // em/en dashes → hyphen
    .replace(/\s+/g, ' ')
    .trim()
}

function extractSubjectFormName(subject: string): string {
  // Subject patterns Squarespace uses:
  //   "New Form Submission - {Form Name}"
  //   "{Form Name} — New Form Submission"
  //   "Form Submission: {Form Name}"
  //   "{Form Name}" (when admin renamed the notification template)
  const cleaned = subject
    .replace(/^(re|fwd?):\s*/i, '')
    .replace(/new form submission/gi, '')
    .replace(/form submission/gi, '')
    .replace(/concussion education australia/gi, '')
    // strip dangling leading/trailing punctuation left behind (regular, em, en dashes)
    .replace(/^[\s\-—–:]+|[\s\-—–:]+$/g, '')
    .trim()
  return normaliseFormName(cleaned)
}

function extractField(body: string, fieldName: string): string | null {
  // Field appears on its own line as "FieldName: value" — Squarespace emits
  // these inside an HTML table that we receive flattened in the text part.
  // Match the field with case-insensitivity but trim trailing decoration.
  const re = new RegExp(`(?:^|\\n)\\s*${fieldName}\\s*:\\s*([^\\n,]+)`, 'i')
  const m = body.match(re)
  if (!m) return null
  return m[1].trim()
}

function looksLikeValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
}

export interface SquarespaceParseSuccess {
  ok: true
  payload: {
    email: string
    name: string
    city: ValidCity
    source: string
    acceptsMarketing: boolean
    rawLocation?: string
    rawState?: string
  }
}

export interface SquarespaceParseFailure {
  ok: false
  error: string
  diagnostic: {
    subject: string
    formNameNormalised: string
    extractedEmail: string | null
    extractedName: string | null
    extractedState: string | null
    extractedLocation: string | null
  }
}

export type SquarespaceParseResult = SquarespaceParseSuccess | SquarespaceParseFailure

export function parseSquarespaceEmail(args: { subject: string; bodyText: string }): SquarespaceParseResult {
  const { subject, bodyText } = args

  // 1. Form name from subject
  const formNameNormalised = extractSubjectFormName(subject)

  // 2. Extract body fields
  const name = extractField(bodyText, 'Name')
  const rawEmailLine = extractField(bodyText, 'Email')
  const email = rawEmailLine ? rawEmailLine.split(/[,;]/)[0].trim().toLowerCase() : null
  const rawState = extractField(bodyText, 'State')
  const rawLocation = extractField(bodyText, 'Location')

  const acceptsMarketing = /accepts\s+marketing\s*:\s*true/i.test(bodyText)

  // 3. Resolve city
  let city: ValidCity | null = null

  const formCity = FORM_TO_CITY[formNameNormalised]
  if (formCity && formCity !== 'lookup-state') {
    city = formCity
  } else if (formCity === 'lookup-state' && rawState) {
    const stateNorm = normaliseFormName(rawState)
    city = STATE_TO_CITY[stateNorm] ?? null
  }

  if (!city && rawState) {
    const stateNorm = normaliseFormName(rawState)
    city = STATE_TO_CITY[stateNorm] ?? null
  }

  if (!city && rawLocation) {
    for (const { pattern, city: c } of LOCATION_KEYWORDS) {
      if (pattern.test(rawLocation)) {
        city = c
        break
      }
    }
  }

  // 4. Validate and assemble
  const diagnostic = {
    subject,
    formNameNormalised,
    extractedEmail: email,
    extractedName: name,
    extractedState: rawState,
    extractedLocation: rawLocation,
  }

  if (!email || !looksLikeValidEmail(email)) {
    return { ok: false, error: 'No valid email address in body', diagnostic }
  }
  if (!name || name.length < 2) {
    return { ok: false, error: 'No name in body (or shorter than 2 chars)', diagnostic }
  }
  if (!city || !VALID_CITIES.includes(city)) {
    return {
      ok: false,
      error: `Could not resolve city from form name "${formNameNormalised}" / state "${rawState ?? ''}" / location "${rawLocation ?? ''}"`,
      diagnostic,
    }
  }

  return {
    ok: true,
    payload: {
      email,
      name: name.slice(0, 100),
      city,
      source: 'squarespace-email-router',
      acceptsMarketing,
      ...(rawLocation && { rawLocation }),
      ...(rawState && { rawState }),
    },
  }
}
