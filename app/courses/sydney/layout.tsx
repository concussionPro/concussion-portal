import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sydney Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Sydney. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. 14 AHPRA CPD points (8 online + 6 in-person). Next round Jun-Aug 2026.',
  keywords: 'concussion workshop Sydney, SCAT6 training Sydney, concussion course Sydney, AHPRA CPD workshop, hands-on concussion training Sydney',
  openGraph: {
    title: 'Sydney Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Sydney. Master SCAT6, VOMS, BESS protocols. 6 AHPRA CPD points.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/courses/sydney',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/courses/sydney',
  },
}

export default function SydneyLayout({ children }: { children: React.ReactNode }) {
  return children
}
