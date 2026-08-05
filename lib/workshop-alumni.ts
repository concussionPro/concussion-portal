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
import { CONFIG, roundStartInstant } from '@/lib/config'

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
 * The instant separating "was in the room for the round that ran" from "is
 * waiting for a round that has not run yet", for a city already known to be in
 * completedWorkshopSlugs(). Registrations strictly BEFORE it are alumni.
 *
 *  - A city whose round has already RUN and whose date we know (Melbourne:
 *    status 'completed', dateObj 13 Jun 2026) → the workshop date itself.
 *    Someone who registered after that day cannot have been in the room; they
 *    are a buyer for the NEXT Melbourne round. `status` alone is NOT the
 *    discriminator: a 'completed' city keeps selling (VALID_LOCATIONS in
 *    lib/stripe.ts still accepts 'melbourne' and /in-person still lists it as
 *    "Scheduling Now"), so "completed" never means "no new buyers".
 *  - A city collecting its next round after a past one, with no date yet
 *    (Sydney, Byron Bay) → ROUND_START. That is the SAME boundary
 *    users.practicalDayAttendees() scopes the current round on, so the seat
 *    counter and this classifier cannot disagree about who is in this round.
 *
 * Returns null when neither is known — the caller must then fail safe.
 */
function roundCutoffMs(
  loc: { slug: string; dateObj: Date | null },
  now: Date,
): number | null {
  if (loc.dateObj && loc.dateObj.getTime() < now.getTime()) return loc.dateObj.getTime()
  // 00:00 Australian Eastern on the round-start date. Previously `new
  // Date('YYYY-MM-DD')` = UTC midnight, i.e. 10-11am Sydney — an 11-hour window
  // in which this classifier and the SQL seat counter could disagree about
  // which round a buyer belongs to (SQL resolved the same bare string against
  // the database's own TimeZone). roundStartInstant() is now the single source
  // for BOTH: practicalDayAttendees() sends its explicit-UTC ISO form to
  // Postgres, this reads its milliseconds.
  const roundStart = roundStartInstant(loc.slug)
  if (roundStart) return roundStart.getTime()
  return null
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

  // Round scoping. Every city here is in completedWorkshopSlugs() because a
  // PAST round ran, but all of them keep selling seats for the NEXT one. Without
  // scoping, a clinician who buys a seat for a round that has not happened is
  // instantly classed an alumnus — dropping them from every nurture lane
  // including their own post-purchase onboarding, seat reservation, prep and
  // logistics email. They paid four figures and heard nothing.
  const loc = Object.values(CONFIG.LOCATIONS).find((l) => l.slug === user.workshopLocation)
  const cutoff = loc ? roundCutoffMs(loc, now) : null

  // FAIL SAFE in every unknown: no city, no cutoff, no registration date, or an
  // unparseable one → NOT an alumnus. Wrongly silencing a paying customer's
  // whole lifecycle is unrecoverable; one extra email to a genuine alumnus is
  // not. (This is also what stops a newly-added `hasRunWorkshop` city whose
  // ROUND_START was forgotten from silencing every buyer in it.)
  if (cutoff === null) return false
  if (!user.registeredAt) return false
  const t = new Date(user.registeredAt).getTime()
  if (!Number.isFinite(t)) return false
  // Registered before the round boundary → they were in the room. On/after it
  // → they are waiting for a workshop that has not happened.
  return t < cutoff
}

// Date.now() is fine in app/runtime (only workflow scripts ban it).
function nowSafe(): Date {
  return new Date()
}
