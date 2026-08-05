'use client'

import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'
import { CompetencyGapEvidence } from '@/components/clinical/CompetencyGapEvidence'
import { CONFIG as APP_CONFIG } from '@/lib/config'

/**
 * SST Trainer — TARGET-facing pitch pages (distinct from the patient landing).
 *
 * One variant-driven component, three shareable routes: /sst/clinics, /sst/acc,
 * /sst/guild. Each opens on THAT target's own problem and maps the solution to
 * it. Matches the SstLanding design language (fonts, mesh, teal, bounded cards).
 *
 * CLAIM DISCIPLINE (same as the outreach + papers): OA endorsement is real;
 * ESSA is "designed to ESSA standards" (pending, never "accredited"); no
 * efficacy/diagnostic claim; papers are NOT referenced (not submitted).
 *
 * PMS WRITE-BACK CLAIMS (updated 2026-08-03, was a blanket ban):
 *  - CLINIKO: claimable — validated against a live tenant 2026-07-20, writes
 *    allowed, live integration guide at /integrations/cliniko.
 *  - PRACSUITE: "in onboarding" claimable only AFTER Smartsoft issue the
 *    vendor key (application in ISO27001-pathway review, Aug 2026).
 *  - GENSOLVE: still NO claim, in any form — adapter writes are gated off
 *    until first live-tenant validation (no public sandbox).
 * ESSA note above is also historical: accreditation GRANTED 2026-07-24.
 */

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
})

const ACCENT = '#0d7377'

export type SstPitchVariant = 'clinics' | 'acc' | 'guild'

interface Solution {
  icon: string
  title: string
  body: string
}
interface VariantConfig {
  eyebrow: string
  headlineLead: string
  headlineAccent: string
  subhead: string
  heroChips: string[]
  ctaLabel: string
  ctaHref: string
  secondaryLabel: string
  secondaryHref: string
  /** Self-serve demo links (DEMO00 fixture data — keyless, no sign-in). */
  demoLinks?: { label: string; href: string }[]
  showDemo: boolean
  painTitle: string
  painBody: string
  solutionsTitle: string
  solutions: Solution[]
  proof: string[]
  closingTitle: string
  closingBody: string
}

const MAILTO = (subject: string, body: string) =>
  `mailto:zac@concussion-education-australia.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

const CONFIG: Record<SstPitchVariant, VariantConfig> = {
  clinics: {
    eyebrow: 'For concussion-managing clinics',
    headlineLead: 'The five-days-a-week',
    headlineAccent: 'you can’t see.',
    subhead:
      'Sub-threshold aerobic rehab happens at home, most days of the week — where you can’t tell whether they hit the right heart rate or bailed early. SST Trainer puts every home session on your dashboard, and generates the GP report for you to review and sign.',
    heroChips: ['Measured Buffalo-protocol threshold', 'Live HR from the patient’s own watch', 'Clinician-directed — you review and sign'],
    ctaLabel: 'See the clinician dashboard',
    ctaHref: MAILTO('SST Trainer — clinician dashboard', 'Hi Zac — I’d like a 15-minute look at the SST Trainer dashboard for our clinic.'),
    secondaryLabel: 'Try the patient app →',
    secondaryHref: '/sst-trainer',
    demoLinks: [{ label: 'Explore the demo dashboard →', href: '/clinical-hub?clinic=DEMO00' }],
    showDemo: true,
    painTitle: 'Between visits, you’re working blind.',
    painBody:
      'The therapy is the home sessions — and you don’t see them. Adherence is invisible, the heart-rate response is invisible, and every GP or return-to-play letter is rebuilt from memory. You already know how to run the Buffalo protocol; the gap is delivering and monitoring it between appointments.',
    solutionsTitle: 'What lands in your workflow',
    solutions: [
      { icon: '❤', title: 'A measured threshold, not an age formula', body: 'A guided graded test sets the individual heart-rate threshold. The 80–90% training band is prescribed from that measured value — not 220-minus-age.' },
      { icon: '⤴', title: 'Every home session on your dashboard', body: 'The patient enters your clinic code once; each session streams back live — objective HR, time-in-band, adherence, and any stop-rule flare.' },
      { icon: '✓', title: 'Only verified sessions progress the band', body: 'Live-wearable sessions advance the band; typed numbers count for safety, never progression. The band is capped at the measured threshold.' },
      { icon: '📄', title: 'The GP report writes itself', body: 'At episode end the report generates — trajectory, adherence, clearance-or-extend recommendation — as a single-page PDF you review and sign.' },
    ],
    proof: ['Osteopathy Australia–endorsed concussion CPD sits alongside the tool', 'Clinician-directed: the tool presents data and paces the protocol; you decide', 'A review-and-sign PDF report you attach to the patient file'],
    closingTitle: 'Put every patient’s trajectory on your dashboard.',
    closingBody: 'Fifteen minutes and I’ll show you the between-visit view for a single patient, and the report it generates at episode end.',
  },
  acc: {
    eyebrow: 'For NZ ACC concussion services',
    headlineLead: 'Your ACC884 outcomes,',
    headlineAccent: 'generated as you deliver.',
    subhead:
      'A measured sub-threshold aerobic programme where every home session is a functional outcome — so the ACC884 Client Summary Report ACC expects at service exit compiles itself from the data you already captured.',
    heroChips: ['Functional measure — not symptom logging', 'ACC884 outcome content, compiled for you', 'Print-ready for transcription onto ACC’s form'],
    ctaLabel: 'Show a clinical lead',
    ctaHref: MAILTO('SST Trainer — ACC concussion reporting', 'Hi Zac — I’d like a 15-minute look at the ACC884 Client Summary Report and the outcome view for our service.'),
    secondaryLabel: 'See how the trainer works →',
    secondaryHref: '/sst-trainer',
    demoLinks: [
      { label: 'See a sample ACC884 →', href: '/demo/acc' },
      { label: 'Explore the demo dashboard →', href: '/clinical-hub?clinic=DEMO00' },
    ],
    showDemo: true,
    painTitle: 'The ACC884 Client Summary Report — compiled by hand.',
    painBody:
      'At service exit ACC expects the ACC884 Client Summary Report — the treatment provided, a risk assessment, the outcomes, and any services still needed — with a functional rather than symptom-led focus. Compiling that by hand is the admin that eats your week, and it’s the exact gap the ACC-funded evaluation of the sector named: no PMS integration, and outcome measurement skewed to symptoms over function.',
    solutionsTitle: 'One workflow closes both gaps',
    solutions: [
      { icon: '📈', title: 'A functional outcome, measured', body: 'Serial measured heart-rate threshold and objective home-session data are functional outcomes — the measure the sector evaluation said was missing.' },
      { icon: '🗂', title: 'The ACC884, compiled for you', body: 'The measured trajectory, adherence and outcome populate the ACC884 Client Summary Report content, carrying the ACC45 claim reference — you review it, transcribe onto ACC’s form and file.' },
      { icon: '✔', title: 'Outcomes reviewed across delivery', body: 'Every graded re-test is a review point; the report shows outcome measures were reviewed across the service, not reconstructed at discharge.' },
      { icon: '⤴', title: 'Reviewed between visits, on your dashboard', body: 'Home sessions stream to the clinician via a service code, so the review is continuous and visible — not reconstructed at discharge.' },
    ],
    proof: [`Clinical-stream training OA-endorsed; exercise-physiology stream ESSA-accredited (No. ${APP_CONFIG.ESSA_ACCREDITATION.NUMBER})`, 'ACC884 content compiled from delivery data, ready to transcribe', 'Send to a clinical or service lead — this is a workflow, not a referral'],
    closingTitle: 'The functional measure your evaluation said was missing.',
    closingBody: 'Fifteen minutes with a clinical lead and I’ll walk the ACC884 Client Summary Report and the outcome-review evidence on a sample episode.',
  },
  guild: {
    eyebrow: 'For Guild Insurance — introduced via Osteopathy Australia',
    headlineLead: 'A defensible record behind',
    headlineAccent: 'every concussion decision.',
    subhead:
      'An Osteopathy Australia–endorsed concussion CPD and a companion RiskHQ risk-management resource — with a clinician-directed, fully-documented audit trail if a management or return-to-play decision is ever questioned.',
    heroChips: ['Osteopathy Australia–endorsed', 'RiskHQ risk-management fit', 'Clinician-directed, documented end to end'],
    ctaLabel: 'Arrange 20 minutes with OA',
    ctaHref: MAILTO('Concussion resource for Guild — via OA', 'Hi Zac — happy to find 20 minutes with OA to look at the concussion CPD and RiskHQ resource.'),
    secondaryLabel: 'See the clinician tool →',
    secondaryHref: '/clinical-suite/clinics',
    showDemo: false,
    painTitle: 'Concussion is a rising decision your insured clinicians must defend.',
    painBody:
      'Return-to-play and management calls are increasingly scrutinised, and they fall to the osteos and physios you insure. The exposure isn’t the exercise — it’s whether the decision was structured, evidence-based and documented. That’s a risk-education and record-keeping problem, which is squarely RiskHQ territory.',
    solutionsTitle: 'What Guild gets',
    solutions: [
      { icon: '🎓', title: 'An OA-endorsed concussion CPD', body: 'A quality-assured education pathway for your insured allied-health cohort — already endorsed by Osteopathy Australia, your principal partner.' },
      { icon: '🛡', title: 'A RiskHQ concussion resource', body: 'A practical risk-management piece shaped to whatever format your risk team prefers — the simplest place to start.' },
      { icon: '🧾', title: 'A defensible audit trail', body: 'When clinicians use the SST tool, care is clinician-directed and documented end to end — timestamped decisions, verified data, stop-rule events — a record that stands up if a claim is questioned.' },
      { icon: '🤝', title: 'Inside your existing OA relationship', body: 'This comes through Osteopathy Australia, not around it — built for the network you already partner with.' },
    ],
    proof: ['Osteopathy Australia–endorsed', 'Introduced through your 16-year OA partnership', 'A supporting record, not a clinical claim — clinicians hold all judgement'],
    closingTitle: 'A risk-management resource, inside your OA partnership.',
    closingBody: 'The simplest start is a RiskHQ concussion piece, with the CPD as the deeper option — 20 minutes with OA in the room.',
  },
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">{children}</span>
  )
}

export default function SstPitch({ variant }: { variant: SstPitchVariant }) {
  const c = CONFIG[variant]
  return (
    <div
      className={`${hanken.className} ${spaceGrotesk.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      {/* HERO */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-6 pb-16 pt-14 md:px-8">
        <div className="flex flex-1 basis-[420px] flex-col gap-[22px]">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none tracking-[0.02em]"
            style={{ background: '#ccfbf1', color: '#0f766e' }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            {c.eyebrow}
          </span>
          <h1 className="m-0 text-[clamp(34px,4.5vw,56px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            {c.headlineLead} <span style={{ color: ACCENT }}>{c.headlineAccent}</span>
          </h1>
          <p className="m-0 max-w-[540px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
            {c.subhead}
          </p>
          <div className="mt-0.5 flex flex-wrap gap-3">
            <a
              href={c.ctaHref}
              className="flex cursor-pointer items-center gap-2 rounded-[13px] border-none px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              {c.ctaLabel}
            </a>
            <Link
              href={c.secondaryHref}
              className="flex items-center gap-2 rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              {c.secondaryLabel}
            </Link>
          </div>
          {c.demoLinks && c.demoLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
              {c.demoLinks.map((d) => (
                <Link
                  key={d.href}
                  href={d.href}
                  className="text-[13.5px] font-bold hover:underline"
                  style={{ color: ACCENT }}
                >
                  {d.label}
                </Link>
              ))}
              <span className="text-[12px] font-semibold text-slate-400">
                Self-serve, sample data — no sign-in
              </span>
            </div>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-[18px]">
            {c.heroChips.map((chip, i) => (
              <span key={chip} className="flex items-center gap-[18px]">
                {i > 0 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                <Chip>{chip}</Chip>
              </span>
            ))}
          </div>
        </div>
        {c.showDemo && (
          <div className="flex min-w-0 flex-1 basis-[540px] justify-center">
            <SstTrainerDemo />
          </div>
        )}
      </header>

      {/* THE PROBLEM (named for this target) */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 pt-2 md:px-8">
        <div
          className="rounded-[22px] border p-[34px] md:p-[40px]"
          style={{ background: 'linear-gradient(135deg,#fff,#f8fafc)', borderColor: '#e2e8f0' }}
        >
          <span className="text-[12px] font-bold uppercase leading-none tracking-[0.1em] text-slate-400">
            The problem
          </span>
          <h2 className="mb-3 mt-3 text-[clamp(23px,2.6vw,32px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
            {c.painTitle}
          </h2>
          <p className="m-0 max-w-[760px] text-[15px] leading-[1.6] text-slate-600">{c.painBody}</p>
        </div>
      </section>

      {/* WHY THE TEAM LAYER IS PART OF IT — published competency gap.
          Sits between the pain and the solution: the buyer has just accepted
          there is a problem, and this is the moment they ask "why isn't our
          existing team enough?". Answering that with citations rather than
          assertion is the only way to raise it without insulting their
          clinicians. */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[60px] md:px-8">
        <CompetencyGapEvidence />
      </section>

      {/* THE SOLUTION (mapped to the pain) */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[60px] md:px-8">
        <h2 className="mb-[26px] text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          {c.solutionsTitle}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {c.solutions.map((s) => (
            <div key={s.title} className="rounded-[16px] border border-slate-200 bg-white p-[22px]">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-[15px] font-bold leading-none text-teal-700"
                style={{ background: '#ccfbf1', fontFamily: 'var(--font-space), sans-serif' }}
              >
                {s.icon}
              </span>
              <h3 className="mb-1.5 mt-[13px] text-[16.5px] font-bold leading-[1.18]">{s.title}</h3>
              <p className="m-0 text-[13.5px] leading-[1.55] text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROOF + CLOSING CTA */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[72px] md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-[30px] rounded-[22px] bg-slate-900 px-9 py-[34px]">
          <div className="flex-1 basis-[440px]">
            <h2 className="m-0 mb-2.5 text-[clamp(22px,2.4vw,30px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-white">
              {c.closingTitle}
            </h2>
            <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-slate-300">{c.closingBody}</p>
            <ul className="mt-4 flex flex-col gap-1.5">
              {c.proof.map((p) => (
                <li key={p} className="flex items-start gap-2 text-[13px] leading-[1.45] text-slate-400">
                  <span className="mt-[6px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: '#5eead4' }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <a
            href={c.ctaHref}
            className="cursor-pointer rounded-[13px] border-none px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            {c.ctaLabel}
          </a>
        </div>
        <p className="mt-4 text-center text-[12px] leading-[1.5] text-slate-400">
          Clinician-directed rehabilitation-delivery and monitoring tool — not a diagnosis, prognosis or
          return-to-play clearance. The supervising clinician holds all clinical judgement.
        </p>
      </section>
    </div>
  )
}
