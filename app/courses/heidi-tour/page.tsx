import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { ArrowRight, Clock, Briefcase, Handshake, Share2 } from 'lucide-react'

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
    estMin: 3,
    title: 'The vertical: ~A$480M, fragmented, no central authority',
    why: '~900k AHPRA-registered clinicians, 20-50 mandatory CPD hours/year, no platform holds >30% share. RACGP charges $4k+/yr to list and clinicians consistently complain courses are a waste of time and money. The vertical is wide open — no one has built the audit-grade, quality-vetted, in-product CPD layer the regulator implies should exist.',
    whatToLookAt: [
      'Marketplace home — the shell that fixes fragmentation',
      'Per-Board AHPRA requirements page — all 15 Boards + RACGP + ACRRM, calibrated and sourced',
      'How-we-vet page — the six-criterion review that becomes the quality authority',
    ],
    href: '/courses',
    ctaLabel: 'Open the marketplace',
  },
  {
    step: 2,
    estMin: 3,
    title: 'The insight you can\'t see from inside Heidi',
    why: 'Every Scribe session is documented clinical reasoning. Every Evidence search is literature review. AHPRA already counts both as Educational Activities CPD — your AU clinicians earn 20-30 hours per year inside Heidi and write none of it down. This is the kind of insight a clinician-who-codes spots that a generalist product team misses.',
    whatToLookAt: [
      'The non-blocking confirmation prompt — one tap, categorised, logged',
      'Per-Board honest ceiling: 50-100% depending on profession (not a flat overclaim)',
      'Event timeline showing Scribe + Evidence events becoming audit-ready CPD entries',
    ],
    href: '/courses/cpd-record/passive',
    ctaLabel: 'Passive-CPD demo',
  },
  {
    step: 3,
    estMin: 3,
    title: 'De-risked execution + built-in distribution',
    why: 'CCM at A$1,190 with ~600 paying clinicians (live, OA-endorsed). AHPRA-aligned AI compliance course (launching publicly this month) — features Heidi prominently among AU scribes. Per-Board CPD reference data (encoded). Marketplace shell + provider vetting policy (shipped). Working /api/cpd/events endpoint (live, curlable). 12 months of solo build. The AI course becomes a distribution channel into AU AHPRA clinicians — every student gets hands-on Heidi exposure.',
    whatToLookAt: [
      'Build-status — 12 shipped capabilities with clickable evidence',
      'AI compliance course — 9 modules, certification, hub (40 prompts + 14 templates + literature search)',
      'About-the-founder — proof of the triple-expertise profile (practitioner + provider + developer)',
    ],
    href: '/courses/build-status',
    ctaLabel: 'See the shipped list',
  },
  {
    step: 4,
    estMin: 3,
    title: 'The 90-day build plan',
    why: 'If you hire me, here\'s what I ship in the first 90 days. If we partner, here\'s what we build together. Either way: ~2 engineer-weeks on Heidi side, six-week joint MVP, the rest already done. This is the cost-of-yes calculation.',
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
    why: 'In my preferred order. The call decides which fits Heidi\'s shape and timing. (1) Hire me as Medical Lead — ideal because Heidi owns the IP, the team, and the CPD vertical P&L. (2) Acquire CEA tech + 600 clinicians, I join — for an instant 600-clinician head start. (3) Partnership cross-promo — my AI course features Heidi prominently, Heidi pushes CEA\'s formal CPD to your users. Zero cash up front, fastest to ship.',
    whatToLookAt: [
      'About-the-founder — the triple-expertise profile you\'d be hiring',
      'Build-status — 12 months of solo execution at the rate-of-shipping a Medical Lead role gets you',
      'How-we-vet — the marketplace credibility process that scales the CPD vertical',
    ],
    href: '/courses/about-the-founder',
    ctaLabel: 'About the founder',
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
          CEA × Heidi · De-risked execution + built-in distribution
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
          600 paying clinicians.{' '}
          <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">A working CPD platform.</span>{' '}
          And an AHPRA AI course launching that puts Heidi in front of every student.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-3 leading-relaxed">
          You&apos;re not being pitched a market opportunity. You&apos;re being pitched <strong className="text-foreground">de-risked execution with a built-in distribution channel into the AU AHPRA segment</strong>. CEA is a working business: ~600 paying clinicians on the CCM product (OA-endorsed), an AHPRA-aligned AI compliance course launching publicly this month, and the per-Board CPD calibration encoded against the regulator&rsquo;s registration standards.
        </p>
        <p className="text-sm text-muted-foreground max-w-2xl mb-6 leading-relaxed">
          Tour below — {totalMin} minutes, five stops. Built for your team to audit the operator, not for a prospect.
        </p>

        {/* TL;DR band — the three shapes upfront */}
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
              <p className="text-sm font-bold text-foreground leading-tight mb-1">Acquire CEA tech + 600 clinicians, I join</p>
              <p className="text-xs text-muted-foreground leading-relaxed">Heidi acquires the CEA platform, course IP, and ~600 paying clinicians. I join as Medical Lead to scale it. Instant 600-clinician head start in the CPD vertical.</p>
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
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">The ask · 15 minutes</p>
          <h2 className="text-2xl font-bold mb-3">A call about whether you hire me, acquire CEA + hire me, or partner.</h2>
          <p className="text-sm text-white/80 mb-5 leading-relaxed">
            I&apos;ve de-risked the concept (600 paying clinicians, OA endorsement, working platform). I&apos;m bringing the distribution (AI course launching to AHPRA clinicians, every student gets Heidi exposure). The triple-expertise profile (practitioner + provider + developer) is the unicorn shape a Medical Lead role needs. Three commercial shapes already mapped — the call decides which fits. If the answer is no on all three, a 5-minute &ldquo;here&apos;s why not&rdquo; would help sharpen the next conversation.
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
