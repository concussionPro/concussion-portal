import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | ConcussionPro Online & Full Course',
  description: 'Enrol in Australia\'s most comprehensive concussion management course. Online course from $497 AUD (8 CPD points) or Complete Course from $1,190 AUD (14 CPD points including full-day workshop). AHPRA aligned, endorsed by Osteopathy Australia. For physios, osteos, chiros & GPs.',
  keywords: 'concussion course pricing, concussion CPD course, AHPRA CPD concussion, concussion management training, concussion education australia, osteopathy CPD, physiotherapy CPD concussion, chiropractic CPD, GP concussion training',
  openGraph: {
    title: 'ConcussionPro Pricing — Online & Full Course',
    description: 'Online course from $497 AUD (8 CPD points) or Complete Course from $1,190 AUD (14 CPD points). AHPRA aligned.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/pricing',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/pricing',
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
