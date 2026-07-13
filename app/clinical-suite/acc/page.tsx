import type { Metadata } from 'next'
import SstPitch from '@/components/platform/SstPitch'

export const metadata: Metadata = {
  title: 'SST Trainer for ACC concussion services — Concussion Education Australia',
  description:
    'A functional sub-threshold aerobic programme that produces an ACC-ready report with the clause 5.4.7 “reviewed during delivery” evidence built in, to file against the claim.',
  robots: { index: false, follow: false },
}

export default function SstAccPitchPage() {
  return <SstPitch variant="acc" />
}
