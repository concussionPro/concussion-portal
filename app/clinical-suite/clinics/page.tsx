import type { Metadata } from 'next'
import SstPitch from '@/components/platform/SstPitch'

export const metadata: Metadata = {
  title: 'SST Trainer for concussion clinics — Concussion Education Australia',
  description:
    'Sub-threshold aerobic concussion rehab, delivered and monitored between visits. Objective home heart-rate data on your dashboard; the GP report generates for you to review and sign.',
  robots: { index: false, follow: false },
}

export default function SstClinicsPitchPage() {
  return <SstPitch variant="clinics" />
}
