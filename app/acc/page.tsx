import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'

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
          <div className="flex flex-wrap gap-3">
            <a
              href={MAILTO}
              className="flex cursor-pointer items-center rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              Start a conversation
            </a>
            <Link
              href="/clinical-hub?clinic=DEMO00"
              className="flex items-center rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              See the caseload view
            </Link>
          </div>
          <p className="m-0 text-[12.5px] font-medium text-slate-500">
            Live demos, no sign-in. Every patient and episode shown is fabricated for illustration — a full example caseload from intake to discharge.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 basis-[520px] justify-center">
          <SstTrainerDemo />
        </div>
      </header>

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

      {/* ── WHAT ACC MEASURES — table ──────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-4 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Scored from ACC&rsquo;s data, not your write-ups
        </h2>
        <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr] sm:grid-cols-[minmax(130px,0.7fr)_1fr_1.2fr]">
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 sm:block">Measure</div>
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400 sm:block">How ACC scores it</div>
            <div className="hidden bg-slate-50 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.1em] sm:block" style={{ color: ACCENT }}>What your record evidences</div>
            {MEASURES_TBL.map((m) => (
              <div key={m.measure} className="contents">
                <div className="border-t border-slate-100 px-5 pb-1 pt-4 text-[13px] font-bold text-slate-900 sm:py-4">{m.measure}</div>
                <div className="px-5 pb-1 text-[13.5px] leading-[1.5] text-slate-500 sm:border-t sm:border-slate-100 sm:py-4">{m.source}</div>
                <div className="px-5 pb-4 text-[13.5px] font-medium leading-[1.5] text-slate-800 sm:border-t sm:border-slate-100 sm:py-4">{m.record}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-3 text-[12.5px] leading-[1.5] text-slate-500">
          Benchmarked at &ldquo;National Average or one deviation higher&rdquo;. No renewal is pending
          — the term runs to 30 June 2027 — which is the point: the record written now is the record
          the Cl.&nbsp;1.2.2 extension decision rests on.
        </p>
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

      {/* ── WHAT YOU GET — value first, product name second ────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-5 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          What you actually get
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-[26px]">
            <p className="m-0 text-[20px] font-extrabold leading-[1.25] text-slate-900">
              An ACC884 your clinician can defend, built from measured data
            </p>
            <p className="m-0 mt-2 text-[13.5px] leading-[1.5] text-slate-500">
              Not a symptom score written up at exit — a physiological record captured as care was
              delivered.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {[
                'Threshold measured by guided graded test — never age-estimated',
                'Home sessions observed on the client’s own wearable',
                'Only live-wearable sessions advance the prescription',
                'Serial re-testing is the outcome measure',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-slate-600">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: ACCENT }} />
                  {f}
                </li>
              ))}
            </ul>
            <p className="m-0 mt-auto pt-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              SST Trainer · per-organisation licence
            </p>
          </div>

          <div className="flex flex-col rounded-[18px] border border-slate-200 bg-white p-[26px]">
            <p className="m-0 text-[20px] font-extrabold leading-[1.25] text-slate-900">
              Team competency you can put in the contract file
            </p>
            <p className="m-0 mt-2 text-[13.5px] leading-[1.5] text-slate-500">
              Turns &ldquo;our physios are experienced in concussion&rdquo; from an assertion into a
              dated, named, auditable record.
            </p>
            <ul className="m-0 mt-4 flex list-none flex-col gap-2 p-0">
              {[
                'Written for the physiotherapists and OTs already on your team',
                'Graded exertion testing, threshold derivation, prescription, progression',
                'Certificated per clinician — dated and named',
                'Endorsed by Osteopathy Australia',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-slate-600">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: ACCENT }} />
                  {f}
                </li>
              ))}
            </ul>
            <p className="m-0 mt-auto pt-4 text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Concussion Clinical Mastery · per-seat
            </p>
          </div>
        </div>
        <p className="mt-4 max-w-[820px] text-[13px] leading-[1.55] text-slate-500">
          <strong className="text-slate-700">Sold together.</strong> The licence without competency
          produces reports a clinician can&rsquo;t defend; competency without the instrument produces
          trained clinicians who still can&rsquo;t see the treatment.
        </p>
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
          <a
            href={MAILTO}
            className="cursor-pointer rounded-[13px] px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            Email Zac
          </a>
        </div>
        <p className="mt-5 text-center text-[11.5px] leading-[1.6] text-slate-400">
          Clinician-directed: the tool presents measured data and paces a published protocol — no
          diagnostic, prognostic or clearance claim. No PMS integration is offered or claimed;
          nothing is submitted to ACC. Client data is stored in Australia (NZ/AU residency per
          Cl.&nbsp;14.1). Concussion Clinical Mastery is endorsed by Osteopathy Australia; that
          endorsement belongs to that course. The programmes are authored by a registered osteopath
          — no exercise physiologist authored them. An ESSA endorsement of CEA&rsquo;s separate
          exercise-physiology product is pending and not claimed. The director&rsquo;s mTBI
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
