'use client'

import { useState } from 'react'
import { SiteNav } from '@/components/SiteNav'
import { GraduationCap, HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'
import CcmInternationalContent from '@/components/ccm/CcmInternationalContent'
import CrmInternationalContent from '@/components/crm/CrmInternationalContent'

/**
 * /pricing-international — two-stream tabbed international course page, mirroring
 * the homepage. Auto-currency (price resolved server-side, GB → £275, etc.).
 *
 * The two courses map to the SCREENING split, made explicit on each tab:
 *   • CCM → physiotherapists, osteopaths & chiropractors (clinicians who SCREEN
 *     and assess: SCAT6/VOMS/BESS + manage + rehab)
 *   • CRM → exercise physiologists & scientists (rehab-only; they don't screen)
 *
 * CRM tab is gated on CRM_INTERNATIONAL_LIVE (passed as `crmLive`) — same pattern
 * as the homepage gating CRM on ESSA. While off, the page shows CCM only.
 */
type Price = { display: string; code: string }

export default function IntlCoursesTabs({ price, crmLive }: { price: Price; crmLive: boolean }) {
  const [stream, setStream] = useState<'ccm' | 'crm'>('ccm')
  const showTabs = crmLive

  const TABS = [
    { id: 'ccm' as const, code: 'CCM', name: 'Concussion Clinical Mastery', who: 'Physiotherapists, osteopaths & chiropractors', icon: GraduationCap },
    { id: 'crm' as const, code: 'CRM', name: 'Concussion Rehab Mastery', who: 'Exercise physiologists & scientists', icon: HeartPulse },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteNav />

      {showTabs && (
        <section className="px-5 pt-[100px] md:pt-[116px]">
          <div className="mx-auto max-w-3xl">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
              Two courses — choose the one for your profession
            </p>
            <div role="tablist" aria-label="Choose your course" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TABS.map((t) => {
                const active = t.id === stream
                const Icon = t.icon
                return (
                  <button
                    key={t.id}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStream(t.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border-2 px-5 py-4 text-left transition',
                      active
                        ? 'border-teal-600 bg-teal-600 text-white shadow-lg shadow-teal-600/20'
                        : 'border-slate-200 bg-white text-slate-900 hover:border-teal-300 hover:shadow-md',
                    )}
                  >
                    <span className={cn('mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl', active ? 'bg-white/15' : 'bg-teal-50')}>
                      <Icon className={cn('h-5 w-5', active ? 'text-white' : 'text-teal-600')} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold leading-tight">{t.who}</span>
                      <span className={cn('mt-0.5 block text-[12px] leading-tight', active ? 'text-white/90' : 'text-slate-500')}>{t.name}</span>
                      <span className={cn('mt-1 block text-[10px] font-bold tracking-widest', active ? 'text-white/60' : 'text-teal-700/80')}>{t.code}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {!showTabs || stream === 'ccm'
        ? <CcmInternationalContent price={price} hideNav />
        : <CrmInternationalContent price={price} live hideNav />}
    </div>
  )
}
