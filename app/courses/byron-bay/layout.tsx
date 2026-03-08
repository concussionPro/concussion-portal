import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Byron Bay Concussion Workshop | March 28, 2026 | Hands-On SCAT6 Training',
  description: 'Full-day hands-on concussion workshop in Byron Bay. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. 6 AHPRA CPD points. Limited to 12 participants. March 28, 2026.',
  keywords: 'concussion workshop Byron Bay, SCAT6 training Byron Bay, concussion course Byron Bay, AHPRA CPD workshop, hands-on concussion training, VOMS training',
  openGraph: {
    title: 'Byron Bay Concussion Workshop — March 28, 2026',
    description: 'Full-day hands-on concussion training. Master SCAT6, VOMS, BESS protocols. 6 AHPRA CPD points. Limited spots.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/courses/byron-bay',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/courses/byron-bay',
  },
}

export default function ByronBayLayout({ children }: { children: React.ReactNode }) {
  return children
}
