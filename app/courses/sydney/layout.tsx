import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sydney Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: 'Full-day hands-on concussion workshop in Sydney. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. Up to 16 CPD hours (8 online + 8 in-person). Sydney round forming — register your interest.',
  keywords: 'concussion workshop Sydney, SCAT6 training Sydney, concussion course Sydney, CPD workshop, hands-on concussion training Sydney',
  openGraph: {
    title: 'Sydney Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Sydney. Master SCAT6, VOMS, BESS protocols. Round forming — register your interest.',
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
