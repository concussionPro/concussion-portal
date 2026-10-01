import { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

export const metadata: Metadata = {
  title: 'Byron Bay Concussion Workshop | Hands-On SCAT6 & VOMS Training',
  description: `Full-day hands-on concussion workshop in Byron Bay. Master SCAT6, VOMS, and BESS protocols with expert-led clinical training. Up to ${CONFIG.COURSE.TOTAL_CPD_POINTS} CPD hours (${CONFIG.COURSE.ONLINE_CPD_POINTS} online + ${CONFIG.COURSE.IN_PERSON_CPD_POINTS} in-person). Byron Bay round forming — a refundable deposit holds your place.`,
  keywords: 'concussion workshop Byron Bay, SCAT6 training Byron Bay, concussion course Byron Bay, CPD workshop, hands-on concussion training Byron Bay',
  openGraph: {
    title: 'Byron Bay Concussion Workshop — Hands-On Clinical Training',
    description: 'Full-day hands-on concussion training in Byron Bay. Master SCAT6, VOMS, BESS protocols. Round forming — a refundable deposit holds your place.',
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
