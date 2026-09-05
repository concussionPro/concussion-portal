/**
 * Abandoned-checkout rescue eligibility + course_type labelling.
 *
 * CCM flagship checkouts have always entered rescue. CRM (EP stream) was
 * skipped because early recovery copy named CCM only — with a CRM sequence
 * and a soft email gate on CRM mint, CRM expires with customer_email now
 * enter the same rescue pipeline.
 *
 * Still skipped: SST subscriptions, Hub Pack, short courses, reference book
 * (wrong product / wrong copy).
 */

export type AbandonedCheckoutMetadata = {
  stream?: string
  product?: string
  productType?: string
  courseType?: string
  tier?: string
} | null | undefined

export function isCrmCheckoutMetadata(md: AbandonedCheckoutMetadata): boolean {
  if (!md) return false
  if (md.stream === 'crm') return true
  const pt = md.productType
  return pt === 'crm-course' || pt === 'crm-upgrade'
}

/**
 * True when checkout.session.expired should NOT claim an abandoned_checkouts
 * row or send rescue mail.
 */
export function skipsAbandonedCheckoutRescue(md: AbandonedCheckoutMetadata): boolean {
  if (!md) return false
  // CRM is recoverable (CRM_ABANDONED_CHECKOUT_SEQUENCE).
  if (isCrmCheckoutMetadata(md)) return false
  if (md.product === 'sst-trainer') return true
  if (md.courseType === 'clinic-hub-pack') return true
  const pt = md.productType
  return pt === 'short-course' || pt === 'reference-book' || pt === 'clinic-hub-pack'
}

/** Label stored on abandoned_checkouts.course_type (drives sequence pick). */
export function abandonedCourseTypeFromMetadata(md: AbandonedCheckoutMetadata): string {
  if (isCrmCheckoutMetadata(md)) {
    const tier = md?.tier
    if (tier === 'online' || tier === 'complete' || tier === 'upgrade') {
      return `crm-${tier}`
    }
    if (md?.productType === 'crm-upgrade') return 'crm-upgrade'
    return 'crm-course'
  }
  return md?.courseType || 'unknown'
}

export function isCrmAbandonedCourseType(courseType: string | null | undefined): boolean {
  if (!courseType) return false
  return (
    courseType.startsWith('crm-') ||
    courseType === 'crm-course' ||
    courseType === 'crm-upgrade'
  )
}
