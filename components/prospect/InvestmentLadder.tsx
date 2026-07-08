import { CONFIG } from '@/lib/config'
import { ArrowRight } from 'lucide-react'

/**
 * The full investment ladder — every way to train the team, shown to ALL
 * prospects so smaller clinics see the in-person options too (Mitch @ Instinct
 * asked for in-person; the on-site HERO stays gated to 8+, but the OPTIONS
 * ladder is universal). Prices from CONFIG — never hardcode.
 */
export function InvestmentLadder() {
  const online = CONFIG.COURSE.PRICE_ONLINE
  const eb = CONFIG.COURSE.PRICE_EARLY_BIRD
  const reg = CONFIG.COURSE.PRICE_REGULAR
  const hub = CONFIG.COURSE.PRICE_CLINIC_HUB_PACK
  const upgrade = CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE

  const rows = [
    { name: 'Individual', price: `A$${eb.toLocaleString()}`, unit: 'early bird', desc: `One clinician — the complete course (online + the full-day practical, 14 CPD hrs). A$${reg.toLocaleString()} standard; online-only A$${online}.` },
    { name: 'Full clinic access', price: `from A$${hub.toLocaleString()}`, unit: '', desc: 'Your whole team online, lifetime access + the clinic toolkit.' },
    { name: 'In-person upgrade', price: `+A$${upgrade}`, unit: '/ clinician', desc: 'Add the full-day hands-on practical workshop to the hub (14 CPD hrs total).' },
    { name: 'On-site day', price: 'from A$7,500', unit: '', desc: 'Your team trained in your own clinic, on your own cases.' },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted-foreground">All ways to train your team</p>
      <div className="mt-3 divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.name} className="flex items-baseline justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground">{r.name}</p>
              <p className="text-xs text-muted-foreground leading-snug">{r.desc}</p>
            </div>
            <p className="whitespace-nowrap text-sm font-bold text-accent">
              {r.price}
              {r.unit && <span className="text-[11px] font-normal text-muted-foreground"> {r.unit}</span>}
            </p>
          </div>
        ))}
      </div>
      <a
        href="#next-step"
        data-track-cta="investment-ladder-inperson"
        className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition"
      >
        Ask about in-person training for your team <ArrowRight className="w-4 h-4" />
      </a>
    </div>
  )
}
