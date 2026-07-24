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
 */
export const metadata: Metadata = {
  title: 'Concussion Clinical Mastery for Physiotherapists — Online CPD | Concussion Education Australia',
  description:
    'An 8-hour, self-paced online CPD course for physiotherapists: evidence-based concussion assessment and management within scope — SCAT6/VOMS/BESS screening, graded return-to-play, and phenotype-based rehabilitation. Endorsed by Osteopathy Australia.',
  alternates: { canonical: '/uk' },
}

export default async function UkCoursePage() {
  const price = intlPriceForCountry(detectCountry(await headers()))
  return <CcmInternationalContent price={{ display: price.display, code: price.code }} />
}
