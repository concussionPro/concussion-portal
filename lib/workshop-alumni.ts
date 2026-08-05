/**
 * Workshop alumni (Zac 2026-06-15).
 *
 * Once a workshop date passes, its paid attendees become the warm base for
 * Level 2 / continuing-ed outreach. An attendee is a "completed" alumnus when:
 *   - they held a seat at the SHARED practical day — access_level
 *     'full-course' (CCM) OR the 'crm-practical' entitlement (CRM, whose
 *     access_level stays 'preview' because the streams are isolated), AND
 *   - workshop_location's date has PASSED (status 'completed' OR dateObj < now).
 *
 * Derived automatically — no manual re-tagging. Works for every future workshop
 * the moment its date passes (no code change per round).
 */
import { CONFIG } from '@/lib/config'

/** Location slugs whose workshop has run (completed status OR past dateObj). */
export function completedWorkshopSlugs(now: Date = nowSafe()): string[] {
  return Object.values(CONFIG.LOCATIONS)
    .filter((loc) => {
      if (loc.status === 'completed') return true
      if (loc.dateObj && loc.dateObj.getTime() < now.getTime()) return true
      // A city that has run a PAST round is alumni-eligible even while its
      // `status` is 'collecting' for the next round (Sydney, Byron Bay).
      if ((loc as { hasRunWorkshop?: boolean }).hasRunWorkshop) return true
      return false
    })
    .map((loc) => loc.slug)
}

/**
 * Is this city's CURRENT round still ahead of it?
 *
 * Sydney and Byron Bay have `hasRunWorkshop: true` (a past round ran) while
 * `status: 'collecting'` for the NEXT one. Their slugs are therefore in
 * completedWorkshopSlugs() permanently, so seat-holders for the round that
 * has NOT run yet were being read as alumni. A 'completed' city (Melbourne)
 * is different — the round that just ran IS the current round.
 */
function isCollectingNextRound(loc: { status: string; dateObj: Date | null }, now: Date): boolean {
  if (loc.status === 'completed') return false
  if (loc.dateObj && loc.dateObj.getTime() < now.getTime()) return false
  return true
}

/**
 * Is this user a completed-workshop alumnus (eligible for Level 2 outreach,
 * and suppressed from post-workshop nurture)?
 *
 * `ownsCrmPractical` is the CRM half of the same seat — pass it (from
 * crmPracticalOwnerEmails()) wherever the caller can, or a CRM attendee who sat
 * in the same room stays in the new-buyer nurture forever.
 */
export function isWorkshopAlumnus(
  user: {
    accessLevel?: string | null
    workshopLocation?: string | null
    ownsCrmPractical?: boolean
    /**
     * When they bought their seat (course_purchases.purchased_at, else
     * workshop_location_set_at — i.e. loadWorkshopEnrolmentDates()). Required
     * to tell a past-round attendee from a buyer for the round that has not
     * run yet. Omitted → treated as a CURRENT-round buyer, because wrongly
     * silencing a paying customer's whole lifecycle is far worse than sending
     * one extra email to a genuine alumnus.
     */
    registeredAt?: string | Date | null,
  },
  now: Date = nowSafe(),
): boolean {
  const heldASeat = user.accessLevel === 'full-course' || user.ownsCrmPractical === true
  if (!heldASeat) return false
  if (!user.workshopLocation) return false
  if (!completedWorkshopSlugs(now).includes(user.workshopLocation)) return false

  // Round scoping. Sydney/Byron are permanently in completedWorkshopSlugs()
  // because a PAST round ran, so without this a clinician who buys a seat for
  // the NEXT Sydney round is instantly classed an alumnus — dropping them from
  // every nurture lane including their own post-purchase onboarding, seat
  // reservation, prep and logistics email. They paid and heard nothing.
  const loc = Object.values(CONFIG.LOCATIONS).find((l) => l.slug === user.workshopLocation)
  if (!loc || !isCollectingNextRound(loc, now)) return true

  const roundStart = CONFIG.WORKSHOP.ROUND_START[user.workshopLocation]
  if (!roundStart) return true
  if (!user.registeredAt) return false // unknown date → assume current round
  const t = new Date(user.registeredAt).getTime()
  if (!Number.isFinite(t)) return false
  // Registered on/after the current round opened → they are waiting for a
  // workshop that has not happened. Only earlier buyers are alumni.
  return t < new Date(roundStart).getTime()
}

// Date.now() is fine in app/runtime (only workflow scripts ban it).
function nowSafe(): Date {
  return new Date()
}
