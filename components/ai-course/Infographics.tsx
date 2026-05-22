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
  AlertOctagon,
  BookOpen,
  Sparkles,
  Lightbulb,
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

export function DecisionTree() {
  const branches: Array<{ question: string; outcomes: Array<{ answer: string; goTo: string; tier?: 'A' | 'B' | 'C'; final?: boolean }> }> = [
    {
      question: 'Does the input or output contain identifiable patient information?',
      outcomes: [
        { answer: 'No — generic education, public-source summary, clinic policy draft', goTo: 'Tier C is fine', tier: 'C', final: true },
        { answer: 'Yes — clinical facts, identifiers, or anything re-identifiable', goTo: 'Next question →', tier: undefined },
      ],
    },
    {
      question: 'Do you have a Tier A tool with AU residency + DPA in place for this task?',
      outcomes: [
        { answer: 'Yes', goTo: 'Use Tier A', tier: 'A', final: true },
        { answer: 'No — but your practice has a Tier B contract (Azure/Bedrock/Vertex Sydney with DPA)', goTo: 'Use Tier B with documented data flow', tier: 'B', final: true },
        { answer: 'No to both', goTo: 'De-identify completely → Tier C, or stop and acquire Tier A', tier: 'C', final: true },
      ],
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Decision tree — which tier for which task
      </p>
      <div className="space-y-3">
        {branches.map((b, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-foreground mb-3">{i + 1}. {b.question}</p>
            <div className="space-y-2">
              {b.outcomes.map((o, j) => (
                <div key={j} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50">
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-foreground mb-1">{o.answer}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-foreground">{o.goTo}</p>
                      {o.tier && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          o.tier === 'A' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          o.tier === 'B' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>Tier {o.tier}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConsentScript() {
  return (
    <div className="my-8 not-prose rounded-xl border-2 border-purple-200 bg-purple-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wide text-purple-900 mb-3">
        AI scribe — verbal consent script (the minimum)
      </p>
      <div className="rounded-lg bg-white border border-purple-100 p-4 mb-3">
        <p className="text-sm text-foreground italic leading-relaxed">
          &ldquo;Before we start — I use an AI tool to help me write notes. It listens to our conversation and produces a draft note that I review and edit. It&apos;s an Australian tool, your data stays in Australia, and the audio isn&apos;t kept after the note is made. You can ask me to turn it off at any time, no questions asked. Are you OK with me using it today?&rdquo;
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-white border border-purple-100 p-3">
          <p className="text-xs font-bold text-purple-900 mb-1">If yes</p>
          <p className="text-[11px] text-muted-foreground">Record in the note: <em>&ldquo;Verbal consent obtained for AI scribe use. Patient informed of data handling and right to decline.&rdquo;</em></p>
        </div>
        <div className="rounded-lg bg-white border border-purple-100 p-3">
          <p className="text-xs font-bold text-purple-900 mb-1">If no</p>
          <p className="text-[11px] text-muted-foreground">Turn off the scribe immediately. No consequence to the patient. Document in note: <em>&ldquo;Patient declined AI scribe; manual notes only.&rdquo;</em></p>
        </div>
      </div>
      <p className="text-[11px] text-purple-900 italic">
        Written consent at booking is better. Verbal consent at the start of the consult is the minimum. Silent assumption of consent is not consent.
      </p>
    </div>
  )
}

export function DpaChecklist() {
  const items = [
    {
      q: 'Where is the data stored, technically and contractually?',
      look: 'Australian region (e.g. ap-southeast-2 Sydney, australiaeast). NOT "available globally" or "regions vary by tier."',
    },
    {
      q: 'Will the vendor train on your data?',
      look: 'Explicit no-training clause covering your prompts, outputs, and any extracted metadata. "Aggregated and anonymous" is not no-training.',
    },
    {
      q: 'What is the breach notification timeline?',
      look: '72 hours to your practice is the minimum. Anything &gt; 7 days is a problem under the NDB scheme.',
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Three questions to ask every vendor before signing
      </p>
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold text-foreground mb-2">
              <span className="text-accent">{i + 1}.</span> {item.q}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <strong>Look for:</strong> {item.look}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Marketing pages are not contracts. Read the DPA (or its equivalent — DPA, data-processing addendum, BAA-equivalent, or a Schedule to the master services agreement).
      </p>
    </div>
  )
}

export function AhpraDocFlow() {
  const stages = [
    { num: 1, title: 'AI generates draft', detail: 'Whether scribe, refinement, or template — output is unsigned, unattested.' },
    { num: 2, title: 'Clinician reviews', detail: 'Read line-by-line. Verify clinical facts, dosages, findings. Edit or delete anything inaccurate.' },
    { num: 3, title: 'Clinician signs', detail: 'Signing = clinician attestation. From this moment, you own the record.' },
    { num: 4, title: 'Notation in record', detail: 'Add: "Drafted with AI assistance, reviewed by [name], [AHPRA reg], [date]." Defensible at audit.' },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        AHPRA documentation flow — every AI-assisted record
      </p>
      <div className="relative">
        <div className="absolute left-4 top-6 bottom-6 w-px bg-accent/30" aria-hidden="true" />
        <ol className="space-y-3">
          {stages.map((s) => (
            <li key={s.num} className="relative flex gap-4 rounded-xl bg-white border border-slate-200 p-4 ml-0">
              <div className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm shrink-0 z-10">
                {s.num}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
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
    case 'decision-tree':
      return <DecisionTree />
    case 'consent-script':
      return <ConsentScript />
    case 'dpa-checklist':
      return <DpaChecklist />
    case 'ahpra-doc-flow':
      return <AhpraDocFlow />
    default:
      return (
        <div className="my-4 p-3 rounded-md bg-slate-50 text-xs text-muted-foreground italic">
          [Infographic &ldquo;{slug}&rdquo; not registered]
        </div>
      )
  }
}

// ─── Inline marker cards (KEYPOINT / REDFLAG / DEFINITION / TRYTHIS) ───────

export function KeyPointCard({ text }: { text: string }) {
  return (
    <div className="my-5 not-prose rounded-lg border-l-4 border-accent bg-accent/5 px-4 py-3 flex gap-3">
      <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-accent mb-1">Key point</p>
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export function RedFlagCard({ text }: { text: string }) {
  return (
    <div className="my-5 not-prose rounded-lg border-2 border-red-300 bg-red-50 px-4 py-3 flex gap-3">
      <AlertOctagon className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-red-900 mb-1">Red flag — non-negotiable</p>
        <p className="text-sm text-red-900 leading-relaxed">{text}</p>
      </div>
    </div>
  )
}

export function DefinitionCard({ term, definition }: { term: string; definition: string }) {
  return (
    <div className="my-5 not-prose rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex gap-3">
      <BookOpen className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900 mb-1">Definition</p>
        <p className="text-sm text-foreground leading-relaxed">
          <strong className="text-blue-900">{term}.</strong> {definition}
        </p>
      </div>
    </div>
  )
}

export function TryThisCard({ text }: { text: string }) {
  return (
    <div className="my-5 not-prose rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 flex gap-3">
      <Lightbulb className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wide text-teal-900 mb-1">Try this tomorrow</p>
        <p className="text-sm text-foreground leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
