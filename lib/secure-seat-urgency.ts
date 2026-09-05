/**
 * Honest Unlock-your-seat urgency — real cohort progress only.
 *
 * TODAY (owner 2026-09-05): run a practical day ONLY when demand is met
 * (CONFIRMATION_THRESHOLD = 12 paid commits). Money before calendar.
 * Do NOT market a fixed monthly/quarterly calendar — that is aspiration, not
 * current ops. Never invent seat counts or fake dates.
 *
 * Revenue shape:
 *  - Online is the front door ($0 opex) — never bury Online enrol
 *  - MOST Online buyers should upgrade → practical via Unlock your seat
 *  - Urgency aimed at Online owners + date-waiters unlocking {City} at 12
 */

export type SecureSeatProgressInput = {
  /** City display name, e.g. "Melbourne". */
  cityLabel: string
  /** Paid commits counting toward the gate (enrolled from city-progress). */
  enrolled?: number | null
  /** Usually 12 — CONFIRMATION_THRESHOLD. */
  threshold?: number | null
  /** True when city-progress returned a real row for this city. */
  progressKnown?: boolean
  /** Deposit amount for CTA suffix (default 100). */
  priceAud?: number
  /** Prefer upgrade framing when the visitor already owns Online. */
  forOnlineUpgrade?: boolean
}

export type SecureSeatUrgency = {
  headline: string
  headlineShort: string
  ctaLabel: string
  /** Progress / scarcity line — null when we must not invent a number. */
  progressLine: string | null
  socialLine: string
  body: string
}

/** When remaining seats ≤ this, use stronger “Only X left” copy (n ≥ 9 at threshold 12). */
const HIGH_URGENCY_REMAINING = 3

export function buildSecureSeatUrgency(input: SecureSeatProgressInput): SecureSeatUrgency {
  const city = (input.cityLabel || 'your city').trim() || 'your city'
  const threshold =
    typeof input.threshold === 'number' && input.threshold > 0 ? input.threshold : 12
  const price = typeof input.priceAud === 'number' && input.priceAud > 0 ? input.priceAud : 100
  const enrolled =
    typeof input.enrolled === 'number' && Number.isFinite(input.enrolled) && input.enrolled >= 0
      ? Math.floor(input.enrolled)
      : null
  const progressKnown = Boolean(input.progressKnown) && enrolled !== null
  const upgrade = Boolean(input.forOnlineUpgrade)

  const headline = upgrade
    ? `Unlock your seat in ${city} — add the catered day`
    : `Unlock next course access in ${city}`
  const headlineShort = `Unlock your seat in ${city}`
  const ctaLabel = `Unlock your seat — A$${price}`

  let progressLine: string | null = null
  if (progressKnown && enrolled !== null) {
    const remaining = Math.max(threshold - enrolled, 0)
    if (enrolled <= 0 || enrolled < 5) {
      progressLine = `Be one of the first ${threshold} in ${city} — your deposit unlocks the practical day when the cohort fills`
    } else if (remaining > 0 && remaining <= HIGH_URGENCY_REMAINING) {
      progressLine = `Only ${remaining} seat${remaining === 1 ? '' : 's'} left to unlock ${city}`
    } else {
      progressLine = `${enrolled} of ${threshold} seats secured in ${city} — unlock yours to open the date`
    }
  }

  const socialLine =
    'Clinicians secure seats to open the catered day — the date opens at ' +
    String(threshold) +
    ' paid commits. Money before calendar · no fake dates.'

  const body = upgrade
    ? `You have Online — next step is the hands-on day. Put A$${price} down for ${city}. It counts toward the ${threshold}-seat gate that opens the date; credit toward Complete when it does; full refund if the cohort does not form.`
    : progressKnown && enrolled !== null && enrolled > 0
      ? `Put A$${price} down for ${city}. It counts toward the ${threshold}-seat demand gate that opens the date. Credit toward Complete when the date opens; full refund if the cohort does not form. Online modules stay a separate enrol.`
      : `Put A$${price} down for ${city}. Be among the clinicians who unlock the practical day when ${threshold} seats fill. Credit toward Complete when the date opens; full refund if it does not. Prefer modules first? Enrol Online, then unlock your seat.`

  return { headline, headlineShort, ctaLabel, progressLine, socialLine, body }
}

/** Prefer confirmed/live city, else highest enrolled collecting city, else melbourne. */
export function pickFocusCitySlug(
  rows: CityProgressRow[],
  fallback: string = 'melbourne',
): string {
  if (!rows.length) return fallback
  const live = rows.find((r) => r.hasLiveDate)
  if (live?.slug) return live.slug
  const ranked = [...rows].sort((a, b) => (b.enrolled ?? 0) - (a.enrolled ?? 0))
  return ranked[0]?.slug || fallback
}

export type CityProgressRow = {
  slug: string
  label?: string
  enrolled: number
  threshold: number
  interested?: number
  hasLiveDate?: boolean
  date?: string | null
}

let cityProgressPromise: Promise<CityProgressRow[]> | null = null

export function fetchCityProgressRows(): Promise<CityProgressRow[]> {
  if (typeof window === 'undefined') return Promise.resolve([])
  if (!cityProgressPromise) {
    cityProgressPromise = fetch('/api/city-progress')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) =>
        data && Array.isArray(data.cities) ? (data.cities as CityProgressRow[]) : [],
      )
      .catch(() => [])
  }
  return cityProgressPromise
}
