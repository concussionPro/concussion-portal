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

const AI_COURSE_MODULES = [
  '01 · Compliance & Medicolegal Framework',
  '02 · Tool Selection & Data Sovereignty',
  '03 · Documentation Workflows (Compliant by Design)',
  '04 · Patient Communication & Documents',
  '05–08 · Specialty Deep Dives (Physio · Naturopathy · GP · Osteo)',
  '09 · Hub Onboarding & Certification',
]

const CCM_MODULES = [
  '01 · What is a Concussion?',
  '02 · Diagnosis & Initial Assessment',
  '03 · Practical Assessment & Acute Management',
  '04 · Persistent Post-Concussive Symptoms',
  '05 · Multidisciplinary Approach',
  '06 · Return to Play, Work, and School',
  '07 · Rehabilitation Pathways by Phenotype',
  '08 · Legal, Ethical, Communication & Documentation',
  '09–11 · SCAT6 + SCOAT6 + Clinical Scenarios',
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
          <div className="grid md:grid-cols-2 gap-4">
            {/* AI in Clinical Practice + Heidi Scribe — left, slightly emphasised */}
            <Link
              href="/courses/ai-in-clinical-practice"
              className="group rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/5 via-white to-white p-6 hover:border-accent/50 hover:shadow-lg transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-accent text-white">
                  <Sparkles className="w-3 h-3" />
                  Launching · Heidi recommended throughout
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground leading-tight mb-2">
                AI in Clinical Practice
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                AHPRA-aligned AI compliance for AU clinicians. <strong className="text-foreground">Heidi is the CEA-recommended AU scribe</strong> in every documentation module and specialty deep-dive. Every student touches Heidi as part of the curriculum.
              </p>
              <div className="rounded-lg bg-white/60 border border-slate-200 p-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Modules</p>
                <ul className="space-y-1">
                  {AI_COURSE_MODULES.map((m) => (
                    <li key={m} className="text-xs text-foreground/85 leading-snug">{m}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['9 modules', '40 prompts', '14 templates', 'Certification', '17 Boards calibrated'].map((s) => (
                  <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-auto text-sm font-bold text-accent group-hover:underline inline-flex items-center gap-1">
                Open the course
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Concussion Clinical Mastery — right */}
            <Link
              href="/learning"
              className="group rounded-2xl border border-slate-200 bg-white p-6 hover:border-accent/40 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Award className="w-3 h-3" />
                  Live · OA-endorsed · A$1,190
                </span>
              </div>
              <h2 className="text-2xl font-bold text-foreground leading-tight mb-2">
                Concussion Clinical Mastery
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Flagship 14-CPD-hour clinical course covering assessment, acute management, return-to-play protocols, persistent symptoms, and the SCAT6 + SCOAT6 instruments. Trading platform with AU clinician subscriber base.
              </p>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-2">Modules</p>
                <ul className="space-y-1">
                  {CCM_MODULES.map((m) => (
                    <li key={m} className="text-xs text-foreground/85 leading-snug">{m}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {['11 modules', '14 CPD hours', 'OA-endorsed', 'SCAT6 + SCOAT6', 'Certification'].map((s) => (
                  <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-auto text-sm font-bold text-accent group-hover:underline inline-flex items-center gap-1">
                Open the course
                <ArrowRight className="w-4 h-4" />
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

        {/* CLOSE — earn the 15 minutes, that's it */}
        <div className="rounded-2xl bg-foreground text-white p-6 text-center">
          <p className="text-2xl font-bold mb-4">Worth 15 minutes?</p>
          <a
            href="mailto:zac@concussion-education-australia.com?subject=Heidi%20%C3%97%20CEA"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            zac@concussion-education-australia.com
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  )
}
