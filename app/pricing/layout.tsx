import { Metadata } from 'next'

export const metadata: Metadata = {
  // No brand suffix here — the root layout's title template appends
  // "| Concussion Education Australia" (was double-branded before).
  title: 'Pricing — Online & Complete Concussion Course',
  description: 'Enrol in Australia\'s most comprehensive concussion management course. Online course $497 AUD (8 CPD hours) or Complete Course from $1,190 early-bird (16 CPD hours including full-day workshop). AHPRA aligned, endorsed by Osteopathy Australia. For physios, osteos, chiros & GPs.',
  keywords: 'concussion course pricing, concussion CPD course, AHPRA CPD concussion, concussion management training, concussion education australia, osteopathy CPD, physiotherapy CPD concussion, chiropractic CPD, GP concussion training',
  openGraph: {
    title: 'Concussion Education Australia Pricing — Online & Complete Course',
    description: 'Online course $497 AUD (8 CPD hours) or Complete Course from $1,190 early-bird (16 CPD hours). AHPRA aligned.',
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
