import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import {
  ArrowRight,
  Layers,
  Workflow,
  ShieldCheck,
  Database,
  Stethoscope,
  Award,
  BookOpen,
  Mic,
  Sparkles,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'CPD layer for Heidi Evidence + Scribe',
  robots: 'noindex, nofollow',
}

interface Module {
  num: string
  title: string
  duration: string
  heidi?: boolean
}

const AI_COURSE_MODULES: Module[] = [
  { num: '01', title: 'Compliance & Medicolegal Framework', duration: '40m' },
  { num: '02', title: 'Tool Selection & Data Sovereignty', duration: '20m', heidi: true },
  { num: '03', title: 'Documentation Workflows (Compliant by Design)', duration: '20m', heidi: true },
  { num: '04', title: 'Patient Communication & Documents', duration: '15m', heidi: true },
  { num: '05–08', title: 'Specialty Deep Dives · Physio · Naturopathy · GP · Osteo', duration: '31m' },
  { num: '09', title: 'Hub Onboarding & Certification', duration: '10m' },
]

const CCM_MODULES: Module[] = [
  { num: '01', title: 'What is a Concussion?', duration: '75m' },
  { num: '02', title: 'Diagnosis & Initial Assessment', duration: '90m' },
  { num: '03', title: 'Practical Assessment & Acute Management', duration: '90m' },
  { num: '04', title: 'Persistent Post-Concussive Symptoms', duration: '75m' },
  { num: '05', title: 'Multidisciplinary Approach', duration: '60m' },
  { num: '06', title: 'Return to Play, Work, and School', duration: '60m' },
  { num: '07', title: 'Rehabilitation Pathways by Phenotype', duration: '75m' },
  { num: '08', title: 'Legal, Ethical, Communication & Documentation', duration: '45m' },
  { num: '09–11', title: 'SCAT6 + SCOAT6 + Clinical Scenarios', duration: '60m' },
]

const METRICS = [
  { value: '17', label: 'AHPRA Boards encoded', detail: 'All 15 National Boards + RACGP + ACRRM CPD Homes' },
  { value: '50–100%', label: 'Passive CPD ceiling', detail: 'Calibrated per profession, sourced against registration standards' },
  { value: '~A$480M', label: 'AU CPD TAM', detail: 'Fragmented, no platform >30%, no quality authority' },
  { value: '~0', label: 'Marginal cost to Heidi', detail: 'Categoriser runs on event metadata only' },
]

const MARKET_FACTS = [
  { stat: '~900k', body: 'AHPRA practitioners on the 2024–25 register, all required to complete 20–50 CPD hours/year for re-registration.' },
  { stat: '<30%', body: 'Largest single player’s market share. Fragmented across professional colleges, universities, Medcast, and independents.' },
  { stat: '$4k+', body: 'RACGP listing fee per year, selective approval. Gatekeeping limits supply; clinicians consistently complain CPD is a waste of time and money.' },
]

const DISTRIBUTION = [
  {
    icon: Award,
    label: 'CCM (live)',
    detail: 'A$1,190 · Osteopathy Australia endorsed · AU clinician subscriber base',
  },
  {
    icon: BookOpen,
    label: 'AI compliance course (launching)',
    detail: 'Launching publicly on the CEA portal · Heidi recommended throughout',
  },
  {
    icon: Mic,
    label: 'OA Conference 2026 (confirmed speaker)',
    detail: '16–17 October · Sea World Resort, Gold Coast · concussion talk · Heidi demoed live',
  },
]

export default async function HeidiTourPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        {/* HERO */}
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          CEA · CPD layer for Heidi
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
          CPD layer for{' '}
          <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">Heidi Evidence + Scribe.</span>{' '}
          Built.
        </h1>

        {/* STRATEGIC INSIGHT — first thing read, no CTA */}
        <div className="mb-10 rounded-2xl bg-gradient-to-br from-foreground to-slate-800 text-white p-7">
          <p className="text-lg font-semibold leading-snug mb-3">
            Heidi&rsquo;s Evidence tool is already a CPD engine. Every guideline review is literature-review CPD. Every Scribe session adds clinical reasoning. AHPRA already counts both.
          </p>
          <p className="text-sm text-white/85 leading-relaxed">
            Your AU users earn meaningful hours per year inside Heidi and log none of it. Scribe-only competitors (Abridge, Nabla, DeepScribe) can&rsquo;t replicate this — they have no Evidence equivalent.
          </p>
          <p className="text-sm font-semibold text-white/95 mt-4">
            Here&rsquo;s the platform that turns it into audit-grade CPD:
          </p>
        </div>

        {/* TWO-COURSE BENTO — the prominent visual feature */}
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-3">
            Two courses, one platform · click any to open the learning dashboard
          </p>
          <div className="grid md:grid-cols-2 gap-4 items-stretch">
            {/* AI in Clinical Practice + Heidi Scribe — left, slightly emphasised */}
            <Link
              href="/courses/ai-in-clinical-practice"
              className="group rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-white to-white hover:border-accent/50 hover:shadow-lg transition-all flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-accent text-white mb-3">
                  <Sparkles className="w-3 h-3" />
                  Launching · Heidi recommended
                </span>
                <h2 className="text-xl font-bold text-foreground leading-tight mb-1.5">
                  AI in Clinical Practice
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AHPRA-aligned AI compliance for AU clinicians. <strong className="text-foreground">Heidi is the CEA-recommended AU scribe</strong> throughout every documentation module and specialty deep-dive.
                </p>
              </div>

              {/* Module list — product-chrome style */}
              <div className="border-t border-accent/15 bg-white/40">
                <div className="px-5 py-2 border-b border-accent/10 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Curriculum</p>
                  <p className="text-[10px] font-bold text-slate-500 tabular-nums">9 modules · 136m</p>
                </div>
                <ul>
                  {AI_COURSE_MODULES.map((m, i) => (
                    <li
                      key={m.num}
                      className={`px-4 py-2 flex items-center gap-3 ${i < AI_COURSE_MODULES.length - 1 ? 'border-b border-accent/5' : ''}`}
                    >
                      <span className={`shrink-0 inline-flex items-center justify-center w-7 h-5 rounded-md text-[10px] font-bold tabular-nums ${m.heidi ? 'bg-accent/15 text-accent border border-accent/20' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        {m.num}
                      </span>
                      <span className="text-xs text-foreground/85 leading-snug flex-1 truncate">{m.title}</span>
                      {m.heidi && (
                        <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          Heidi
                        </span>
                      )}
                      <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-500 min-w-[32px] text-right">{m.duration}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stat pills + CTA */}
              <div className="mt-auto px-5 py-4 border-t border-accent/15 bg-white/60">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {['40 prompts', '14 templates', '17 Boards', 'Certification'].map((s) => (
                    <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-sm font-bold text-accent group-hover:underline inline-flex items-center gap-1">
                  Open the course
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>

            {/* Concussion Clinical Mastery — right */}
            <Link
              href="/learning"
              className="group rounded-2xl border-2 border-slate-200 bg-white hover:border-accent/40 hover:shadow-md transition-all flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-4">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 mb-3">
                  <Award className="w-3 h-3" />
                  Live · OA-endorsed · A$1,190
                </span>
                <h2 className="text-xl font-bold text-foreground leading-tight mb-1.5">
                  Concussion Clinical Mastery
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Flagship 14-CPD-hour clinical course. Assessment, acute management, return-to-play protocols, persistent symptoms, SCAT6 + SCOAT6 instruments. Live AU clinician subscriber base.
                </p>
              </div>

              {/* Module list */}
              <div className="border-t border-slate-200 bg-slate-50/60">
                <div className="px-5 py-2 border-b border-slate-200 flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Curriculum</p>
                  <p className="text-[10px] font-bold text-slate-500 tabular-nums">11 modules · 630m</p>
                </div>
                <ul>
                  {CCM_MODULES.map((m, i) => (
                    <li
                      key={m.num}
                      className={`px-4 py-2 flex items-center gap-3 ${i < CCM_MODULES.length - 1 ? 'border-b border-slate-100' : ''}`}
                    >
                      <span className="shrink-0 inline-flex items-center justify-center w-7 h-5 rounded-md text-[10px] font-bold tabular-nums bg-slate-100 text-slate-600 border border-slate-200">
                        {m.num}
                      </span>
                      <span className="text-xs text-foreground/85 leading-snug flex-1 truncate">{m.title}</span>
                      <span className="shrink-0 text-[10px] font-medium tabular-nums text-slate-500 min-w-[32px] text-right">{m.duration}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stat pills + CTA */}
              <div className="mt-auto px-5 py-4 border-t border-slate-200 bg-white">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {['14 CPD hours', 'OA-endorsed', 'SCAT6 + SCOAT6', 'Certification'].map((s) => (
                    <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-sm font-bold text-accent group-hover:underline inline-flex items-center gap-1">
                  Open the course
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3 italic text-center">
            Both courses run on the same CEA learning dashboard — module nav left, content right, certification at the end. Plug-and-play.
          </p>
        </div>

        {/* INTEGRATION API — smaller band below the bento */}
        <Link
          href="/courses/integration"
          className="group block mb-12 rounded-2xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-md transition-all"
        >
          <div className="grid md:grid-cols-[auto_1fr_auto] gap-4 items-center">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
              <Workflow className="w-5 h-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">POST /api/cpd/events · live · curlable today</p>
              <p className="text-base font-bold text-foreground leading-tight">Heidi-integration API</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                Scribe + Evidence events → categoriser → AHPRA-tagged log entry. ~2 engineer-weeks on Heidi side, 6-week joint MVP. Reads from your existing event stream — no new UX, no replatforming.
              </p>
            </div>
            <div className="text-sm font-bold text-accent group-hover:underline inline-flex items-center gap-1 shrink-0">
              See the integration
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Link>

        {/* CPD MARKET DATA — the case for the vertical */}
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-4">
            The CPD vertical · current facts
          </p>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            {MARKET_FACTS.map((f) => (
              <div key={f.stat} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-3xl font-bold text-accent tabular-nums leading-none mb-2">{f.stat}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
              CPD vertical · the numbers
            </p>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
              {METRICS.map((m) => (
                <div key={m.label}>
                  <p className="text-3xl font-bold text-accent tabular-nums leading-none mb-1">{m.value}</p>
                  <p className="text-sm font-bold text-foreground mb-0.5">{m.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{m.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DISTRIBUTION CHANNELS — compact */}
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-4">
            Three live distribution channels into the AU AHPRA segment
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            {DISTRIBUTION.map((d) => {
              const Icon = d.icon
              return (
                <div key={d.label} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-emerald-700" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Live</p>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight mb-1">{d.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.detail}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* LOOK AROUND — further reading */}
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-4">
            Look around
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/courses/cpd-record/passive" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors flex items-start gap-3">
              <Stethoscope className="w-4 h-4 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Passive-CPD demo</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Confirmation prompt + per-Board honest ceiling + event timeline.</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent shrink-0 mt-1" />
            </Link>
            <Link href="/courses/cpd-record/requirements" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors flex items-start gap-3">
              <Database className="w-4 h-4 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Per-Board AHPRA reference</p>
                <p className="text-xs text-muted-foreground leading-relaxed">All 17 Boards / CPD Homes. Ceilings sourced against registration standards.</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent shrink-0 mt-1" />
            </Link>
            <Link href="/courses/how-we-vet" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Provider vetting policy</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Six-criterion review. The quality authority the vertical lacks.</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent shrink-0 mt-1" />
            </Link>
            <Link href="/courses/build-status" className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/40 transition-colors flex items-start gap-3">
              <Layers className="w-4 h-4 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">Build status</p>
                <p className="text-xs text-muted-foreground leading-relaxed">Shipped capabilities with clickable evidence. Honest split with roadmap.</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-accent shrink-0 mt-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
