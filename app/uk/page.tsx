import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { detectCountry } from '@/lib/geo'
import { intlPriceForCountry } from '@/lib/international-pricing'
import UkCourseContent from '@/components/uk/UkCourseContent'

/**
 * /uk — UK-facing landing for Concussion Clinical Mastery (CCM), the physio
 * course. Target audience = UK physiotherapists (CSP), reached via the CSP
 * course-advert channel.
 *
 * WHY A DEDICATED PAGE: /pricing shows AUD (wrong currency for a UK physio) and
 * /pricing-international is CRM-branded (wrong course — that's the EP stream).
 * This page shows CCM in GBP and routes to the `international-online` checkout,
 * which grants `online-only` access = the CCM 8-module course (verified in
 * lib/stripe.ts COURSE_ACCESS_MAP). Price + charge both come from
 * lib/international-pricing (GB → £275), so display and charge always match.
 *
 * SCOPE (HCPC): copy frames CCM as clinical ASSESSMENT & MANAGEMENT within
 * physiotherapy scope — screening (SCAT6, VOMS, BESS), graded return-to-play,
 * phenotype rehab — with red-flag referral to medical for diagnosis/clearance.
 * Physios screen and assess (which EPs do not), so CCM — not CRM — is theirs.
 */
export const metadata: Metadata = {
  title: 'Concussion Clinical Mastery for Physiotherapists — Online CPD | Concussion Education Australia',
  description:
    'An 8-hour, self-paced online CPD course for physiotherapists: evidence-based concussion assessment and management within scope — SCAT6/VOMS/BESS screening, graded return-to-play, and phenotype-based rehabilitation. Endorsed by Osteopathy Australia.',
  alternates: { canonical: '/uk' },
}

export default async function UkCoursePage() {
  const price = intlPriceForCountry(detectCountry(await headers()))
  return <UkCourseContent price={{ display: price.display, code: price.code }} />
}
