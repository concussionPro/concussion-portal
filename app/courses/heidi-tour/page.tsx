import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { ArrowRight, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'CEA × Heidi — 15-minute guided tour',
  robots: 'noindex, nofollow',
}

interface TourStop {
  step: number
  estMin: number
  title: string
  why: string
  whatToLookAt: string[]
  href: string
  ctaLabel: string
}

const STOPS: TourStop[] = [
  {
    step: 1,
    estMin: 2,
    title: 'The provider behind the platform',
    why: 'CEA is already a shipping company with an OA-endorsed product and ~600 paying clinicians. This is not a deck — it is a partnership with a live business.',
    whatToLookAt: [
      'Traction strip — Osteopathy Australia endorsement, CCM at A$1,190, subscriber count',
      'Live courses card grid — currently 1 verified (CEA), marketplace shape demonstrated',
    ],
    href: '/courses',
    ctaLabel: 'Marketplace home',
  },
  {
    step: 2,
    estMin: 3,
    title: 'The flagship CPD product',
    why: 'The AI-in-clinical-practice course shows the depth and clinical rigour CEA brings to the marketplace. Same quality bar gets applied to every provider that lists.',
    whatToLookAt: [
      '9 modules · ~120 min reading · OA-aligned with AHPRA standards',
      'KEYPOINT / REDFLAG / DEFINITION / TRYTHIS interactive cards',
      'Mid-module quizzes and the 10-question certification quiz',
    ],
    href: '/courses/ai-in-clinical-practice',
    ctaLabel: 'Open the course',
  },
  {
    step: 3,
    estMin: 3,
    title: 'The CPD record dashboard',
    why: 'Audit-ready CPD log per clinician — the multi-provider value proposition only works if the dashboard genuinely aggregates. The per-Board AHPRA reference is the unique-defensible bit.',
    whatToLookAt: [
      'CPD record dashboard — one source of truth across providers',
      'Per-Board requirements page — passive-CPD ceiling calibrated for all 15 AHPRA Boards + RACGP + ACRRM',
    ],
    href: '/courses/cpd-record',
    ctaLabel: 'CPD record',
  },
  {
    step: 4,
    estMin: 4,
    title: 'The passive-CPD insight (the game-changer)',
    why: 'The strategic case for Heidi: every Scribe session, every Evidence search, every clinical-context interaction is unlogged CPD. 100-400 hours per clinician per year. Currently invisible.',
    whatToLookAt: [
      'Visual demo of "log this 45-min session as CPD?" prompt',
      'Per-Board honest ceiling (NOT a flat 100% claim — calibrated 50-100% per profession)',
      'Event timeline mockup showing how Heidi events become CPD records',
    ],
    href: '/courses/cpd-record/passive',
    ctaLabel: 'Passive-CPD demo',
  },
  {
    step: 5,
    estMin: 3,
    title: 'The integration spec',
    why: 'The bit a CRO actually needs: concrete API contract, 6-week MVP timeline, effort estimate. This is the cost-of-yes calculation.',
    whatToLookAt: [
      'Architecture diagram — Heidi surface → POST /api/cpd/events → CEA categoriser',
      'Request and response JSON shapes (the endpoint is live; try a POST)',
      'Open questions to resolve in the first call',
    ],
    href: '/courses/integration',
    ctaLabel: 'Integration spec',
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

        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          15-minute guided tour · CEA × Heidi
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 leading-tight">
          Start here.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-6 leading-relaxed">
          Five stops, {totalMin} minutes. Each stop has a clear &ldquo;why this matters for Heidi&rdquo; framing and the specific things to look at. Built for a CRO/product-lead audit, not a sales prospect.
        </p>

        <div className="flex flex-wrap gap-2 mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3" /> ~{totalMin} minutes total
          </span>
          <Link href="/courses/build-status" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
            Shipped vs roadmap (honest split)
          </Link>
          <Link href="/courses/about-the-founder" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
            About the founder
          </Link>
        </div>

        <div className="space-y-4">
          {STOPS.map((stop, idx) => (
            <div key={stop.step} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-foreground text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {stop.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-2 mb-2">
                      <h2 className="text-xl font-bold text-foreground">{stop.title}</h2>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        ~{stop.estMin} min
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      <strong className="text-foreground">Why it matters: </strong>
                      {stop.why}
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
                    <Link
                      href={stop.href}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-white text-sm font-semibold hover:bg-foreground/90 transition-colors"
                    >
                      {stop.ctaLabel}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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

        <section className="mt-12 rounded-2xl bg-foreground text-white p-7">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">After the tour</p>
          <h2 className="text-2xl font-bold mb-3">If the case is interesting, the next step is a 30-minute call.</h2>
          <p className="text-sm text-white/80 mb-5 leading-relaxed">
            Three partnership shapes are pre-drafted (licensing / white-label / equity-employment) in the proposal doc. None are pre-committed; the call decides which fits.
          </p>
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA%20partnership%20call"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            Email Zac to schedule
            <ArrowRight className="w-4 h-4" />
          </a>
        </section>
      </div>
    </div>
  )
}
