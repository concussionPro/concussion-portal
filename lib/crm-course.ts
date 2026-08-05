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
import { userOwnsCourse } from '@/lib/course-purchases'
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
  try {
    const { rows } = await sql<{ user_email: string }>`
      SELECT LOWER(user_email) AS user_email
      FROM course_purchases
      WHERE course_slug = ${CRM_COURSE_SLUG}
    `
    return new Set(rows.map((r) => r.user_email))
  } catch {
    return null
  }
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
