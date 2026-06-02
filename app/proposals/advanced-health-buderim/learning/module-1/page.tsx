import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Home,
  BookOpen,
  Brain,
  Activity,
  FileText,
  Library,
  BookMarked,
  Lock,
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  Clock,
  Award,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react'
import { modules } from '@/data/modules'

const ACCESS_KEY = 'ah2026'

const CLINIC = {
  shortName: 'Advanced Health',
  city: 'Buderim',
  region: 'Sunshine Coast',
  state: 'QLD',
  contactFirstName: 'Lauren',
}

// Trial scope: first 3 sections only (intro/myths, learning objectives, introduction)
// Real Module 1 has many more sections + a quiz. The rest is locked.
const TRIAL_SECTION_COUNT = 3

export const metadata: Metadata = {
  title: 'Module 1 Trial — Advanced Health Hub Preview',
  description: 'Module 1 trial preview for Advanced Health Pain & Injury Clinic.',
  robots: 'noindex, nofollow',
}

export default async function ProspectModuleOneTrial({
  searchParams,
}: {
  searchParams: Promise<{ k?: string }>
}) {
  const { k } = await searchParams
  if (k !== ACCESS_KEY) {
    return (
      <div className="min-h-screen dashboard-bg flex items-center justify-center p-6">
        <div className="max-w-md w-full glass-premium rounded-2xl p-8 text-center">
          <h1 className="text-xl font-bold text-foreground mb-3">Private proposal portal</h1>
          <p className="text-sm text-muted-foreground">Access requires the link from Zac&rsquo;s introductory email.</p>
        </div>
      </div>
    )
  }

  const m1 = modules.find((m) => m.id === 1)!
  const trialSections = m1.sections.slice(0, TRIAL_SECTION_COUNT)
  const lockedSections = m1.sections.slice(TRIAL_SECTION_COUNT)

  return (
    <div className="flex min-h-screen dashboard-bg">
      <ProspectSidebar />
      <main className="flex-1 ml-0 md:ml-64">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
          <Link
            href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`}
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

          {/* QUIZ CHECKPOINT — first myth question interactive */}
          <QuizCheckpoint
            question={m1.quiz[0]}
            totalMythQuestions={m1.quiz.filter((q) => q.id.startsWith('myth')).length}
            totalQuizQuestions={m1.quiz.length}
          />

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

          {/* End-of-trial pitch — economics surface AFTER the material */}
          <EndOfTrialPitch />
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// QUIZ CHECKPOINT — first myth question with reveal-on-click
// ─────────────────────────────────────────────────────────────────────────────

function QuizCheckpoint({
  question,
  totalMythQuestions,
  totalQuizQuestions,
}: {
  question: { id: string; question: string; options: string[]; correctAnswer: number; explanation: string }
  totalMythQuestions: number
  totalQuizQuestions: number
}) {
  return (
    <section className="mt-8">
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/40 p-5 sm:p-7 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-200/60 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-amber-700" strokeWidth={2.2} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-amber-800">
            Quiz checkpoint · question 1 of {totalMythQuestions} myth questions
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

        <p className="text-[11px] text-muted-foreground italic mt-4">
          {totalQuizQuestions - 1} more questions follow this checkpoint in Module 1 · activated with the full Hub Program.
        </p>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENT RENDERING — lightweight markdown-ish for trial sections
// ─────────────────────────────────────────────────────────────────────────────

function SectionBlock({
  sectionNumber,
  title,
  content,
}: {
  sectionNumber: number
  title: string
  content: string[]
}) {
  return (
    <article className="glass-premium rounded-2xl p-5 sm:p-7">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
          <span className="text-[11px] font-bold text-accent">1.{sectionNumber}</span>
        </div>
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      <div className="prose prose-sm max-w-none">
        {content.map((line, i) => (
          <ContentLine key={i} line={line} />
        ))}
      </div>
    </article>
  )
}

function ContentLine({ line }: { line: string }) {
  // Callout extraction: [CALLOUT: type | text]
  const calloutMatch = line.match(/^\[CALLOUT:\s*(\w+)\s*\|\s*([\s\S]+)\]$/)
  if (calloutMatch) {
    return (
      <div className="rounded-lg border-l-4 border-l-accent bg-accent/5 px-4 py-3 my-3">
        <p className="text-[13px] text-foreground leading-relaxed">{calloutMatch[2]}</p>
      </div>
    )
  }

  // Heading: ### or ##
  if (line.startsWith('### ')) {
    return <h3 className="text-base font-bold text-foreground mt-4 mb-2">{line.slice(4)}</h3>
  }
  if (line.startsWith('## ')) {
    return <h3 className="text-base font-bold text-foreground mt-4 mb-2">{line.slice(3)}</h3>
  }

  // Bullet list item
  if (/^\s*-\s+/.test(line)) {
    return (
      <li className="text-[13px] text-foreground leading-relaxed list-disc ml-5 mb-1">
        {line.replace(/^\s*-\s+/, '')}
      </li>
    )
  }

  // Quiz / interactive marker
  if (line.startsWith('⚠️')) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 my-3">
        <p className="text-[13px] text-amber-900 leading-relaxed">{line}</p>
      </div>
    )
  }

  // Labeled lines (DEFINITION: / CLASSIFICATION: / EPIDEMIOLOGY: etc)
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

// ─────────────────────────────────────────────────────────────────────────────
// END OF TRIAL PITCH — economics surface here, after they've engaged
// ─────────────────────────────────────────────────────────────────────────────

function EndOfTrialPitch() {
  return (
    <section className="mt-10 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-accent/8 via-accent/5 to-white border-2 border-accent/20 p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent">
            End of Module 1 trial
          </p>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight leading-tight mb-3">
          Become the concussion hub for the {CLINIC.region}.
        </h2>
        <p className="text-sm text-foreground leading-relaxed mb-5 max-w-xl">
          The next 7 modules cover diagnosis, acute management, PPCS, multidisciplinary care, return-to-play, phenotype-targeted rehab, and documentation. Every clinician at {CLINIC.shortName} gets full access.
        </p>

        <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-3">
          Why this region · why now
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <StatPill headline="~144k" label="Sport-related concussions in Australia / year" />
          <StatPill headline="~14%" label="Senior community AFL players concussed / season" />
          <StatPill headline="4–12%" label="Youth contact-sport athletes ≥1 / season" />
          <StatPill headline="60+" label={`Contact-sport clubs across ${CLINIC.region}`} />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <a
            href="https://cal.com/zac-lewis-so8zjs/30min"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-accent/90 transition-colors shadow-md"
          >
            Book call
            <ArrowUpRight className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-muted-foreground">
            Online program for {CLINIC.shortName} · on-site Hub day is the next step.
          </p>
        </div>
      </div>

      <Link
        href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`}
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
// SIDEBAR — matches the others
// ─────────────────────────────────────────────────────────────────────────────

function ProspectSidebar() {
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
        <p className="text-[0.65rem] text-muted-foreground ml-12 uppercase tracking-widest font-medium">
          Hub Program Preview
        </p>
      </div>

      <div className="glass-premium rounded-xl p-3 mb-6">
        <p className="text-[9px] uppercase tracking-wider font-bold text-accent mb-1">Prepared for</p>
        <p className="text-sm font-bold text-foreground leading-tight">{CLINIC.shortName}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{CLINIC.city}, {CLINIC.state}</p>
      </div>

      <nav className="flex-1 space-y-1">
        <SidebarItem href={`/proposals/advanced-health-buderim?k=${ACCESS_KEY}`} label="Dashboard" icon={Home} />
        <SidebarItem href={`/proposals/advanced-health-buderim/learning?k=${ACCESS_KEY}`} label="Learning Suite" icon={BookOpen} active />
        <SidebarItem href="/scat-forms" label="SCAT Forms" icon={Activity} external />
        <SidebarItem href="/preseason" label="Baseline Testing" icon={TrendingUp} external />
        <SidebarItem href={`/proposals/advanced-health-buderim/references?k=${ACCESS_KEY}`} label="Reference Library" icon={Library} />
        <SidebarItem href={`/proposals/advanced-health-buderim/toolkit/clinical?k=${ACCESS_KEY}`} label="Clinical Toolkit" icon={FileText} />
        <SidebarItem href={`/proposals/advanced-health-buderim/toolkit/admin?k=${ACCESS_KEY}`} label="Admin Workflow" icon={BookMarked} />
      </nav>

      <div className="pt-5 border-t border-white/30">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">AHPRA Aligned</p>
        <p className="text-[10px] text-muted-foreground">OA Endorsed · 14 CPD hrs</p>
      </div>
    </div>
  )
}

function SidebarItem({
  href,
  label,
  icon: Icon,
  active,
  locked,
  external,
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
        <div className="nav-active-indicator" />
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
