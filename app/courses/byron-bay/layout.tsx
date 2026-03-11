import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Byron Bay Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Byron Bay. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. 14 AHPRA CPD points (8 online + 6 in-person). Next round Jul-Sep 2026.',
  keywords: 'concussion workshop Byron Bay, SCAT6 training Byron Bay, concussion course Byron Bay, AHPRA CPD workshop, hands-on concussion training, VOMS training',
  openGraph: {
    title: 'Byron Bay Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Byron Bay. Master SCAT6, VOMS, BESS protocols. 14 AHPRA CPD points.',
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
