import type { Metadata } from 'next'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { SiteNav } from '@/components/SiteNav'
import { SstSuiteLanding } from '@/components/platform/SstSuiteLanding'

/**
 * /clinical-suite/baseline — STANDALONE Baseline Testing landing (owner
 * 2026-07-06: each tool "must be a standalone page", not a tab that duplicates
 * the other's below-fold). Same shell as the SST page; the top toggle links
 * back to /clinical-suite. Combined pricing shows on both.
 */

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], variable: '--font-hanken', display: 'swap' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-space', display: 'swap' })

export const metadata: Metadata = {
  title: 'Pre-season concussion baseline testing for clinics | Concussion Education Australia',
  description:
    'One club link sends every athlete a self-administered SCAT6 pre-season baseline — done in ~5 minutes on any computer, a PDF report to your clinic inbox. Be the clinic holding the baseline when an injury happens mid-season.',
  alternates: { canonical: '/clinical-suite/baseline' },
}

export default function BaselineLandingPage() {
  return (
    <div
      className={`${hanken.className} ${spaceGrotesk.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      <SiteNav logoHref="/clinical-suite" />
      <SstSuiteLanding tool="baseline" />
    </div>
  )
}
