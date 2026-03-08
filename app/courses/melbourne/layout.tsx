import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Melbourne Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Melbourne. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. 6 AHPRA CPD points. Limited to 12 participants.',
  keywords: 'concussion workshop Melbourne, SCAT6 training Melbourne, concussion course Melbourne, AHPRA CPD workshop, hands-on concussion training Melbourne',
  openGraph: {
    title: 'Melbourne Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Melbourne. Master SCAT6, VOMS, BESS protocols. 6 AHPRA CPD points.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/courses/melbourne',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/courses/melbourne',
  },
}

export default function MelbourneLayout({ children }: { children: React.ReactNode }) {
  return children
}
