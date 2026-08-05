import { Metadata } from 'next'

// HONESTY: no "CE credits" claims — ACSM CECs are NOT held and the ACSM
// Approved-Provider application is PARKED (2026-08), so "application in
// progress" must not appear anywhere. ESSA accreditation IS held (granted
// 2026-07-24) — state it only via CONFIG.FEATURES.ESSA_ACCREDITED.
export const metadata: Metadata = {
  title: 'Concussion Rehab Mastery — International (USD) for Exercise Physiologists',
  description: 'The concussion course that trains exercise physiologists to deliver the consensus-recommended first-line treatment — sub-symptom-threshold aerobic exercise from a measured HR threshold — and ships the tools to do it. USD $347. ESSA-accredited.',
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
