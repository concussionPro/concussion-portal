'use client'

import { useState } from 'react'
import { CONFIG } from '@/lib/config'
import { trackEvent, getAttribution } from '@/lib/analytics'
import { Users, Check, Loader2, ArrowRight, Plane, ShieldCheck } from 'lucide-react'

/**
 * Self-serve Hub Pack purchase for SMALL clinics (≤5 clinical) on the prospect
 * portal. This is the offer that was missing: a 4-person clinic was shown the
 * on-site cohort cards (book-a-call, uneconomic for them) with no way to buy
 * the right product. Hub Pack is online + no travel, so it CAN check out cold.
 * POSTs courseType:'clinic-hub-pack' → /api/create-checkout → Stripe.
 */
const HUB_MAX = 12

export function HubPackBuyCard({ clinical, slug }: { clinical: number; slug: string }) {
  const [loading, setLoading] = useState(false)
  const price = CONFIG.COURSE.PRICE_CLINIC_HUB_PACK
  const baseSeats = CONFIG.COURSE.CLINIC_HUB_SEATS_INCLUDED
  // Buyer declares their clinician headcount — this becomes the access key's
  // hard seat cap. Default to the clinic's known size (min the base 5, max 12).
  const [count, setCount] = useState<number>(Math.min(HUB_MAX, Math.max(baseSeats, clinical || 0)))
  const individualCost = count * CONFIG.COURSE.PRICE_ONLINE
  const cheaperThanIndividual = individualCost > price

  async function buy() {
    setLoading(true)
    trackEvent('checkout_start', { courseType: 'clinic-hub-pack', source: 'prospect_portal', slug })
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseType: 'clinic-hub-pack',
          clinicianCount: count,
          utm: { utm_source: 'portal', utm_medium: 'hub_pack_card', utm_campaign: slug },
          attribution: getAttribution(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data?.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const includes = [
    `${count} clinician seats + your front-desk / admin team — 8 modules, 8 CPD hours each, OA-endorsed`,
    'Each teammate gets their own login & CPD certificate — you forward one access key',
    'Clinical docs (GP, NDIS, school/sport, RTP) — enter your clinic details once, they fill across every document',
    'Front-desk / admin micro-course + a 30-minute onboarding call',
  ]

  return (
    <section id="pricing" className="mt-8 scroll-mt-8">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
          Recommended for your clinic
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          Train your whole clinic — online, no travel
        </h3>
      </div>

      <div className="rounded-2xl glass-premium border border-accent/30 ring-1 ring-accent/20 p-5 sm:p-6">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-accent/15 to-accent/5 flex items-center justify-center">
              <Users className="w-[22px] h-[22px] text-accent" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Concussion Hub Pack</p>
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Plane className="w-3 h-3" /> No travel · start today · whole clinic
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-accent leading-none">A${price.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground mt-1">one-off · covers {count} clinicians + admin</p>
          </div>
        </div>

        <ul className="space-y-2 mb-5">
          {includes.map((line, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed">
              <Check className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" strokeWidth={2.2} />
              {line}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/20 bg-white/50 px-4 py-3 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">How many clinicians?</p>
            <p className="text-[11px] text-muted-foreground leading-snug">Sets your team access key. Front-desk / admin staff are included on top.</p>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <button type="button" aria-label="Fewer" onClick={() => setCount((c) => Math.max(1, c - 1))}
              className="w-8 h-8 rounded-lg border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-50">−</button>
            <span className="w-7 text-center text-lg font-extrabold text-foreground">{count}</span>
            <button type="button" aria-label="More" onClick={() => setCount((c) => Math.min(HUB_MAX, c + 1))}
              className="w-8 h-8 rounded-lg border border-slate-300 text-lg font-bold text-slate-600 hover:bg-slate-50">+</button>
          </div>
        </div>

        {cheaperThanIndividual && (
          <p className="text-xs font-semibold text-emerald-700 mb-4 -mt-1">
            That&apos;s less than {count} individual online seats (A${individualCost.toLocaleString()}) — and the whole team is credentialled, not just one.
          </p>
        )}

        <button
          onClick={buy}
          disabled={loading}
          data-track-cta="hub-pack-buy"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl bg-accent text-white hover:opacity-90 transition disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Full clinic access — A${price.toLocaleString()}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </button>
        <p className="text-[11px] text-muted-foreground mt-3">
          Secure checkout · instant access · GST invoice emailed. Your access key covers {count} clinicians + your front-desk team — forward it once and each teammate gets their own login.
        </p>
        <p className="text-[11px] text-emerald-700 font-medium mt-2 inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> 7-day money-back guarantee — full refund before 2 modules are completed.
        </p>
      </div>
    </section>
  )
}
