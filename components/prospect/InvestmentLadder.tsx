'use client'

import { useState } from 'react'
import { CONFIG } from '@/lib/config'
import { User, Users, GraduationCap, Building2, Check, ChevronDown, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * The full investment ladder — every way to train the team, as INTERACTIVE
 * expandable cards (owner 2026-07-08: "clickable with relevant info, not a
 * list"). Shown to all sub-8 prospects so smaller clinics see the in-person
 * options too; the on-site HERO stays gated to 8+. Prices from CONFIG.
 */

interface Option {
  id: string
  icon: LucideIcon
  name: string
  tagline: string
  price: string
  priceUnit?: string
  forWho: string
  includes: string[]
  priceDetail: string
  cta: { label: string; href: string }
  featured?: boolean
}

export function InvestmentLadder() {
  const online = CONFIG.COURSE.PRICE_ONLINE
  const eb = CONFIG.COURSE.PRICE_EARLY_BIRD
  const reg = CONFIG.COURSE.PRICE_REGULAR
  const hub = CONFIG.COURSE.PRICE_CLINIC_HUB_PACK
  const upgrade = CONFIG.COURSE.PRICE_CLINIC_WORKSHOP_UPGRADE

  const options: Option[] = [
    {
      id: 'individual',
      icon: User,
      name: 'Individual',
      tagline: 'One clinician, fully credentialled',
      price: `A$${eb.toLocaleString()}`,
      priceUnit: 'early bird',
      forWho: 'A single clinician who wants the full credential.',
      includes: [
        '8 online modules — 8 CPD hours, Osteopathy Australia-endorsed',
        'A seat at the full-day practical workshop in your nominated city (+6 CPD = 14 total)',
        'The full clinical toolkit — SCAT6/SCOAT6, referral letters, RTP tracking',
      ],
      priceDetail: `A$${eb.toLocaleString()} early bird · A$${reg.toLocaleString()} standard · online-only A$${online}`,
      cta: { label: 'Enrol', href: '/pricing' },
    },
    {
      id: 'hub',
      icon: Users,
      name: 'Full clinic access',
      tagline: 'The whole team online, one key',
      price: `from A$${hub.toLocaleString()}`,
      forWho: 'A clinic that wants every clinician (and front-desk staff) credentialled.',
      includes: [
        'Every clinician + your front-desk team online — 8 CPD hours each, lifetime access',
        'You forward one access key — each teammate gets their own login & CPD certificate',
        'The clinical toolkit — enter your clinic details once, they fill across every document',
        'Front-desk / admin micro-course + a 30-minute onboarding call',
      ],
      priceDetail: `from A$${hub.toLocaleString()} one-off · covers your clinicians + admin team`,
      cta: { label: 'Get full clinic access', href: '#pricing' },
      featured: true,
    },
    {
      id: 'upgrade',
      icon: GraduationCap,
      name: 'In-person upgrade',
      tagline: 'Add the hands-on day to the hub',
      price: `+A$${upgrade}`,
      priceUnit: '/ clinician',
      forWho: 'Hub clinics whose clinicians want the practical, hands-on day.',
      includes: [
        'A seat at a public full-day workshop — supervised SCAT6, VOMS, BESS & cervical assessment',
        'OSCE competency check + the extra 8 CPD hours (16 total)',
        `About half the A$${eb.toLocaleString()} solo price — your team already has the online bundle`,
      ],
      priceDetail: `+A$${upgrade} per clinician who attends · added to full clinic access`,
      cta: { label: 'Ask about workshop dates', href: '#next-step' },
    },
    {
      id: 'onsite',
      icon: Building2,
      name: 'On-site day',
      tagline: 'A private day at your clinic',
      price: 'from A$8,000',
      forWho: 'Larger teams (8–12 clinicians) who want a private day on their own cases.',
      includes: [
        'A full practical day delivered in your clinic, on your own patients',
        '8 hours online pre-work + 1 day on-site = 16 CPD hours, OA-endorsed',
        'Tiered per head for 8, 10 or 12 clinicians — we quote on a quick call',
      ],
      priceDetail: 'from A$8,000 · private full day for 8–12 clinicians (+ travel)',
      cta: { label: 'Talk to us about on-site', href: '#next-step' },
    },
  ]

  const [open, setOpen] = useState<string | null>('hub')

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.14em] font-bold text-muted-foreground mb-4">All ways to train your team</p>
      <div className="space-y-2.5">
        {options.map((o) => {
          const isOpen = open === o.id
          const Icon = o.icon
          return (
            <div
              key={o.id}
              className={`rounded-xl border transition-colors ${
                isOpen ? 'border-accent/40 bg-accent/[0.03]' : 'border-slate-200 hover:border-slate-300'
              } ${o.featured && !isOpen ? 'ring-1 ring-accent/20' : ''}`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : o.id)}
                aria-expanded={isOpen}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${isOpen ? 'bg-accent text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{o.name}</span>
                    {o.featured && (
                      <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-accent">Most clinics</span>
                    )}
                  </span>
                  <span className="block text-[12px] text-muted-foreground leading-snug">{o.tagline}</span>
                </span>
                <span className="flex-none text-right">
                  <span className="block text-sm font-bold text-accent leading-none">{o.price}</span>
                  {o.priceUnit && <span className="block text-[10px] text-muted-foreground mt-0.5">{o.priceUnit}</span>}
                </span>
                <ChevronDown className={`h-4 w-4 flex-none text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-0.5">
                  <div className="rounded-lg bg-white/70 border border-slate-100 p-3.5">
                    <p className="text-[12px] text-slate-500 mb-2.5">
                      <span className="font-semibold text-slate-700">Best for:</span> {o.forWho}
                    </p>
                    <ul className="space-y-1.5 mb-3">
                      {o.includes.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-foreground/85 leading-snug">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-accent" strokeWidth={2.4} />
                          {line}
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-muted-foreground mb-3 border-t border-slate-100 pt-2.5">{o.priceDetail}</p>
                    <a
                      href={o.cta.href}
                      data-track-cta={`ladder-${o.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#16243f] px-4 py-2 text-[13px] font-bold text-white hover:opacity-90 transition"
                    >
                      {o.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
