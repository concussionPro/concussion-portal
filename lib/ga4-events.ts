/**
 * Portal event → GA4 recommended event.
 *
 * GA4 has recorded NOTHING but page views since Google Ads was retired: the
 * server-side purchase was gated on the Ads flag and the browser never sent
 * begin_checkout / generate_lead / sign_up at all, so every channel in the
 * acquisition report shows "Key events 0.00" (Zac, 4 Oct 2026: "fix it so we
 * have better data"). This bridge runs in the browser, so each event lands on
 * the session that produced it and attributes to the channel that brought the
 * person (an essa.org.au referral, a tagged email link) — which is the whole
 * point. Pure function; the caller decides whether gtag exists.
 */
export interface Ga4Event {
  name: string
  params: Record<string, string | number | boolean | Array<Record<string, string | number>>>
}

const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const str = (v: unknown): string | undefined => (typeof v === 'string' && v ? v : undefined)

export function ga4EventFor(eventType: string, data: Record<string, unknown> = {}): Ga4Event | null {
  const courseType = str(data.courseType) ?? str(data.tier) ?? 'course'
  const location = str(data.location)
  const item = { item_name: courseType, item_category: location ?? 'online', quantity: 1, ...(num(data.amount) !== undefined ? { price: num(data.amount) as number } : {}) }
  switch (eventType) {
    case 'purchase': {
      const transaction_id = str(data.transactionId) ?? str(data.sessionId) ?? str(data.session_id)
      if (!transaction_id) return null // GA4 dedups purchases on this; never send one without it
      return { name: 'purchase', params: { transaction_id, value: num(data.amount) ?? 0, currency: str(data.currency) ?? 'AUD', items: [item] } }
    }
    case 'checkout_start':
      return { name: 'begin_checkout', params: { currency: str(data.currency) ?? 'AUD', ...(num(data.amount) !== undefined ? { value: num(data.amount) as number } : {}), items: [item], ...(str(data.source) ? { source: str(data.source) as string } : {}) } }
    case 'workshop_interest_submit':
    case 'workshop_pool_join':
    case 'nomination_confirm_click':
      return { name: 'generate_lead', params: { lead_type: eventType, ...(location ? { location } : {}) } }
    case 'free_course_signup':
    case 'exit_popup_signup':
      return { name: 'sign_up', params: { method: str(data.source) ?? eventType } }
    case 'pricing_page':
      return { name: 'view_item_list', params: { item_list_name: 'pricing' } }
    case 'view_workshop_details':
      return { name: 'view_item', params: { items: [item] } }
    case 'talk_cal_open':
      return { name: 'generate_lead', params: { lead_type: 'walkthrough_booking' } }
    default:
      return null
  }
}
