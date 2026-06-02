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
  Brain,
  Heart,
  Activity,
  Stethoscope,
  Wind,
  TrendingDown,
  TrendingUp,
  Clock,
  Timer,
  Hand,
  Footprints,
  Droplet,
  AlertCircle,
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

// ═══════════════════════════════════════════════════════════════════════
// VAGUS COURSE INFOGRAPHICS
// ═══════════════════════════════════════════════════════════════════════

export function VagusAnatomyMap() {
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Vagal anatomy — the 80/20 traffic split that&apos;s usually inverted in marketing
      </p>
      <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden">
        {/* Traffic-direction visualization */}
        <div className="grid grid-cols-1 sm:grid-cols-5 items-stretch">
          <div className="sm:col-span-1 bg-blue-50 border-r border-slate-200 p-4 flex flex-col items-center justify-center text-center">
            <Brain className="w-10 h-10 text-blue-700 mb-2" />
            <p className="text-xs font-bold text-blue-900">Brainstem</p>
            <p className="text-[10px] text-blue-700">Nuclei in medulla</p>
          </div>
          <div className="sm:col-span-3 p-4 grid grid-rows-2 gap-2">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 flex items-center gap-3">
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">80%</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-emerald-900">Afferent · sensory ↑</p>
                <p className="text-[11px] text-emerald-800 leading-tight">Periphery → brain. Visceral status reporting (gut, heart, lungs, pharynx). The vagus is mostly <em>listening</em>.</p>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-center gap-3">
              <div className="text-2xl font-bold text-amber-700 tabular-nums">20%</div>
              <div className="flex-1">
                <p className="text-xs font-bold text-amber-900">Efferent · motor ↓</p>
                <p className="text-[11px] text-amber-800 leading-tight">Brain → periphery. Parasympathetic output. This is the &ldquo;tone&rdquo; the wellness market talks about.</p>
              </div>
            </div>
          </div>
          <div className="sm:col-span-1 bg-rose-50 border-l border-slate-200 p-4 flex flex-col items-center justify-center text-center">
            <Heart className="w-10 h-10 text-rose-700 mb-2" />
            <p className="text-xs font-bold text-rose-900">Viscera</p>
            <p className="text-[10px] text-rose-700">Heart · lungs · gut</p>
          </div>
        </div>
        {/* Efferent nucleus split */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600 mb-2">Efferent output splits into two nuclei</p>
          <div className="grid sm:grid-cols-2 gap-2">
            <div className="rounded-md bg-white border border-slate-200 px-3 py-2">
              <p className="text-xs font-bold text-foreground">Dorsal motor nucleus (DMN)</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Unmyelinated · slow · most sub-diaphragmatic viscera</p>
            </div>
            <div className="rounded-md bg-white border border-slate-200 px-3 py-2">
              <p className="text-xs font-bold text-foreground">Nucleus ambiguus (NA)</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Myelinated · fast · primarily cardiac + laryngeal</p>
            </div>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Anatomic source: Agostoni et al. 1957 · Berthoud &amp; Neuhuber 2000 · Kenny &amp; Bordoni 2024.
      </p>
    </div>
  )
}

export function PolyvagalEvidenceTable() {
  const rows = [
    {
      claim: '"Ventral vagal state" is a measurable physiological state',
      verdict: 'unsupported',
      evidence: 'No validated biomarker. The construct is psychological framing, not a measurable state. (Grossman 2023)',
    },
    {
      claim: 'Specific exercises reliably "tone" the vagus nerve',
      verdict: 'mostly-unsupported',
      evidence: 'Slow-paced breathing increases HRV acutely (Laborde 2022). "Toning" exercises (humming, gargling, cold-face) have very limited RCT support.',
    },
    {
      claim: 'HRV-wearables track real-time "vagal state"',
      verdict: 'partial',
      evidence: 'HRV correlates loosely with parasympathetic activity. Wearable accuracy varies. Causal claims about "state" exceed the evidence. (Shaffer & Ginsberg 2017)',
    },
    {
      claim: 'Trauma is "stored in the vagus nerve" and released through manoeuvres',
      verdict: 'unsupported',
      evidence: 'Not a recognised mechanism in autonomic physiology. Metaphor, not physiology. (Grossman 2023)',
    },
    {
      claim: 'Vagal anatomy includes a "social engagement" myelinated branch',
      verdict: 'contested',
      evidence: 'Polyvagal theory claims a uniquely mammalian myelinated branch. Comparative anatomy disputes this. (Grossman & Taylor 2007; Grossman 2023)',
    },
    {
      claim: 'Vagal afferents outnumber efferents ~4:1',
      verdict: 'supported',
      evidence: 'Quantified in primary literature. ~80% sensory, ~20% motor. (Agostoni 1957; Berthoud & Neuhuber 2000)',
    },
    {
      claim: 'Modified Valsalva manoeuvre terminates SVT',
      verdict: 'supported',
      evidence: 'RCT-supported (REVERT trial, Smith 2015). The most-defensible vagal intervention in acute medicine.',
    },
  ]
  const colorFor = (v: string) =>
    v === 'supported' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
    v === 'partial' ? 'bg-blue-50 text-blue-900 border-blue-200' :
    v === 'mostly-unsupported' ? 'bg-amber-50 text-amber-900 border-amber-200' :
    v === 'contested' ? 'bg-orange-50 text-orange-900 border-orange-200' :
    'bg-red-50 text-red-900 border-red-200'
  const labelFor = (v: string) =>
    v === 'supported' ? 'Supported' :
    v === 'partial' ? 'Partial' :
    v === 'mostly-unsupported' ? 'Mostly unsupported' :
    v === 'contested' ? 'Contested' : 'Unsupported'
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Polyvagal claims vs the underlying evidence
      </p>
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        {rows.map((r, i) => (
          <div key={i} className={`px-4 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
            <div className="flex items-start justify-between gap-3 mb-1.5">
              <p className="text-sm font-semibold text-foreground flex-1 leading-snug">&ldquo;{r.claim}&rdquo;</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${colorFor(r.verdict)}`}>
                {labelFor(r.verdict)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{r.evidence}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ActiveStandTestProtocol() {
  const steps = [
    { n: 1, title: 'Supine baseline', detail: 'Patient supine 5–10 min. Record HR + BP at the end of rest. Quiet room, no caffeine/exercise in past 2 hrs.', timing: '5–10 min' },
    { n: 2, title: 'Stand', detail: 'Patient stands unassisted. Start timer immediately. Avoid talking — speech alters HR.', timing: 't = 0' },
    { n: 3, title: 'Vitals at 1 min', detail: 'HR + BP standing. Note symptoms (lightheaded, palpitations, vision changes).', timing: '1 min' },
    { n: 4, title: 'Vitals at 3 min', detail: 'Repeat HR + BP. This is the orthostatic-hypotension diagnostic timepoint per consensus.', timing: '3 min' },
    { n: 5, title: 'Vitals at 5–10 min', detail: 'Required to capture POTS (HR sustained ≥30 bpm above baseline). Vasovagal episodes typically present in this window if at all.', timing: '5–10 min' },
    { n: 6, title: 'Document', detail: 'Record HR/BP at each timepoint + symptom list + termination reason (completed / pre-syncope / patient request).', timing: 'End' },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Active stand test — 10-minute clinic-based protocol
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <ol className="space-y-2">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">{s.n}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <p className="text-sm font-bold text-foreground">{s.title}</p>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{s.timing}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 pt-3 border-t border-slate-100 grid sm:grid-cols-3 gap-2 text-[11px]">
          <div className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-2">
            <p className="font-bold text-emerald-900 mb-0.5">Normal</p>
            <p className="text-emerald-800">HR rise &lt; 30 bpm. BP drop &lt; 20/10. No sustained symptoms.</p>
          </div>
          <div className="rounded-md bg-amber-50 border border-amber-200 px-2.5 py-2">
            <p className="font-bold text-amber-900 mb-0.5">POTS criterion</p>
            <p className="text-amber-800">HR ≥ 30 bpm rise (≥40 in adolescents) sustained ≥ 5–10 min, no OH, symptomatic.</p>
          </div>
          <div className="rounded-md bg-red-50 border border-red-200 px-2.5 py-2">
            <p className="font-bold text-red-900 mb-0.5">OH criterion</p>
            <p className="text-red-800">Systolic ↓ ≥ 20 mmHg OR diastolic ↓ ≥ 10 mmHg within 3 min of standing.</p>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Source: Sheldon et al. 2015 HRS expert consensus · Brignole et al. 2018 ESC syncope guidelines.
      </p>
    </div>
  )
}

export function HRVHonestRanking() {
  const tells = [
    { what: 'Group-level associations with cardiovascular health', confidence: 'high', detail: 'Low RMSSD/HF-HRV correlates with poorer CV outcomes at population level. Effect size moderate, mechanism partially understood.' },
    { what: 'Acute response to slow-paced breathing', confidence: 'high', detail: 'HRV rises during 5.5 bpm breathing. Reliable, reproducible, mechanism understood (baroreflex resonance).' },
    { what: 'Within-person trends over weeks of training/recovery', confidence: 'moderate', detail: 'Useful for monitoring training load in athletes. Requires consistent measurement conditions.' },
  ]
  const doesnts = [
    { what: 'Real-time "vagal state" snapshot', detail: 'A single morning reading does not equal a state. Confounded by sleep, hydration, caffeine, room temp, posture, measurement device.' },
    { what: 'Diagnose autonomic disease', detail: 'HRV is not a diagnostic test for POTS, IST, vasovagal syncope, or autonomic neuropathy. Use validated tests instead.' },
    { what: 'Quantify "trauma load"', detail: 'No published validation. The wellness-app claim that HRV maps to nervous-system state in that way is unsupported.' },
    { what: 'Differentiate clinical phenotypes', detail: 'Two patients with identical HRV can have very different clinical pictures. HRV does not replace history + exam + targeted testing.' },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        HRV — what it does and doesn&apos;t tell you, honestly
      </p>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">What HRV does tell you</p>
          </div>
          <ul className="space-y-2">
            {tells.map((t, i) => (
              <li key={i} className="rounded-md bg-white border border-emerald-100 px-3 py-2">
                <div className="flex items-baseline justify-between gap-2 mb-0.5">
                  <p className="text-xs font-bold text-foreground">{t.what}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${t.confidence === 'high' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.confidence}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t.detail}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-700" />
            <p className="text-xs font-bold uppercase tracking-wide text-red-900">What HRV does NOT tell you</p>
          </div>
          <ul className="space-y-2">
            {doesnts.map((d, i) => (
              <li key={i} className="rounded-md bg-white border border-red-100 px-3 py-2">
                <p className="text-xs font-bold text-foreground mb-0.5">{d.what}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{d.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Sources: Shaffer &amp; Ginsberg 2017 · Laborde et al. 2017 · Task Force ESC/NASPE 1996 · Singh et al. 2018.
      </p>
    </div>
  )
}

export function AutonomicPhenotypeMatrix() {
  const phenotypes = [
    {
      name: 'POTS',
      hallmark: 'HR ↑ ≥30 bpm sustained on standing, no OH',
      criteria: '≥3 months symptoms. Adolescents: ≥40 bpm.',
      driver: 'Hypovolaemia, deconditioning, autoimmune (some), small-fibre neuropathy',
      management: 'Salt 8–10 g/day · 2–3 L fluids · compression · graded exercise (recumbent first)',
      red: false,
    },
    {
      name: 'IST (Inappropriate Sinus Tachycardia)',
      hallmark: 'Resting HR > 100 bpm, mean 24-hr HR > 90 bpm',
      criteria: 'No identifiable secondary cause. Often female, mid-30s.',
      driver: 'Enhanced sinus-node automaticity (mechanism debated)',
      management: 'Beta-blocker or ivabradine (cardiology). Lifestyle alone rarely sufficient.',
      red: false,
    },
    {
      name: 'Vasovagal syncope',
      hallmark: 'Pre-syncopal prodrome → brief LOC → rapid recovery',
      criteria: 'Triggered (heat, fear, blood, prolonged standing). Recovery < 30 sec usually.',
      driver: 'Bezold-Jarisch reflex — sudden vagal dominance + hypotension',
      management: 'Trigger avoidance · counter-pressure manoeuvres · midodrine if recurrent',
      red: false,
    },
    {
      name: 'Anxiety-driven somatic tachycardia',
      hallmark: 'Tachycardia with anticipatory anxiety, no orthostatic pattern',
      criteria: 'Often labelled "POTS" by wellness sources. Active-stand HR rise &lt;30 bpm.',
      driver: 'Sympathetic activation from threat appraisal — not autonomic disease',
      management: 'CBT · graded exposure · address core anxiety. Do NOT treat as POTS.',
      red: false,
    },
    {
      name: 'Post-concussion autonomic dysfunction',
      hallmark: 'Symptoms (HR, BP lability, exercise intolerance) post-mTBI > 4 weeks',
      criteria: 'Often overlaps with POTS criteria post-injury (Goodman 2022).',
      driver: 'Brainstem autonomic network dysfunction post-TBI',
      management: 'Buffalo sub-symptom-threshold exercise · Heart-rate-threshold program',
      red: false,
    },
    {
      name: 'Cardiac arrhythmia (NOT autonomic)',
      hallmark: 'Syncope on exertion · family history of SCD · long QT · WPW',
      criteria: 'Red-flag presentation. Refer for cardiology + ECG urgently.',
      driver: 'Structural or electrical cardiac disease',
      management: 'STOP — this is not your differential. Urgent cardiology referral.',
      red: true,
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Autonomic phenotype matrix — six conditions clinicians confuse
      </p>
      <div className="space-y-2">
        {phenotypes.map((p) => (
          <div key={p.name} className={`rounded-xl border-2 ${p.red ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'} overflow-hidden`}>
            <div className={`px-4 py-2 ${p.red ? 'bg-red-100 text-red-900' : 'bg-slate-50 text-foreground'} border-b ${p.red ? 'border-red-200' : 'border-slate-100'} flex items-center justify-between gap-3`}>
              <p className="text-sm font-bold flex items-center gap-2">
                {p.red && <AlertOctagon className="w-4 h-4 text-red-700" />}
                {p.name}
              </p>
              <p className="text-[11px] font-semibold opacity-80">{p.hallmark}</p>
            </div>
            <div className="px-4 py-3 grid sm:grid-cols-3 gap-3 text-[11px]">
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">Criteria</p>
                <p className="text-foreground/85 leading-relaxed">{p.criteria}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">Mechanism</p>
                <p className="text-foreground/85 leading-relaxed">{p.driver}</p>
              </div>
              <div>
                <p className="font-bold text-slate-500 uppercase tracking-wide text-[9px] mb-0.5">First-line management</p>
                <p className="text-foreground/85 leading-relaxed">{p.management}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Sources: Sheldon et al. 2015 HRS · Vernino et al. 2021 NIH · Raj et al. 2022 · CSANZ POTS 2024 · Goodman 2022.
      </p>
    </div>
  )
}

export function InterventionEvidenceLadder() {
  const tiers = [
    {
      tier: 1,
      label: 'Tier 1 — RCT-supported, specific context',
      color: 'emerald',
      examples: [
        { name: 'Modified Valsalva manoeuvre for SVT', source: 'REVERT trial · Smith 2015 · Lancet' },
        { name: 'Sub-symptom-threshold exercise for post-concussion', source: 'Leddy 2019 · JAMA Pediatrics' },
        { name: 'Slow-paced breathing (~5.5 bpm) for acute HRV increase', source: 'Laborde 2022 meta-analysis' },
        { name: 'Salt + fluid loading for POTS', source: 'Vernino 2021 NIH consensus · Sheldon 2015 HRS' },
      ],
    },
    {
      tier: 2,
      label: 'Tier 2 — Guideline-endorsed, reasonable',
      color: 'blue',
      examples: [
        { name: 'Compression garments (abdominal + lower limb)', source: 'CSANZ 2024 POTS · Brignole 2018 ESC' },
        { name: 'Counter-pressure manoeuvres for vasovagal', source: 'Sheldon 2015 HRS · Shen 2017 ACC/AHA/HRS' },
        { name: 'Graded reconditioning program (recumbent → upright)', source: 'Raj 2022 NIH part 2' },
      ],
    },
    {
      tier: 3,
      label: 'Tier 3 — Mechanistic plausibility, weak clinical evidence',
      color: 'amber',
      examples: [
        { name: 'Slow paced breathing for general anxiety / stress', source: 'Gerritsen & Band 2018 (mechanism review)' },
        { name: 'Cold-water face immersion (acute parasympathetic surge)', source: 'Physiological evidence, no chronic-condition RCTs' },
      ],
    },
    {
      tier: 4,
      label: 'Tier 4 — Aspirational / unsupported',
      color: 'red',
      examples: [
        { name: '"Vagus toning" exercises (humming, gargling, ear massage)', source: 'No RCT support beyond acute physiological effects' },
        { name: 'HRV-guided wellness apps as diagnostic tools', source: 'Singh 2018 critique of wearable claims' },
        { name: '"Polyvagal-informed" trauma manoeuvres', source: 'Grossman 2023 critique — claimed mechanism not supported' },
        { name: 'Implanted-VNS for non-FDA-approved indications', source: 'Approved only for epilepsy + treatment-resistant depression' },
      ],
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Four-tier evidence ladder for vagal interventions
      </p>
      <div className="space-y-3">
        {tiers.map((t) => {
          const ring = t.color === 'emerald'
            ? 'border-emerald-300 bg-emerald-50'
            : t.color === 'blue'
              ? 'border-blue-300 bg-blue-50'
              : t.color === 'amber'
                ? 'border-amber-300 bg-amber-50'
                : 'border-red-300 bg-red-50'
          const text = t.color === 'emerald'
            ? 'text-emerald-900'
            : t.color === 'blue'
              ? 'text-blue-900'
              : t.color === 'amber'
                ? 'text-amber-900'
                : 'text-red-900'
          return (
            <div key={t.tier} className={`rounded-xl border-2 ${ring} p-4`}>
              <p className={`text-sm font-bold ${text} mb-2`}>{t.label}</p>
              <ul className="space-y-1.5">
                {t.examples.map((ex, i) => (
                  <li key={i} className="text-xs text-foreground flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 rounded-md bg-white/70 px-3 py-1.5">
                    <span className="font-semibold">{ex.name}</span>
                    <span className="text-[10px] text-muted-foreground italic shrink-0">{ex.source}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function BuffaloHRThreshold() {
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Buffalo Concussion Treadmill Test — HR-threshold protocol
      </p>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          Sub-symptom-threshold aerobic exercise initiated within first 10 days post-mTBI. RCT-supported for shortened recovery (Leddy 2019, JAMA Pediatrics).
        </p>
        <div className="space-y-3">
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-accent" /> Step 1 — Determine HR threshold</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Run BCTT (treadmill walk at increasing speed/incline, supervised). Record HR at <strong>symptom exacerbation</strong>. This is the symptom-threshold HR (SThr-HR).
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-accent" /> Step 2 — Set training HR</p>
            <div className="bg-white border border-accent/30 rounded-md p-3 my-2">
              <p className="text-center text-sm font-mono">
                Training HR target = <span className="font-bold text-accent">SThr-HR × 0.80–0.90</span>
              </p>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Example — symptom threshold at HR 140 bpm → training zone 112–126 bpm. Patient exercises 20 min/day at this HR.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-accent" /> Step 3 — Re-test weekly</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Repeat BCTT each week. As recovery progresses, SThr-HR rises. Training zone rises with it. Endpoint: BCTT to ≥ 90% age-predicted max HR with no symptom exacerbation.
            </p>
          </div>
        </div>
        <div className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-[11px] font-bold text-red-900 mb-0.5">Stop criteria</p>
          <p className="text-[11px] text-red-800 leading-relaxed">Symptom exacerbation &gt; 2 points on 11-point VAS · new symptoms · HR ≥ training-zone ceiling. Rest, retest next session.</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Source: Leddy et al. 2019 JAMA Pediatrics · Haider et al. 2019 (BCTT validation).
      </p>
    </div>
  )
}

export function CounterPressureManoeuvres() {
  const moves = [
    {
      icon: Hand,
      name: 'Hand grip',
      how: 'Squeeze a stress ball or grip firmly fist-to-fist at maximum effort for 30 sec',
      when: 'Pre-syncopal prodrome (lightheaded, vision graying)',
    },
    {
      icon: Footprints,
      name: 'Leg crossing + tensing',
      how: 'Cross legs at thigh level. Tense calf, thigh, gluteal, abdominal muscles for 30 sec',
      when: 'Standing prolonged · pre-syncope · awaiting symptom resolution',
    },
    {
      icon: AlertCircle,
      name: 'Arm tensing',
      how: 'Grip one hand with the other, pull outward against resistance at max effort, 30 sec',
      when: 'Alternative if seated and unable to leg-cross',
    },
    {
      icon: Activity,
      name: 'Squatting',
      how: 'Drop into a deep squat. Hold 30–60 sec. Recover slowly when symptoms resolve',
      when: 'Severe prodrome · cannot safely remain standing',
    },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Physical counter-pressure manoeuvres for vasovagal syncope
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {moves.map((m) => {
          const Icon = m.icon
          return (
            <div key={m.name} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <p className="text-sm font-bold text-foreground">{m.name}</p>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed mb-2"><strong>How:</strong> {m.how}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed"><strong>When:</strong> {m.when}</p>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Source: Sheldon et al. 2015 HRS expert consensus on POTS, IST, vasovagal · Shen et al. 2017 ACC/AHA/HRS syncope guideline.
      </p>
    </div>
  )
}

export function PacedBreathingProtocol() {
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Slow-paced breathing — the resonant-frequency protocol
      </p>
      <div className="rounded-xl border-2 border-teal-200 bg-teal-50 p-5">
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-white border border-teal-200 p-3 text-center">
            <Timer className="w-6 h-6 text-teal-700 mx-auto mb-1" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-900">Rate</p>
            <p className="text-base font-bold text-foreground">~5.5 breaths/min</p>
            <p className="text-[10px] text-muted-foreground">≈ resonant freq. for most adults</p>
          </div>
          <div className="rounded-lg bg-white border border-teal-200 p-3 text-center">
            <Wind className="w-6 h-6 text-teal-700 mx-auto mb-1" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-900">Cycle</p>
            <p className="text-base font-bold text-foreground">5.5 s in · 5.5 s out</p>
            <p className="text-[10px] text-muted-foreground">No hold. Nose if comfortable.</p>
          </div>
          <div className="rounded-lg bg-white border border-teal-200 p-3 text-center">
            <Clock className="w-6 h-6 text-teal-700 mx-auto mb-1" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-teal-900">Duration</p>
            <p className="text-base font-bold text-foreground">10–20 min/day</p>
            <p className="text-[10px] text-muted-foreground">Split into 2× 10-min if easier</p>
          </div>
        </div>
        <div className="bg-white border border-teal-200 rounded-lg p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-teal-900 mb-2">What the evidence supports</p>
          <ul className="space-y-1 text-xs text-foreground/90">
            <li className="flex gap-2"><span className="text-teal-700">✓</span> Acute increase in HRV (RMSSD/HF) during practice (Laborde 2022 meta-analysis)</li>
            <li className="flex gap-2"><span className="text-teal-700">✓</span> Reduced state-anxiety in short-term studies</li>
            <li className="flex gap-2"><span className="text-teal-700">✓</span> Useful adjunct in pre-syncopal prodromes</li>
            <li className="flex gap-2 text-muted-foreground"><span>?</span> Effects beyond the practice session — small, inconsistent</li>
            <li className="flex gap-2 text-muted-foreground"><span>✗</span> Not validated as a primary treatment for POTS, IST, or post-concussion autonomic dysfunction</li>
          </ul>
        </div>
        <p className="text-[11px] text-teal-900 italic mt-3">
          Mechanism: baroreflex resonance — synchronising respiration to the natural ~6-second arterial blood-pressure oscillation maximises baroreflex gain. (Gerritsen &amp; Band 2018)
        </p>
      </div>
    </div>
  )
}

export function PostConcussionAutonomicTimeline() {
  const phases = [
    { phase: 'Days 0–3', color: 'red', what: 'Acute symptomatic phase. Symptom-limited activity. Sleep, hydration, simple cognitive load.', do: 'Symptom-limited rest. NOT total bed rest.' },
    { phase: 'Days 4–14', color: 'amber', what: 'Sub-symptom aerobic introduction. BCTT to determine HR threshold. Most recover by end of this window.', do: 'Begin HR-threshold program · 20 min/day at 80–90% of SThr-HR.' },
    { phase: 'Weeks 2–4', color: 'blue', what: 'Persistent symptoms = persistent post-concussion syndrome (PPCS). Autonomic phenotype may emerge.', do: 'Re-evaluate · active stand test · consider POTS overlay · structured graded exercise.' },
    { phase: 'Months 1–3', color: 'blue', what: 'Most resolve. Those who don\'t require structured rehabilitation + autonomic workup.', do: 'Multi-disciplinary referral · vestibular if dizzy · psychology if mood overlay.' },
    { phase: 'Months 3+', color: 'slate', what: 'Persistent autonomic symptoms = persistent dysautonomia. Cardiology referral for tilt-table, autonomic battery.', do: 'Cardiology + autonomic neurology. Long-term graded reconditioning program.' },
  ]
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Post-concussion autonomic recovery — what to expect, what to do
      </p>
      <div className="space-y-2">
        {phases.map((p) => {
          const ring = p.color === 'red'
            ? 'border-red-200 bg-red-50'
            : p.color === 'amber'
              ? 'border-amber-200 bg-amber-50'
              : p.color === 'blue'
                ? 'border-blue-200 bg-blue-50'
                : 'border-slate-200 bg-slate-50'
          const dot = p.color === 'red'
            ? 'bg-red-500'
            : p.color === 'amber'
              ? 'bg-amber-500'
              : p.color === 'blue'
                ? 'bg-blue-500'
                : 'bg-slate-400'
          return (
            <div key={p.phase} className={`rounded-xl border-2 ${ring} p-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${dot}`} />
                <p className="text-sm font-bold text-foreground">{p.phase}</p>
              </div>
              <p className="text-xs text-foreground/85 leading-relaxed mb-1.5">{p.what}</p>
              <p className="text-xs text-foreground"><strong>Do:</strong> {p.do}</p>
            </div>
          )
        })}
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Source: Leddy et al. 2019 · Esterov &amp; Greenwald 2017 · Goodman 2022.
      </p>
    </div>
  )
}

export function SaltFluidProtocol() {
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Salt + fluid loading protocol — non-pharmacological POTS first-line
      </p>
      <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-white border border-blue-200 p-3">
            <Droplet className="w-6 h-6 text-blue-700 mb-1.5" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900">Fluids</p>
            <p className="text-base font-bold text-foreground">2–3 L per day</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">Distributed across the day. Pre-load 500 mL on waking. Avoid caffeine excess.</p>
          </div>
          <div className="rounded-lg bg-white border border-blue-200 p-3">
            <Activity className="w-6 h-6 text-blue-700 mb-1.5" />
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900">Salt</p>
            <p className="text-base font-bold text-foreground">8–10 g per day</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">Salt tablets (1g) or generous salting of food. Track for 2 weeks to establish habit.</p>
          </div>
        </div>
        <div className="bg-white border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-900 mb-2">Implementation</p>
          <ol className="space-y-1 text-xs text-foreground/90 list-decimal pl-4">
            <li>GP screen first — exclude hypertension, renal disease, heart failure before salt-loading</li>
            <li>Start with 2 L water + 6 g salt/day. Titrate up over 2 weeks to tolerance</li>
            <li>Use a marked water bottle; salt tabs at fixed times</li>
            <li>Track BP weekly (home device) — flag if seated systolic rises &gt; 140 mmHg</li>
            <li>Re-evaluate at 4 weeks — symptom reduction is the endpoint, not normalised orthostatics</li>
          </ol>
        </div>
        <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-[11px] font-bold text-red-900 mb-0.5">Do not use if</p>
          <p className="text-[11px] text-red-800 leading-relaxed">Hypertension · CKD · CHF · pregnancy without specialist input · adolescent without paediatric / cardiology supervision.</p>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Source: Sheldon et al. 2015 HRS · Vernino et al. 2021 NIH consensus · Raj et al. 2022 NIH part 2 · CSANZ POTS 2024.
      </p>
    </div>
  )
}

export function RedFlagDecisionTree() {
  return (
    <div className="my-8 not-prose">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
        Red-flag triage — when autonomic symptoms aren&apos;t autonomic
      </p>
      <div className="space-y-3">
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4" />
            STOP and refer urgently if:
          </p>
          <ul className="space-y-1.5 text-xs text-red-900">
            <li className="flex gap-2"><span>→</span><span><strong>Syncope on exertion</strong> — hypertrophic cardiomyopathy, channelopathy, structural disease. Urgent cardiology.</span></li>
            <li className="flex gap-2"><span>→</span><span><strong>Family history of sudden cardiac death &lt; 40 yo</strong> — channelopathy or HCM screening required before any exercise prescription.</span></li>
            <li className="flex gap-2"><span>→</span><span><strong>Chest pain with syncope or pre-syncope</strong> — ACS or aortic dissection until proven otherwise. ED.</span></li>
            <li className="flex gap-2"><span>→</span><span><strong>New focal neurological signs</strong> — stroke, posterior circulation, brainstem lesion. ED.</span></li>
            <li className="flex gap-2"><span>→</span><span><strong>Syncope without prodrome in older patient</strong> — arrhythmia. Cardiology + Holter.</span></li>
            <li className="flex gap-2"><span>→</span><span><strong>Unexplained weight loss + autonomic symptoms</strong> — paraneoplastic syndromes possible. Workup.</span></li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Refer non-urgently (within 2–4 weeks) if:
          </p>
          <ul className="space-y-1.5 text-xs text-amber-900">
            <li className="flex gap-2"><span>→</span>Symptoms persist &gt; 3 months despite first-line management</li>
            <li className="flex gap-2"><span>→</span>Resting HR &gt; 100 with normal active stand → cardiology (IST workup)</li>
            <li className="flex gap-2"><span>→</span>POTS diagnostic criteria + functional impairment → autonomic neurology / cardiology</li>
            <li className="flex gap-2"><span>→</span>Suspected tilt-table indication → cardiology</li>
            <li className="flex gap-2"><span>→</span>Long COVID with autonomic-cluster phenotype → long-COVID clinic if available</li>
          </ul>
        </div>
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <Stethoscope className="w-4 h-4" />
            Allied-health scope appropriate if:
          </p>
          <ul className="space-y-1.5 text-xs text-emerald-900">
            <li className="flex gap-2"><span>→</span>Diagnosis already established by GP/cardiology, follow-up management</li>
            <li className="flex gap-2"><span>→</span>Post-concussion within first month with no red flags</li>
            <li className="flex gap-2"><span>→</span>Structured exercise prescription for known POTS (with patient&apos;s cardiology team aware)</li>
            <li className="flex gap-2"><span>→</span>Patient education / lifestyle interventions / breathing protocols</li>
          </ul>
        </div>
      </div>
      <p className="text-[11px] text-muted-foreground mt-3 italic">
        Source: Shen et al. 2017 ACC/AHA/HRS syncope · Brignole et al. 2018 ESC syncope · Sheldon et al. 2015 HRS POTS/IST/VVS.
      </p>
    </div>
  )
}

/**
 * Renders an infographic by slug. Used by the markdown parser when it
 * encounters a `[INFOGRAPHIC: <slug>]` marker.
 */
export function InfographicRenderer({ slug }: { slug: string }) {
  switch (slug) {
    // AI course
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
    // Vagus course
    case 'vagus-anatomy-map':
      return <VagusAnatomyMap />
    case 'polyvagal-evidence-table':
      return <PolyvagalEvidenceTable />
    case 'active-stand-test':
      return <ActiveStandTestProtocol />
    case 'hrv-honest-ranking':
      return <HRVHonestRanking />
    case 'autonomic-phenotype-matrix':
      return <AutonomicPhenotypeMatrix />
    case 'intervention-evidence-ladder':
      return <InterventionEvidenceLadder />
    case 'buffalo-hr-threshold':
      return <BuffaloHRThreshold />
    case 'counter-pressure-manoeuvres':
      return <CounterPressureManoeuvres />
    case 'paced-breathing-protocol':
      return <PacedBreathingProtocol />
    case 'post-concussion-timeline':
      return <PostConcussionAutonomicTimeline />
    case 'salt-fluid-protocol':
      return <SaltFluidProtocol />
    case 'red-flag-decision-tree':
      return <RedFlagDecisionTree />
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
