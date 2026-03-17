import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | ConcussionPro — Clinical Concussion Course',
  description: 'The SCAT6-specific clinical concussion course for healthcare professionals worldwide. 8 CE credits, 130+ peer-reviewed references, endorsed by a national medical peak body. USD $347.',
  keywords: 'concussion course, SCAT6 training, concussion CE credits, concussion management course, VOMS training, BESS scoring, concussion certification, clinical concussion education',
  openGraph: {
    title: 'ConcussionPro — The Clinical Concussion Course',
    description: 'Master SCAT6, VOMS and BESS. 8 CE credits, endorsed by Osteopathy Australia. USD $347.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/pricing-international',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/pricing-international',
  },
}

export default function PricingInternationalLayout({ children }: { children: React.ReactNode }) {
  return children
}
