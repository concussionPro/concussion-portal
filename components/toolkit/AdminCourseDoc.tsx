'use client'

import { FillableDoc, Fld } from './FillableDoc'
import type { AdminCourseModule } from '@/data/hub-program-content'
import { CheckCircle2, Clock } from 'lucide-react'

export function AdminCourseDoc({ modules }: { modules: AdminCourseModule[] }) {
  const totalMinutes = modules.reduce((acc, m) => acc + m.durationMinutes, 0)
  return (
    <FillableDoc storageKey="admin-course">
      <Cover totalMinutes={totalMinutes} moduleCount={modules.length} />
      <TableOfContents modules={modules} />
      {modules.map((m) => (
        <ModuleBlock key={m.slug} module={m} />
      ))}
      <Certificate moduleCount={modules.length} totalMinutes={totalMinutes} />
    </FillableDoc>
  )
}

function Cover({ totalMinutes, moduleCount }: { totalMinutes: number; moduleCount: number }) {
  return (
    <section className="bg-white rounded-2xl border border-accent/10 p-6 sm:p-10 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-after-page">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-full border-2 border-accent relative">
          <div className="absolute inset-[5px] rounded-full border-2 border-accent-dark" />
          <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-none">Concussion Education Australia</p>
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
            Concussion Clinical Mastery · Hub Program
          </p>
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent flex items-center gap-2 mb-4">
        <span className="w-6 h-0.5 bg-accent inline-block" />
        Hub Program · Asset Library
      </p>
      <h1 className="text-3xl sm:text-4xl font-bold text-foreground leading-[1.05] tracking-tight mb-3">
        Front-Desk Micro-Course
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl mb-4">
        A short, non-clinical training for reception and administration staff at concussion-trained clinics. Covers recognition, phone triage, red flags, intake, AI-safe documentation, the template library, and concussion-priority booking — with a 10-question knowledge check and a digital certificate at the end.
      </p>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <Stat label="Modules" value={`${moduleCount}`} />
        <Stat label="Total time" value={`~${Math.round(totalMinutes / 60 * 10) / 10} hr`} />
        <Stat label="Certificate" value="On pass" />
      </div>

      <div className="mt-5 rounded-lg bg-accent/[0.04] border border-accent/15 border-l-2 border-l-accent p-3 sm:p-4">
        <p className="text-xs text-foreground leading-relaxed">
          <strong>For:</strong> Reception, practice manager, administration. Not a clinical course. The course teaches admin staff to <em>recognise the pattern and route correctly</em> — not diagnose.
        </p>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
      <p className="text-lg font-bold text-foreground leading-none mb-1">{value}</p>
      <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground">{label}</p>
    </div>
  )
}

function TableOfContents({ modules }: { modules: AdminCourseModule[] }) {
  return (
    <section className="bg-white rounded-2xl border border-accent/10 p-5 sm:p-6 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-after-page">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3">Modules</p>
      <ol className="divide-y divide-accent/8">
        {modules.map((m) => (
          <li key={m.slug}>
            <a href={`#${m.slug}`} className="flex items-baseline gap-3 py-3 hover:text-accent transition-colors">
              <span className="text-[11px] font-mono text-accent w-7 shrink-0">
                {String(m.id).padStart(2, '0')}
              </span>
              <span className="text-sm font-semibold text-foreground flex-1">{m.title}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {m.durationMinutes} min
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

function ModuleBlock({ module: m }: { module: AdminCourseModule }) {
  return (
    <article id={m.slug} className="bg-white rounded-2xl border border-accent/10 p-6 sm:p-9 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-before-page">
      {/* Meta */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] uppercase tracking-[0.1em] font-bold bg-amber-500 text-white px-2 py-1 rounded">
          Module {m.id}
        </span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {m.durationMinutes} min
        </span>
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight mb-4">
        {m.title}
      </h2>

      {/* Learning outcomes */}
      <div className="rounded-lg bg-accent/[0.04] border border-accent/15 p-3 sm:p-4 mb-5">
        <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-accent mb-2">
          You will be able to
        </p>
        <ul className="space-y-1.5 text-[12.5px] text-foreground">
          {m.learningOutcomes.map((o, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Body */}
      <div className="space-y-1">
        {m.sections.map((s, i) => (
          <div key={i} className="my-3">
            {s.heading && (
              <h3 className="text-sm font-bold text-foreground tracking-tight mt-4 mb-1.5">{s.heading}</h3>
            )}
            {s.body.map((line, j) => (
              <p key={j} className="text-[13px] text-foreground leading-relaxed my-1.5">
                <ParsedText text={line} />
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Knowledge check */}
      {m.knowledgeCheck && <KnowledgeCheck check={m.knowledgeCheck} />}
    </article>
  )
}

function KnowledgeCheck({
  check,
}: {
  check: { question: string; options: string[]; correctIndex: number; rationale: string }
}) {
  return (
    <div className="mt-6 rounded-lg border border-accent/40 ring-1 ring-accent/20 bg-accent/[0.04] p-4 sm:p-5 print:break-inside-avoid">
      <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-accent mb-3">
        Knowledge check
      </p>
      <p className="text-[13px] font-semibold text-foreground mb-3 leading-snug">
        {check.question}
      </p>
      <ul className="space-y-1.5 mb-3">
        {check.options.map((opt, i) => {
          const isCorrect = i === check.correctIndex
          return (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`shrink-0 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center mt-0.5 ${
                isCorrect
                  ? 'bg-accent text-white border border-accent'
                  : 'bg-white border border-slate-300 text-slate-500'
              }`}>
                {String.fromCharCode(65 + i)}
              </span>
              <span className={`text-[12.5px] leading-snug ${isCorrect ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                {opt}
              </span>
            </li>
          )
        })}
      </ul>
      <details className="group">
        <summary className="cursor-pointer text-xs font-bold text-accent inline-flex items-center gap-1.5 list-none">
          <span className="group-open:hidden">Show rationale</span>
          <span className="hidden group-open:inline">Hide rationale</span>
        </summary>
        <div className="mt-2 pt-2 border-t border-dashed border-accent/30">
          <p className="text-[12px] text-muted-foreground leading-relaxed">{check.rationale}</p>
        </div>
      </details>
    </div>
  )
}

function Certificate({ moduleCount, totalMinutes }: { moduleCount: number; totalMinutes: number }) {
  return (
    <article className="bg-white rounded-2xl border border-accent/10 p-6 sm:p-10 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-before-page">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
        Certificate of completion
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-1">
        Front-Desk Concussion Workflow
      </h2>
      <p className="text-sm text-muted-foreground mb-6">
        {moduleCount} modules · ~{Math.round(totalMinutes / 60 * 10) / 10} hours · knowledge check pass mark 8/10
      </p>

      <div className="rounded-xl bg-gradient-to-br from-accent/8 via-white to-white border border-accent/25 ring-1 ring-accent/15 p-6 sm:p-8 my-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">This certifies that</p>
        <div className="mb-4">
          <Fld name="staff_name" placeholder="staff member name" />
        </div>

        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
          of <Fld name="clinic_name" placeholder="clinic name" />
        </p>

        <p className="text-[13px] text-foreground leading-relaxed mb-4">
          has successfully completed the <strong>Front-Desk Concussion Workflow</strong> micro-course — covering concussion recognition at reception, phone triage, red-flag protocols, intake form additions, AI-safe documentation, the template library, concussion-priority booking, and the 10-question knowledge check.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Date of completion</p>
            <Fld name="completion_date" placeholder="DD MMM YYYY" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Certificate ID</p>
            <Fld name="certificate_id" placeholder="CEA-FDC-XXXX" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 mt-6 pt-6 border-t border-accent/15 items-end">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Issued by</p>
            <p className="text-sm font-bold text-foreground">Zac Lewis</p>
            <p className="text-[11px] text-muted-foreground">Osteopath · Founder, Concussion Education Australia</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Endorsed by</p>
            <p className="text-sm font-bold text-foreground">Osteopathy Australia</p>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground italic leading-relaxed mt-4">
        This is a workflow micro-course for clinic admin staff. It is not formal CPD for clinical registration and does not certify clinical competency. The treating clinician retains responsibility for clinical decisions.
      </p>
    </article>
  )
}

function ParsedText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const regex = /\{([a-z_]+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    const name = match[1]
    parts.push(<Fld key={`${name}-${match.index}`} name={name} placeholder={name.replace(/_/g, ' ')} />)
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return <>{parts}</>
}
