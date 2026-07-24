import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { detectCountry } from '@/lib/geo'
import { intlPriceForCountry } from '@/lib/international-pricing'
import { CONFIG } from '@/lib/config'
import IntlCoursesTabs from '@/components/international/IntlCoursesTabs'

/**
 * /pricing-international — two-stream tabbed international course page (CCM +
 * CRM), mirroring the homepage. Auto-currency: the price is resolved SERVER-SIDE
 * from the visitor country (lib/international-pricing via cf-ipcountry), the same
 * derivation the checkout charges, so display and charge always match (GB → £275).
 *
 * Audience is explicit on each tab (the screening split):
 *   CCM → physiotherapists, osteopaths & chiropractors (they screen/assess)
 *   CRM → exercise physiologists & scientists (rehab-only; they don't screen)
 *
 * CRM tab is gated on CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE — while false the
 * page shows CCM only (same pattern as the homepage gating CRM on ESSA). The CCM
 * checkout (`international-online`) is live now and grants the CCM 8-module course.
 */
export const metadata: Metadata = {
  title: 'Concussion CPD for clinicians worldwide — Concussion Education Australia',
  description:
    'Evidence-based concussion CPD, priced in your local currency. Concussion Clinical Mastery for physiotherapists, osteopaths and chiropractors; Concussion Rehab Mastery for exercise physiologists.',
  alternates: { canonical: '/pricing-international' },
}

export default async function PricingInternationalPage() {
  const price = intlPriceForCountry(detectCountry(await headers()))
  return (
    <IntlCoursesTabs
      price={{ display: price.display, code: price.code }}
      crmLive={CONFIG.FEATURES.CRM_INTERNATIONAL_LIVE}
    />
  )
}
