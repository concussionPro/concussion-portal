import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Byron Bay Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Byron Bay. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. Up to 16 CPD hours (8 online + 8 in-person). Byron Bay round forming — register your interest.',
  keywords: 'concussion workshop Byron Bay, SCAT6 training Byron Bay, concussion course Byron Bay, CPD workshop, hands-on concussion training Byron Bay',
  openGraph: {
    title: 'Byron Bay Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Byron Bay. Master SCAT6, VOMS, BESS protocols. Round forming — register your interest.',
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
