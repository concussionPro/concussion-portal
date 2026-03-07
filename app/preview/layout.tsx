import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Course Preview | Explore All 8 Modules Free | ConcussionPro',
  description: 'Preview the full ConcussionPro course structure. Explore all 8 modules covering SCAT6 assessment, concussion phenotyping, return-to-play protocols, vestibular rehabilitation, and medico-legal documentation. Free access to first sections of every module.',
  keywords: 'concussion course preview, concussion management modules, SCAT6 course, concussion phenotyping, return to play protocol course, vestibular rehabilitation concussion, concussion CPD preview',
  openGraph: {
    title: 'Preview ConcussionPro — Explore All 8 Modules Free',
    description: 'Preview the full course structure. SCAT6 assessment, concussion phenotyping, RTP protocols, vestibular rehab, and more.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/preview',
  },
}

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children
}
