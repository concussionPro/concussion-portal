import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { ArrowRight, Clock, Award, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Free Training — two free CPD courses | Concussion Education Australia',
  description:
    'Two free courses for clinicians: SCAT6 Mastery (~1 hour — SCAT6/SCOAT6, red flags, documentation) and Concussion Care Has Changed (~1 hour — the new first-line treatment). No credit card.',
}

/**
 * /free-training — the nav's Free Training destination (owner 2026-08-04:
 * "launches under the free courses tab but only shows scat6 — your nav
 * routing is fucked"). One hub, BOTH free courses, equal billing.
 */
const COURSES = [
  {
    eyebrow: 'Assessment',
    title: 'SCAT6 Mastery',
    time: '~1 hour · 3 modules',
    body: 'Master SCAT6 & SCOAT6: step-by-step protocols, red-flag identification, medicolegal documentation. Finish it and get $50 off the full online course.',
    href: '/scat-mastery',
    cta: 'Start SCAT6 Mastery',
  },
  {
    eyebrow: 'Treatment update',
    title: 'Concussion Care Has Changed',
    time: '~1 hour · 1 module',
    body: 'Rest is out — measured sub-symptom-threshold exercise is now first-line treatment. The update on the paradigm shift, the evidence behind it, and what modern management involves.',
    href: '/concussion-update',
    cta: 'Start the update',
  },
]

export default function FreeTrainingPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-4xl mx-auto px-6 pb-20 pt-[120px]">
        <div className="text-center mb-10">
          <div className="badge mb-5 inline-flex">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            100% free · no credit card
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Two free courses. <span className="text-gradient">Start with either.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Both are complete, self-paced short courses with certificates — assessment first if you
            run SCATs, the treatment update first if your training predates the current consensus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {COURSES.map((c) => (
            <div key={c.href} className="card card-visible rounded-2xl p-6 flex flex-col">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-accent mb-2">{c.eyebrow}</p>
              <h2 className="text-xl font-bold text-foreground mb-1">{c.title}</h2>
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                <Clock className="w-3.5 h-3.5" /> {c.time}
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-5">{c.body}</p>
              <Link href={c.href} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold">
                {c.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Award className="w-4 h-4 text-accent" />
            Ready for the full pathway? Both accredited streams live at{' '}
            <Link href="/courses" className="font-semibold text-accent hover:underline">/courses</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
