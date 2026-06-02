'use client'

import { FillableDoc, Fld } from './FillableDoc'
import type { OutreachTemplate } from '@/data/hub-program-content'
import { Lock, ArrowRight } from 'lucide-react'

/**
 * `previewedSlugs` — when provided, only templates in the array render in full.
 * Others render as locked teasers. Used by cold-pitch prospect portals.
 */
export function OutreachToolkitDoc({
  templates,
  previewedSlugs,
  unlockHref = '/pricing',
  defaultValues,
}: {
  templates: OutreachTemplate[]
  previewedSlugs?: string[]
  unlockHref?: string
  defaultValues?: Record<string, string>
}) {
  const isPreviewMode = Array.isArray(previewedSlugs)
  const isVisible = (slug: string) => !isPreviewMode || previewedSlugs.includes(slug)
  return (
    <FillableDoc storageKey="outreach-kit" defaultValues={defaultValues}>
      <Cover />
      <TableOfContents templates={templates} isVisible={isVisible} />
      {templates.map((t) =>
        isVisible(t.slug)
          ? <OutreachBlock key={t.slug} template={t} />
          : <LockedOutreachCard key={t.slug} template={t} unlockHref={unlockHref} />
      )}
    </FillableDoc>
  )
}

function LockedOutreachCard({ template, unlockHref }: { template: OutreachTemplate; unlockHref: string }) {
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
              {template.channel.replace('-', ' ')}
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

function Cover() {
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
        Outreach Kit
      </h1>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
        Six referral-building templates for the post-training outreach push. Edit fields per recipient, run as a sequenced campaign across schools, clubs and GP practices in your catchment.
      </p>

      <div className="mt-5 rounded-lg bg-accent/[0.04] border border-accent/15 border-l-2 border-l-accent p-3 sm:p-4">
        <p className="text-xs text-foreground leading-relaxed">
          <strong>Fillable:</strong> populate clinic name, contact details, recipient names. Same-name fields fill together; entries persist on reload. <strong>Clear fields</strong> resets between recipients.
        </p>
      </div>
    </section>
  )
}

function TableOfContents({
  templates,
  isVisible,
}: {
  templates: OutreachTemplate[]
  isVisible: (slug: string) => boolean
}) {
  return (
    <section className="bg-white rounded-2xl border border-accent/10 p-5 sm:p-6 mb-6 shadow-sm print:shadow-none print:border-0 print:rounded-none print:break-after-page">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3">Contents</p>
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
                {t.channel.replace('-', ' ')}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  )
}

function OutreachBlock({ template }: { template: OutreachTemplate }) {
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
        <div className="shrink-0 text-[8px] uppercase tracking-[0.12em] text-slate-600 border border-slate-300 rounded px-2 py-1">
          Outreach template
        </div>
      </header>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[9px] uppercase tracking-[0.1em] font-bold bg-slate-800 text-white px-2 py-1 rounded">
          Outreach kit
        </span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {template.channel.replace('-', ' ')}
        </span>
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

      {/* Subject line for email templates */}
      {template.subject && (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5 mb-4">
          <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Subject line</p>
          <p className="text-[13px] font-semibold text-foreground">
            <ParsedText text={template.subject} />
          </p>
        </div>
      )}

      {/* Body */}
      <div className="mt-4 space-y-1">
        {template.sections.map((section, i) => (
          <div key={i} className="my-3">
            {section.heading && (
              <h3 className="text-sm font-bold text-foreground tracking-tight mt-4 mb-1.5">
                <ParsedText text={section.heading} />
              </h3>
            )}
            {section.body.map((line, j) => (
              <p key={j} className="text-[13px] text-foreground leading-relaxed my-1.5">
                <ParsedText text={line} />
              </p>
            ))}
          </div>
        ))}
      </div>

      {/* Follow-up schedule */}
      {template.followUpSchedule && template.followUpSchedule.length > 0 && (
        <FollowUpSchedule schedule={template.followUpSchedule} />
      )}

      {/* Compliance note (advertising-aware) */}
      <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 p-4 print:break-inside-avoid">
        <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-slate-700 mb-2">
          Advertising compliance note
        </p>
        <p className="text-[11.5px] text-slate-600 leading-relaxed">
          This outreach material describes the clinic&rsquo;s capability and training. No specific clinical-outcome claims, comparative statements about other providers, or testimonials about treatment results are included. AHPRA advertising guidelines (s.133 National Law) apply — review any locally-added testimonials or claims before sending. Use the clinic letterhead and treating clinician name on outbound copies.
        </p>
      </div>
    </article>
  )
}

function FollowUpSchedule({ schedule }: { schedule: { day: number; action: string }[] }) {
  return (
    <div className="mt-5 print:break-inside-avoid">
      <p className="text-[9px] uppercase tracking-[0.14em] font-bold text-accent mb-2">
        Follow-up schedule
      </p>
      <table className="w-full text-[12px]">
        <tbody>
          {schedule.map((row, i) => (
            <tr key={i} className="border-t border-accent/8">
              <td className="py-2 pr-3 font-mono text-[11px] text-accent whitespace-nowrap w-20 align-top">
                +{row.day} day{row.day !== 1 ? 's' : ''}
              </td>
              <td className="py-2 text-foreground leading-snug">
                <ParsedText text={row.action} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
