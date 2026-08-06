'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { GraduationCap, HeartPulse, ArrowRight } from 'lucide-react'
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

        {/* The chooser — same visual language as the homepage stream cards
            (white card, teal-tinted icon chip, CODE eyebrow, generous radius),
            because that pattern already reads well and users meet it first.

            SELECTED STATE, rebuilt 2026-08-07. The first version tinted the
            active card with bg-accent/[0.07] — 7% opacity — and greyed the
            inactive icon. Owner: "these are not obvious enough or are too
            washed out." Correct: at 7% the two cards were near-identical, so
            the control did not look like a control. Now the active tab carries
            a 2px accent ring, a filled accent icon chip, a lifted shadow and an
            explicit "Viewing" flag; the inactive one stays white with a plain
            border and a tinted-not-grey icon, so it reads as available rather
            than disabled. */}
        <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)] mb-4">
          Two CPD streams — choose yours
        </p>
        <div role="tablist" aria-label="Course stream" className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
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
                  'w-full flex items-center gap-4 rounded-[26px] px-5 py-4 text-left transition-all bg-white',
                  active
                    ? 'border-2 border-[var(--accent)] shadow-lg'
                    : 'border border-[rgba(13,115,119,0.14)] shadow-sm hover:shadow-md hover:border-[var(--accent)]',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex-none w-12 h-12 rounded-full grid place-items-center transition-colors',
                    active ? 'bg-[var(--accent)]' : 'bg-[rgba(13,115,119,0.08)]',
                  ].join(' ')}
                >
                  <Icon className={`w-6 h-6 ${active ? 'text-white' : 'text-[var(--accent)]'}`} strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.14em] text-[var(--accent)]">{s.code}</span>
                    {active && (
                      <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-white bg-[var(--accent)] rounded-full px-2 py-[3px]">
                        Viewing
                      </span>
                    )}
                  </span>
                  <span className="block text-[16px] font-bold leading-tight text-[var(--foreground)]">{s.name}</span>
                  <span className="block text-[12.5px] leading-tight mt-0.5 text-[var(--muted-foreground)]">
                    {s.audience} · {s.endorse}
                  </span>
                </span>
                {!active && <ArrowRight className="w-4 h-4 flex-none text-[var(--accent)]" />}
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
