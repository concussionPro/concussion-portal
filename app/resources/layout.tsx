import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Clinical Resources | Concussion Assessment Tools',
  description: 'Download free concussion clinical resources: SCAT6 cheat sheet, PCS flowchart, return-to-play ladder, patient education handouts. AHPRA-aligned tools for Australian clinicians.',
  keywords: 'concussion clinical resources, SCAT6 cheat sheet, PCS flowchart, return to play protocol, concussion patient handout, free concussion tools, concussion assessment resources',
  openGraph: {
    title: 'Free Concussion Clinical Resources',
    description: 'Professional concussion assessment tools for your clinic. SCAT6 cheat sheets, PCS flowcharts, return-to-play protocols.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/resources',
  },
}

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children
}
