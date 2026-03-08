import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCOAT6 Online Form | Office Concussion Assessment Tool',
  description: 'Free digital SCOAT6 form with automatic scoring. Sport Concussion Office Assessment Tool 6th Edition for clinic follow-up visits (Day 3-30). Amsterdam 2023 Consensus aligned.',
  openGraph: {
    title: 'Free SCOAT6 Online Form — Office Assessment',
    description: 'Complete the SCOAT6 office concussion assessment online with automatic scoring. Free, for clinic use Day 3-30.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat-forms/scoat6',
  },
}

export default function SCOAT6Layout({ children }: { children: React.ReactNode }) {
  return children
}
