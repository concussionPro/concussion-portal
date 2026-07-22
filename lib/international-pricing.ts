/**
 * International course pricing — the SINGLE source of truth for what an overseas
 * buyer is charged and shown, per market.
 *
 * MODEL (owner decision 2026-07-22): consistent global pricing anchored to the
 * USD list price (CONFIG.COURSE.PRICE_INTERNATIONAL). Each market is charged a
 * FIXED value in its own currency — NOT a live FX conversion — so there is no
 * runtime FX dependency and margins are stable. The values below are honest
 * conversions of the USD anchor, rounded to clean local numbers.
 *
 * Currency is derived SERVER-SIDE from the visitor country (cf-ipcountry via
 * lib/geo.detectCountry) in the checkout route — never from client input — so a
 * buyer cannot select a cheaper currency than their geo. The same functions
 * drive the displayed price so display and charge always match.
 *
 * International = 8 online modules / 8 hours of learning only (overseas buyers
 * cannot attend the in-person workshop, so never 14 CPD hours).
 *
 * To PPP-adjust a market (e.g. discount South Africa for local buying power),
 * change that row's `amount` here — display and charge both follow.
 */
import { CONFIG } from './config'

export interface IntlPrice {
  /** ISO-4217 lowercase, for Stripe `price_data.currency`. */
  currency: string
  /** Whole major units (e.g. 347 = US$347). */
  amount: number
  /** Minor units (cents) for Stripe `price_data.unit_amount`. */
  unitAmount: number
  /** Currency symbol for display. */
  symbol: string
  /** ISO-4217 uppercase code, for display (e.g. "USD"). */
  code: string
  /** Ready-to-render price, e.g. "US$347" or "£275". */
  display: string
}

/** USD anchor = the configured international list price. */
const USD_ANCHOR = CONFIG.COURSE.PRICE_INTERNATIONAL // 347

/**
 * Fixed per-currency list values. USD is the anchor; the rest are clean local
 * conversions of it. Keep these coherent with each other — a buyer comparing
 * markets should see roughly the same real price everywhere.
 */
const CURRENCY_TABLE: Record<string, { currency: string; amount: number; symbol: string; code: string }> = {
  USD: { currency: 'usd', amount: USD_ANCHOR, symbol: 'US$', code: 'USD' },
  GBP: { currency: 'gbp', amount: 275, symbol: '£', code: 'GBP' },
  EUR: { currency: 'eur', amount: 325, symbol: '€', code: 'EUR' },
  CAD: { currency: 'cad', amount: 475, symbol: 'CA$', code: 'CAD' },
  NZD: { currency: 'nzd', amount: 575, symbol: 'NZ$', code: 'NZD' },
  ZAR: { currency: 'zar', amount: 6400, symbol: 'R', code: 'ZAR' },
}

/** Eurozone members (ISO-3166 alpha-2) → EUR. */
const EUROZONE = new Set([
  'AT', 'BE', 'HR', 'CY', 'EE', 'FI', 'FR', 'DE', 'GR', 'IE', 'IT', 'LV',
  'LT', 'LU', 'MT', 'NL', 'PT', 'SK', 'SI', 'ES',
])

/** Country → currency bucket. Anything not listed falls back to USD. */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GB: 'GBP',
  CA: 'CAD',
  NZ: 'NZD',
  ZA: 'ZAR',
}

/** Resolve the pricing currency key for a visitor country (defaults to USD). */
export function intlCurrencyKeyForCountry(country: string | null | undefined): string {
  if (!country) return 'USD'
  const cc = country.trim().toUpperCase()
  if (COUNTRY_TO_CURRENCY[cc]) return COUNTRY_TO_CURRENCY[cc]
  if (EUROZONE.has(cc)) return 'EUR'
  return 'USD'
}

/** The price (currency, amount, display) an overseas buyer in `country` sees and pays. */
export function intlPriceForCountry(country: string | null | undefined): IntlPrice {
  const key = intlCurrencyKeyForCountry(country)
  const row = CURRENCY_TABLE[key] ?? CURRENCY_TABLE.USD
  return {
    currency: row.currency,
    amount: row.amount,
    unitAmount: row.amount * 100,
    symbol: row.symbol,
    code: row.code,
    display: `${row.symbol}${row.amount.toLocaleString('en-US')}`,
  }
}

/** All supported international prices (for a "prices by region" display). */
export function allIntlPrices(): IntlPrice[] {
  return Object.keys(CURRENCY_TABLE).map((key) => {
    const row = CURRENCY_TABLE[key]
    return {
      currency: row.currency,
      amount: row.amount,
      unitAmount: row.amount * 100,
      symbol: row.symbol,
      code: row.code,
      display: `${row.symbol}${row.amount.toLocaleString('en-US')}`,
    }
  })
}
