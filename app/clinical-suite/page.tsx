import type { Metadata } from 'next'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { SiteNav } from '@/components/SiteNav'
import { SstSuiteLanding } from '@/components/platform/SstSuiteLanding'

/**
 * /sst — PUBLIC, standalone Clinical Testing landing (SST Trainer + baseline),
 * in the /preseason baseline visual style. Single page, tabbed between the
 * two tools, land on SST. Launches into the founding signup → portal, where
 * the tools are free-trial and course content is purchase-gated. Public and
 * indexable (top-level route, outside the noindex /platform layout).
 */

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-hanken', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-space', display: 'swap' })

export const metadata: Metadata = {
  title: 'SST Trainer + Baseline — concussion Clinical Testing for clinics | Concussion Education Australia',
  description:
    'The Clinical Testing suite for concussion clinics: measured sub-symptom exercise rehab on the patient’s own watch, plus pre-season SCAT6 baseline testing — one licence, first-line care, data and the GP report back to you.',
  alternates: { canonical: '/clinical-suite' },
}

export default function SstLandingPage() {
  return (
    <div
      className={`${hanken.className} ${spaceGrotesk.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      <SiteNav logoHref="/clinical-suite" />
      <SstSuiteLanding />
    </div>
  )
}
