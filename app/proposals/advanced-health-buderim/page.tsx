import { Metadata } from 'next'
import { PrintButton } from './PrintButton'

export const metadata: Metadata = {
  title: 'Concussion Hub Programme — Advanced Health Buderim',
  description: 'On-site concussion + AI training proposal for Advanced Health, Buderim QLD. Full clinical flow from intake to discharge.',
  robots: 'noindex, nofollow',
}

export default function AdvancedHealthProposal() {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">

      {/* Print action bar — hidden when printing */}
      <div className="print:hidden bg-white border-b border-slate-200">
        <div className="max-w-[820px] mx-auto px-6 py-3 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Tip: <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Cmd+P</kbd> &rarr; <strong>Save as PDF</strong> for the polished proposal.
          </p>
          <PrintButton />
        </div>
      </div>

      <main className="max-w-[820px] mx-auto px-8 py-10 print:py-0 print:px-8 print:max-w-none bg-white print:bg-white shadow-xl print:shadow-none my-8 print:my-0">

        {/* HEADER */}
        <header className="flex items-start justify-between gap-6 pb-5 border-b-2 border-teal-700 mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-teal-700 mb-1">
              Concussion Education Australia
            </p>
            <h1 className="text-[22px] font-bold text-slate-900 leading-tight mb-1">
              Concussion Hub Programme
            </h1>
            <p className="text-[13px] text-slate-700 leading-snug">
              On-site training + medicolegal protection package for <strong>Advanced Health Pain &amp; Injury Clinic</strong>, Buderim QLD
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mb-0.5">Prepared</p>
            <p className="text-[11px] font-semibold text-slate-800">June 2026</p>
            <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-2 mb-0.5">Author</p>
            <p className="text-[11px] font-semibold text-slate-800">Zac Lewis</p>
            <p className="text-[9px] text-slate-500">AHPRA-registered Osteopath</p>
          </div>
        </header>

        {/* MEDICOLEGAL HOOK — opens with the fear / value driver, not the CPD pitch */}
        <section className="mb-5 rounded-lg border-2 border-red-200 bg-red-50/40 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-red-800 font-bold mb-1.5">
            Why this matters now
          </p>
          <p className="text-[12px] text-slate-800 leading-relaxed">
            A missed concussion that turns into a complaint, an AHPRA notification, an NDIS audit on AI-generated reports, or an indemnity claim &mdash; all of these are increasingly common and avoidable. The Concussion Hub Programme is built around <strong>defensible documentation and standardised clinical decisions</strong> across the whole patient journey. Every role (admin to discharge) works the same playbook. Every note your team writes survives audit.
          </p>
        </section>

        {/* THE OPPORTUNITY */}
        <section className="mb-5">
          <p className="text-[12px] text-slate-800 leading-relaxed">
            Advanced Health has the complete clinical flow a concussion management hub needs &mdash; reception triage, osteopathic diagnosis and treatment, exercise physiology rehab, and structured discharge. Most clinics don&rsquo;t. This proposal turns that existing workflow into a coordinated, audit-safe concussion-management capability that fits Monday&rsquo;s schedule and positions Advanced Health as the Sunshine Coast referral destination for head injury.
          </p>
        </section>

        {/* THE HUB — 4-stage flow */}
        <section className="mb-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 mb-3">
            The Concussion Hub — Trained Role-by-Role
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <FlowStage
              num="01"
              roleLabel="Intake"
              team="Reception + admin"
              items={[
                'Phone-triage script (fast-track vs schedule)',
                'Red-flag identification → ED transfer',
                'Intake form additions for head injury',
                'Privacy Act-safe AI documentation workflows',
                'Patient / parent waiting-room leaflet',
                '1-hr Admin Micro-Course (B2B only)',
              ]}
            />
            <FlowStage
              num="02"
              roleLabel="Diagnosis + Treatment"
              team="The 9 osteopaths"
              items={[
                'SCAT6 + SCOAT6 (acute + subacute)',
                'VOMS deep-dive (hands-on)',
                'BESS scoring',
                'Cervical contribution (osteo focus)',
                'Acute return-to-activity decisions',
                'Paediatric concussion + red flags',
                '14 CPD hours per clinician',
              ]}
            />
            <FlowStage
              num="03"
              roleLabel="Rehab"
              team="The EP team"
              items={[
                'Buffalo Concussion Treadmill Test',
                'Sub-threshold aerobic prescription',
                'VOR / gaze stability progression',
                'Amsterdam 2023 6-step return-to-play',
                'Return-to-work + return-to-school',
                'Symptom-tracking tools',
                'Escalation back to osteos',
              ]}
            />
            <FlowStage
              num="04"
              roleLabel="Discharge + Referral"
              team="Whole team"
              items={[
                'GP handover (medicolegal-clean)',
                'School / coach RTP authorisation',
                'Parent symptom-management plan',
                'Sports club RTP certificate',
                'NDIS-safe report template',
                'WorkCover / insurer documentation',
                'Audit-defensible across the board',
              ]}
              highlight
            />
          </div>
        </section>

        {/* DIFFERENTIATORS — three pillars, prominently displayed */}
        <section className="mb-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 mb-3">
            What you get that no other CPD provider offers
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Differentiator
              colour="red"
              icon="⚖"
              label="Medicolegal protection"
              body="Every discharge document is built to be AHPRA-, NDIS-, WorkCover- and indemnity-insurer-defensible. Standardised across the whole team. If a clinical decision is ever challenged, your documentation holds up."
            />
            <Differentiator
              colour="teal"
              icon="📋"
              label="Plug-and-play templates"
              body="Six discharge templates pre-filled with your clinic branding. Six outreach templates for schools, sports clubs and GPs. Your team starts using them on day one. No DIY editing required."
            />
            <Differentiator
              colour="amber"
              icon="🎯"
              label="Local referral flow"
              body="Outreach package pre-built for Sunshine Coast — Matthew Flinders, SC Grammar, Immanuel, Sunshine Coast Falcons, surf life saving, triathlon clubs, GP networks. Email sequences, phone scripts, meeting agendas, follow-up tracker — everything ready to send."
            />
          </div>
        </section>

        {/* ADMIN MICRO-COURSE CALLOUT — emphasises B2B-only value */}
        <section className="mb-5 rounded-lg border border-slate-300 bg-slate-50 p-3 flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-full bg-teal-700 text-white flex items-center justify-center text-[13px] font-bold">
            1hr
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-bold text-slate-900 mb-0.5">
              Concussion Workflow for Admin + Reception
            </p>
            <p className="text-[11px] text-slate-700 leading-snug">
              Custom 1-hour online module designed for non-clinical staff &mdash; phone triage, red-flag escalation, intake form management, Privacy Act-safe handling of AI-generated notes, template management. <strong>Not available publicly</strong>; included only in B2B Hub Complete engagements. Brings the whole front-of-house in line with the clinical playbook.
            </p>
          </div>
        </section>

        {/* INVESTMENT */}
        <section className="mb-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 mb-3">
            Investment
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <PriceTier
              name="Hub Foundation"
              price="A$8,000"
              footnote="From"
              items={[
                'Full-day on-site training at Buderim',
                'Concussion Clinical Mastery for all clinicians',
                'AHPRA + OA-endorsed certification per clinician',
                '14 CPD hours per osteo / EP / myo',
                'Standard CPD records + completion certs',
              ]}
            />
            <PriceTier
              name="Hub Complete"
              price="A$12,500"
              footnote="Recommended"
              highlight
              items={[
                'Everything in Foundation, plus:',
                '1-hr Admin + Reception micro-course (B2B-only)',
                '6 discharge templates, clinic-licensed + branded',
                '6 outreach templates (schools / sports / GPs)',
                'Email sequences + phone scripts + follow-up tracker',
                '30-day post-training implementation support',
                'CEA-trained-clinic badge + waiting-room poster',
              ]}
            />
          </div>
          <p className="text-[10px] text-slate-500 italic mt-2 leading-snug">
            Pricing scoped for ~10-14 clinicians (osteo + EP + myo + admin). Larger teams or multi-location delivery scoped on request. GST exclusive.
          </p>
        </section>

        {/* OUTCOMES */}
        <section className="mb-5 rounded-lg border border-teal-200 bg-teal-50/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-teal-800 font-bold mb-1.5">
            What success looks like at 6 months
          </p>
          <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-700">
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">Audit-safe across the board</p>
              <p className="leading-snug">Every note, every discharge, every referral document is AHPRA-, NDIS-, WorkCover-defensible. Indemnity exposure materially reduced.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">The local concussion clinic</p>
              <p className="leading-snug">Sunshine Coast schools, sports clubs and GPs know Advanced Health is the concussion-trained referral destination in the region.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">One team, one playbook</p>
              <p className="leading-snug">Reception to discharge: every role works the same concussion management protocol. Handoffs are documented, consistent, and defensible.</p>
            </div>
          </div>
        </section>

        {/* CTA + FOOTER */}
        <section className="border-t border-slate-200 pt-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[12px] font-semibold text-slate-900 mb-1">
                Next step — a 20-minute scoping call
              </p>
              <p className="text-[11px] text-slate-700 leading-snug">
                Pick a window that suits. I&rsquo;ll come back with a tailored one-page proposal for the exact team and topic mix you want included.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[11px] font-semibold text-slate-800">Zac Lewis</p>
              <p className="text-[10px] text-slate-600">zac@concussion-education-australia.com</p>
              <p className="text-[10px] text-teal-700 mt-0.5">portal.concussion-education-australia.com</p>
            </div>
          </div>
        </section>

        <footer className="mt-4 pt-3 border-t border-slate-200 text-center">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-bold">
            AHPRA-aligned · Osteopathy Australia endorsed · 140+ peer-reviewed references · Built around Amsterdam 2023 + AIS 2024
          </p>
        </footer>
      </main>
    </div>
  )
}

function FlowStage({
  num,
  roleLabel,
  team,
  items,
  highlight,
}: {
  num: string
  roleLabel: string
  team: string
  items: string[]
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-2.5 ${
        highlight ? 'border-teal-300 bg-teal-50/60' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">{num}</p>
      <p className={`text-[11px] font-bold leading-tight ${highlight ? 'text-teal-800' : 'text-slate-900'}`}>
        {roleLabel}
      </p>
      <p className="text-[9px] text-slate-500 mb-2 leading-tight">{team}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-[9.5px] text-slate-700 leading-snug flex gap-1">
            <span className={highlight ? 'text-teal-600' : 'text-slate-400'}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Differentiator({
  colour,
  icon,
  label,
  body,
}: {
  colour: 'red' | 'teal' | 'amber'
  icon: string
  label: string
  body: string
}) {
  const colourMap = {
    red: { border: 'border-red-200', bg: 'bg-red-50/50', text: 'text-red-800' },
    teal: { border: 'border-teal-200', bg: 'bg-teal-50/50', text: 'text-teal-800' },
    amber: { border: 'border-amber-200', bg: 'bg-amber-50/50', text: 'text-amber-800' },
  }
  const c = colourMap[colour]
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[18px] leading-none">{icon}</span>
        <p className={`text-[11px] font-bold uppercase tracking-wide ${c.text}`}>{label}</p>
      </div>
      <p className="text-[10.5px] text-slate-700 leading-snug">{body}</p>
    </div>
  )
}

function PriceTier({
  name,
  price,
  footnote,
  items,
  highlight,
}: {
  name: string
  price: string
  footnote: string
  items: string[]
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg p-4 ${
        highlight
          ? 'border-2 border-teal-700 bg-teal-50/60 shadow-md'
          : 'border border-slate-300 bg-white'
      }`}
    >
      <div className="flex items-baseline justify-between mb-2">
        <p className={`text-[13px] font-bold ${highlight ? 'text-teal-800' : 'text-slate-900'}`}>
          {name}
        </p>
        <span className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
          {footnote}
        </span>
      </div>
      <p className={`text-[24px] font-bold leading-none mb-3 ${highlight ? 'text-teal-800' : 'text-slate-900'}`}>
        {price}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-[10.5px] text-slate-700 leading-snug flex gap-1.5">
            <span className={highlight ? 'text-teal-600 mt-0.5' : 'text-slate-400 mt-0.5'}>✓</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
