import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import {
  FileSearch,
  BookOpen,
  Activity,
  Clock,
  Check,
  Sparkles,
  ArrowRight,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Passive CPD — Earned while you work',
  robots: 'noindex, nofollow',
}

interface PassiveEvent {
  date: string
  kind: 'literature-search' | 'guideline-review' | 'case-research' | 'scribe-reflection'
  description: string
  minutes: number
  category: string
  status: 'logged' | 'awaiting-confirmation' | 'declined'
}

// Mock data — illustrative of what a real passive-CPD timeline would
// show. In production, events come from Heidi's literature/evidence
// activity stream + scribe session metadata.
const EVENTS: PassiveEvent[] = [
  { date: '2026-05-22', kind: 'literature-search', description: 'PubMed: type 2 diabetes outcomes post-GLP-1', minutes: 47, category: 'Pharmacotherapy update', status: 'awaiting-confirmation' },
  { date: '2026-05-21', kind: 'guideline-review', description: 'RACGP red book — cardiovascular risk assessment', minutes: 22, category: 'Preventive care', status: 'logged' },
  { date: '2026-05-21', kind: 'case-research', description: 'Concussion in adolescent athlete — return to learn', minutes: 35, category: 'Sports medicine', status: 'logged' },
  { date: '2026-05-20', kind: 'literature-search', description: 'Semantic Scholar: SSRI discontinuation guidance', minutes: 28, category: 'Mental health', status: 'logged' },
  { date: '2026-05-20', kind: 'scribe-reflection', description: 'Complex case — atypical chest pain workup', minutes: 18, category: 'Clinical reasoning', status: 'logged' },
  { date: '2026-05-19', kind: 'literature-search', description: 'PubMed: BPPV diagnosis Dix-Hallpike sensitivity', minutes: 41, category: 'Vestibular medicine', status: 'logged' },
  { date: '2026-05-18', kind: 'guideline-review', description: 'AHPRA — AI use in clinical practice update', minutes: 33, category: 'Regulatory / compliance', status: 'logged' },
  { date: '2026-05-17', kind: 'literature-search', description: 'NEJM: SGLT2 inhibitors in heart failure', minutes: 52, category: 'Cardiology', status: 'declined' },
]

function kindIcon(kind: PassiveEvent['kind']) {
  switch (kind) {
    case 'literature-search': return FileSearch
    case 'guideline-review': return BookOpen
    case 'case-research': return Sparkles
    case 'scribe-reflection': return Activity
  }
}

function kindLabel(kind: PassiveEvent['kind']) {
  switch (kind) {
    case 'literature-search': return 'Literature search'
    case 'guideline-review': return 'Guideline review'
    case 'case-research': return 'Case research'
    case 'scribe-reflection': return 'Scribe reflection'
  }
}

export default async function PassiveCpdPage() {
  const access = await requireAiCourseAccess()
  const logged = EVENTS.filter((e) => e.status === 'logged')
  const totalLoggedMin = logged.reduce((s, e) => s + e.minutes, 0)
  const totalLoggedHours = (totalLoggedMin / 60).toFixed(1)
  const awaitingCount = EVENTS.filter((e) => e.status === 'awaiting-confirmation').length

  // Annualised projection from the past 7 days of activity
  const weeklyHours = totalLoggedMin / 60
  const projectedAnnualHours = Math.round(weeklyHours * 52)

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        <Link href="/courses/cpd-record" className="text-xs text-accent hover:underline mb-4 inline-block">
          ← CPD Record
        </Link>

        {/* Hero */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-accent/10 via-emerald-50/40 to-background border border-accent/20 p-8">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-2">
            Passive CPD · The killer feature
          </p>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 max-w-3xl">
            CPD earned while you work
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-6">
            Heidi already runs your literature searches, guideline reviews, and case research. We track the time, you confirm what counts, and it auto-logs to your CPD record. <strong className="text-foreground">60-80% of your annual hours accumulate passively.</strong>
          </p>
          <div className="text-xs text-muted-foreground">
            <em>Demo mockup. In production, events come from Heidi&apos;s literature / Evidence activity stream + scribe session metadata. CEA&apos;s formal courses fill the residual gap.</em>
          </div>
        </div>

        {/* Annualised projection */}
        <div className="grid sm:grid-cols-4 gap-3 mb-10">
          <div className="card rounded-xl p-4 sm:col-span-2 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-700 mb-1">Projected passive CPD / year</p>
            <p className="text-4xl font-bold text-foreground">{projectedAnnualHours}h</p>
            <p className="text-xs text-muted-foreground mt-1">at your past-7-day pace</p>
          </div>
          <div className="card rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">AHPRA requirement</p>
            <p className="text-3xl font-bold text-foreground">50h</p>
            <p className="text-xs text-muted-foreground mt-1">/ year, varies by board</p>
          </div>
          <div className="card rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Formal courses still needed</p>
            <p className="text-3xl font-bold text-foreground">{Math.max(0, 50 - projectedAnnualHours)}h</p>
            <p className="text-xs text-muted-foreground mt-1">covered by Heidi&apos;s curated marketplace</p>
          </div>
        </div>

        {/* The prompt UI */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-foreground mb-3">The one-tap confirmation prompt</h2>
          <p className="text-sm text-muted-foreground mb-4">
            After a literature search or guideline review, Heidi surfaces a discreet, non-blocking prompt. One tap → categorised → logged.
          </p>
          {awaitingCount > 0 && (() => {
            const evt = EVENTS.find((e) => e.status === 'awaiting-confirmation')!
            const Icon = kindIcon(evt.kind)
            return (
              <div className="rounded-2xl bg-white border-2 border-accent/40 shadow-lg p-5 max-w-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">
                      {kindLabel(evt.kind)} · {evt.minutes} minutes
                    </p>
                    <p className="text-base font-semibold text-foreground mb-1">
                      {evt.description}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Log this as <strong className="text-foreground">{evt.category}</strong> CPD?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        Yes — auto-categorise
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-slate-100 text-foreground text-sm font-semibold hover:bg-slate-200">
                        Not now
                      </button>
                      <button className="px-4 py-2 rounded-lg bg-transparent text-muted-foreground text-sm hover:text-foreground">
                        Don&apos;t ask again
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}
        </section>

        {/* Event timeline */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Past 7 days — passive CPD events</h2>
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{totalLoggedHours}h</strong> logged · {logged.length} entries
            </p>
          </div>
          <div className="space-y-2">
            {EVENTS.map((e, i) => {
              const Icon = kindIcon(e.kind)
              const statusBadge = e.status === 'logged' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Logged</span>
              ) : e.status === 'awaiting-confirmation' ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Awaiting</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">Declined</span>
              )
              return (
                <div key={i} className={`card rounded-xl p-3 flex items-center gap-3 ${e.status === 'declined' ? 'opacity-50' : ''}`}>
                  <div className="w-9 h-9 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{e.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {kindLabel(e.kind)} · {e.category} · {e.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground tabular-nums flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {e.minutes}m
                    </span>
                    {statusBadge}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Moat explanation */}
        <section className="rounded-2xl bg-foreground text-white p-8 mb-10">
          <p className="text-xs font-bold uppercase tracking-wide text-accent mb-3">
            Why no competitor can copy this
          </p>
          <h2 className="text-2xl font-bold mb-4">The behavioural moat</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-sm leading-relaxed">
            <div>
              <p className="font-semibold mb-2">What Heidi can see:</p>
              <ul className="space-y-1 text-white/80">
                <li>· Literature searches (already in Evidence product)</li>
                <li>· Guideline reviews</li>
                <li>· Case research time</li>
                <li>· Scribe sessions with complex reasoning</li>
                <li>· The 100-400 hrs/yr of CPD-qualifying activity already happening</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold mb-2">What Medcast / Lyrebird / RACGP cannot see:</p>
              <ul className="space-y-1 text-white/80">
                <li>· What clinicians research on PubMed</li>
                <li>· What guidelines they read on RACGP, AIS, CISG sites</li>
                <li>· What they spend time thinking through after a complex consult</li>
                <li>· Anything outside their own product</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-white/90 mt-6 italic">
            To copy, a competitor would need clinicians to do all research inside their product. Heidi already owns that surface.
          </p>
        </section>

        {/* CTA */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/courses"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-white font-semibold text-sm hover:bg-foreground/90"
          >
            Browse formal courses (fill the gap)
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/courses/cpd-record"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-slate-300 text-foreground font-semibold text-sm hover:bg-slate-50"
          >
            ← Back to CPD Record
          </Link>
        </div>
      </div>
    </div>
  )
}
