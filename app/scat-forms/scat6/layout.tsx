import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free SCAT6 Online Form | Auto-Scoring Concussion Assessment',
  description: 'Free digital SCAT6 form with automatic scoring. Complete Sport Concussion Assessment Tool 6th Edition online. Amsterdam 2023 Consensus aligned. No download required.',
  openGraph: {
    title: 'Free SCAT6 Online Form — Auto-Scoring',
    description: 'Complete the SCAT6 concussion assessment online with automatic scoring. Free, no download required.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat-forms/scat6',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/scat-forms/scat6',
  },
}

export default function SCAT6Layout({ children }: { children: React.ReactNode }) {
  return children
}
