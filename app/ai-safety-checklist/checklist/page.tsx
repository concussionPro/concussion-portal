import { Metadata } from 'next'
import { SiteNav } from '@/components/SiteNav'
import { PrintButton } from './PrintButton'

export const metadata: Metadata = {
  title: 'AI Safety Checklist for Allied Health Documentation',
  description: 'AHPRA-aligned, NDIS-audit-safe checklist for clinicians using AI in patient documentation.',
  robots: 'noindex, nofollow', // gated content — accessed via email link
}

export default function AiSafetyChecklistPage() {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <div className="print:hidden">
        <SiteNav />
      </div>

      <main className="max-w-3xl mx-auto px-6 pt-[100px] pb-12 print:pt-6 print:max-w-none">

        {/* Print + save action bar — hidden when printing */}
        <div className="print:hidden mb-6 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3">
          <p className="text-xs text-slate-600">
            Tip: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Cmd+P</kbd> &rarr; <strong>Save as PDF</strong> to keep the checklist on your device.
          </p>
          <PrintButton />
        </div>

        {/* Header */}
        <header className="mb-6 pb-4 border-b-2 border-teal-700">
          <p className="text-[10px] uppercase tracking-[0.15em] font-bold text-teal-700 mb-1">Concussion Education Australia</p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">AI Safety Checklist for Allied Health Documentation</h1>
          <p className="text-sm text-slate-600">AHPRA-aligned · NDIS-audit-safe · Australian Privacy Principles · v1 (2026-05-27)</p>
        </header>

        {/* Tier reference */}
        <Section title="Quick reference: Tier A / B / C tools">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <TierCard tier="A" colour="green" label="Healthcare-purpose-built · AU data residency" examples="Heidi, Lyrebird, Halo" verdict="Safe for clinical notes with consent" />
            <TierCard tier="B" colour="amber" label="Enterprise LLM · AU data residency configurable" examples="Microsoft Copilot (Healthcare), AWS HealthScribe" verdict="Safe with workflow redesign" />
            <TierCard tier="C" colour="red" label="Consumer LLM · US/offshore data" examples="ChatGPT (free/Plus), Claude.ai, Gemini" verdict="Not safe for PHI without explicit consent" />
          </div>
        </Section>

        {/* Pre-consult */}
        <Section title="Pre-consult checklist">
          <ChecklistList items={[
            'Is the AI tool I plan to use Tier A or B for this consult?',
            'Have I added the AI-consent line to my standard patient information sheet?',
            'Do I have a fallback (manual notes) if the AI tool fails mid-consult?',
            'Is the patient aware AI may be used today (waiting room poster / pre-visit email / verbal at start)?',
            'For NDIS reports: do I have the previous report on hand so the new one does not template-copy?',
          ]} />
        </Section>

        {/* During-consult */}
        <Section title="During-consult checklist">
          <ChecklistList items={[
            'Verbal consent obtained and recorded — sample script: "I use an AI tool to help with my notes. It listens during our consult and creates a draft I edit before saving. Are you OK with that?"',
            'Patient&apos;s explicit "yes" (or "no" and the chosen alternative) documented in the note.',
            'AI scribe activated only after consent confirmed.',
            'No personal information typed into a Tier C tool (ChatGPT, Claude.ai, Gemini) at any point.',
            'Sensitive disclosures (mental health, family violence, drug use): pause the AI scribe or switch to manual notes for that portion if the patient prefers.',
          ]} />
        </Section>

        {/* Post-consult */}
        <Section title="Post-consult checklist">
          <ChecklistList items={[
            'AI-drafted note read in full before saving — clinician remains responsible for accuracy.',
            'Any templated phrasing edited so the note reflects this specific consult.',
            'Clinical reasoning expressed in your own voice — not the AI&apos;s default phrasing.',
            'Note signed by you (not the AI tool).',
            'Audit trail: consent record + AI tool used + version + date stored alongside the note.',
            'For NDIS-funded reports: cross-check against the templating-flag self-audit (next page).',
          ]} />
        </Section>

        {/* NDIS specifics */}
        <Section title="NDIS report templating-flag self-audit">
          <p className="text-sm text-slate-700 mb-3">
            The NDIA flags AI-generated reports during fraud-and-assurance audits when language is templated across clients. Before submitting any NDIS-funded report, check:
          </p>
          <ChecklistList items={[
            'Does this paragraph appear (almost) identically in another client&apos;s recent report? If yes, rewrite in your own voice.',
            'Does the clinical reasoning reference this specific client&apos;s presentation, goals, and history?',
            'Are the recommended supports linked to documented functional impact, not just general guideline language?',
            'Have I read the entire report aloud (or to a colleague) and would I defend it under an NDIS audit interview?',
          ]} />
        </Section>

        {/* AHPRA + Privacy Act cheatsheet */}
        <Section title="AHPRA + Privacy Act mini-cheatsheet">
          <div className="bg-amber-50/40 border border-amber-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-slate-900 mb-2">The 4 obligations every AU clinician must meet when using AI:</p>
            <ol className="list-decimal pl-6 space-y-1.5 text-slate-700">
              <li><strong>Patient consent</strong> — verbal + documented. AHPRA AI guidelines treat this as mandatory.</li>
              <li><strong>Clinician responsibility</strong> — you read, edit, and sign the final note. AI-assisted ≠ AI-authored.</li>
              <li><strong>Data location</strong> — offshore processing of personal information is a notifiable disclosure under Australian Privacy Principle 8 without explicit consent. Tier A tools (Heidi, Lyrebird) are AU-resident.</li>
              <li><strong>Documentation integrity</strong> — the note must reflect this specific clinical encounter, not be templated phrasing copied across patients.</li>
            </ol>
          </div>
        </Section>

        {/* Tool decision tree */}
        <Section title="Which tool for which task?">
          <div className="grid grid-cols-1 gap-2 text-sm">
            <DecisionRow task="Live consult note (ambient transcription)" tool="Tier A — Heidi or Lyrebird" />
            <DecisionRow task="NDIS allied health report (drafting)" tool="Tier A scribe, then heavy clinician rewrite to remove templating" />
            <DecisionRow task="Patient information sheet (no PHI)" tool="Tier C OK — ChatGPT/Claude/Gemini with PHI stripped" />
            <DecisionRow task="Exercise programs (no PHI)" tool="Tier C OK with PHI stripped" />
            <DecisionRow task="Translation of clinical letters" tool="Tier B preferred (Microsoft Translator with AU residency)" />
            <DecisionRow task="Mental-health care plans" tool="Tier A scribe + clinician review; high audit scrutiny" />
            <DecisionRow task="Referral letters" tool="Tier A scribe or Tier B; final signed by clinician" />
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-10 pt-6 border-t border-slate-200 text-xs text-slate-600 space-y-1">
          <p><strong>Author:</strong> Zac Lewis, B.Clin.Sci., M.Ost.Med. — AHPRA-registered Osteopath, Concussion Education Australia.</p>
          <p><strong>Built for:</strong> Australian allied health professionals using AI in patient care.</p>
          <p><strong>Updates:</strong> This is v1. Reply to the welcome email with feedback or specific use cases I should cover in v2.</p>
          <p className="pt-2"><strong>Want the full framework?</strong> The AI in Clinical Practice short course (3 CPD hours, A$99 launch week, A$197 thereafter) walks through every item on this checklist with worked examples for physio, osteo, GP, and naturopathy.</p>
          <p className="text-[10px] text-slate-400 pt-2 italic">Not legal advice. Verify with your indemnity insurer + AHPRA board before changing your scope of practice.</p>
        </footer>
      </main>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-7 print:mb-5">
      <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3 border-l-4 border-teal-700 pl-3">{title}</h2>
      {children}
    </section>
  )
}

function ChecklistList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="w-4 h-4 mt-0.5 shrink-0 border-2 border-slate-400 rounded-sm print:bg-white" />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  )
}

function TierCard({ tier, colour, label, examples, verdict }: { tier: string; colour: 'green' | 'amber' | 'red'; label: string; examples: string; verdict: string }) {
  const colourMap = {
    green: 'border-emerald-300 bg-emerald-50',
    amber: 'border-amber-300 bg-amber-50',
    red: 'border-red-300 bg-red-50',
  }
  const tierColour = { green: 'text-emerald-800', amber: 'text-amber-800', red: 'text-red-800' }[colour]
  return (
    <div className={`rounded-lg border-2 p-3 ${colourMap[colour]}`}>
      <p className={`text-2xl font-bold ${tierColour}`}>Tier {tier}</p>
      <p className="text-[11px] font-semibold text-slate-700 mt-1">{label}</p>
      <p className="text-[11px] text-slate-600 mt-2"><span className="font-semibold">Examples:</span> {examples}</p>
      <p className={`text-[11px] mt-2 font-semibold ${tierColour}`}>{verdict}</p>
    </div>
  )
}

function DecisionRow({ task, tool }: { task: string; tool: string }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 py-2 border-b border-slate-200">
      <p className="text-slate-900 font-medium md:w-2/5">{task}</p>
      <p className="text-slate-700 md:w-3/5">→ {tool}</p>
    </div>
  )
}
