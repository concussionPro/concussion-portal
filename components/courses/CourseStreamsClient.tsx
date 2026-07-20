'use client'

import { useState } from 'react'
import Link from 'next/link'
import { GraduationCap, HeartPulse } from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import CcmPricingContent from '@/components/pricing/CcmPricingContent'
import CrmPricingContent from '@/components/crm/CrmPricingContent'
import { trackEvent } from '@/lib/analytics'

/**
 * Dual-stream courses page. One shared nav, a large stream toggle, and the two
 * EXISTING landing bodies rendered as-is (hideNav so the toggle owns the nav):
 *  - CCM (Concussion Clinical Mastery) — allied health / clinical → /pricing body
 *  - CRM (Concussion Rehab Mastery)   — exercise physiology / ESSA → CRM body
 * Same design as each stream's own landing; the toggle just switches which one
 * you're reading. ESSA claims stay truth-gated inside CrmPricingContent.
 */

type Stream = 'ccm' | 'crm'

const STREAMS: Array<{ id: Stream; code: string; name: string; audience: string; icon: typeof GraduationCap }> = [
  { id: 'ccm', code: 'CCM', name: 'Concussion Clinical Mastery', audience: 'Physiotherapists & allied health', icon: GraduationCap },
  { id: 'crm', code: 'CRM', name: 'Concussion Rehab Mastery', audience: 'Exercise physiologists', icon: HeartPulse },
]

export default function CourseStreamsClient({ initial = 'ccm' }: { initial?: Stream }) {
  const [stream, setStream] = useState<Stream>(initial)

  const select = (id: Stream) => {
    if (id === stream) return
    setStream(id)
    trackEvent('course_stream_toggle', { stream: id })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <SiteNav />

      {/* ── Stream toggle — large, standalone (not attached to the top bar) ── */}
      <div className="bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 md:pt-16 pb-8">
          <p className="text-center text-xs font-bold uppercase tracking-[0.18em] text-accent mb-5">
            Choose your stream
          </p>
          <div
            role="tablist"
            aria-label="Choose your CPD stream"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {STREAMS.map((s) => {
              const active = s.id === stream
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => select(s.id)}
                  className={`flex items-center gap-4 rounded-2xl px-6 py-6 text-left border-2 transition-all ${
                    active
                      ? 'bg-accent text-white border-accent shadow-lg shadow-accent/25'
                      : 'bg-white border-border/60 text-foreground hover:border-accent/40 hover:shadow-md'
                  }`}
                >
                  <span
                    className={`flex-none w-14 h-14 rounded-2xl grid place-items-center ${
                      active ? 'bg-white/15' : 'bg-accent/8'
                    }`}
                  >
                    <Icon className={`w-7 h-7 ${active ? 'text-white' : 'text-accent'}`} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[11px] font-bold tracking-[0.14em] mb-0.5 ${active ? 'text-white/70' : 'text-accent/70'}`}>
                      {s.code}
                    </span>
                    <span className="block text-lg font-bold leading-tight">{s.name}</span>
                    <span className={`block text-sm leading-tight mt-0.5 ${active ? 'text-white/85' : 'text-muted-foreground'}`}>
                      {s.audience}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>

          {/* Free taster — try the first module before enrolling */}
          <p className="mt-5 text-center text-sm text-muted-foreground">
            Not sure yet?{' '}
            <Link href="/preview" className="font-semibold text-accent underline underline-offset-2 hover:text-accent/80">
              Try Module 1 free →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Active stream landing (existing design, nav suppressed) ─────── */}
      {stream === 'ccm' ? <CcmPricingContent hideNav /> : <CrmPricingContent hideNav />}
    </>
  )
}
