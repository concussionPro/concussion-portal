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
    title: 'Real provider, real revenue, real clinicians',
    why: 'CEA is already shipping. OA-endorsed CCM at A$1,190 with ~600 paying clinicians. Founder is a practising osteopath who codes the platform himself. Partnership with a live business, not a deck.',
    whatToLookAt: [
      'Traction strip — OA endorsement, CCM price, subscriber count',
      'About-the-founder page — AHPRA register link, ABR lookup, direct email',
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
    why: 'The strategic case. Every Scribe session is documented clinical reasoning. Every Evidence search is literature review. AHPRA already counts both — clinicians just never log them. 100-400 unlogged hours per clinician per year, currently invisible.',
    whatToLookAt: [
      'The non-blocking confirmation prompt — one tap, categorised, logged',
      'Per-Board honest ceiling: 50-100% depending on profession (NOT a flat overclaim)',
      'Event timeline showing how Scribe + Evidence events become audit-ready CPD entries',
    ],
    href: '/courses/cpd-record/passive',
    ctaLabel: 'Passive-CPD demo',
  },
  {
    step: 5,
    estMin: 3,
    title: 'The integration spec',
    why: 'The cost-of-yes calculation. Two engineer-weeks on Heidi side. Six-week joint MVP. The /api/cpd/events endpoint is already live — curl it from this page.',
    whatToLookAt: [
      'Architecture: Heidi (Scribe + Evidence) → POST /api/cpd/events → CEA categoriser',
      'Request + response JSON shapes — the endpoint is live, try a POST',
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
          CEA × Heidi · Partnership preview
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
          Your clinicians do 100-400 hrs of unlogged CPD per year.{' '}
          <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">All of it inside Heidi.</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-3 leading-relaxed">
          Every Scribe session is clinical reasoning. Every Evidence search is literature review. AHPRA already counts these — clinicians just never log them. We turn one event into one audit-ready hour. <strong className="text-foreground">No new UX. No new behaviour. Two engineer-weeks on your side.</strong>
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mb-6 leading-relaxed">
          Tour below — {totalMin} minutes, five stops, each with a clear &ldquo;why this matters for Heidi&rdquo; framing. Built for a CRO/product audit, not a prospect.
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
          <h2 className="text-2xl font-bold mb-3">The ask: 15 minutes to talk through the data signals + commercial shape.</h2>
          <p className="text-sm text-white/80 mb-5 leading-relaxed">
            Three commercial shapes pre-drafted (licensing / white-label / equity-employment). None pre-committed — the call decides which fits. If the answer is no, a 5-minute &ldquo;here&apos;s why not&rdquo; would help me sharpen the next one.
          </p>
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA%20%E2%80%94%2015-min%20partnership%20call"
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
