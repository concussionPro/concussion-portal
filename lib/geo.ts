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

/**
 * Explicit market override cookie (`cea_market`).
 *
 * Geo alone is insufficient: an AU/NZ clinician on an overseas VPN (or a
 * traveller checking pricing from abroad) gets bounced to intl/UK/CATA and
 * cannot self-recover. Values: `au` | `intl`. Set via `?market=au` /
 * `?au=1` / `?market=intl` in middleware (cookie wins over cf-ipcountry).
 * Bots never get a cookie from those params in a way that changes crawlable
 * surfaces — middleware still skips geo redirects for bot UAs.
 */
export const MARKET_COOKIE = 'cea_market'
export type MarketOverride = 'au' | 'intl'

export function parseMarketCookie(value: string | undefined | null): MarketOverride | null {
  if (value === 'au' || value === 'intl') return value
  return null
}

/** Read the override from a NextRequest-like cookies bag, or null. */
export function readMarketOverride(
  cookies: { get: (name: string) => { value: string } | undefined },
): MarketOverride | null {
  return parseMarketCookie(cookies.get(MARKET_COOKIE)?.value)
}

/**
 * Should this visitor be treated as overseas for homepage/`/pricing` redirects?
 * Cookie wins: `au` never redirects to intl; `intl` always does (country still
 * picks /uk vs /cata vs /pricing-international). No cookie → cf-ipcountry.
 */
export function shouldTreatAsInternational(
  market: MarketOverride | null,
  country: CountryCode | null,
): boolean {
  if (market === 'au') return false
  if (market === 'intl') return true
  return isInternational(country)
}

/**
 * Should checkout remap `international-online` → AUD `online-only`?
 *
 * Online is sold worldwide (CATA etc.): international visitors must keep the
 * intl SKU and native currency from lib/international-pricing. Remap ONLY when
 * the market is truly AU:
 *   - cea_market=au (explicit override / ?market=au)
 *   - AU geo when the visitor has not opted into intl
 *
 * Do NOT remap on NZ alone (NZD lives on the intl path) or on every session —
 * that forced AUD onto the world. Adaptive Pricing lock for A$ presentment is
 * separate (lib/stripe.ts) and must not depend on this remap.
 */
export function shouldForceAudOnlineSku(
  market: MarketOverride | null,
  country: CountryCode | null,
): boolean {
  if (market === 'intl') return false
  if (market === 'au') return true
  return country === 'AU'
}
