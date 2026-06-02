import { Metadata } from 'next'
import { PrintButton } from './PrintButton'

export const metadata: Metadata = {
  title: 'Concussion Hub Programme — Advanced Health Buderim',
  description: 'On-site concussion training proposal for Advanced Health, Buderim QLD. Clinical mastery + local-hub positioning.',
  robots: 'noindex, nofollow',
}

export default function AdvancedHealthProposal() {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">

      {/* Print bar */}
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
              Clinical mastery + local-hub positioning for <strong>Advanced Health Pain &amp; Injury Clinic</strong>, Buderim QLD
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

        {/* THE OPPORTUNITY — clinical leadership framing, not fear */}
        <section className="mb-5 rounded-lg border-2 border-teal-200 bg-teal-50/40 p-3.5">
          <p className="text-[10px] uppercase tracking-wider text-teal-800 font-bold mb-1.5">
            The opportunity
          </p>
          <p className="text-[12px] text-slate-800 leading-relaxed">
            Concussion is one of the most undertaught conditions in Australian healthcare &mdash; and one of the highest-volume sports injuries on the Sunshine Coast. Most clinics aren&rsquo;t trained to manage it confidently. Your team can be the one that is. The Concussion Hub Programme gives Advanced Health <strong>clinical mastery in concussion diagnosis and rehab</strong>, and the positioning to become the Sunshine Coast&rsquo;s referral destination for sports teams, schools and local GPs.
          </p>
        </section>

        {/* THREE OUTCOMES YOUR TEAM GAINS — the new differentiators */}
        <section className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 mb-3">
            What your team will be able to do
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <OutcomeCard
              icon="🧠"
              label="Diagnose with confidence"
              body="Hands-on SCAT6 and SCOAT6 administration. Complete VOMS deep-dive. BESS scored reliably. Cervical contribution assessment integrated into the same consult. Your osteos finish the day confident on the most undertaught condition in their scope."
              primary
            />
            <OutcomeCard
              icon="🏃"
              label="Deliver structured rehab"
              body="Buffalo Treadmill Test for sub-symptom-threshold aerobic prescription. VOR / gaze-stability progression. Amsterdam 2023 six-step return-to-play, return-to-work, return-to-school. Your EPs leave with a complete active-rehab toolkit most clinicians have never been formally taught."
              primary
            />
            <OutcomeCard
              icon="🎯"
              label="Own the local referral flow"
              body="Concussion training is rare enough that one trained clinic becomes the obvious referral destination. Outreach package, introduction templates and capability one-pagers — turn the clinical capability into ongoing referrals from local GPs, sports clubs and schools."
              primary
            />
          </div>
        </section>

        {/* BECOME THE LOCAL HUB — sports + GP referral flow */}
        <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50/40 p-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-800 mb-2">
            Become the Sunshine Coast&rsquo;s concussion clinic
          </h2>
          <p className="text-[12px] text-slate-800 leading-relaxed mb-3">
            One trained clinic per region becomes the natural concussion referral destination. The Hub Programme builds out that positioning explicitly &mdash; not just the training, but the relationships and referral pathways that turn it into patient volume.
          </p>
          <div className="grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <p className="font-bold text-slate-900 mb-1">Sports teams + clubs</p>
              <ul className="space-y-0.5 text-slate-700">
                <li>• Sunshine Coast Falcons (Q-Cup rugby league)</li>
                <li>• Junior rugby league + AFL + soccer programs</li>
                <li>• Surf life saving clubs (Maroochydore → Caloundra)</li>
                <li>• Mooloolaba triathlon + cycling clubs</li>
                <li>• Pre-season baseline testing as a paid service</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-900 mb-1">Local schools + GPs</p>
              <ul className="space-y-0.5 text-slate-700">
                <li>• Matthew Flinders Anglican College</li>
                <li>• Sunshine Coast Grammar</li>
                <li>• Immanuel Lutheran, Pacific Lutheran</li>
                <li>• Local GP practices needing a referral path for concussion rehab</li>
                <li>• University of the Sunshine Coast sports program</li>
              </ul>
            </div>
          </div>
          <p className="text-[11px] text-slate-700 leading-snug mt-3 italic">
            We provide editable email templates, capability one-pagers, phone scripts and meeting agendas so your team starts building these relationships <strong>the week after training</strong> &mdash; no DIY work required.
          </p>
        </section>

        {/* THE 4-STAGE HUB FLOW — clinical stages emphasized */}
        <section className="mb-5">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 mb-3">
            How it&rsquo;s delivered — role-by-role on-site at Buderim
          </h2>
          <div className="grid grid-cols-4 gap-2">
            <FlowStage
              num="01"
              roleLabel="Intake"
              team="Reception + admin"
              items={[
                'Phone triage script',
                'Red-flag identification',
                'Intake form additions',
                'Booking flow for concussion priority',
                '1-hr admin micro-course',
              ]}
            />
            <FlowStage
              num="02"
              roleLabel="Diagnosis"
              team="The 9 osteopaths — hands-on"
              items={[
                'SCAT6 + SCOAT6 admin',
                'VOMS deep-dive',
                'BESS scoring',
                'Cervical contribution',
                'Acute return-to-activity',
                'Paediatric concussion',
                '14 CPD hours',
              ]}
              highlight
            />
            <FlowStage
              num="03"
              roleLabel="Rehab"
              team="The EP team"
              items={[
                'Buffalo Treadmill Test',
                'Sub-threshold aerobic Rx',
                'VOR / gaze stability',
                'Amsterdam 2023 RTP',
                'Return-to-work / school',
                'Symptom-tracking tools',
                'Escalation criteria',
              ]}
              highlight
            />
            <FlowStage
              num="04"
              roleLabel="Discharge + Referral"
              team="Whole team"
              items={[
                'GP handover letter',
                'School / coach RTP form',
                'Parent management plan',
                'Sports club RTP cert',
                'Six clinic-licensed templates',
                'Consistent across roles',
              ]}
            />
          </div>
        </section>

        {/* PORTAL PLATFORM ACCESS — ongoing value beyond the training day */}
        <section className="mb-5 rounded-lg border border-slate-300 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-1">
                Not just a training day &mdash; an ongoing platform
              </p>
              <p className="text-[12px] text-slate-800 leading-relaxed">
                Each clinician gets their own login to the CEA platform with permanent access to the courses, clinical references, fillable forms and CPD tracking. New evidence (Amsterdam / AIS updates) flows into the platform; your team stays current.
              </p>
            </div>
            <a
              href="https://portal.concussion-education-australia.com"
              className="shrink-0 text-[10px] font-semibold text-teal-700 underline"
            >
              portal.concussion-education-australia.com
            </a>
          </div>
          <div className="grid grid-cols-4 gap-2 text-[10.5px]">
            <PortalItem title="Concussion Clinical Mastery" detail="Full online course, lifetime access per clinician — A$497 standalone value × team" />
            <PortalItem title="AI in Clinical Practice" detail="3 CPD hours on AHPRA-aligned AI use in clinical notes — launching 17 June, included" />
            <PortalItem title="Fillable SCAT6 + SCOAT6" detail="Web-based + downloadable auto-scoring forms (Adult, Child, SCOAT). Updated as consensus changes." />
            <PortalItem title="Reference library + CPD tracking" detail="140+ peer-reviewed citations, AIS / Amsterdam position statements, per-clinician CPD dashboard." />
          </div>
        </section>

        {/* SUPPORTING INFRASTRUCTURE — the bits that make it stick (medicolegal now SECONDARY) */}
        <section className="mb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700 mb-3">
            What makes the clinical capability stick
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <SupportCard
              label="Plug-and-play templates"
              body="Six discharge documents pre-filled with your clinic branding (GP letter, school RTP, parent plan, sports club cert, NDIS report, insurer doc). Six outreach templates for schools, sports clubs and GPs. Day-one ready."
            />
            <SupportCard
              label="Admin coordination"
              body="A custom 1-hour Concussion Workflow micro-course for reception and admin (not available in our public catalogue) gets your front-of-house aligned with the clinical playbook. Phone triage, intake, booking priority, template management."
            />
            <SupportCard
              label="Defensible documentation"
              body="Every template is AHPRA-, NDIS-, WorkCover- and indemnity-insurer-defensible. Standardised across the team. A genuine bonus — your clinical confidence is backed by paperwork that holds up."
            />
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
            Larger teams or multi-location delivery scoped on request. GST exclusive.
          </p>

          {/* Per-clinician value comparison */}
          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[10px] uppercase tracking-wider text-slate-600 font-bold mb-2">
              Per-clinician math &mdash; vs individual retail
            </p>
            <p className="text-[10.5px] text-slate-700 leading-snug mb-2">
              Individual CCM Complete is <strong>A$1,400 per clinician</strong> at retail. Even Hub Foundation works out cheaper per clinician at Advanced Health&rsquo;s team size, before counting the on-site delivery, templates and ongoing portal access.
            </p>
            <table className="w-full text-[10.5px] border-collapse">
              <thead>
                <tr className="border-b border-slate-300">
                  <th className="text-left py-1.5 font-semibold text-slate-700">Team size</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-slate-700">Individual @ A$1,400 each</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-teal-700">Hub Foundation per clinician</th>
                  <th className="text-right py-1.5 px-2 font-semibold text-teal-800">Hub Complete per clinician</th>
                </tr>
              </thead>
              <tbody className="text-slate-700">
                <tr className="border-b border-slate-200">
                  <td className="py-1.5">8 clinicians</td>
                  <td className="text-right py-1.5 px-2">A$11,200</td>
                  <td className="text-right py-1.5 px-2 font-semibold">A$1,000</td>
                  <td className="text-right py-1.5 px-2 font-semibold">A$1,563</td>
                </tr>
                <tr className="border-b border-slate-200 bg-white">
                  <td className="py-1.5">12 clinicians</td>
                  <td className="text-right py-1.5 px-2">A$16,800</td>
                  <td className="text-right py-1.5 px-2 font-semibold">A$667</td>
                  <td className="text-right py-1.5 px-2 font-semibold">A$1,042</td>
                </tr>
                <tr className="border-b border-slate-200 bg-teal-50/40">
                  <td className="py-1.5 font-semibold">16 clinicians (Advanced Health published team)</td>
                  <td className="text-right py-1.5 px-2">A$22,400</td>
                  <td className="text-right py-1.5 px-2 font-bold text-teal-800">A$500</td>
                  <td className="text-right py-1.5 px-2 font-bold text-teal-800">A$781</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[9.5px] text-slate-500 italic mt-2 leading-snug">
              Individual retail comparison uses CCM Complete (A$1,400). Per-clinician Hub price excludes the templates, outreach package, admin micro-course, 30-day support, on-site delivery and ongoing platform updates &mdash; all of which are bundled in.
            </p>
          </div>
        </section>

        {/* OUTCOMES — clinical + business framing */}
        <section className="mb-5 rounded-lg border border-teal-200 bg-teal-50/40 p-3">
          <p className="text-[10px] uppercase tracking-wider text-teal-800 font-bold mb-1.5">
            What success looks like at 6 months
          </p>
          <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-700">
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">Clinical confidence</p>
              <p className="leading-snug">Every clinician confident on SCAT6, VOMS, BESS and structured rehab. The conditions your team was guessing on six months ago are now your strongest clinical capability.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">The local concussion clinic</p>
              <p className="leading-snug">Sunshine Coast schools, sports clubs and GPs know Advanced Health is the concussion-trained referral destination. New patients flowing in from referral relationships you didn&rsquo;t have before.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-0.5">Audit-safe by default</p>
              <p className="leading-snug">Every note, every discharge, every referral document is AHPRA-, NDIS- and WorkCover-defensible. The clinical capability you&rsquo;ve built is backed by documentation that holds up.</p>
            </div>
          </div>
        </section>

        {/* CTA + FOOTER */}
        <section className="border-t-2 border-teal-700 pt-5">
          <div className="grid grid-cols-[1fr_auto] gap-5 items-center">
            <div>
              <p className="text-[14px] font-bold text-slate-900 mb-1">
                Book a 20-minute scoping call
              </p>
              <p className="text-[11px] text-slate-700 leading-snug">
                Pick a window that suits. I&rsquo;ll come back with a tailored one-page proposal for the exact team and topic mix you want included.
              </p>
            </div>
            <a
              href="https://cal.com/zac-lewis-so8zjs/30min"
              className="shrink-0 inline-flex items-center justify-center gap-1.5 px-6 py-3 rounded-lg bg-teal-700 text-white text-[12px] font-bold hover:bg-teal-800 transition-colors whitespace-nowrap shadow-md no-underline print:bg-white print:text-teal-700 print:border-2 print:border-teal-700"
            >
              Book a call → cal.com/zac-lewis-so8zjs/30min
            </a>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-4 text-[10px] text-slate-600">
            <div>
              <p className="font-semibold text-slate-800">Zac Lewis · AHPRA-registered Osteopath</p>
              <p>Founder, Concussion Education Australia</p>
            </div>
            <div className="text-right">
              <p>zac@concussion-education-australia.com</p>
              <p className="text-teal-700">portal.concussion-education-australia.com</p>
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
        highlight ? 'border-teal-400 bg-teal-50/60' : 'border-slate-200 bg-white'
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

function OutcomeCard({
  icon,
  label,
  body,
  primary,
}: {
  icon: string
  label: string
  body: string
  primary?: boolean
}) {
  return (
    <div className={`rounded-lg border ${primary ? 'border-teal-300 bg-teal-50/30' : 'border-slate-200 bg-slate-50'} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[18px] leading-none">{icon}</span>
        <p className={`text-[11px] font-bold uppercase tracking-wide ${primary ? 'text-teal-800' : 'text-slate-800'}`}>{label}</p>
      </div>
      <p className="text-[10.5px] text-slate-700 leading-snug">{body}</p>
    </div>
  )
}

function PortalItem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-2">
      <p className="text-[10px] font-bold text-slate-900 mb-0.5">{title}</p>
      <p className="text-[9.5px] text-slate-600 leading-snug">{detail}</p>
    </div>
  )
}

function SupportCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-bold text-slate-900 mb-1.5">{label}</p>
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
