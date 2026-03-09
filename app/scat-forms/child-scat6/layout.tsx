import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Child SCAT6 Online Form | Auto-Scoring Concussion Assessment for Children',
  description: 'Free digital Child SCAT6 form with automatic scoring. Sport Concussion Assessment Tool for children aged 5-12. Amsterdam 2023 Consensus aligned.',
  openGraph: {
    title: 'Free Child SCAT6 Online Form — Auto-Scoring',
    description: 'Complete the Child SCAT6 concussion assessment online with automatic scoring for ages 5-12. Free, no download required.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/scat-forms/child-scat6',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/scat-forms/child-scat6',
  },
}

export default function ChildSCAT6Layout({ children }: { children: React.ReactNode }) {
  return children
}
