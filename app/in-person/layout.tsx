import { Metadata } from 'next'
import { CONFIG } from '@/lib/config'

const PRACTICAL_CPD = CONFIG.COURSE.IN_PERSON_CPD_POINTS
const SEATS = CONFIG.WORKSHOP.CAPACITY_PER_COURSE

export const metadata: Metadata = {
  title: `In-Person Concussion Workshop | Hands-On Clinical Training | ${PRACTICAL_CPD} CPD Hours`,
  description: `Full-day hands-on concussion workshop. Master SCAT6 administration, VOMS testing, BESS protocols, and vestibular assessment. ${PRACTICAL_CPD} AHPRA CPD hours. Limited to ${SEATS} participants. Sydney, Melbourne.`,
  keywords: 'concussion workshop australia, hands-on concussion training, SCAT6 workshop, VOMS training, concussion practical course, AHPRA CPD workshop, concussion assessment training, physiotherapy workshop concussion',
  openGraph: {
    title: 'In-Person Concussion Workshop — Hands-On Clinical Training',
    description: `Full-day hands-on workshop. Master SCAT6, VOMS, BESS protocols. ${PRACTICAL_CPD} AHPRA CPD hours. Limited to ${SEATS} participants.`,
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/in-person',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/in-person',
  },
}

export default function InPersonLayout({ children }: { children: React.ReactNode }) {
  return children
}
