import { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Sydney Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: `Full-day hands-on concussion workshop in Sydney. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. Up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours (${CONFIG.COURSE.ONLINE_CPD_POINTS} online + ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} in-person). Sydney round forming — a refundable deposit holds your place.`,
  keywords: 'concussion workshop Sydney, SCAT6 training Sydney, concussion course Sydney, CPD workshop, hands-on concussion training Sydney',
  openGraph: {
    title: 'Sydney Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Sydney. Master SCAT6, VOMS, BESS protocols. Round forming — a refundable deposit holds your place.',
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
