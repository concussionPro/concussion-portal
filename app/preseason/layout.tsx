import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pre-Season Baseline Testing | Concussion Baseline Assessment Tool',
  description: 'Free pre-season concussion baseline testing tool. Establish athlete baselines for SCAT6 assessment, symptom evaluation, and cognitive testing. Essential for sports teams and clinics managing concussion return-to-play protocols.',
  keywords: 'concussion baseline testing, pre-season concussion assessment, SCAT6 baseline, athlete concussion screening, concussion return to play baseline, sports concussion testing',
  openGraph: {
    title: 'Pre-Season Concussion Baseline Testing',
    description: 'Free baseline testing tool for athletes. Establish SCAT6 baselines for accurate concussion assessment and return-to-play decisions.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/preseason',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/preseason',
  },
}

export default function PreseasonLayout({ children }: { children: React.ReactNode }) {
  return children
}
