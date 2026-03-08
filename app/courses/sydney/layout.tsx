import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sydney Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Sydney. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. 6 AHPRA CPD points. Limited to 12 participants.',
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
