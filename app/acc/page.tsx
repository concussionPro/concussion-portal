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
 * DESIGN RULE (owner, twice): show, don't describe. This page earns its length
 * only through things the reader can look at — the running patient app, the
 * live-rendered ACC884, the demo caseload. Prose earns nothing. If a paragraph
 * can become a demo link or be deleted, do that instead of writing it.
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

const CLAUSES = [
  { ref: 'Cl. 5.2.1', text: 'Mandates the team: medical, neuropsychology, psychology, OT, physiotherapy — none trained at entry to practice in graded exercise testing.' },
  { ref: 'Cl. 5.8.2.1.2', text: 'Obliges you to deliver “assessment of exercise tolerance and/or functional capacity”.' },
  { ref: 'Cl. 1.2.2', text: 'Makes the one-year extension conditional on ACC being satisfied with performance.' },
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
            Your contract requires a capability{' '}
            <span style={{ color: ACCENT }}>its own mandated team doesn&rsquo;t supply.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,17.5px)] leading-[1.55] text-slate-600">
            A tool that measures the first-line treatment and compiles your{' '}
            <strong>ACC884</strong> content as care is delivered — plus certificated
            per-clinician competency for the contract file.
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

      {/* ── THE GAP ────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div
          className="rounded-[22px] border p-[30px] md:p-[38px]"
          style={{ background: 'linear-gradient(135deg,#fff,#f8fafc)', borderColor: '#e2e8f0' }}
        >
          <h2 className="mb-5 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
            The gap, in the contract&rsquo;s own words
          </h2>
          <dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-3.5 md:grid-cols-3">
            {CLAUSES.map((c) => (
              <div key={c.ref}>
                <dt
                  className="text-[12px] font-bold text-teal-700"
                  style={{ fontFamily: 'var(--font-space), sans-serif' }}
                >
                  {c.ref}
                </dt>
                <dd className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-slate-600">{c.text}</dd>
              </div>
            ))}
          </dl>
          <p className="mb-0 mt-6 max-w-[820px] text-[15px] leading-[1.6] text-slate-700">
            One clause mandates a team; another requires a competency that team doesn&rsquo;t have.
            Since Amsterdam 2022 that assessment isn&rsquo;t peripheral — a measured heart-rate
            threshold <em>generates</em> the first-line treatment, worth roughly{' '}
            <strong style={{ color: ACCENT }}>4.6 days</strong> of recovery time.
          </p>
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

      {/* ── WHAT ACC MEASURES ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-2 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Measured from ACC&rsquo;s data, not your write-ups
        </h2>
        <p className="mb-6 max-w-[720px] text-[14.5px] leading-[1.55] text-slate-600">
          Benchmarked at &ldquo;National Average or one deviation higher&rdquo; from ACC&rsquo;s own
          claims data — so the number moves on recovery, not documentation. No renewal is pending
          (the term runs to 30 June 2027), and that&rsquo;s the argument: the record written now is
          what the Cl.&nbsp;1.2.2 extension decision rests on.
        </p>
        <dl className="m-0 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
          {MEASURES.map((m) => (
            <div key={m.k}>
              <dt className="text-[15px] font-bold" style={{ color: ACCENT }}>{m.k}</dt>
              <dd className="m-0 mt-1.5 text-[13.5px] leading-[1.55] text-slate-600">{m.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── THE TWO COMPONENTS ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-2 mt-0 text-[clamp(22px,2.6vw,30px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
          Two components, sold together
        </h2>
        <p className="mb-6 max-w-[720px] text-[14.5px] leading-[1.55] text-slate-600">
          The licence without competency produces reports a clinician can&rsquo;t defend; competency
          without the instrument produces trained clinicians who still can&rsquo;t see the treatment.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-slate-200 bg-white p-[24px]">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Per-organisation licence
            </span>
            <h3 className="mb-3 mt-1.5 text-[18px] font-extrabold leading-[1.15]">SST Trainer</h3>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {[
                'A measured threshold from a guided graded test — never age-estimated.',
                'Home sessions observed on the client’s own wearable: time-in-band, duration, stop-rule events.',
                'Only live-wearable sessions advance the prescription; manual entries never raise the ceiling.',
                'Serial re-testing is the outcome measure, and each re-test a documented review point.',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.5] text-slate-600">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: ACCENT }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-[24px]">
            <span className="text-[11.5px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Per-seat competency
            </span>
            <h3 className="mb-3 mt-1.5 text-[18px] font-extrabold leading-[1.15]">
              Concussion Clinical Mastery
            </h3>
            <p className="m-0 text-[13.5px] leading-[1.55] text-slate-600">
              For the physiotherapists and OTs already on your team: graded exertion testing,
              deriving the threshold, prescribing against it, progression by re-test, and the scope
              boundary. Endorsed by Osteopathy Australia.
            </p>
            <p
              className="mb-0 mt-3 rounded-[12px] p-3.5 text-[13.5px] leading-[1.55]"
              style={{ background: '#f0fdfa', color: '#134e4a' }}
            >
              Certificated per clinician, dated and named — turning &ldquo;our physios are
              experienced in concussion&rdquo; from an assertion into an auditable record.
            </p>
          </div>
        </div>
        <p className="mb-0 mt-4 max-w-[820px] text-[13px] leading-[1.55] text-slate-500">
          No price here deliberately. It&rsquo;s a per-organisation licence plus per-seat training,
          and the licence figure turns on one question we&rsquo;d rather ask than assume: whether a
          tool like this is funded from supplier margin or is recoverable within the funded service.
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
