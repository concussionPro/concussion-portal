import { Metadata } from 'next'
import { MODULES } from '@/lib/ai-course/content'
import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import { requireAiCourseAccess, AdminPreviewBadge } from '@/components/ai-course/CourseGate'
import { ClinicianMockDashboard } from '@/components/ai-course/ClinicianMockDashboard'
import { Library, FileQuestion, Award, ArrowRight, Wrench, BookMarked, PlayCircle, Clock, BookOpen, GraduationCap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'AI in Clinical Practice',
  description: 'AHPRA-aligned AI compliance course for Australian clinicians.',
  robots: 'noindex, nofollow',
}

export default async function CoursePage() {
  const access = await requireAiCourseAccess()
  const totalMin = MODULES.reduce((sum, m) => sum + m.durationMin, 0)
  const firstModule = MODULES[0]
  const totalHours = Math.round((totalMin / 60) * 10) / 10

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <ClinicianMockDashboard />
      <main className="md:pl-72">
        <div className="max-w-4xl mx-auto px-6 pt-[100px] pb-20">
          <AdminPreviewBadge access={access} />

          {/* DASHBOARD HEADER — course overview card with primary CTA */}
          <section className="mt-6 mb-8 rounded-2xl border-2 border-accent/30 bg-gradient-to-br from-accent/[0.04] to-white overflow-hidden">
            <div className="p-6 md:p-7">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Launches 1 June 2026
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  A$147
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 leading-tight">
                AI in Clinical Practice
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-2xl">
                For Australian clinicians using LLMs in patient care. Designed against AHPRA&rsquo;s 2024 AI guidance, the Australian Privacy Principles, and current indemnity-insurer positions (Avant, MIPS, Guild, MIGA).
              </p>

              {/* Stats strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Stat icon={BookOpen} value={String(MODULES.length)} label="Modules" />
                <Stat icon={Clock} value={`${totalHours}h`} label={`${totalMin} min`} />
                <Stat icon={GraduationCap} value="3" label="CPD hours" />
                <Stat icon={Award} value="1" label="Certificate" />
              </div>

              {/* Progress bar — mock 0% for demo */}
              <div className="rounded-lg bg-white border border-slate-200 p-4 mb-5">
                <div className="flex items-center justify-between mb-2 text-xs">
                  <span className="font-semibold text-foreground">Your progress</span>
                  <span className="text-slate-500 tabular-nums">0 / {MODULES.length} modules · 0%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-accent transition-all" style={{ width: '0%' }} />
                </div>
              </div>

              {/* Primary CTA */}
              <Link
                href={`/courses/ai-in-clinical-practice/${firstModule.slug}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors"
              >
                <PlayCircle className="w-4 h-4" />
                Start Module 1 → {firstModule.title}
              </Link>
            </div>
          </section>

          {/* CURRICULUM — compact module list */}
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
              Curriculum
            </p>
            <p className="text-[10px] text-muted-foreground tabular-nums">{MODULES.length} modules · {totalMin}m</p>
          </div>
          <div className="grid gap-2 mb-10">
            {MODULES.map((m) => (
              <Link
                key={m.slug}
                href={`/courses/ai-in-clinical-practice/${m.slug}`}
                className="group rounded-xl border border-slate-200 bg-white hover:border-accent/40 hover:shadow-sm transition-all flex items-center gap-3 px-4 py-3"
              >
                <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold tabular-nums bg-slate-100 text-slate-600 group-hover:bg-accent group-hover:text-white transition-colors">
                  {String(m.number).padStart(2, '0')}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground leading-tight">{m.title}</p>
                    {m.loadBearing && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{m.description}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-500">
                  {m.durationMin}m
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-accent shrink-0 transition-colors" />
              </Link>
            ))}
          </div>

          {/* Resource grid */}
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">
            Resources
          </p>
          <div className="grid gap-3 sm:grid-cols-3 mb-4">
            <ResourceCard
              href="/courses/ai-in-clinical-practice/hub"
              icon={Library}
              tag="AI Practice Hub"
              title="Prompts · Templates · Tools"
              note="40 prompts · 14 templates · 9 vendors in the tool comparison · live literature search"
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/toolkit"
              icon={Wrench}
              tag="Clinical Toolkit"
              title="Consent · de-id · audit · incident"
              note="10 clinician-grade artefacts designed to survive an AHPRA notification"
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/references"
              icon={BookMarked}
              tag="Reference Repository"
              title="AHPRA · OAIC · TGA · evidence"
              note="26 references + 8 podcasts/webinars · refreshed monthly"
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 mt-6">
            Certification
          </p>
          <div className="grid gap-3 sm:grid-cols-2 mb-8">
            <ResourceCard
              href="/courses/ai-in-clinical-practice/quiz"
              icon={FileQuestion}
              tag="Quiz"
              title="10 questions · 8/10 to pass"
              note="Issues the certificate on pass."
            />
            <ResourceCard
              href="/courses/ai-in-clinical-practice/certificate"
              icon={Award}
              tag="My Certificate"
              title="Download · verify"
              note="12-month validity · public verification URL · AHPRA log-entry template"
            />
          </div>

          {/* Footer disclaimer */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-xs text-slate-700">
            <p className="font-semibold mb-2">Education, not legal advice.</p>
            <p>
              This course is general clinical education for Australian registered health practitioners. It does not constitute legal advice. For case-specific guidance, consult your professional indemnity insurer (Avant, MIPS, Guild, MIGA) and, where appropriate, a regulatory lawyer. AHPRA and OAIC guidance referenced throughout is current as of the last content refresh — see the Hub update feed for the latest.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: string
  label: string
}) {
  return (
    <div className="rounded-lg bg-white border border-slate-200 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-accent" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-foreground tabular-nums leading-none">{value}</p>
    </div>
  )
}

function ResourceCard({
  href,
  icon: Icon,
  tag,
  title,
  note,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  tag: string
  title: string
  note: string
}) {
  return (
    <Link
      href={href}
      className="card rounded-xl p-4 hover:border-accent/40 transition-colors flex items-start gap-3"
    >
      <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-accent mb-1">{tag}</p>
        <p className="text-sm text-foreground font-semibold leading-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{note}</p>
      </div>
    </Link>
  )
}
