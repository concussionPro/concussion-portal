'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GraduationCap, HeartPulse } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import CcmPricingContent from '@/components/pricing/CcmPricingContent'
import CrmPricingContent from '@/components/crm/CrmPricingContent'
import { CONFIG } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

/**
 * /pricing — TABBED BY STREAM.
 *
 * WHY (owner, 2026-08-07: "a pricing page should clearly show pricing for each
 * stream… why isn't the page tabbed for each stream?").
 *
 * This page sold ONE course. Measured on the live page the same day: the words
 * "Concussion Rehab", "Exercise Physiolog" and "ESSA" appeared NOWHERE on it.
 * An exercise physiologist landing on the page people arrive at to buy saw a
 * physio/osteo course, no sign the ESSA-accredited stream existed, and left.
 *
 * My first two attempts bolted a CRM signpost onto the CCM page — first below
 * the value bento (~60% down, so an EP read the entire CCM pitch before finding
 * out they were on the wrong page), then as a one-line fork. Both were patches
 * on the wrong shape. The page needed to present TWO STREAMS, not one course
 * with a footnote.
 *
 * Both stream bodies already existed and already work — CcmPricingContent and
 * CrmPricingContent each run their own live Stripe checkout on their own pages,
 * and both already accept `hideNav` for exactly this kind of embedding. So this
 * is a chooser over two working components, not a rebuild of a payment flow.
 * The homepage uses the same two-stream pattern; this brings /pricing in line.
 *
 * ?stream=crm deep-links the EP tab, so outreach and the ESSA listing can point
 * straight at it. The tab is reflected in the URL without a navigation, so the
 * back button and a shared link both behave.
 */

type Stream = 'ccm' | 'crm'

const STREAMS: Array<{
  id: Stream
  code: string
  name: string
  audience: string
  icon: typeof GraduationCap
  endorse: string
}> = [
  {
    id: 'ccm',
    code: 'CCM',
    name: 'Concussion Clinical Mastery',
    audience: 'Physios, osteos, chiros & GPs',
    icon: GraduationCap,
    endorse: 'Osteopathy Australia endorsed',
  },
  {
    id: 'crm',
    code: 'CRM',
    name: 'Concussion Rehab Mastery',
    audience: 'Exercise physiologists',
    icon: HeartPulse,
    endorse: CONFIG.FEATURES.ESSA_ACCREDITED ? 'ESSA accredited' : 'Built to ESSA CPD standards',
  },
]

function PricingTabs() {
  const params = useSearchParams()
  const router = useRouter()
  const [stream, setStream] = useState<Stream>('ccm')

  // Deep link support. Read once on mount rather than deriving on every render
  // so switching tabs does not fight the URL.
  useEffect(() => {
    if (params.get('stream') === 'crm') setStream('crm')
  }, [params])

  function choose(next: Stream) {
    if (next === stream) return
    setStream(next)
    trackEvent('pricing_stream_switch', { stream: next })
    // replace, not push — the tab is a view of one page, and pushing would
    // make the back button walk through tab states instead of leaving.
    router.replace(next === 'crm' ? '/pricing?stream=crm' : '/pricing', { scroll: false })
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 pt-[120px] pb-2">
        <div className="text-center mb-5">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Course pricing
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Two streams. Choose the one that matches your registration.
          </p>
        </div>

        {/* The chooser. Both tabs are visible from the first paint — an EP must
            be able to SEE their stream exists without scrolling or guessing. */}
        <div role="tablist" aria-label="Course stream" className="grid sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
          {STREAMS.map((s) => {
            const active = s.id === stream
            const Icon = s.icon
            return (
              <button
                key={s.id}
                role="tab"
                aria-selected={active}
                onClick={() => choose(s.id)}
                className={[
                  'rounded-2xl border p-4 text-left transition-all min-h-[44px]',
                  active
                    ? 'border-accent bg-accent/[0.07] shadow-sm'
                    : 'border-border hover:border-accent/50 bg-transparent',
                ].join(' ')}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      active ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500',
                    ].join(' ')}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold leading-tight ${active ? 'text-foreground' : 'text-slate-600'}`}>
                      {s.name}
                    </p>
                    <p className="text-[12.5px] text-muted-foreground leading-snug mt-0.5">
                      {s.audience} · {s.endorse}
                    </p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* The selected stream's own pricing body, with its own working checkout.
          hideNav because the nav is already rendered above. */}
      {stream === 'ccm' ? <CcmPricingContent hideNav /> : <CrmPricingContent hideNav />}
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={null}>
      <PricingTabs />
    </Suspense>
  )
}
