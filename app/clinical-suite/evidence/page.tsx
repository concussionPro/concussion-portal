import type { Metadata } from 'next'
import PlatformEvidencePage from '@/app/platform/evidence/page'

export const metadata: Metadata = {
  title: 'The evidence — SST Trainer | Concussion Education Australia',
  description: 'The research behind measured sub-symptom threshold exercise rehab for concussion: Buffalo protocol, Amsterdam 2023 first-line guidance, and the compliance–recovery link.',
  alternates: { canonical: '/clinical-suite/evidence' },
}

export default function Page() {
  return <PlatformEvidencePage />
}
