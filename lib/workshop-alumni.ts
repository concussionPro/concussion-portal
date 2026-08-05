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
 * Is this user a completed-workshop alumnus (eligible for Level 2 outreach,
 * and suppressed from post-workshop nurture)?
 *
 * `ownsCrmPractical` is the CRM half of the same seat — pass it (from
 * crmPracticalOwnerEmails()) wherever the caller can, or a CRM attendee who sat
 * in the same room stays in the new-buyer nurture forever.
 */
export function isWorkshopAlumnus(
  user: { accessLevel?: string | null; workshopLocation?: string | null; ownsCrmPractical?: boolean },
  now: Date = nowSafe(),
): boolean {
  const heldASeat = user.accessLevel === 'full-course' || user.ownsCrmPractical === true
  if (!heldASeat) return false
  if (!user.workshopLocation) return false
  return completedWorkshopSlugs(now).includes(user.workshopLocation)
}

// Date.now() is fine in app/runtime (only workflow scripts ban it).
function nowSafe(): Date {
  return new Date()
}
