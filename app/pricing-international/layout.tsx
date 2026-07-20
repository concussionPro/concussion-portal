import { Metadata } from 'next'

// HONESTY: no "CE credits" / accreditation claims — ACSM CECs are pending
// (application in progress) and ESSA is pending. Metadata must not claim either.
export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — International (USD) for Exercise Physiologists',
  description: 'The concussion course that trains exercise physiologists to deliver the consensus-recommended first-line treatment — sub-symptom-threshold aerobic exercise from a measured HR threshold — and ships the tools to do it. USD $347. ACSM CEC application in progress.',
  keywords: 'concussion exercise physiology, sub-symptom threshold aerobic exercise, exercise physiologist concussion, HR threshold concussion rehab, Buffalo test, clinical exercise physiologist CEC, concussion rehabilitation course',
  openGraph: {
    title: 'Concussion Rehab Mastery — International (for Exercise Physiologists)',
    description: 'You already run the exercise test. The consensus just made it the gate to first-line concussion treatment. The EP-scoped course + the tools to deliver it. USD $347.',
    type: 'website',
    url: 'https://portal.concussion-education-australia.com/pricing-international',
  },
  alternates: {
    canonical: 'https://portal.concussion-education-australia.com/pricing-international',
  },
}

export default function PricingInternationalLayout({ children }: { children: React.ReactNode }) {
  return children
}
