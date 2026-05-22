import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import {
  ArrowRight,
  Clock,
  Briefcase,
  Handshake,
  Share2,
  TrendingUp,
  Lock,
  ShieldCheck,
  Layers,
  Mail,
  Award,
  BookOpen,
  Mic,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'CEA × Heidi — 15-minute guided tour',
  robots: 'noindex, nofollow',
}

interface TourStop {
  step: number
  estMin: number
  title: string
  leadClaim: string
  supporting: string
  whatToLookAt: string[]
  href: string
  ctaLabel: string
}

const STOPS: TourStop[] = [
  {
    step: 1,
    estMin: 3,
    title: 'The vertical: ~A$480M, fragmented, no central authority',
    leadClaim: 'The AU CPD market is structurally open — no platform >30% share, no quality bar, RACGP charges $4k+ to list.',
    supporting: '~900k AHPRA-registered clinicians, 20-50 mandatory CPD hours/year, scattered across professional colleges, universities, Medcast, and independents. No one has built the audit-grade, quality-vetted, in-product CPD layer the regulator implies should exist.',
    whatToLookAt: [
      'Marketplace home — the shell that fixes fragmentation',
      'Per-Board AHPRA requirements — all 15 Boards + RACGP + ACRRM, calibrated and sourced',
      'How-we-vet page — the six-criterion review that becomes the quality authority',
    ],
    href: '/courses',
    ctaLabel: 'Open the marketplace',
  },
  {
    step: 2,
    estMin: 3,
    title: 'Heidi\'s Evidence tool is already a CPD engine',
    leadClaim: 'Monetization depth on existing usage. Marginal cost: near-zero.',
    supporting: 'Every Evidence guideline review is literature-review CPD — an AHPRA Educational Activity by the regulator\'s own definition. Every Scribe session adds clinical-reasoning documentation on top. Your AU users earn meaningful hours per year inside Heidi and log none of it. Scribe-only competitors (Abridge, Nabla, DeepScribe) can\'t replicate this — they have no Evidence equivalent. That\'s the moat, and it sits on usage you already have.',
    whatToLookAt: [
      'The non-blocking confirmation prompt — one tap, categorised, logged',
      'Per-Board honest ceiling: 50-100% depending on profession (not a flat overclaim)',
      'Event timeline showing Evidence + Scribe events becoming audit-ready CPD entries',
    ],
    href: '/courses/cpd-record/passive',
    ctaLabel: 'Passive-CPD demo',
  },
  {
    step: 3,
    estMin: 3,
    title: 'De-risked execution + three live distribution channels',
    leadClaim: 'CCM is OA-endorsed and trading. AI course launches with Heidi recommended. OA 2026 speaker slot confirmed.',
    supporting: 'CCM at A$1,190 live with Osteopathy Australia endorsement. AHPRA-aligned AI compliance course launching publicly on the CEA portal — Heidi is the CEA-recommended scribe throughout, every student gets hands-on exposure. Confirmed clinical presentation at the Osteopathy Australia Conference 2026 (Sea World Resort, Gold Coast · 16-17 October) on concussion assessment and management, with Heidi demoed live as the recommended workflow. Three live channels into the AU AHPRA segment you don\'t currently reach.',
    whatToLookAt: [
      'Build-status — 12 shipped capabilities with clickable evidence',
      'AI compliance course — 9 modules with Heidi as the recommended scribe throughout',
      'About-the-founder — proof of the triple-expertise profile (practitioner + provider + developer)',
    ],
    href: '/courses/build-status',
    ctaLabel: 'See the shipped list',
  },
  {
    step: 4,
    estMin: 3,
    title: 'The 90-day build plan',
    leadClaim: 'Two engineer-weeks on Heidi side. Six-week joint MVP. The /api/cpd/events endpoint is already live.',
    supporting: 'If you hire me, this is week 1 to week 13. If we partner, this is the joint MVP. Either way: 12+ months of vertical groundwork already done at CEA, the heavy lifting (per-Board AHPRA calibration, categoriser, marketplace shell, export PDF generator) all shipped. Heidi adds the event-source instrumentation in Scribe + Evidence and the non-blocking prompt UI. That\'s it.',
    whatToLookAt: [
      'Architecture: Heidi (Scribe + Evidence) → POST /api/cpd/events → CEA categoriser',
      'Request + response JSON shapes — the endpoint is live, try a POST',
      'Six-week joint timeline with both teams\' deliverables per week',
    ],
    href: '/courses/integration',
    ctaLabel: 'Build plan',
  },
  {
    step: 5,
    estMin: 3,
    title: 'Three shapes that work',
    leadClaim: 'Hire (ideal) · Acqui-hire (mid) · Partnership (lightest, fastest). The call decides.',
    supporting: 'In my preferred order. (1) Hire me as Medical Lead — Heidi owns the IP, the team, the CPD vertical P&L. (2) Acquire CEA platform + course IP + subscriber relationship, I join — head start in the AU CPD vertical from day one; terms TBD. (3) Partnership cross-promo — my AI course already features Heidi as recommended scribe, OA conf demos Heidi live, in return Heidi pushes CEA formal CPD to your users. Zero cash up front, fastest to ship.',
    whatToLookAt: [
      'About-the-founder — the triple-expertise profile you\'d be hiring',
      'Build-status — 12 months of solo execution at the rate-of-shipping a Medical Lead role gets you',
      'How-we-vet — the marketplace credibility process that scales the CPD vertical',
    ],
    href: '/courses/about-the-founder',
    ctaLabel: 'About the founder',
  },
]

const ROADMAP_FITS = [
  {
    icon: TrendingUp,
    label: 'ARPU expansion',
    detail: 'CPD is depth on existing users — zero net CAC. Easiest possible internal pitch for the next-round narrative.',
  },
  {
    icon: Lock,
    label: 'Net dollar retention',
    detail: '30+ logged CPD hours = 12-month behavioural lock-in. Improves NDR without a price increase.',
  },
  {
    icon: ShieldCheck,
    label: 'Defensive moat',
    detail: 'Scribe-only competitors (Abridge, Nabla, DeepScribe) have no Evidence equivalent. CPD layer they structurally can\'t copy.',
  },
  {
    icon: Layers,
    label: 'Vertical depth',
    detail: 'Adjacent to Evidence, not a new bet. Leverages product surface you already own.',
  },
]

const CHANNELS = [
  {
    icon: Award,
    label: 'CCM subscriber base',
    detail: 'OA-endorsed, live at A$1,190',
  },
  {
    icon: BookOpen,
    label: 'AI compliance course',
    detail: 'Launching · Heidi recommended throughout',
  },
  {
    icon: Mic,
    label: 'OA 2026 speaker slot',
    detail: 'Confirmed · 16–17 Oct · Gold Coast · Heidi demoed live',
  },
]

export default async function HeidiTourPage() {
  const access = await requireAiCourseAccess()
  const totalMin = STOPS.reduce((s, t) => s + t.estMin, 0)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        {/* HERO — leads with the CFO frame, moat second */}
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          CEA × Heidi · A Series-B-aligned CPD vertical
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
          Monetization depth on the clinicians you already have.{' '}
          <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">Marginal cost: near-zero.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-5 leading-relaxed">
          Heidi&apos;s Evidence tool is already a CPD engine. Every guideline review is literature-review CPD. Every Scribe session adds clinical reasoning. AHPRA already counts both. Your AU users earn meaningful hours per year inside Heidi and write none of it down. <strong className="text-foreground">Scribe-only competitors can&apos;t replicate this — they have no Evidence equivalent. That&apos;s the moat.</strong>
        </p>

        {/* PRIMARY CTA — visible above the fold */}
        <div className="flex flex-wrap items-center gap-3 mb-10">
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA%20%E2%80%94%2015-min%20call"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors shadow-sm"
          >
            <Mail className="w-4 h-4" />
            Book 15-min call
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
          <span className="text-xs text-muted-foreground">
            Or scroll for the {totalMin}-min guided audit — five stops, every claim verifiable.
          </span>
        </div>

        {/* CHANNEL STRIP — three live distribution channels, condensed */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-baseline justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">
              Three live distribution channels into the AU AHPRA segment
            </p>
            <p className="text-[10px] text-muted-foreground">Audit-ready</p>
          </div>
          <div className="grid sm:grid-cols-3 divide-x divide-slate-100">
            {CHANNELS.map((c) => {
              const Icon = c.icon
              return (
                <div key={c.label} className="p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Icon className="w-3 h-3 text-emerald-700" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Live</p>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight mb-0.5">{c.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{c.detail}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* ROADMAP FIT — maps to Heidi's likely current goals */}
        <div className="mb-10 rounded-2xl bg-gradient-to-br from-foreground to-slate-800 text-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-3">
            How this fits Heidi&apos;s roadmap
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {ROADMAP_FITS.map((fit) => {
              const Icon = fit.icon
              return (
                <div key={fit.label} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{fit.label}</p>
                    <p className="text-xs text-white/75 leading-relaxed">{fit.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* TL;DR — three shapes upfront */}
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700">
              If you read one thing: the three shapes
            </p>
          </div>
          <div className="grid sm:grid-cols-3 divide-x divide-slate-100">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Briefcase className="w-3.5 h-3.5 text-accent" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-accent">1 · Ideal</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight mb-1">Hire me as Medical Lead</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Bring me on to own the CPD vertical inside Heidi. I build using the proven CEA model, the AI course becomes Heidi&apos;s education offering. Salary + equity; CCM stays mine as a side project.</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
                  <Share2 className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">2 · Acqui-hire</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight mb-1">Acquire CEA tech + course IP, I join</p>
              <p className="text-xs text-muted-foreground leading-relaxed"><strong>Sold:</strong> CPD platform code, AI course IP, marketplace shell, /api/cpd/events service, AU subscriber relationship. <strong>Stays mine:</strong> CCM (separate concussion clinical product). Terms TBD on the call.</p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                  <Handshake className="w-3.5 h-3.5 text-slate-600" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600">3 · Partnership</p>
              </div>
              <p className="text-sm font-bold text-foreground leading-tight mb-1">Cross-promotion (fastest)</p>
              <p className="text-xs text-muted-foreground leading-relaxed">CEA&apos;s AI course features Heidi prominently; Heidi pushes CEA&apos;s formal CPD to your users for CPD credits. My platform drives Heidi adoption, your platform drives my revenue. Zero cash up front.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" /> ~{totalMin} minutes total
          </span>
          <Link href="/courses/build-status" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            12 months of execution
          </Link>
          <Link href="/courses/about-the-founder" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
            About the founder
          </Link>
        </div>

        {/* TOUR STOPS — bulleted lead-with-bold format */}
        <div className="space-y-4">
          {STOPS.map((stop, idx) => (
            <div key={stop.step} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-foreground text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {stop.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-3">
                      <h2 className="text-xl font-bold text-foreground">{stop.title}</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        ~{stop.estMin} min
                      </span>
                    </div>
                    <p className="text-base font-semibold text-foreground leading-snug mb-2">
                      {stop.leadClaim}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {stop.supporting}
                    </p>
                    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3 mb-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">What to look at</p>
                      <ul className="space-y-1">
                        {stop.whatToLookAt.map((item, i) => (
                          <li key={i} className="text-xs text-foreground flex items-start gap-2">
                            <span className="text-accent shrink-0">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={stop.href}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 transition-colors"
                      >
                        {stop.ctaLabel}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <a
                        href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA%20%E2%80%94%2015-min%20call"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline px-2"
                      >
                        Or skip to the call
                        <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              {idx < STOPS.length - 1 && (
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-muted-foreground">
                  Next: {STOPS[idx + 1].title}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CLOSING ASK — restate the CFO frame */}
        <section className="mt-12 rounded-2xl bg-foreground text-white p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">The ask · 15 minutes</p>
          <h2 className="text-2xl font-bold mb-3">Monetization depth, not a new bet. Three shapes — the call decides.</h2>
          <p className="text-sm text-white/80 mb-5 leading-relaxed">
            This isn&apos;t a new user cohort — it&apos;s ARPU expansion on clinicians already using Heidi. Marginal cost: near-zero. The Evidence moat keeps Abridge / Nabla / DeepScribe locked out of this surface. Three commercial shapes already mapped: hire (ideal) · acqui-hire (mid) · partnership cross-promo (lightest). If the answer is no on all three, a 5-minute &ldquo;here&apos;s why not&rdquo; would help sharpen the next conversation.
          </p>
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA%20%E2%80%94%2015-min%20call"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Email Zac · 15-min call
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </div>
    </div>
  )
}
