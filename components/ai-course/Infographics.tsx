'use client'

import {
  ShieldCheck,
  Shield,
  AlertTriangle,
  FileText,
  UserCheck,
  Hospital,
  Cloud,
  Check,
  X,
  ArrowRight,
} from 'lucide-react'

/**
 * Infographic library for the AI in Clinical Practice course. Each
 * component is self-contained, mobile-responsive, and uses lucide-react
 * icons + Tailwind classes consistent with the rest of the portal.
 *
 * Inject via the `[INFOGRAPHIC: <slug>]` marker in module markdown
 * (handled by ModuleViewer / InfographicRenderer).
 */

export function TierLadder() {
  const tiers = [
    {
      label: 'Tier A — Safe for PII',
      sub: 'Healthcare-purpose-built · AU residency · DPA',
      color: 'emerald',
      icon: ShieldCheck,
      examples: 'Heidi Health · Lyrebird Health · Halo Health · Dragon Copilot for Healthcare',
      use: 'Identifiable patient data. AI scribes. Clinical documentation with PHI.',
    },
    {
      label: 'Tier B — Cautious',
      sub: 'Enterprise LLM · AU region configurable · DPA required',
      color: 'amber',
      icon: Shield,
      examples: 'Azure OpenAI (Sydney) · AWS Bedrock (Sydney) · Vertex AI (Sydney)',
      use: 'Identifiable data when a Tier A tool is not available. Requires configured region + signed DPA.',
    },
    {
      label: 'Tier C — De-identified only',
      sub: 'Consumer LLM · no AU residency · no DPA',
      color: 'red',
      icon: AlertTriangle,
      examples: 'ChatGPT (Plus / Team) · Claude (Pro / Team) · Gemini · Perplexity',
      use: 'De-identified prompts only. NEVER paste identifiable patient data, even with consent.',
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Three-tier framework for LLM use in clinical practice
      </p>
      <div className="space-y-3">
        {tiers.map((t) => {
          const Icon = t.icon
          const ring = t.color === 'emerald'
            ? 'border-emerald-300 bg-emerald-50'
            : t.color === 'amber'
              ? 'border-amber-300 bg-amber-50'
              : 'border-red-300 bg-red-50'
          const iconClass = t.color === 'emerald'
            ? 'text-emerald-700'
            : t.color === 'amber'
              ? 'text-amber-700'
              : 'text-red-700'
          return (
            <div key={t.label} className={`rounded-xl border-2 p-4 ${ring}`}>
              <div className="flex items-start gap-3">
                <Icon className={`w-6 h-6 shrink-0 mt-0.5 ${iconClass}`} />
                <div className="flex-1">
                  <p className={`text-sm font-bold ${iconClass}`}>{t.label}</p>
                  <p className="text-xs text-muted-foreground mb-2">{t.sub}</p>
                  <p className="text-xs text-foreground mb-1.5"><strong>Examples:</strong> {t.examples}</p>
                  <p className="text-xs text-foreground"><strong>Use for:</strong> {t.use}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Default question for any task: <strong>does the prompt contain identifiable patient data?</strong> If yes → Tier A or B. If no (truly de-identified) → Tier C is acceptable.
      </p>
    </div>
  )
}

export function DataFlowDiagram() {
  const steps = [
    { icon: UserCheck, label: 'Patient', sub: 'Consent obtained, recorded' },
    { icon: Hospital, label: 'Clinician', sub: 'You — responsible party' },
    { icon: FileText, label: 'AI tool', sub: 'Tier A/B for PII · Tier C de-identified only' },
    { icon: Cloud, label: 'Vendor cloud', sub: 'AU residency or strict APP 8 review' },
    { icon: Check, label: 'Output', sub: 'Reviewed + signed by clinician before record' },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Data-flow for a compliant AI-assisted workflow
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2 items-start">
          {steps.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} className="relative flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <p className="text-xs font-bold text-foreground">{s.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.sub}</p>
                {i < steps.length - 1 && (
                  <ArrowRight className="hidden sm:block absolute -right-3 top-3 w-4 h-4 text-slate-300" />
                )}
              </div>
            )
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mt-4 text-center italic">
          Break any link in the chain and your AHPRA / APP exposure compounds.
        </p>
      </div>
    </div>
  )
}

export function ReviewAndSignWorkflow() {
  const steps = [
    {
      label: '1 · De-identify',
      body: 'Strip name, DOB, Medicare, address, third-party names. Keep age band + presenting complaint.',
      icon: Shield,
    },
    {
      label: '2 · Generate',
      body: 'LLM produces a draft using your prompt + de-identified facts. No clinical decision is made here.',
      icon: FileText,
    },
    {
      label: '3 · Verify',
      body: 'Read every line. Confirm findings match your clinical reasoning. Edit anything ambiguous.',
      icon: UserCheck,
    },
    {
      label: '4 · Sign + note AI use',
      body: 'Document attestation: "Drafted with AI assistance, reviewed by [clinician name, AHPRA reg]."',
      icon: Check,
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        The Review-and-Sign workflow
      </p>
      <ol className="space-y-2">
        {steps.map((s, i) => {
          const Icon = s.icon
          return (
            <li key={i} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.body}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function DocumentationDoDont() {
  const items = [
    {
      ok: true,
      text: '"Drafted with AI assistance, reviewed by Dr A. Practitioner, AHPRA reg. MED0001234. Date: 22 May 2026."',
      note: 'Specific clinician, registration, date. Defensible at audit.',
    },
    {
      ok: false,
      text: '"Note written by AI."',
      note: 'Implies no human review. AHPRA expectation breached.',
    },
    {
      ok: false,
      text: '"AI was used somewhere in this consult."',
      note: 'Too vague. Audit will not accept this.',
    },
    {
      ok: true,
      text: '"Patient consent for AI scribe obtained verbally and recorded; scribe transcript reviewed and edited by clinician before signing."',
      note: 'Consent + review + clinician signoff in one line.',
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Documentation: what is defensible
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((item, i) => (
          <div
            key={i}
            className={`rounded-lg border-2 p-3 ${item.ok ? 'border-emerald-300 bg-emerald-50' : 'border-red-300 bg-red-50'}`}
          >
            <div className="flex items-start gap-2 mb-2">
              {item.ok ? (
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <X className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
              )}
              <p className={`text-xs font-semibold ${item.ok ? 'text-emerald-900' : 'text-red-900'}`}>
                {item.ok ? 'Defensible' : 'Not defensible'}
              </p>
            </div>
            <p className="text-xs text-foreground italic mb-2">&ldquo;{item.text}&rdquo;</p>
            <p className="text-[11px] text-muted-foreground">{item.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InfoSheet({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="my-6 not-prose rounded-xl border-2 border-blue-200 bg-blue-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-blue-900 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground flex gap-2">
            <span className="text-blue-700 shrink-0">→</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Renders an infographic by slug. Used by the markdown parser when it
 * encounters a `[INFOGRAPHIC: <slug>]` marker.
 */
export function InfographicRenderer({ slug }: { slug: string }) {
  switch (slug) {
    case 'tier-ladder':
      return <TierLadder />
    case 'data-flow':
      return <DataFlowDiagram />
    case 'review-and-sign':
      return <ReviewAndSignWorkflow />
    case 'documentation-do-dont':
      return <DocumentationDoDont />
    default:
      return (
        <div className="my-4 p-3 rounded-md bg-slate-50 text-xs text-muted-foreground italic">
          [Infographic &ldquo;{slug}&rdquo; not registered]
        </div>
      )
  }
}
