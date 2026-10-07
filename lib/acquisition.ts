import { sql } from '@/lib/db'

/**
 * Where a customer actually came from, stored on the user record.
 *
 * THE HOLE THIS CLOSES (found 2026-09-30, a year in): `users.signup_source`
 * was the only origin field, and for anyone whose account was created BY the
 * purchase it reads 'purchase' — which records that they paid, not what sent
 * them. That was 12 of 37 paying customers: a third of the customer base with
 * no recorded origin, while the business tried to decide which channels to
 * keep funding.
 *
 * The referrer was never actually lost. `getAttribution()` puts it in the
 * checkout request, `lib/stripe.ts` forwards it as Stripe metadata
 * (attr_first_ref / attr_first_utm), and the webhook already stamps it onto
 * the analytics `purchase_complete` event. It just never reached the user
 * row, so nothing that reports on customers could see it. This module moves
 * it the last inch.
 *
 * Recovered on backfill, it immediately showed osteopathy.org.au as the
 * source of two buyers — including one of the two paid Melbourne seats.
 */

/** Hosts that are us. A visit from our own site is navigation, not an origin. */
const SELF_HOSTS = [
  'concussion-education-australia.com',
  'portal.concussion-education-australia.com',
  'concussionpro.com',
  'checkout.stripe.com',
  'buy.stripe.com',
]

/**
 * Referrer → the thing worth reporting: a bare host, '(direct)' when there
 * was none, or null when it tells us nothing about acquisition (our own
 * pages, the Stripe checkout we sent them to, an unparseable string).
 *
 * Returning null rather than a domain matters — a self-referral recorded as
 * an origin is worse than no origin, because it reads as a real answer.
 */
export function normaliseReferrer(raw?: string | null): string | null {
  if (!raw) return '(direct)'
  let host: string
  try {
    host = new URL(raw).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  if (!host) return null
  if (SELF_HOSTS.some((s) => host === s || host.endsWith('.' + s))) return null
  return host
}

export interface AcquisitionInput {
  referrer?: string | null
  /** First-touch UTM bundle, as captured client-side. */
  utm?: Record<string, string> | null
  /** Landing path, when known. */
  landing?: string | null
  /**
   * Explicit source, used when the origin is known but is not a referring
   * host — e.g. a campaign link whose utm_source survived a hop through the
   * marketing site that would otherwise erase the referrer. Stored verbatim
   * as the source; `referrer` is still kept for the audit trail.
   */
  sourceOverride?: string | null
}

export async function ensureAcquisitionColumns(): Promise<void> {
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_source TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_referrer TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_utm TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_landing TEXT`
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS acquisition_at TIMESTAMPTZ`
}

/**
 * Write-once. First touch wins: a later purchase, login or campaign click
 * must never overwrite the origin that actually won the customer, which is
 * exactly how attribution data rots.
 *
 * Never throws — a lost attribution row is a reporting gap, an exception here
 * would be a failed purchase webhook.
 */
export async function recordAcquisition(
  email: string,
  input: AcquisitionInput,
): Promise<boolean> {
  const source = (input.sourceOverride || '').trim() || normaliseReferrer(input.referrer)
  if (!source) return false
  try {
    await ensureAcquisitionColumns()
    const utm = input.utm && Object.keys(input.utm).length ? JSON.stringify(input.utm) : null
    const { rowCount } = await sql`
      UPDATE users
      SET acquisition_source = ${source},
          acquisition_referrer = ${input.referrer ?? null},
          acquisition_utm = ${utm},
          acquisition_landing = ${input.landing ?? null},
          acquisition_at = NOW()
      WHERE LOWER(email) = ${email.toLowerCase()}
        AND acquisition_source IS NULL
    `
    return (rowCount ?? 0) > 0
  } catch (err) {
    console.error('[acquisition] record failed (non-fatal):', err)
    return false
  }
}

/**
 * Recover origins already sitting in analytics_events but never promoted to
 * the user row. The webhook has been stamping firstReferrer onto
 * purchase_complete since June; this reads it back.
 *
 * Idempotent — only fills rows that are still null.
 */
/**
 * FIRST-TOUCH REPAIR.
 *
 * Reads the origin back out of the person's own analytics events and promotes
 * it onto their user row. Preference order: the converting session's
 * firstReferrer from purchase_complete, then the firstReferrer carried on ANY
 * of their events, then the raw document.referrer of their earliest row
 * (usually one of our own pages, which normalises away).
 *
 * The middle step is the one that matters and was missing. getVisitorContext()
 * stamps firstReferrer onto every client event, so a free signup already
 * carries the origin that won them — but this only ever looked at
 * purchase_complete, and recordAcquisition is otherwise called from exactly
 * one place, the Stripe webhook. So only BUYERS were ever attributed.
 * Measured 2026-10-07: 95% of users created after the one-off 2026-09-30
 * backfill had no acquisition_source, which makes the top of the funnel
 * unanswerable for everyone who has not yet paid.
 *
 * Idempotent: recordAcquisition only writes where acquisition_source IS NULL.
 */
export async function backfillAcquisition(): Promise<{ scanned: number; filled: number }> {
  await ensureAcquisitionColumns()
  const { rows } = await sql`
    SELECT LOWER(u.email) AS email,
           (SELECT e.referrer FROM analytics_events e
             WHERE LOWER(e.user_email) = LOWER(u.email)
               AND e.referrer IS NOT NULL
             ORDER BY e.created_at ASC LIMIT 1) AS ev_referrer,
           -- first-touch from ANY event of theirs; see the note above
           (SELECT e.event_data->>'firstReferrer' FROM analytics_events e
             WHERE LOWER(e.user_email) = LOWER(u.email)
               AND e.event_data->>'firstReferrer' IS NOT NULL
             ORDER BY e.created_at ASC LIMIT 1) AS first_referrer,
           -- the campaign that brought them, when the link carried one
           (SELECT e.event_data->'firstUtm'->>'utm_source' FROM analytics_events e
             WHERE LOWER(e.user_email) = LOWER(u.email)
               AND e.event_data->'firstUtm'->>'utm_source' IS NOT NULL
             ORDER BY e.created_at ASC LIMIT 1) AS first_utm_source,
           -- did we see them at all? distinguishes 'direct' from 'no data'
           (SELECT count(*)::int FROM analytics_events e
             WHERE LOWER(e.user_email) = LOWER(u.email)) AS seen,
           (SELECT e.event_data::text FROM analytics_events e
             WHERE LOWER(e.user_email) = LOWER(u.email)
               AND e.event_type = 'purchase_complete'
             ORDER BY e.created_at ASC LIMIT 1) AS purchase_data
    FROM users u
    WHERE u.acquisition_source IS NULL
  `
  let filled = 0
  for (const r of rows) {
    // The purchase event's own firstReferrer is the better signal: it is the
    // first referrer of the browsing session that converted, not merely the
    // earliest row we happen to hold for the address.
    let ref: string | null = null
    if (r.purchase_data) {
      try {
        const d = JSON.parse(r.purchase_data as string) as Record<string, unknown>
        ref = (d.firstReferrer as string) || (d.referrer as string) || null
      } catch { /* fall through to the event referrer */ }
    }
    // Then the first-touch referrer carried on any of their own events, and
    // only then the raw document.referrer of the earliest row (which is often
    // one of our own pages and normalises away).
    if (!ref) ref = (r.first_referrer as string) || null
    if (!ref) ref = (r.ev_referrer as string) || null

    /**
     * A SELF-HOST FIRST-TOUCH IS NOT "UNKNOWN".
     *
     * normaliseReferrer deliberately returns null for our own domains, so a
     * visitor who landed on the marketing site and clicked through to the
     * portal produced no source at all — 146 of the 172 unattributed users
     * are exactly this shape. The marketing-site hop erases the origin.
     *
     * Two recoveries, in order:
     *  1. the first-touch UTM, when the link that brought them carried one
     *     (this is how the Squarespace and campaign lanes stay attributable
     *     across the hop);
     *  2. failing that, '(direct)' — because we DID observe this person
     *     browsing, and "arrived with no external referrer" is a finding.
     *     Leaving it null conflates a direct visitor with a capture failure,
     *     which is what made the number unreadable in the first place.
     * Someone with no events at all stays null: that is genuinely unknown.
     */
    const seen = Number(r.seen ?? 0)
    const normalised = normaliseReferrer(ref)
    if (!normalised && seen > 0) {
      const utmSource = ((r.first_utm_source as string) || '').trim().slice(0, 60)
      const ok = await recordAcquisition(r.email as string, {
        referrer: ref,
        // '(direct)' when nothing carried them but we did observe the visit.
        sourceOverride: utmSource ? `utm:${utmSource}` : '(direct)',
      })
      if (ok) filled++
      continue
    }
    if (await recordAcquisition(r.email as string, { referrer: ref })) filled++
  }
  return { scanned: rows.length, filled }
}

export interface AcquisitionRow {
  source: string
  buyers: number
  signups: number
}

/** Origins of people who have actually paid, best first. */
export async function acquisitionByRevenue(): Promise<AcquisitionRow[]> {
  await ensureAcquisitionColumns()
  const { rows } = await sql`
    SELECT COALESCE(u.acquisition_source, '(unknown)') AS source,
           COUNT(*) FILTER (
             WHERE u.access_level IN ('full-course', 'online-only')
                OR EXISTS (SELECT 1 FROM course_purchases c
                            WHERE LOWER(c.user_email) = LOWER(u.email)
                              AND c.course_slug NOT LIKE '%secure-seat%')
           )::int AS buyers,
           COUNT(*)::int AS signups
    FROM users u
    WHERE COALESCE(u.is_test, false) = false
    GROUP BY 1
    ORDER BY 2 DESC, 3 DESC
  `
  return rows as unknown as AcquisitionRow[]
}

/** How much of the paying customer base still has no recorded origin. */
export async function unattributedBuyers(): Promise<{ total: number; unattributed: number }> {
  await ensureAcquisitionColumns()
  const { rows } = await sql`
    SELECT COUNT(*)::int AS total,
           COUNT(*) FILTER (WHERE u.acquisition_source IS NULL)::int AS unattributed
    FROM users u
    WHERE COALESCE(u.is_test, false) = false
      AND (u.access_level IN ('full-course', 'online-only')
        OR EXISTS (SELECT 1 FROM course_purchases c
                    WHERE LOWER(c.user_email) = LOWER(u.email)
                      AND c.course_slug NOT LIKE '%secure-seat%'))
  `
  return { total: rows[0]?.total ?? 0, unattributed: rows[0]?.unattributed ?? 0 }
}
