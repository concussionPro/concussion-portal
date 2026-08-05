/**
 * CRM — Concussion Rehab Mastery — the exercise-physiology course stream.
 *
 * CRM is CCM in every respect (pricing, early-bird, the SHARED practical day,
 * city nomination) EXCEPT the module content and its OWN access entitlement.
 * Deliberately isolated from CCM's `users.access_level`: CRM ownership lives in
 * `course_purchases` (slug below), so a CRM buyer unlocks /ep-course and a CCM
 * buyer never does — watertight per stream. Everything the buyer touches is
 * gated behind CONFIG.FEATURES.ESSA_ACCREDITED until real ESSA approval.
 */
import { CONFIG, isEarlyBirdForLocation, workshopPriceFor } from '@/lib/config'
import { ensureCoursePurchasesTable, userOwnsCourse } from '@/lib/course-purchases'
import { sql } from '@/lib/db'

/** Owns the online CRM course → unlocks /ep-course content. */
export const CRM_COURSE_SLUG = 'crm'
/** Attends the SHARED CCM/CRM practical day (workshop nomination add-on). */
export const CRM_PRACTICAL_SLUG = 'crm-practical'

export type CrmTier = 'online' | 'complete' | 'upgrade'

/** True when this buyer owns the online CRM course (the /ep-course content gate). */
export function userOwnsCrm(email: string): Promise<boolean> {
  return userOwnsCourse(email, CRM_COURSE_SLUG)
}

/** True when this buyer holds a seat at the SHARED CCM/CRM practical day. */
export function userOwnsCrmPractical(email: string): Promise<boolean> {
  return userOwnsCourse(email, CRM_PRACTICAL_SLUG)
}

/**
 * Both CRM entitlements for ONE buyer in ONE query.
 *
 * The session route needs both — `ownsCrm` to admit them to /ep-course at all,
 * `ownsCrmPractical` to know whether the practical day is still an upsell — and
 * it is a hot path. Calling userOwnsCrm + userOwnsCrmPractical would double its
 * round trips.
 *
 * A DB error PROPAGATES, exactly as userOwnsCrm does today — swallowing it
 * would silently render a paying CRM buyer as a non-owner, which is the whole
 * defect class tests/crm-ccm-entitlement-parity.test.ts exists to prevent.
 */
export async function crmEntitlementsFor(
  email: string,
): Promise<{ ownsCrm: boolean; ownsCrmPractical: boolean }> {
  const normalised = email?.trim().toLowerCase()
  if (!normalised) return { ownsCrm: false, ownsCrmPractical: false }
  await ensureCoursePurchasesTable()
  const { rows } = await sql<{ course_slug: string }>`
    SELECT course_slug FROM course_purchases
    WHERE user_email = ${normalised}
      AND course_slug IN (${CRM_COURSE_SLUG}, ${CRM_PRACTICAL_SLUG})
  `
  const slugs = new Set(rows.map((r) => r.course_slug))
  return {
    ownsCrm: slugs.has(CRM_COURSE_SLUG),
    ownsCrmPractical: slugs.has(CRM_PRACTICAL_SLUG),
  }
}

/**
 * What a CRM buyer owns, and WHEN they bought it.
 *
 * The timestamp is not decoration. Every CCM lifecycle lane keys its day
 * counter off `users.created_at` because a CCM purchase creates (or upgrades)
 * the row — the signup IS the purchase. A CRM buyer is usually an existing
 * free-course lead whose row is months old, so the same arithmetic puts them
 * at "day 214" of a 30-day onboarding and they receive nothing. CRM lanes key
 * off `course_purchases.purchased_at` instead.
 */
export interface CrmOwnershipRecord {
  /** ISO purchase time of the online CRM course ('crm'), if owned. */
  crmAt?: string
  /** ISO purchase time of the shared practical-day seat ('crm-practical'), if owned. */
  practicalAt?: string
}

function isoOf(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : String(v)
}

/**
 * Every CRM entitlement in one query, keyed by lowercased email.
 *
 * FAILS CLOSED by contract: returns null on a DB error, and callers must treat
 * null as "can't prove who's paying — don't run the lane" rather than emailing
 * a paying customer a free-course pitch (or silently dropping them from the
 * workshop lanes they've paid for).
 */
export async function crmOwnership(): Promise<Map<string, CrmOwnershipRecord> | null> {
  try {
    await ensureCoursePurchasesTable()
    const { rows } = await sql<{ user_email: string; course_slug: string; purchased_at: Date | string }>`
      SELECT LOWER(user_email) AS user_email, course_slug, purchased_at
      FROM course_purchases
      WHERE course_slug IN (${CRM_COURSE_SLUG}, ${CRM_PRACTICAL_SLUG})
    `
    const map = new Map<string, CrmOwnershipRecord>()
    for (const r of rows) {
      const rec = map.get(r.user_email) ?? {}
      if (r.course_slug === CRM_COURSE_SLUG) rec.crmAt = isoOf(r.purchased_at)
      else rec.practicalAt = isoOf(r.purchased_at)
      map.set(r.user_email, rec)
    }
    return map
  } catch {
    return null
  }
}

/**
 * Emails of every CRM owner, lowercased.
 *
 * A CRM buyer's `users.access_level` stays 'preview' (the streams are isolated),
 * so every query shaped `WHERE access_level = 'preview'` silently scoops up
 * PAYING EP customers as free-course leads — the free-trial conversion cron,
 * lead scoring, SCAT-completer follow-ups, warming pushes. Filter those lanes
 * with this set.
 *
 * FAILS CLOSED-ish by design: on a DB error it returns null, and callers must
 * treat null as "can't prove they're free — skip the funnel" rather than
 * emailing a paying customer a free-course pitch.
 */
export async function crmOwnerEmails(): Promise<Set<string> | null> {
  const owners = await crmOwnership()
  if (!owners) return null
  return new Set([...owners].filter(([, rec]) => rec.crmAt).map(([email]) => email))
}

/**
 * Emails of everyone holding a seat at the SHARED practical day via the CRM
 * side ('crm-practical'), lowercased. Same fail-closed contract as
 * crmOwnerEmails.
 *
 * The workshop keys on `access_level = 'full-course'` everywhere, which a CRM
 * Complete/upgrade buyer never has — so without this set they are invisible to
 * the seat count, the roster, the alumni cohort and every workshop email lane,
 * while still being dunned to buy the seat they already paid for.
 */
export async function crmPracticalOwnerEmails(): Promise<Set<string> | null> {
  const owners = await crmOwnership()
  if (!owners) return null
  return new Set([...owners].filter(([, rec]) => rec.practicalAt).map(([email]) => email))
}

/**
 * CRM price in cents for a tier. IDENTICAL to CCM (owner: "everything identical
 * except the content"), derived from the same CONFIG + early-bird helpers so
 * there is one source of truth:
 *   online   = PRICE_ONLINE ($497)
 *   complete = workshopPriceFor(city)  ($1,190 early-bird / $1,400 final window)
 *   upgrade  = complete − online       ($693 early-bird / $903 final window)
 *
 * NOTE (flagged for Zac): the online→practical UPGRADE works out to $693 early-
 * bird under "identical to CCM", not the $600 mentioned. Reusing the shared
 * function keeps CRM and CCM in lockstep; change here if $600 is intended.
 */
export function crmPriceCents(tier: CrmTier, location?: string | null): number {
  const online = CONFIG.COURSE.PRICE_ONLINE
  const complete = workshopPriceFor(location)
  const dollars = tier === 'online' ? online : tier === 'complete' ? complete : complete - online
  return Math.round(dollars * 100)
}

export function crmIsEarlyBird(location?: string | null): boolean {
  return isEarlyBirdForLocation(location)
}

/**
 * Tax-invoice line description — CRM-specific so it matches the buyer's own tax
 * records (owner: "make sure the invoice is specific for CRM"). Never a shared
 * CCM label.
 */
export function crmInvoiceDescription(tier: CrmTier, location?: string | null): string {
  const city = location ? ` — ${location}` : ''
  switch (tier) {
    case 'online':
      return `Concussion Rehab Mastery (CRM) — Online course · exercise-physiology stream · ${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours · lifetime access`
    case 'complete':
      return `Concussion Rehab Mastery (CRM) — Complete · ${CONFIG.COURSE.ONLINE_CPD_POINTS} online CPD hours + full-day practical workshop${city} · ${CONFIG.COURSE.CRM_TOTAL_CPD_POINTS} CPD hours total`
    case 'upgrade':
      return `Concussion Rehab Mastery (CRM) — Practical Day workshop upgrade${city} · ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} additional CPD hours`
  }
}

/** Product name shown on the Stripe checkout page. */
export function crmProductName(tier: CrmTier, location?: string | null): string {
  const city = location ? ` (${location})` : ''
  switch (tier) {
    case 'online':
      return 'Concussion Rehab Mastery — Online'
    case 'complete':
      return `Concussion Rehab Mastery — Complete${city}`
    case 'upgrade':
      return `Concussion Rehab Mastery — Practical Day Upgrade${city}`
  }
}
