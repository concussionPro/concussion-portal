import { PROTOCOL_DOI, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import BctcCalculatorClient from '@/app/ep-course/tools/bctt/BctcCalculatorClient'

/**
 * /tools/bctt-calculator — PUBLIC, INDEXABLE clinical calculator.
 *
 * The clinical-moment discovery surface (2026-07-31 "better angle" decision):
 * clinicians don't browse plugin directories, but they DO search "BCTT
 * calculator" / "Buffalo concussion treadmill test protocol" mid-consult.
 * This page serves that moment for free and routes the highest-intent
 * clinician traffic that exists to the SST clinician demo.
 *
 * The calculator component is shared with the EP-course tools page (gated
 * there as a course convenience; public here as the funnel).
 */
export const metadata: Metadata = {
  title: 'BCTT Calculator — Buffalo Concussion Treadmill Test threshold & prescription | Free clinical tool',
  description:
    'Free Buffalo Concussion Treadmill/Bike Test (BCTT) calculator for clinicians: record stage heart rates and symptom scores, apply the ≥3-point termination rule, and derive the sub-symptom-threshold heart-rate prescription (80–90% HRt) per the published protocol.',
  alternates: { canonical: '/tools/bctt-calculator' },
}

export default function PublicBcttCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pb-16 pt-[120px]">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Buffalo Concussion Treadmill Test calculator
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Record stage heart rates and symptom scores, apply the standard termination rules
            (≥3-point symptom exacerbation or exhaustion), and derive the heart-rate threshold
            and sub-symptom-threshold prescription. Free for clinical use — no account.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Method per the published protocol:{' '}
            <a href={PROTOCOL_DOI_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
              {PROTOCOL_DOI}
            </a>{' '}
            · decision support only — the treating clinician owns all clinical decisions
          </p>
        </div>

        <BctcCalculatorClient />

        <div className="mt-10 rounded-2xl border border-teal-200 bg-teal-50/50 p-6 text-center">
          <p className="text-sm font-bold text-foreground mb-1.5">
            Prescribing from this number? The delivery is the hard part.
          </p>
          <p className="text-[13.5px] text-muted-foreground max-w-xl mx-auto mb-4">
            SST Trainer runs this test app-guided, then delivers the prescription on the
            patient&rsquo;s own watch — every home session verified live, trajectory on your
            dashboard, GP and return-to-play reports rendered from the episode.
          </p>
          <Link href="/clinics" className="btn-primary inline-flex items-center px-6 py-2.5 rounded-xl font-semibold text-sm">
            See it live — no login
          </Link>
        </div>
      </div>
    </div>
  )
}
