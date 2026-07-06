import type { Metadata } from 'next'
import FoundingClinicPage from '@/app/platform/founding/page'

export const metadata: Metadata = {
  title: 'Become a founding clinic — SST Trainer | Concussion Education Australia',
  description: 'Join the founding cohort for the concussion Clinical Testing suite: free through the founding period, your first 3 patients free, and your rate locked for life.',
  alternates: { canonical: '/sst/founding' },
}

export default function Page() {
  return <FoundingClinicPage />
}
