import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { detectCountry } from '@/lib/geo'
import { intlPriceForCountry } from '@/lib/international-pricing'
import CcmInternationalContent from '@/components/ccm/CcmInternationalContent'

/**
 * /uk — UK-facing landing for Concussion Clinical Mastery (CCM), the physio
 * course, reached via the CSP course-advert channel. Reuses the shared
 * CcmInternationalContent (the international landing structure) — NOT a bespoke
 * page. Auto-currency (GB → £275), international-online checkout grants the CCM
 * 8-module course.
 *
 * heroFlow + priceFirst (2026-09-24 weekday pass): analytics money-path exits
 * on /uk (8 visitors in 14d) + lander 10 entries / 8 bounce. Live smoke still
 * showed hero CTA "Enrol — see options" (#pricing-cards) with the checkout
 * card buried under the training photo — same fold bug /cata fixed Sep 22.
 */
export const metadata: Metadata = {
  title: 'Concussion Clinical Mastery for Physiotherapists — Online CPD | Concussion Education Australia',
  description:
    'An 8-hour, self-paced online CPD course for physiotherapists: evidence-based concussion assessment and management within scope — SCAT6/VOMS/BESS screening, graded return-to-play, and phenotype-based rehabilitation. Endorsed by Osteopathy Australia.',
  alternates: { canonical: '/uk' },
}

export default async function UkCoursePage() {
  const price = intlPriceForCountry(detectCountry(await headers()))
  return (
    <CcmInternationalContent
      price={{ display: price.display, code: price.code }}
      uk
      audience={{
        heroFlow: true,
        priceFirst: true,
        heroBlurb:
          'Online concussion CPD for UK physiotherapists — 8 modules, start anytime, priced in GBP. Diagnosis and red-flag clearance stay with medical; you own screening, management and rehab.',
      }}
    />
  )
}
