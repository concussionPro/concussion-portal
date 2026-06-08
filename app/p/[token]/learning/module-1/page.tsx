/**
 * Dynamic Module 1 trial preview for EVERY prospect.
 *
 * Cloned from /proposals/advanced-health-buderim/learning/module-1 but
 * with every hardcoded "Advanced Health" / "Buderim" / "ah2026" replaced
 * with values from the clinic row keyed by token + access key. Every
 * link routes back into /p/[token]/*, never the hardcoded Lauren
 * portal. Stops the "Module 1 link bounces to /scat-mastery" failure
 * that was kicking prospects out of the proposal demo.
 *
 * Print-suppression CSS prevents Cmd+P save-as-PDF leakage of trial
 * content. Auth gate: access key must match clinic.accessKey, else
 * the access wall is shown.
 */
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Home, BookOpen, Brain, Activity, FileText, Library, BookMarked, Lock,
  ArrowLeft, ArrowUpRight, ExternalLink, Clock, Award, CheckCircle2,
  TrendingUp, Stethoscope,
} from 'lucide-react'
import { modules } from '@/data/modules'
import { getClinicBySlug } from '@/lib/prospect/repo'
import { AccessWall } from '@/components/prospect/ProspectLanding'

// 6 sections + 3 quiz questions ≈ 10 minutes of reading on Module 1
// (was 3 — too thin per Zac feedback). 6 covers myths/objectives,
// definition + classification, pathophysiology basics, biomechanics,
// red flags, and on-field recognition — enough for the prospect to
// gauge clinical depth before the locked content gate.
const TRIAL_SECTION_COUNT = 6
const TRIAL_QUIZ_COUNT = 3

const PREVIEW_PRINT_CSS = `
  @media print {
    body * { visibility: hidden !important; }
    body::before {
      content: "Module 1 trial preview — full Concussion Clinical Mastery (8 modules, 14 CPD hrs) activates with the Hub Program. portal.concussion-education-australia.com";
      visibility: visible !important;
      display: block !important;
      padding: 24px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 13px !important;
      line-height: 1.6 !important;
      color: #1a2332 !important;
    }
  }
`

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>
}): Promise<Metadata> {
  const { token } = await params
  const clinic = await getClinicBySlug(token)
  return {
    title: clinic ? `Module 1 trial — ${clinic.shortName}` : 'Module 1 trial',
    description: clinic
      ? `Module 1 trial preview for ${clinic.name}.`
      : 'Module 1 trial preview.',
    robots: 'noindex, nofollow',
  }
}

export default async function ProspectModuleOneTrial({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>
  searchParams: Promise<{ k?: string }>
}) {
  const { token } = await params
  const { k } = await searchParams
  const clinic = await getClinicBySlug(token)
  if (!clinic) notFound()
  if (k !== clinic.accessKey) return <AccessWall clinicName={clinic.name} />

  const m1 = modules.find((m) => m.id === 1)
  if (!m1) notFound()

  const trialSections = m1.sections.slice(0, TRIAL_SECTION_COUNT)
  const lockedSections = m1.sections.slice(TRIAL_SECTION_COUNT)
  const slug = clinic.slug
  const ak = clinic.accessKey

  return (
    <div className="flex min-h-screen dashboard-bg">
      <style dangerouslySetInnerHTML={{ __html: PREVIEW_PRINT_CSS }} />
      <ProspectSidebar
        slug={slug}
        accessKey={ak}
        clinicShortName={clinic.shortName}
        clinicCity={clinic.city}
        clinicState={clinic.state}
      />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/p/${slug}/learning?k=${ak}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors mb-4"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Learning Suite
          </Link>

          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-1">
            Module 1 of 8 · Trial preview
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight leading-tight mb-1">
            {m1.title}
          </h1>
          <p className="text-sm text-muted-foreground mb-2">{m1.subtitle}</p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{m1.duration}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Award className="w-3 h-3" />{m1.points} CPD hr</span>
            <span>·</span>
            <span>AHPRA-aligned</span>
          </div>

          {/* Trial content */}
          <div className="space-y-6">
            {trialSections.map((section, idx) => (
              <SectionBlock key={section.id} sectionNumber={idx + 1} title={section.title} content={section.content} />
            ))}
          </div>

          {/* QUIZ CHECKPOINTS — multiple questions so the prospect can
              actually engage with the clinical reasoning, not just see one */}
          {m1.quiz?.length ? (
            <div className="space-y-4 mt-8">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">
                Knowledge checkpoints · {Math.min(TRIAL_QUIZ_COUNT, m1.quiz.length)} of {m1.quiz.length}
              </p>
              {m1.quiz.slice(0, TRIAL_QUIZ_COUNT).map((q, qi) => (
                <QuizCheckpoint
                  key={q.id}
                  question={q}
                  questionNumber={qi + 1}
                  totalShown={Math.min(TRIAL_QUIZ_COUNT, m1.quiz.length)}
                  totalAvailable={m1.quiz.length}
                />
              ))}
            </div>
          ) : null}

          {/* Locked sections preview */}
          <div className="glass-premium rounded-2xl p-5 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-slate-400" />
              <p className="stat-label mb-0">{lockedSections.length} more sections · locked</p>
            </div>
            <ul className="space-y-1.5 text-xs text-muted-foreground">
              {lockedSections.slice(0, 6).map((s) => (
                <li key={s.id} className="flex items-center gap-2">
                  <Lock className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{s.title}</span>
                </li>
              ))}
              {lockedSections.length > 6 && (
                <li className="text-[11px] italic pl-5">+ {lockedSections.length - 6} more sections</li>
              )}
            </ul>
          </div>

          <EndOfTrialPitch
            slug={slug}
            accessKey={ak}
            clinicShortName={clinic.shortName}
            clinicRegion={clinic.region || clinic.city || clinic.state}
          />
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Components
// ─────────────────────────────────────────────────────────────────────────────

function QuizCheckpoint({
  question,
  questionNumber,
  totalShown,
  totalAvailable,
}: {
  question: { id: string; question: string; options: string[]; correctAnswer: number; explanation: string }
  questionNumber: number
  totalShown: number
  totalAvailable: number
}) {
  return (
    <section>
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-5 sm:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-200/60 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-amber-700" strokeWidth={2.2} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-800">
            Checkpoint {questionNumber} of {totalShown} · {totalAvailable - totalShown} more in full Module 1
          </p>
        </div>
        <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug mb-4">
          {question.question}
        </h3>
        <div className="space-y-2 mb-4">
          {question.options.map((opt, i) => (
            <div
              key={i}
              className="rounded-lg bg-white/70 border border-amber-200/70 px-3 py-2.5 text-[13px] text-foreground leading-snug"
            >
              <span className="text-[10px] font-bold text-amber-700 mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </div>
          ))}
        </div>
        <details className="group">
          <summary className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-700 text-white text-xs font-bold hover:bg-amber-800 transition-colors list-none">
            <span className="group-open:hidden">Reveal answer</span>
            <span className="hidden group-open:inline">Hide answer</span>
          </summary>
          <div className="mt-4 rounded-lg bg-white/80 border border-emerald-300 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Correct answer: {String.fromCharCode(65 + question.correctAnswer)}
              </p>
            </div>
            <p className="text-sm text-foreground leading-relaxed">{question.explanation}</p>
          </div>
        </details>
      </div>
    </section>
  )
}

function SectionBlock({
  sectionNumber, title, content,
}: { sectionNumber: number; title: string; content: string[] }) {
  return (
    <article className="glass-premium rounded-2xl p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <span className="text-[11px] font-bold text-accent">1.{sectionNumber}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="prose prose-sm max-w-none">
        {content.map((line, i) => <ContentLine key={i} line={line} />)}
      </div>
    </article>
  )
}

function ContentLine({ line }: { line: string }) {
  const calloutMatch = line.match(/^\[CALLOUT:\s*(\w+)\s*\|\s*([\s\S]+)\]$/)
  if (calloutMatch) {
    return (
      <div className="rounded-lg border-l-2 border-l-accent bg-accent/5 px-4 py-3 my-3">
        <p className="text-[13px] text-foreground leading-relaxed">{calloutMatch[2]}</p>
      </div>
    )
  }
  if (line.startsWith('### ')) return <h3 className="text-base font-bold text-foreground mt-4 mb-2">{line.slice(4)}</h3>
  if (line.startsWith('## ')) return <h3 className="text-base font-bold text-foreground mt-4 mb-2">{line.slice(3)}</h3>
  if (/^\s*-\s+/.test(line)) {
    return (
      <li className="text-[13px] text-foreground leading-relaxed list-disc ml-5 mb-1">
        {line.replace(/^\s*-\s+/, '')}
      </li>
    )
  }
  if (line.startsWith('⚠️')) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 my-3">
        <p className="text-[13px] text-amber-900 leading-relaxed">{line}</p>
      </div>
    )
  }
  const labelMatch = line.match(/^([A-Z][A-Z\s&-]+):\s+(.+)$/)
  if (labelMatch) {
    return (
      <p className="text-[13px] text-foreground leading-relaxed my-2">
        <span className="font-bold text-accent">{labelMatch[1]}:</span> {labelMatch[2]}
      </p>
    )
  }
  return <p className="text-[13px] text-foreground leading-relaxed my-2">{line}</p>
}

function EndOfTrialPitch({
  slug, accessKey, clinicShortName, clinicRegion,
}: {
  slug: string; accessKey: string; clinicShortName: string; clinicRegion: string
}) {
  return (
    <section className="mt-10 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-accent/8 via-accent/5 to-white border border-accent/25 ring-1 ring-accent/15 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">
            End of Module 1 trial
          </p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-3">
          Become the concussion hub for {clinicRegion}.
        </h2>
        <p className="text-sm text-foreground leading-relaxed mb-5 max-w-xl">
          The next 7 modules cover diagnosis, acute management, PPCS, multidisciplinary care, return-to-play, phenotype-targeted rehab, and documentation. Every clinician at {clinicShortName} gets full access.
        </p>
        <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
          Why this region · why now
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <StatPill headline="~144k" label="Sport-related concussions in Australia / year" />
          <StatPill headline="~14%" label="Senior community AFL players concussed / season" />
          <StatPill headline="4–12%" label="Youth contact-sport athletes ≥1 / season" />
          <StatPill headline="60+" label={`Contact-sport clubs across ${clinicRegion}`} />
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <a
            href="https://cal.com/zac-lewis-so8zjs/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
          >
            Book call
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            Online program for {clinicShortName} · on-site Hub day is the next step.
          </p>
        </div>
      </div>
      <Link
        href={`/p/${slug}/learning?k=${accessKey}`}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to Learning Suite
      </Link>
    </section>
  )
}

function StatPill({ headline, label }: { headline: string; label: string }) {
  return (
    <div className="rounded-lg bg-white/80 border border-accent/15 px-3 py-2.5">
      <div className="flex items-center gap-1 mb-1">
        <TrendingUp className="w-3 h-3 text-accent" />
      </div>
      <p className="text-base font-bold text-foreground leading-tight">{headline}</p>
      <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">{label}</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — fully dynamic per prospect
// ─────────────────────────────────────────────────────────────────────────────

function ProspectSidebar({
  slug, accessKey, clinicShortName, clinicCity, clinicState,
}: {
  slug: string; accessKey: string; clinicShortName: string; clinicCity?: string | null; clinicState?: string | null
}) {
  const portalBase = `/p/${slug}`
  const ak = `k=${accessKey}`
  return (
    <div className="hidden md:flex fixed left-0 top-0 h-screen w-64 sidebar-premium p-6 flex-col z-40">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center shadow-md shadow-accent/15">
            <Brain className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            Concussion<span className="text-accent">Pro</span>
          </h1>
        </div>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{clinicShortName}</p>
        {(clinicCity || clinicState) && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {clinicCity}{clinicCity && clinicState ? ', ' : ''}{clinicState}
          </p>
        )}
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem href={`${portalBase}?${ak}`} label="Dashboard" icon={Home} />
        <SidebarItem href={`${portalBase}/learning?${ak}`} label="Learning Suite" icon={BookOpen} active />
        <SidebarItem href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <SidebarItem href="/preseason" label="Baseline Testing" icon={TrendingUp} external />
        <SidebarItem href={`${portalBase}/references?${ak}`} label="Reference Library" icon={Library} />
        <SidebarItem href={`${portalBase}/toolkit/clinical?${ak}`} label="Clinical Toolkit" icon={FileText} />
        <SidebarItem href={`${portalBase}/toolkit/outreach?${ak}`} label="Outreach Kit" icon={Stethoscope} />
        <SidebarItem href={`${portalBase}/toolkit/admin?${ak}`} label="Admin Workflow" icon={BookMarked} />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 14 CPD hrs</p>
      </div>
    </div>
  )
}

function SidebarItem({
  href, label, icon: Icon, active, locked, external,
}: {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  active?: boolean
  locked?: boolean
  external?: boolean
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all relative text-sm font-medium'
  if (locked) {
    return (
      <div className={`${base} opacity-50 text-muted-foreground cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
        <span>{label}</span>
        <Lock className="w-3 h-3 ml-auto text-muted-foreground/60" />
      </div>
    )
  }
  if (active) {
    return (
      <div className={`${base} bg-accent/8 text-accent font-semibold cursor-default`}>
        <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
        <span>{label}</span>
      </div>
    )
  }
  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener' : undefined}
      className={`${base} text-muted-foreground hover:text-foreground hover:bg-white/40`}
    >
      <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
      <span>{label}</span>
      {external && <ExternalLink className="w-3 h-3 ml-auto opacity-50" />}
    </a>
  )
}
