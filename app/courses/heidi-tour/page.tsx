import { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import {
  ArrowRight,
  BookOpen,
  Layers,
  Workflow,
  ShieldCheck,
  Database,
  Stethoscope,
  Award,
  Mic,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'CPD layer for Heidi Evidence + Scribe',
  robots: 'noindex, nofollow',
}

const BUILDS = [
  {
    icon: BookOpen,
    label: 'AI in Clinical Practice',
    tag: 'Course · 9 modules · launching',
    summary: 'AHPRA-aligned AI compliance course for AU clinicians. Privacy Act, APP 6/8/11, TGA, indemnity. Heidi is the recommended scribe throughout — every student touches Heidi as part of the curriculum.',
    stats: ['9 modules', '40 prompts', '14 templates', '17 Boards calibrated'],
    href: '/courses/ai-in-clinical-practice',
    cta: 'Open the course',
  },
  {
    icon: Layers,
    label: 'CPD vertical platform',
    tag: 'Marketplace · live · OA-endorsed',
    summary: 'Per-clinician audit log across providers. Six-criterion vetting policy. One-click AHPRA audit export. The shell that fixes the fragmented A$480M AU CPD market.',
    stats: ['Per-Board AHPRA reference', 'Marketplace shell', '1-click audit export'],
    href: '/courses',
    cta: 'Open the platform',
  },
  {
    icon: Workflow,
    label: 'Heidi-integration API',
    tag: 'POST /api/cpd/events · live',
    summary: 'Scribe + Evidence events → categoriser → AHPRA-tagged log entry. Validated JSON contract, curlable today. Reads from your existing event stream — no new UX, no replatforming.',
    stats: ['~2 eng-weeks Heidi side', '6-week joint MVP', 'Live API stub'],
    href: '/courses/integration',
    cta: 'See the integration',
  },
]

const METRICS = [
  { value: '17', label: 'AHPRA Boards encoded', detail: 'All 15 National Boards + RACGP + ACRRM CPD Homes' },
  { value: '50–100%', label: 'Passive CPD ceiling', detail: 'Calibrated per profession, sourced against registration standards' },
  { value: '~A$480M', label: 'AU CPD TAM', detail: 'Fragmented, no platform >30%, no quality authority' },
  { value: '~0', label: 'Marginal cost to Heidi', detail: 'Categoriser runs on event metadata only' },
]

const DISTRIBUTION = [
  {
    icon: Award,
    label: 'CCM (live)',
    detail: 'Live at A$1,190 · Osteopathy Australia endorsed · AU clinician subscriber base',
  },
  {
    icon: BookOpen,
    label: 'AI compliance course (launching)',
    detail: 'Launching publicly on the CEA portal · Heidi recommended as the AU scribe throughout',
  },
  {
    icon: Mic,
    label: 'OA Conference 2026 (confirmed speaker)',
    detail: 'Sea World Resort, Gold Coast · 16–17 October · concussion clinical talk · Heidi demoed live',
  },
]

const SHAPES = [
  {
    when: 'If you\'re building CPD internally',
    shape: 'Bring me on as Medical Lead to own the vertical. The CEA model becomes Heidi\'s education layer. CCM stays separate as my clinical specialty.',
  },
  {
    when: 'If you want speed + IP transfer',
    shape: 'Acquire the platform code, course IP, and subscriber relationship. I join to integrate it. Terms TBD on your timeline.',
  },
  {
    when: 'If you\'re testing the thesis first',
    shape: 'Partnership cross-promo. My AI course already recommends Heidi. Your product pushes CEA CPD. Zero cash, validates the channel.',
  },
]

export default async function HeidiTourPage() {
  const access = await requireAiCourseAccess()

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <div className="max-w-5xl mx-auto px-6 pt-[120px] pb-20">
        <AdminPreviewBadge access={access} />

        {/* HERO — short, descriptive, no positioning language */}
        <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-accent mb-3">
          CEA · CPD layer for Heidi
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-5 leading-[1.05] max-w-3xl">
          CPD layer for{' '}
          <span className="bg-gradient-to-r from-accent to-emerald-600 bg-clip-text text-transparent">Heidi Evidence + Scribe.</span>{' '}
          Built.
        </h1>

        {/* STRATEGIC INSIGHT — first thing they read, no CTA */}
        <div className="mb-12 rounded-2xl bg-gradient-to-br from-foreground to-slate-800 text-white p-7">
          <p className="text-lg font-semibold leading-snug mb-3">
            Heidi&rsquo;s Evidence tool is already a CPD engine. Every guideline review is literature-review CPD. Every Scribe session adds clinical reasoning. AHPRA already counts both.
          </p>
          <p className="text-sm text-white/85 leading-relaxed">
            Your AU users earn meaningful hours per year inside Heidi and log none of it. Scribe-only competitors (Abridge, Nabla, DeepScribe) can&rsquo;t replicate this — they have no Evidence equivalent.
          </p>
          <p className="text-sm font-semibold text-white/95 mt-4">
            Here&rsquo;s what that looks like as a working product:
          </p>
        </div>

        {/* THREE BUILDS — the execution tour */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {BUILDS.map((b) => {
            const Icon = b.icon
            return (
              <Link
                key={b.label}
                href={b.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 hover:border-accent/40 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">{b.tag}</p>
                    <h2 className="text-lg font-bold text-foreground leading-tight">{b.label}</h2>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-1">
                  {b.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {b.stats.map((s) => (
                    <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-semibold text-accent group-hover:underline inline-flex items-center gap-1">
                  {b.cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* METRICS BAND */}
        <div className="mb-12 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-4">
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

        {/* DISTRIBUTION PROOF — three live channels into the AU AHPRA segment */}
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-4">
            Three distribution channels into the AU AHPRA segment
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

        {/* SHAPES — framed as Heidi's decision based on their constraints */}
        <div className="mb-12">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-700 mb-4">
            Three ways this could work
          </p>
          <div className="space-y-3">
            {SHAPES.map((s) => (
              <div key={s.when} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                <p className="text-sm font-bold text-foreground mb-1.5">{s.when}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.shape}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QUICK LINKS — further reading, no CTAs */}
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

        {/* ONE CTA — at the end, mutual-discovery framing */}
        <div className="rounded-2xl bg-foreground text-white p-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent mb-2">
            Next step
          </p>
          <p className="text-base text-white/90 leading-relaxed mb-4 max-w-2xl mx-auto">
            15-minute call to decide which shape fits Heidi&rsquo;s roadmap. If the answer is no on all three, a 5-minute &ldquo;here&rsquo;s why not&rdquo; helps sharpen the next iteration.
          </p>
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
