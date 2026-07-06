import type { Metadata } from 'next'
import PlatformPricingPage from '@/app/platform/pricing/page'

export const metadata: Metadata = {
  title: 'Pricing — SST Trainer + Baseline | Concussion Education Australia',
  description: 'One licence for both concussion Clinical Testing tools: Single A$49, Small clinic (≤5) A$99, Enterprise (≤15) A$149 per month. Free through the founding period.',
  alternates: { canonical: '/clinical-suite/pricing' },
}

export default function Page() {
  return <PlatformPricingPage />
}
