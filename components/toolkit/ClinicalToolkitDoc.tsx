'use client'

import { FillableDoc, Fld, SignOffStamp } from './FillableDoc'
import type { DischargeTemplate } from '@/data/hub-program-content'
import { Lock, ArrowRight } from 'lucide-react'

interface Principles {
  title: string
  body: string[]
}

/**
 * `previewedSlugs` — when provided, only templates whose slug is in the array
 * render in full. Others render as a locked teaser card. Used for cold-pitch
 * prospect portals where only 1-2 templates are exposed. Omit for full paid
 * access.
 */
export function ClinicalToolkitDoc({
  templates,
  principles,
  previewedSlugs,
  previewSectionLimit,
  unlockHref = '/pricing',
  defaultValues,
  storageKey = 'clinical-toolkit',
  requireSignoff = false,
}: {
  templates: DischargeTemplate[]
  principles: Principles
  previewedSlugs?: string[]
  /** localStorage namespace for saved fills. Override per-context (e.g.
   *  per-patient) so one fill never bleeds into another. */
  storageKey?: string
  /** When set, visible templates render only this many body sections then
   *  show a "rest unlocks with Hub Program" card. Prevents the prospect
   *  from extracting a complete usable document. */
  previewSectionLimit?: number
  unlockHref?: string
  /** Pre-populated field values for prospect-branded previews. */
  defaultValues?: Record<string, string>
  /** Gate export behind a clinician review + sign-off (compliance). Off in
   *  prospect-preview mode (nothing exportable there anyway). */
  requireSignoff?: boolean
}) {
  const isPreviewMode = Array.isArray(previewedSlugs)
  const isVisible = (slug: string) => !isPreviewMode || previewedSlugs.includes(slug)
  // Preview = title/structure only. In preview mode the "visible" templates are
  // truncated to the structure-only lock (no copyable body, sign-off, or
  // compliance text) so prospects can't lift a usable document before paying.
  // Default to 0 sections in preview unless an explicit limit is given.
  const effectiveSectionLimit = isPreviewMode ? (previewSectionLimit ?? 0) : previewSectionLimit
  return (
    <FillableDoc storageKey={storageKey} defaultValues={defaultValues} previewMode={isPreviewMode} requireSignoff={requireSignoff && !isPreviewMode}>
      <Cover isPreviewMode={isPreviewMode} templateCount={templates.length} />
      <TableOfContents templates={templates} isVisible={isVisible} />
      {templates.map((t) =>
        isVisible(t.slug)
          ? <TemplateBlock key={t.slug} template={t} sectionLimit={effectiveSectionLimit} unlockHref={unlockHref} />
          : <LockedTemplateCard key={t.slug} template={t} unlockHref={unlockHref} />
      )}
      <PrinciplesBlock principles={principles} />
    </FillableDoc>
  )
}

function LockedTemplateCard({ template, unlockHref }: { template: DischargeTemplate; unlockHref: string }) {
  return (
    <article id={template.slug} className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 mb-6 opacity-95 print:break-before-page">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <Lock className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[9px] uppercase tracking-[0.1em] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded">
              Locked · sample only
            </span>
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {template.estimatedReadMinutes} min
            </span>
          </div>
          <h2 className="text-lg font-bold text-foreground tracking-tight leading-tight mb-2">
            {template.title}
          </h2>
          <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-1">
            <strong className="text-foreground">When to use.</strong> {template.purpose}
          </p>
          <p className="text-[11.5px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Recipient:</strong> {template.audience}
          </p>
          <a
            href={unlockHref}
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-colors"
          >
            Unlock with Hub Program
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </article>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER
// ─────────────────────────────────────────────────────────────────────────────

function Cover({ isPreviewMode, templateCount }: { isPreviewMode?: boolean; templateCount: number }) {
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
        Clinical Toolkit
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
        {templateCount} concussion discharge and handover templates — structured against the 2023 Amsterdam Consensus Statement, AHPRA-aligned, and built for clinician sign-off. Each is fillable, then printed or saved to PDF on your clinic letterhead.
      </p>

      {!isPreviewMode && (
        <div className="mt-5 rounded-lg bg-accent/[0.04] border border-accent/15 border-l-2 border-l-accent p-3 sm:p-4">
          <p className="text-xs text-foreground leading-relaxed">
            <strong>Fillable:</strong> type directly into the highlighted fields and use <strong>Save as PDF</strong>. Fields with the same label (e.g. clinic name) fill together, and your entries are kept if you reload. <strong>Clear fields</strong> resets the document. Every clinical template carries a sign-off block and a compliance &amp; disclaimer note.
          </p>
        </div>
      )}
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE OF CONTENTS
// ─────────────────────────────────────────────────────────────────────────────

function TableOfContents({
  templates,
  isVisible,
}: {
  templates: DischargeTemplate[]
  isVisible: (slug: string) => boolean
}) {
  return (
    <section className="bg-white rounded-2xl border border-accent/10 p-5 sm:p-6 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-after-page">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3">
        Contents
      </p>
      <ol className="divide-y divide-accent/8">
        {templates.map((t, i) => (
          <li key={t.slug}>
            <a
              href={`#${t.slug}`}
              className={`flex items-baseline gap-3 py-3 transition-colors ${isVisible(t.slug) ? 'hover:text-accent' : 'opacity-65 hover:opacity-90'}`}
            >
              <span className="text-[11px] font-mono text-accent w-7 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-sm font-semibold text-foreground flex-1 inline-flex items-center gap-1.5">
                {t.title}
                {!isVisible(t.slug) && <Lock className="w-3 h-3 text-amber-600" />}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.estimatedReadMinutes} min
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE BLOCK
// ─────────────────────────────────────────────────────────────────────────────

function TemplateBlock({
  template,
  sectionLimit,
  unlockHref = '/pricing',
}: {
  template: DischargeTemplate
  sectionLimit?: number
  unlockHref?: string
}) {
  const totalSections = template.sections.length
  // `!= null` (not truthy) so a limit of 0 truncates EVERYTHING — title +
  // structure lock only, no body. A plain `sectionLimit ?` treated 0 as "no
  // limit" and leaked the full template into the prospect preview.
  const sectionsToRender = sectionLimit != null
    ? template.sections.slice(0, sectionLimit)
    : template.sections
  const hiddenSectionCount = totalSections - sectionsToRender.length
  const isTruncated = hiddenSectionCount > 0
  return (
    <article id={template.slug} className="bg-white rounded-2xl border border-accent/10 p-6 sm:p-9 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-before-page">
      {/* Letterhead */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-foreground pb-3 mb-5">
        <div className="min-w-0">
          <Fld name="clinic_name" placeholder="Clinic name" />
          <p className="text-[9px] uppercase tracking-[0.1em] text-muted-foreground mt-1.5">
            Concussion-trained clinic · trained via Concussion Education Australia
          </p>
        </div>
        <div className="shrink-0 text-[8px] uppercase tracking-[0.12em] text-amber-600 border border-amber-300 rounded px-2 py-1">
          Confidential · health information
        </div>
      </header>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] uppercase tracking-[0.1em] font-bold bg-accent-dark text-white px-2 py-1 rounded">
          Clinical toolkit
        </span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {template.estimatedReadMinutes} min read
        </span>
        {isTruncated && (
          <span className="text-[9px] uppercase tracking-wider font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded">
            Excerpt only
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight mb-3">
        {template.title}
      </h2>

      {/* Purpose + audience */}
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-1">
        <strong className="text-foreground">When to use.</strong> {template.purpose}
      </p>
      <p className="text-[13px] text-muted-foreground leading-relaxed mb-4">
        <strong className="text-foreground">Recipient:</strong> {template.audience}
      </p>

      {/* Pre-issue checklist */}
      <PreIssueChecklist />

      {/* Body — full render only if NOT truncated; preview mode shows nothing */}
      {!isTruncated && (
        <div className="mt-5 space-y-1">
          {sectionsToRender.map((section, i) => (
            <SectionRenderer key={i} heading={section.heading} body={section.body} />
          ))}
        </div>
      )}

      {isTruncated && (
        <TruncatedSectionLock
          template={template}
          unlockHref={unlockHref}
        />
      )}

      {/* Sign-off + compliance footer are part of the full template — hidden
          in excerpt mode to prevent the prospect from extracting a complete
          usable document. */}
      {!isTruncated && (
        <>
          <SignOffBlock />
          <ComplianceFooter items={template.complianceFooter} />
        </>
      )}
    </article>
  )
}

function TruncatedSectionLock({
  template,
  unlockHref,
}: {
  template: DischargeTemplate
  unlockHref: string
}) {
  const headings = template.sections.map((s) => s.heading).filter(Boolean) as string[]
  return (
    <div className="mt-6 rounded-xl bg-amber-50/60 border border-amber-200 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4 text-amber-700" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground mb-1">
            Full template content locked
          </p>
          <p className="text-[12px] text-muted-foreground leading-relaxed mb-3">
            This preview shows the structure only. Section headings are listed below — full editable body, fillable patient fields, sign-off block and AHPRA-aligned compliance footer activate per clinician with the Hub Program.
          </p>
          {headings.length > 0 && (
            <ul className="space-y-1 text-[12px] text-muted-foreground mb-4">
              {headings.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Lock className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                  <span>{h.replace(/\{[a-z_]+\}/g, '[merge field]')}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <Lock className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                <span>Practitioner sign-off block</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                <span>AHPRA-aligned compliance &amp; disclaimer footer</span>
              </li>
            </ul>
          )}
          <a
            href={unlockHref}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-colors"
          >
            Unlock the full template →
          </a>
        </div>
      </div>
    </div>
  )
}

function PreIssueChecklist() {
  return (
    <div className="rounded-lg bg-accent/[0.04] border border-accent/15 p-3 sm:p-4 my-4">
      <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-accent mb-2">
        Before you issue — clinician checklist
      </p>
      <ul className="space-y-1.5 text-[12px] text-foreground">
        {[
          'Every field completed — no blanks or {braces} left in.',
          'Reviewed, signed and dated by the treating clinician.',
          'Patient / guardian consent obtained to share with this recipient.',
          'A signed copy retained in the patient record.',
        ].map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="shrink-0 w-3 h-3 mt-0.5 border border-accent rounded-sm" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function SectionRenderer({ heading, body }: { heading?: string; body: string[] }) {
  return (
    <div className="my-3">
      {heading && (
        <h3 className="text-sm font-bold text-foreground tracking-tight mt-4 mb-1.5">
          <ParsedText text={heading} />
        </h3>
      )}
      {body.map((line, i) => (
        <p key={i} className="text-[13px] text-foreground leading-relaxed my-1.5">
          <ParsedText text={line} />
        </p>
      ))}
    </div>
  )
}

/**
 * Parses {field_name} placeholders in the text and renders Fld inputs in their place.
 * Everything else is rendered as plain text.
 */
function ParsedText({ text }: { text: string }) {
  const parts: React.ReactNode[] = []
  const regex = /\{([a-z_]+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const name = match[1]
    parts.push(
      <Fld
        key={`${name}-${match.index}`}
        name={name}
        placeholder={name.replace(/_/g, ' ')}
      />
    )
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return <>{parts}</>
}

function SignOffBlock() {
  return (
    <div className="mt-8 print:break-inside-avoid">
      <SignOffStamp />
      <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1.4fr_0.8fr] gap-6 mt-3">
      <div>
        <div className="h-9 border-b-2 border-foreground" />
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1.5">
          Practitioner signature
        </p>
      </div>
      <div>
        <div className="h-9 border-b-2 border-foreground" />
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1.5">
          Name &amp; AHPRA registration no.
        </p>
      </div>
      <div>
        <div className="h-9 border-b-2 border-foreground" />
        <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1.5">
          Date
        </p>
      </div>
      </div>
    </div>
  )
}

function ComplianceFooter({ items }: { items: string[] }) {
  return (
    <div className="mt-6 rounded-lg bg-slate-900 text-slate-100 p-4 sm:p-5 print:bg-slate-100 print:text-slate-700 print:border print:border-slate-300">
      <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-accent mb-2">
        Compliance &amp; disclaimer
      </p>
      <div className="space-y-1.5 text-[11.5px] leading-relaxed">
        {items.map((item, i) => (
          <p key={i}>
            <ParsedText text={item} />
          </p>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PRINCIPLES — global documentation principles printed at the back
// ─────────────────────────────────────────────────────────────────────────────

function PrinciplesBlock({ principles }: { principles: Principles }) {
  return (
    <article className="bg-white rounded-2xl border border-accent/10 p-6 sm:p-9 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-before-page">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-2">
        Reference · global documentation principles
      </p>
      <h2 className="text-2xl font-bold text-foreground tracking-tight mb-4">
        {principles.title}
      </h2>
      <div className="space-y-3 text-[13px] text-foreground leading-relaxed">
        {principles.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground italic mt-5 leading-relaxed">
        Not a substitute for the clinic&rsquo;s own indemnity insurer review. The clinic&rsquo;s PI insurer (Avant / Guild / MIPS) should sign off on the local-letterhead version before issue.
      </p>
    </article>
  )
}
