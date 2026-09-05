/**
 * Hub Pack add-ons (extra seats / workshop upgrade) have no Stripe webhook
 * fulfilment yet — charging would take money and deliver nothing. Until that
 * lands, both checkout entry points return this contact payload so the UI can
 * open mailto or Cal instead of a dead-end error.
 */
export const HUB_ADDON_CAL_URL = 'https://cal.com/zac-lewis-so8zjs/30min'
export const HUB_ADDON_EMAIL = 'zac@concussion-education-australia.com'

export type HubAddonCourseType = 'clinic-hub-extra-seat' | 'clinic-workshop-upgrade'

export function hubAddonContact(courseType: HubAddonCourseType) {
  const isSeats = courseType === 'clinic-hub-extra-seat'
  const subject = isSeats
    ? 'Hub Pack — add clinician seats'
    : 'Hub Pack — add workshop places'
  const body = isSeats
    ? "Hi Zac,\n\nI'd like to add extra clinician seats to our Hub Pack.\n\nNumber of extra seats: \nClinic / key (if known): \n"
    : "Hi Zac,\n\nI'd like to add workshop places to our Hub Pack.\n\nNumber of clinicians: \nPreferred city: \nClinic / key (if known): \n"
  const message = isSeats
    ? 'Extra Hub Pack seats are arranged directly — email Zac or book a 30-min call and we’ll invoice you.'
    : 'Hub Pack workshop places are arranged directly — email Zac or book a 30-min call and we’ll invoice you.'
  return {
    error: 'This add-on is arranged by email or call (self-serve checkout not live yet).',
    action: 'contact' as const,
    mailto: `mailto:${HUB_ADDON_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    calUrl: HUB_ADDON_CAL_URL,
    message,
  }
}
