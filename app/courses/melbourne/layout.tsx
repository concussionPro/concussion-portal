import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Melbourne Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Melbourne. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. Up to 14 CPD hours (8 online + 6 in-person). Melbourne workshop delivered June 2026 — nominate for the next round.',
  keywords: 'concussion workshop Melbourne, SCAT6 training Melbourne, concussion course Melbourne, CPD workshop, hands-on concussion training Melbourne',
  openGraph: {
    title: 'Melbourne Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Melbourne. Master SCAT6, VOMS, BESS protocols. Delivered June 2026 — nominate for the next round.',
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
