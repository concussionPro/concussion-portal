import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Concussion Management Course | 14 CPD Hours | Online + Practical',
  description: 'Australia\'s most comprehensive concussion management course. 8 online modules (8 CPD hours) plus full-day hands-on workshop (6 CPD hours). AHPRA aligned, endorsed by Osteopathy Australia. Evidence-based training for physiotherapists, osteopaths, chiropractors, and GPs.',
  keywords: 'concussion management course, concussion CPD australia, AHPRA concussion course, osteopathy concussion training, physiotherapy concussion CPD, chiropractic CPD, GP concussion training, concussion education australia, evidence-based concussion management',
  openGraph: {
    title: 'Concussion Management Course — 14 CPD Hours',
    description: '8 online modules + full-day workshop. AHPRA aligned, endorsed by Osteopathy Australia. For physiotherapists, osteopaths, and GPs.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/course',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/course',
  },
}

export default function CourseLayout({ children }: { children: React.ReactNode }) {
  return children
}
