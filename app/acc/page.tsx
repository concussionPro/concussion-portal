import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'
import { CompetencyGapEvidence } from '@/components/clinical/CompetencyGapEvidence'
import { TrackedOutbound } from '@/components/TrackedOutbound'

/**
 * NOT INDEXABLE.
 * This is a SUPPLIER NEGOTIATION document for ACC contract holders, not
 * marketing — it is reached by a direct link, and indexing a pitch aimed at one
 * counterparty is a positioning risk.
 * (Unlisted-but-crawlable was the worst of both: no sitemap entry, no
 * noindex — discoverable by accident and managed by nobody.)
 */
export const metadata = { robots: 'noindex, nofollow' } as const


/**
 * /acc — the NZ ACC Concussion Services supplier pitch.
 *
 * BUYER: an organisation holding an ACC Concussion Services contract — a
 * clinical director or contract lead. The product sold is THE REPORT and
 * DOCUMENTED TEAM COMPETENCY. Rehabilitation is the mechanism, never the pitch.
 *
 * DESIGN RULE (owner, three times: "text mess"): this page is STRUCTURE, not
 * prose. Every block is a table, a strip, a card row or a live artifact. The
 * only paragraphs that survive are the evidence footnote and the legal
 * disclosure, which must read as prose. New content that wants to be a
 * paragraph belongs in the supplier pack, not here.
 *
 * CLAIM DISCIPLINE: CEA has NO outcome data. Never state or imply this software
 * shortens recovery. The trial result is cited ONCE, in the footnote, with its
 * population limit stated — an ACC caseload (39.5% falls, 20% MVA, 8.9%
 * assault) is not the adolescent sport-concussion population that was studied.
 *
 * ARGUMENT: the contract's own tension — Cl. 5.2.1 mandates five disciplines,
 * none trained at entry in exercise testing; Cl. 5.8.2.1.2 obliges exercise
 * tolerance assessment. NO renewal hook (term runs to 30 June 2027); the lever
 * is Cl. 1.2.2 — the extension is performance-conditional.
 *
 * Robots noindex/nofollow + the claim-discipline list live in layout.tsx.
 */

const hanken = Hanken_Grotesk({ subsets: ['latin'] })
const space = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' })

const ACCENT = '#0d9488'
const CONTACT_EMAIL = CONFIG.CONTACT_EMAIL
const REPORT_URL =
  '/api/sst/report?code=DEMO00&patient=Demo%20Patient&skin=acc884&first=Alex&last=Demo&claim=AB12345&clinician=Reviewing%20Clinician'

const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'ACC Concussion Services — exercise tolerance assessment and ACC884 reporting',
)}&body=${encodeURIComponent(
  'Hi Zac — I hold (or support) an ACC Concussion Services contract and would like 20 minutes to look at the ACC884 output and the competency component.\n\nOrganisation:\nRole:\nBest time:',
)}`

/** ACC's own performance measures -> what an episode record can evidence. */
const MEASURES_TBL: { measure: string; source: string; record: string }[] = [
  { measure: 'Client outcomes', source: 'Recovery duration, from ACC claims data', record: 'Serial measured threshold — a physiological trajectory, not a symptom score' },
  { measure: 'Quality', source: 'Service delivery against the schedule', record: 'Every home session recorded against the prescribed band; dose and adherence observed' },
  { measure: 'Timeliness', source: 'Return-to-work metrics; reporting deadlines', record: 'ACC884 content accumulates during delivery, not at the deadline' },
]

/** The admin reality, before and after. */
const SHIFT: { step: string; before: string; after: string }[] = [
  { step: 'During the episode', before: 'Appointment notes, written for clinical use', after: 'Structured record: threshold, band, minutes, symptom deltas' },
  { step: 'At service exit', before: 'Reconstruct the episode from notes', after: 'Review the compiled ACC884 content' },
  { step: 'Six-monthly return', before: 'Assemble by hand from files', after: 'Aggregate what is already structured' },
]

const CLAUSES = [
  { ref: 'Cl. 5.2.1', text: 'Mandates the team: medical, neuropsychology, psychology, OT, physiotherapy — none trained at entry to practice in graded exercise testing.' },
  { ref: 'Cl. 5.8.2.1.2', text: 'Obliges you to deliver “assessment of exercise tolerance and/or functional capacity”.' },
  { ref: 'Cl. 13.4', text: 'Your performance is shared, non-anonymised, with every other contracted supplier.' },
  { ref: 'Cl. 1.2.2', text: 'The one-year extension is conditional on ACC being satisfied with performance.' },
] as const

const MEASURES = [
  { k: 'Client outcomes', body: 'A serial measured threshold is a physiological outcome, not a symptom score — an objective record of tolerance recovering, or not.' },
  { k: 'Quality', body: 'Every home session is recorded against the prescribed band. Dose and adherence are observed, not assumed.' },
  { k: 'Timeliness', body: 'Content accumulates as care is delivered, so the six-monthly deadline becomes review-and-transcribe, not reconstruct-from-notes.' },
] as const

export default function AccSupplierPage() {
  return (
    <div
      className={`${hanken.className} ${space.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-6 pb-12 pt-14 md:px-8">
        <div className="flex flex-1 basis-[420px] flex-col gap-5">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none"
            style={{ background: '#ccfbf1', color: '#0f766e' }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            For ACC Concussion Services suppliers
          </span>
          <h1 className="m-0 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            Your ACC884s, written{' '}
            <span style={{ color: ACCENT }}>as the care happens.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,17.5px)] leading-[1.55] text-slate-600">
            The instrument for delivering the consensus first-line treatment — aerobic
            exercise prescribed from a <strong>measured</strong> heart-rate threshold —
            which records the objective outcome as it goes. Your six-monthly becomes
            review-and-transcribe instead of reconstruct-from-notes.
          </p>
          {/* Evidence chips — the email leads 17→13; the page must echo it
              above the fold, not bury it in the legal footnote. */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {[
              '17 → 13 days median recovery (Leddy 2019)',
              'Threshold measured, never estimated',
              'ACC884 compiles as care happens',
              'Reports file into Gensolve',
            ].map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate-500">
                <span className="h-[6px] w-[6px] rounded-full" style={{ background: ACCENT }} />
                {c}
              </span>
            ))}
          </div>
          {/* Arrival context: they clicked from an email OFFERING the sample
              ACC884 — the artifact is the primary CTA, the dashboard second,
              booking one click away. Never "email me" as the first ask. */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/demo/acc"
              className="flex cursor-pointer items-center rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              See a sample ACC884
            </Link>
            <Link
              href="/demo/clinic"
              className="flex items-center rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              Tour the clinician workspace
            </Link>
          </div>
          <p className="m-0 text-[12.5px] font-medium text-slate-500">
            Live demos, no sign-in — every patient shown is fabricated. The workspace tour is the
            real product surface, Gensolve connection included; and{' '}
            <a href="#workflow" className="font-bold underline" style={{ color: ACCENT }}>
              reports file into the PMS you already run
            </a>
            . Ready to talk?{' '}
            <TrackedOutbound href="https://cal.com/zac-lewis-so8zjs/30min" event="cal_click" source="acc-hero" className="font-bold underline" style={{ color: ACCENT }}>
              Book 20 minutes
            </TrackedOutbound>.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 basis-[520px] justify-center">
          <SstTrainerDemo />
        </div>
      </header>

      {/* ── THE PACKAGE — one offer, two halves, visually joined ──────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div className="overflow-hidden rounded-[20px] border-2" style={{ borderColor: ACCENT }}>
          <div className="px-6 py-4" style={{ background: '#f0fdfa' }}>
            <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>
              One package — sold together, because neither works alone
            </p>
            <p className="m-0 mt-1 text-[clamp(18px,2.2vw,24px)] font-extrabold leading-[1.15] tracking-[-0.02em]">
              Two instruments — one that engages athletes before the injury, one that delivers
              and evidences the funded episode — plus the accredited training that makes your
              team compliant to run them. Documentation automated, filed into Gensolve.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3">
            <div className="border-t border-slate-200 p-6 md:border-r">
              <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Instrument 1 — the funded episode</p>
              <p className="m-0 mt-1.5 text-[17px] font-extrabold text-slate-900">SST Trainer</p>
              <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-slate-600">
                Measured threshold, verified home sessions, the ACC884 compiling as care happens —
                the obliged exercise-tolerance assessment (Cl.&nbsp;5.8.2.1.2), self-documenting.
              </p>
            </div>
            <div className="border-t border-slate-200 p-6 md:border-r">
              <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Instrument 2 — the front door</p>
              <p className="m-0 mt-1.5 text-[17px] font-extrabold text-slate-900">Baseline testing</p>
              <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-slate-600">
                One link engages a whole club — athletes self-complete in ~5 minutes, no
                appointment, baseline on file. Engaged athletes present <em>early</em> — and
                &ldquo;entered Stage&nbsp;1 within two weeks of injury&rdquo; is a measure
                you&rsquo;re scored on.
              </p>
            </div>
            <div className="border-t border-slate-200 p-6">
              <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">The competency layer</p>
              <p className="m-0 mt-1.5 text-[17px] font-extrabold text-slate-900">Accredited team training</p>
              <p className="m-0 mt-2 text-[13.5px] leading-[1.55] text-slate-600">
                For the physios and OTs your contract already mandates — OA-endorsed,
                ESSA-accredited, certificated per clinician: the documented competency
                Cl.&nbsp;15.2 requires.
              </p>
            </div>
          </div>
          <p className="m-0 border-t border-slate-200 bg-slate-50 px-6 py-3 text-[12.5px] leading-[1.5] text-slate-500">
            The instruments without competency produce reports a clinician can&rsquo;t defend;
            competency without the instruments produces trained clinicians who still can&rsquo;t
            see the treatment; and both run on one clinic code, filing into the PMS you already
            use. That&rsquo;s why it&rsquo;s one package.
          </p>
        </div>
      </section>

      {/* ── THE SHIFT — before/after strip ─────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr] sm:grid-cols-[minmax(140px,0.8fr)_1fr_1fr]">
            <div className="hidden bg-slate-50 px-5 py-3 sm:block" />
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 sm:block">Today</div>
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] sm:block" style={{ color: ACCENT }}>With SST Trainer</div>
            {SHIFT.map((r) => (
              <div key={r.step} className="contents">
                <div className="border-t border-slate-100 px-5 pb-1 pt-4 text-[13px] font-bold text-slate-900 sm:py-4">{r.step}</div>
                <div className="px-5 pb-1 text-[13.5px] leading-[1.5] text-slate-500 sm:border-t sm:border-slate-100 sm:py-4">{r.before}</div>
                <div className="px-5 pb-4 text-[13.5px] font-medium leading-[1.5] text-slate-800 sm:border-t sm:border-slate-100 sm:py-4">{r.after}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THE ARTIFACT — the page's centre of gravity ────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="m-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
              This is the actual output
            </h2>
            <p className="m-0 mt-2 max-w-[660px] text-[14.5px] leading-[1.55] text-slate-600">
              Rendered live from a fabricated example episode — not a real client. Your clinician reviews and transcribes onto
              ACC&rsquo;s fillable form — it compiles the content, it doesn&rsquo;t file anything.
            </p>
          </div>
          <Link
            href="/demo/acc"
            className="flex items-center rounded-[12px] border-[1.5px] border-slate-300 bg-white px-4 py-2.5 text-[13.5px] font-bold leading-none text-slate-900"
          >
            Open full screen →
          </Link>
        </div>
        <div
          className="overflow-hidden rounded-[18px] border border-slate-200 bg-white"
          style={{ boxShadow: '0 30px 60px -30px rgba(15,23,42,.25)' }}
        >
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11.5px] font-medium text-slate-400">
              ACC884 Client Summary Report — fabricated example
            </span>
          </div>
          <iframe
            src={REPORT_URL}
            title="Example ACC884 Client Summary Report, rendered live from fabricated demonstration data"
            className="block h-[560px] w-full border-0"
            loading="lazy"
            sandbox="allow-same-origin"
          />
        </div>
        <p className="mt-3 text-[12.5px] leading-[1.5] text-slate-400">
          ACC884 is the Client Summary Report — not a treatment plan (that&rsquo;s the ACC32).
          ACC885 is Did Not Attend — not progress. Jurisdiction is enforced in software: an
          Australian code cannot emit an ACC form.
        </p>
      </section>

      {/* ── WHY THE TEAM LAYER IS PART OF THIS — published competency gap ──── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <CompetencyGapEvidence heading="Why documented team competency is part of the deliverable" />
      </section>

      {/* ── THE CONTRACT — bento, not a text block ────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-1 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          And your contract already asks for it
        </h2>
        <p className="mb-5 max-w-[680px] text-[14px] leading-[1.5] text-slate-600">
          Amsterdam 2022 changed the <em>method</em>, not the service — an upgrade to what you
          already run.
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {/* the obligation — hero tile */}
          <div className="rounded-[18px] border-2 p-6 md:col-span-2" style={{ borderColor: ACCENT, background: '#f0fdfa' }}>
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em]" style={{ color: ACCENT }}>
              What you must deliver
            </span>
            <p className="m-0 mt-2 text-[19px] font-extrabold leading-[1.3] text-slate-900">
              &ldquo;Assessment of exercise tolerance and/or functional capacity&rdquo;
            </p>
            <p className="m-0 mt-2 text-[13px] font-bold" style={{ fontFamily: 'var(--font-space), sans-serif', color: ACCENT }}>
              Cl. 5.8.2.1.2
            </p>
          </div>

          {/* the team */}
          <div className="rounded-[18px] border border-slate-200 bg-white p-6">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Who you have
            </span>
            <p className="m-0 mt-2 text-[14.5px] font-semibold leading-[1.45] text-slate-800">
              Medical · Neuropsychology · Psychology · OT · Physiotherapy
            </p>
            <p className="m-0 mt-2 text-[13px] leading-[1.45] text-slate-500">
              None trained at entry to practice in graded exercise testing.
            </p>
            <p className="m-0 mt-2 text-[12px] font-bold text-slate-400" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
              Cl. 5.2.1
            </p>
          </div>

          {/* the stakes — dark, full width */}
          <div className="rounded-[18px] bg-slate-900 p-6 md:col-span-3">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              And who sees the result
            </span>
            <div className="mt-3 grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
              <div>
                <p className="m-0 text-[15px] font-semibold leading-[1.45] text-white">
                  Your performance is shared <strong style={{ color: '#5eead4' }}>non-anonymised</strong> with
                  every other contracted supplier.
                </p>
                <p className="m-0 mt-1.5 text-[12px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                  Cl. 13.4
                </p>
              </div>
              <div>
                <p className="m-0 text-[15px] font-semibold leading-[1.45] text-white">
                  The one-year extension is conditional on ACC being satisfied with it.
                </p>
                <p className="m-0 mt-1.5 text-[12px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                  Cl. 1.2.2
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-5 max-w-[860px] text-[12.5px] leading-[1.55] text-slate-400">
          Evidence base: in the pivotal randomised trial, adolescent athletes prescribed
          individualised sub-symptom-threshold aerobic exercise recovered in a median of 13 days
          versus 17 on placebo-like stretching (Leddy et al., <em>JAMA Pediatrics</em> 2019; n=103,
          ages 13&ndash;18, P=.009). That population is narrower than an ACC caseload. CEA holds no
          outcome data of its own and makes no efficacy claim for its software: the tool delivers
          the published protocol and records what happened.
        </p>
      </section>

      {/* ── WORKFLOW + COMMERCIALS ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        {/* WORKFLOW — how it wires into what they already run. Gensolve covers
            90%+ of NZ allied health (gensolve.com/nz — 1,000+ practices, native
            ACC billing), so "not another PMS" is the wiring story, not a
            disclaimer. CLAIM DISCIPLINE: the Gensolve write-back adapter is
            BUILT but never validated against a live tenant (no public sandbox;
            per-tenant key + IP whitelist) — say "validated with our first
            partner", never "integrated" or "certified". */}
        <h3 id="workflow" className="mb-1 mt-8 scroll-mt-24 text-[clamp(18px,2vw,22px)] font-extrabold leading-[1.15] tracking-[-0.02em]">
          Not another PMS — it feeds the one you run
        </h3>
        <p className="mb-4 max-w-[680px] text-[13.5px] leading-[1.5] text-slate-600">
          Your team keeps working where they already work. SST is the measured-data layer
          underneath — education, the instrument, and the reporting convenience.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-[18px] border border-slate-200 bg-white p-5">
            <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Today</p>
            <p className="m-0 mt-1.5 text-[14.5px] font-bold leading-[1.4] text-slate-800">
              Reports land in the patient record
            </p>
            <p className="m-0 mt-1.5 text-[13px] leading-[1.5] text-slate-600">
              ACC884 content and clinical reports render as documents for Gensolve — or whichever
              PMS you run. Nothing migrates, nobody re-keys.
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-5">
            <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">With the pilot partner</p>
            <p className="m-0 mt-1.5 text-[14.5px] font-bold leading-[1.4] text-slate-800">
              Direct Gensolve write-back
            </p>
            <p className="m-0 mt-1.5 text-[13px] leading-[1.5] text-slate-600">
              The adapter that files reports into the patient&rsquo;s Gensolve record is built —
              validated with the first partner tenant.
            </p>
          </div>
          <div className="rounded-[18px] border border-slate-200 bg-white p-5">
            <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Always</p>
            <p className="m-0 mt-1.5 text-[14.5px] font-bold leading-[1.4] text-slate-800">
              Patients need no clinic hardware
            </p>
            <p className="m-0 mt-1.5 text-[13px] leading-[1.5] text-slate-600">
              Home sessions run on the patient&rsquo;s own watch; the clinician view is a browser.
              Nothing to buy or manage.
            </p>
          </div>
        </div>

        {/* COMMERCIALS — negotiated per organisation (owner 2026-07-27: no
            published pricing bentos; every agreement is its own negotiation). */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-[18px] border border-slate-200 bg-white px-6 py-5">
          <div className="min-w-[260px] flex-1">
            <p className="m-0 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">Commercials</p>
            <p className="m-0 mt-1.5 text-[14.5px] leading-[1.55] text-slate-700">
              Agreed per organisation, on the clinicians <strong>delivering the concussion
              service</strong> — never headcount. The pilot is free for the first two organisations:
              one clinician, a few real episodes, end to end.
            </p>
          </div>
          <TrackedOutbound
            href="https://cal.com/zac-lewis-so8zjs/30min"
            event="cal_click"
            source="acc-commercials"
            className="flex cursor-pointer items-center rounded-[13px] px-[22px] py-[14px] text-[14.5px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            Scope it in 20 minutes
          </TrackedOutbound>
        </div>
      </section>

      {/* ── CLOSE ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[72px] md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 rounded-[22px] bg-slate-900 px-9 py-[32px]">
          <div className="flex-1 basis-[420px]">
            <h2 className="m-0 mb-2.5 text-[clamp(21px,2.3vw,28px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-white">
              Twenty minutes, and one commercial question
            </h2>
            <p className="m-0 max-w-[540px] text-[14.5px] leading-[1.55] text-slate-300">
              A scoping conversation with your clinical lead — nothing sold in it. Test whether this
              gap matches the one you&rsquo;re carrying, and settle the funding question. From there
              the natural pilot is one clinician and a few real episodes end to end.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <TrackedOutbound
              href="https://cal.com/zac-lewis-so8zjs/30min"
              event="cal_click"
              source="acc-close"
              className="cursor-pointer rounded-[13px] px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
            >
              Book 20 minutes
            </TrackedOutbound>
            <a
              href={MAILTO}
              className="cursor-pointer rounded-[13px] border-[1.5px] border-slate-600 px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            >
              Email Zac
            </a>
          </div>
        </div>
        <p className="mt-5 text-center text-[11.5px] leading-[1.6] text-slate-400">
          Clinician-directed: the tool presents measured data and paces a published protocol — no
          diagnostic, prognostic or clearance claim. No PMS integration is offered or claimed;
          nothing is submitted to ACC. Client data is stored in Australia (NZ/AU residency per
          Cl.&nbsp;14.1). Concussion Clinical Mastery is endorsed by Osteopathy Australia; that
          endorsement belongs to that course. The programmes are authored by a registered osteopath
          — no exercise physiologist authored them. CEA&rsquo;s exercise-physiology program
          (Concussion Rehab Mastery) is accredited by Exercise &amp; Sports Science Australia
          (Accreditation No. PDNF26077, valid to 24 July 2027). The director&rsquo;s mTBI
          manuscript is prepared for submission — not peer reviewed, unpublished. CEA holds no New
          Zealand accreditation.
        </p>
        <p className="mt-2 text-center text-[11px] leading-[1.5] text-slate-400">
          Concussion Education Australia Pty Ltd · ACN 688 155 508 · ABN 74 688 155 508 · 2
          Wordsworth St, Byron Bay NSW 2481 · Director: Zac Lewis, Registered Osteopath
          (AHPRA-registered), B.Clin.Sci, M.Ost.Med
        </p>
      </section>
    </div>
  )
}
