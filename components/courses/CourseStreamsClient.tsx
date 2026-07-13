'use client'

import { useState } from 'react'
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

      {/* ── Stream toggle ─────────────────────────────────────────────── */}
      <div className="bg-background border-b border-border/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-5">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-accent mb-3">
            Choose your stream
          </p>
          <div
            role="tablist"
            aria-label="Choose your CPD stream"
            className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-white border border-border/60 shadow-sm"
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
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                    active
                      ? 'bg-accent text-white shadow-md shadow-accent/20'
                      : 'text-muted-foreground hover:bg-accent/5'
                  }`}
                >
                  <span
                    className={`flex-none w-9 h-9 rounded-lg grid place-items-center ${
                      active ? 'bg-white/15' : 'bg-accent/8'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${active ? 'text-white' : 'text-accent'}`} strokeWidth={1.9} />
                  </span>
                  <span className="min-w-0">
                    <span className={`block text-[10px] font-bold tracking-[0.12em] ${active ? 'text-white/70' : 'text-accent/70'}`}>
                      {s.code}
                    </span>
                    <span className="block text-sm font-bold leading-tight truncate">{s.name}</span>
                    <span className={`block text-[11.5px] leading-tight truncate ${active ? 'text-white/80' : 'text-muted-foreground'}`}>
                      {s.audience}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Active stream landing (existing design, nav suppressed) ─────── */}
      {stream === 'ccm' ? <CcmPricingContent hideNav /> : <CrmPricingContent hideNav />}
    </>
  )
}
