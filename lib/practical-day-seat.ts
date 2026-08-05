/**
 * ONE signal for "does this account hold a seat at the in-person practical day?"
 *
 * `access_level === 'full-course'` was doing two jobs at once: it opened every
 * paid ONLINE surface AND it meant "owns the practical day". The Clinic Hub
 * Pack broke that equivalence — it sells ONLINE seats only (lib/stripe.ts
 * product description; the in-person day is a separate A$600 add-on,
 * CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE) yet provisions members at
 * 'full-course'. So hub members were badged "Included" on the dashboard, told
 * they held CONFIG.COURSE.TOTAL_CPD_POINTS CPD hours on /learning, had the
 * add-on CTA suppressed, and could self-serve onto the practical-day roster —
 * counting toward CONFIG.WORKSHOP.CONFIRMATION_THRESHOLD and pushing Zac to
 * book a venue for seats that were never sold.
 *
 * Rather than patch each surface, both sides read this. Pure, so the same
 * function serves server routes, SQL-fed rosters and client components.
 *
 * `ownsCrmPractical` is the CRM stream's equivalent: a CRM buyer's CCM
 * access_level stays 'preview' by design but their course_purchases
 * 'crm-practical' row IS a paid seat at the same shared day.
 */
export interface PracticalDaySeatSubject {
  accessLevel?: string | null
  /** true when the account's access came from a Clinic Hub Pack seat */
  hubPackSeat?: boolean | null
  /** CRM stream: owns course_purchases slug 'crm-practical' */
  ownsCrmPractical?: boolean | null
}

/** Does this account hold a PAID seat at the shared in-person practical day? */
export function holdsPracticalDaySeat(subject: PracticalDaySeatSubject): boolean {
  if (subject.ownsCrmPractical) return true
  return subject.accessLevel === 'full-course' && !subject.hubPackSeat
}

/**
 * Does this account hold the paid ONLINE course but NOT the practical day?
 * True for classic online-only buyers AND for Clinic Hub Pack seats — the two
 * groups the A$600 add-on is sold to.
 */
export function holdsOnlineWithoutPracticalDay(subject: PracticalDaySeatSubject): boolean {
  if (subject.ownsCrmPractical) return false
  return (
    subject.accessLevel === 'online-only' ||
    (subject.accessLevel === 'full-course' && Boolean(subject.hubPackSeat))
  )
}
