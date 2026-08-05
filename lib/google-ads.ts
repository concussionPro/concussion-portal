/**
 * Google Ads — RETIRED CHANNEL. One switch for the whole thing.
 *
 * There is no live ad spend (CLAUDE.md goal #1: acquisition without paid ads;
 * cold outreach is the channel). Until 2026-08 the portal still: loaded
 * gtag.js under the AW- conversion ID on EVERY page, configured the Ads tag,
 * fired remarketing audience events on 8 routes, fired an enrol-click
 * conversion, and posted server-side purchase conversions from the Stripe
 * webhook — i.e. a third-party advertising tag on every page of a YMYL
 * healthcare site, with no consent gate, feeding a channel nobody is buying.
 *
 * What this flag does NOT touch:
 *   - the custom Postgres event store (/api/analytics/track → analytics_events),
 *     which is the analytics Zac actually reads. Untouched, always on.
 *   - GA4 measurement (G-LRDRZBWJ2E). gtag.js still loads under the GA4 id and
 *     gtag('config', GA4_MEASUREMENT_ID) still runs, so page_view / login /
 *     scroll_depth measurement is intact. Only the ADVERTISING half is off.
 *
 * To resume ad spend: set NEXT_PUBLIC_GOOGLE_ADS_LIVE=true in Vercel and
 * redeploy (it is inlined at build time, so a redeploy is required). That
 * restores the AW- tag load, the Ads config line, remarketing audiences and
 * every conversion hit — nothing was deleted. The Google Ads conversion labels
 * live in lib/analytics.ts as before.
 *
 * NOTE for a future resume: next.config.ts's CSP still allows
 * googleadservices/doubleclick, so flipping the flag needs no CSP change.
 */

/** Ads conversion account. Public — it ships in client JS whenever it is used. */
export const GOOGLE_ADS_ID = 'AW-17984048021'

/** GA4 measurement property — analytics, NOT advertising. Always loaded. */
export const GA4_MEASUREMENT_ID = 'G-LRDRZBWJ2E'

/**
 * Is the retired Google Ads channel switched back on? Default FALSE.
 * Read as a literal (not via a helper) so Next can inline it in client bundles.
 */
export const GOOGLE_ADS_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ADS_LIVE === 'true'
