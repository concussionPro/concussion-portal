'use client'

import Link from 'next/link'
import { ArrowRight, GraduationCap } from 'lucide-react'
import { CONFIG } from '@/lib/config'
import { trackEvent } from '@/lib/analytics'

export type SoftScatPaidBridgeSource =
  | 'scat_module1_complete'
  | 'scat_export'
  | 'scat_mid'

/**
 * Soft SCAT → paid bridge (NOT the cold free-resource drip).
 *
 * One competency-framed nudge toward /pricing with optional SCAT6 code.
 * Use only where course interest is clear (e.g. free Module 1 complete).
 * PDF / tool hunters stay on forms + AfterTheAssessment — do not mount this
 * as a hard interrupt on mid-assessment clinic surfaces.
 */
export function SoftScatPaidBridge({
  source = 'scat_module1_complete',
  className = '',
  compact = false,
}: {
  source?: SoftScatPaidBridgeSource
  className?: string
  /** Tighter layout for celebration overlays */
  compact?: boolean
}) {
  const promo = CONFIG.COURSE.PROMO_CODE
  const discount = CONFIG.COURSE.SCAT_DISCOUNT_AUD
  const pricingHref = `/pricing?promo=${promo}&src=${source}`

  return (
    <aside
      className={`rounded-xl border border-teal-200/90 bg-gradient-to-br from-teal-50/95 to-white text-left ${
        compact ? 'p-4' : 'p-5'
      } ${className}`}
      aria-labelledby="soft-scat-paid-bridge"
    >
      <p className="m-0 text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">
        After Module 1 · competency
      </p>
      <h3
        id="soft-scat-paid-bridge"
        className={`mt-1.5 font-bold tracking-tight text-slate-900 ${
          compact ? 'text-base' : 'text-lg'
        }`}
      >
        You can run the SCAT6. Clinical competency is the next layer.
      </h3>
      <p className="mt-1.5 text-[13px] leading-snug text-slate-600">
        The form confirms a suspected concussion — it does not tell you phenotype,
        exercise dose, or return-to-contact. Online covers VOMS, BESS, phenotypes,
        and staged RTP ({CONFIG.COURSE.ONLINE_CPD_POINTS} CPD).
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-[12px] font-semibold text-teal-800">
          Course buyers: code <span className="font-bold">{promo}</span> · A${discount}{' '}
          off Online
        </p>
        <Link
          href={pricingHref}
          onClick={() =>
            trackEvent('upgrade_cta_click', {
              source,
              promo,
              from: 'soft_scat_paid_bridge',
            })
          }
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-teal-800 transition-colors"
        >
          <GraduationCap className="h-4 w-4" strokeWidth={2} />
          See Online — from A${CONFIG.COURSE.PRICE_ONLINE - discount}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  )
}
