import type { Metadata } from 'next'
import SstPitch from '@/components/platform/SstPitch'

export const metadata: Metadata = {
  title: 'SST Trainer for ACC concussion services — Concussion Education Australia',
  description:
    'A functional sub-threshold aerobic programme that writes into Gensolve against the ACC45 claim and generates the clause 5.4.7 “reviewed during delivery” evidence automatically.',
  robots: { index: false, follow: false },
}

export default function SstAccPitchPage() {
  return <SstPitch variant="acc" />
}
