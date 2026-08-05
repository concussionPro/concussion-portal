import { Metadata } from 'next'
import { CONFIG, workshopPriceFor } from '@/lib/config'

// Prices in the search snippet are the FIRST price a buyer sees. Derived so a
// pricing change can never leave Google advertising a rate we no longer charge.
const ONLINE = CONFIG.COURSE.PRICE_ONLINE
const COMPLETE = workshopPriceFor(null).toLocaleString()

export const metadata: Metadata = {
  // No brand suffix here — the root layout's title template appends
  // "| Concussion Education Australia" (was double-branded before).
  title: 'Pricing — Online & Complete Concussion Course',
  description: `Enrol in Australia's most comprehensive concussion management course. Online course $${ONLINE} AUD (${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours) or Complete Course from $${COMPLETE} early-bird (${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours including full-day workshop). AHPRA aligned, endorsed by Osteopathy Australia. For physios, osteos, chiros & GPs.`,
  keywords: 'concussion course pricing, concussion CPD course, AHPRA CPD concussion, concussion management training, concussion education australia, osteopathy CPD, physiotherapy CPD concussion, chiropractic CPD, GP concussion training',
  openGraph: {
    title: 'Concussion Education Australia Pricing — Online & Complete Course',
    description: `Online course $${ONLINE} AUD (${CONFIG.COURSE.ONLINE_CPD_POINTS} CPD hours) or Complete Course from $${COMPLETE} early-bird (${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours). AHPRA aligned.`,
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/pricing',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
