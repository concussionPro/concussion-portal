import type { Metadata } from 'next'
import SstPitch from '@/components/platform/SstPitch'

export const metadata: Metadata = {
  title: 'SST Trainer for ACC concussion services — Concussion Education Australia',
  description:
    'A functional sub-threshold aerobic programme that compiles the ACC884 Client Summary Report ACC expects at service exit — measured outcomes, reviewed across delivery — to transcribe onto ACC’s form and file.',
  robots: { index: false, follow: false },
}

export default function SstAccPitchPage() {
  return <SstPitch variant="acc" />
}
