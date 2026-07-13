import type { Metadata } from 'next'
import SstPitch from '@/components/platform/SstPitch'

export const metadata: Metadata = {
  title: 'Concussion resource for Guild — via Osteopathy Australia',
  description:
    'An Osteopathy Australia–endorsed concussion CPD and RiskHQ risk-management resource, with a clinician-directed, documented audit trail for defensible concussion decisions.',
  robots: { index: false, follow: false },
}

export default function SstGuildPitchPage() {
  return <SstPitch variant="guild" />
}
