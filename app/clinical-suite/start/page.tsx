import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SstTrialStartPage } from './start-client'

export const metadata: Metadata = {
  title: 'Start your free SST Trainer trial — Concussion Education Australia',
  description:
    'Set up your clinic in two minutes: get a clinic code, run heart-rate-based sub-symptom threshold concussion rehab with your first 3 patients free, and file reports to your practice software.',
}

export default function Page() {
  return (
    <Suspense>
      <SstTrialStartPage />
    </Suspense>
  )
}
