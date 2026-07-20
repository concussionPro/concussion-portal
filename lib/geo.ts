/**
 * Visitor-country detection — the SINGLE source of truth for geo routing.
 *
 * Order matters. The portal sits behind Cloudflare, which proxies to Vercel, so
 * Vercel's own geo (`x-vercel-ip-country`) reflects CLOUDFLARE'S edge IP, not the
 * visitor — unreliable. Cloudflare's `cf-ipcountry` carries the real visitor
 * country and is preferred. `x-vercel-ip-country` is a last-resort fallback for
 * direct (non-CF) hits. Returns null when nothing is available — callers treat
 * null as "unknown" (do not guess a country).
 */
export type CountryCode = string // ISO-3166 alpha-2, uppercased

const HOME_COUNTRIES = new Set(['AU', 'NZ'])

/** Read the best available visitor country from request headers, or null. */
export function detectCountry(headers: Headers): CountryCode | null {
  const cf = headers.get('cf-ipcountry')?.trim().toUpperCase()
  // 'XX'/'T1' are Cloudflare's unknown/Tor placeholders — treat as no signal.
  if (cf && cf.length === 2 && cf !== 'XX' && cf !== 'T1') return cf
  const vercel = headers.get('x-vercel-ip-country')?.trim().toUpperCase()
  if (vercel && vercel.length === 2) return vercel
  return null
}

/**
 * Should this visitor see international (USD) pricing? Non-AU/NZ → yes. Unknown
 * geo → FALSE for /pricing (keep the AU default + SEO), but the /international
 * entry treats unknown as international (explicit overseas intent). Callers pick
 * the policy; this is the shared "is a known overseas country" test.
 */
export function isInternational(country: CountryCode | null): boolean {
  return country != null && !HOME_COUNTRIES.has(country)
}

export function isHomeCountry(country: CountryCode | null): boolean {
  return country != null && HOME_COUNTRIES.has(country)
}
