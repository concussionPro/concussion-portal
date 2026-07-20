import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { CONFIG } from '@/lib/config'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'

/**
 * /acc — the NZ ACC Concussion Services supplier pitch.
 *
 * SHAPE (owner 2026-07-20): the buyer is an ORGANISATION holding an ACC
 * Concussion Services contract — a clinical director or contract lead. The
 * product sold is THE REPORT and DOCUMENTED TEAM COMPETENCY; rehabilitation is
 * the mechanism, never the pitch. Never frame as professional development.
 *
 * DESIGN (owner 2026-07-20): this page must SHOW the product, not describe it —
 * the live SST walkthrough in the hero and the ACTUAL ACC884, rendered live
 * from the DEMO00 fixture episode, embedded mid-page. House visual language =
 * SstPitch (gradient field, chip eyebrow, card grids, dark closing panel).
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

const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'ACC Concussion Services — exercise tolerance assessment and ACC884 reporting',
)}&body=${encodeURIComponent(
  'Hi Zac — I hold (or support) an ACC Concussion Services contract and would like 20 minutes to look at the ACC884 output and the competency component.\n\nOrganisation:\nRole:\nBest time:',
)}`

/** Verified against the executed Service Schedule. Substance first, clause second. */
const CLAUSES = [
  {
    ref: 'Cl. 5.2.1',
    title: 'The mandated team',
    text: 'Medical, neuropsychology, psychology, occupational therapy, physiotherapy — none trained at entry to practice in graded exercise testing.',
  },
  {
    ref: 'Cl. 5.8.2.1.2',
    title: 'The obligation',
    text: 'The supplier must deliver “assessment of exercise tolerance and/or functional capacity”.',
  },
  {
    ref: 'Cl. 1.2.2',
    title: 'The stakes',
    text: 'The one-year extension is conditional on ACC being satisfied with performance — the file written now is the file that decision rests on.',
  },
] as const

const MEASURES = [
  {
    k: 'Client outcomes',
    body: 'A serial measured heart-rate threshold is a physiological outcome, not a symptom score. Re-tested across the episode, it is an objective record of exercise tolerance recovering — or not.',
  },
  {
    k: 'Quality',
    body: 'Every home session is recorded against the prescribed band, so dose and adherence are observed rather than assumed. Every graded re-test is a documented in-delivery review point.',
  },
  {
    k: 'Timeliness',
    body: 'Six-monthly reporting, due 15 business days after 31 Dec and 10 after 30 June. Content accumulates as care is delivered — the deadline becomes review-and-transcribe, not reconstruct-from-notes.',
  },
] as const

export default function AccSupplierPage() {
  return (
    <div
      className={`${hanken.className} ${space.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      {/* ── HERO: argument left, living product right ─────────────────────── */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-6 pb-14 pt-14 md:px-8">
        <div className="flex flex-1 basis-[420px] flex-col gap-[22px]">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none tracking-[0.02em]"
            style={{ background: '#ccfbf1', color: '#0f766e' }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            For ACC Concussion Services suppliers
          </span>
          <h1 className="m-0 text-[clamp(32px,4.2vw,52px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
            Your Service Schedule requires a capability{' '}
            <span style={{ color: ACCENT }}>its own mandated team does not supply.</span>
          </h1>
          <p className="m-0 max-w-[540px] text-[clamp(15px,1.4vw,17.5px)] leading-[1.55] text-slate-600">
            Two components close it: a tool that <strong>measures</strong> the first-line treatment and
            compiles your <strong>ACC884</strong> content as care is delivered, and certificated
            per-clinician competency that sits in the contract file as documentation, not assertion.
          </p>
          <div className="mt-0.5 flex flex-wrap gap-3">
            <a
              href={MAILTO}
              className="flex cursor-pointer items-center gap-2 rounded-[13px] border-none px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              Start a conversation
            </a>
            <Link
              href="/clinical-hub?clinic=DEMO00"
              className="flex items-center gap-2 rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              Explore the demo dashboard
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <Link href="/demo/acc" className="text-[13.5px] font-bold hover:underline" style={{ color: ACCENT }}>
              Open the sample ACC884 →
            </Link>
            <span className="text-[12px] font-semibold text-slate-400">
              Self-serve, synthetic sample episode — no sign-in, no real client data
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-[18px]">
            {['Measured HR threshold — not estimated', 'ACC884 content compiled in-delivery', 'Clinician-directed throughout'].map(
              (chip, i) => (
                <span key={chip} className="flex items-center gap-[18px]">
                  {i > 0 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                  <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">{chip}</span>
                </span>
              ),
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 basis-[540px] justify-center">
          <SstTrainerDemo />
        </div>
      </header>

      {/* ── THE GAP: three clause cards + the tension, stated once ────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div
          className="rounded-[22px] border p-[34px] md:p-[40px]"
          style={{ background: 'linear-gradient(135deg,#fff,#f8fafc)', borderColor: '#e2e8f0' }}
        >
          <span className="text-[12px] font-bold uppercase leading-none tracking-[0.1em] text-slate-400">
            The gap, in the contract&rsquo;s own words
          </span>
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {CLAUSES.map((c) => (
              <div key={c.ref} className="rounded-[16px] border border-slate-200 bg-white p-[22px]">
                <span
                  className="text-[12px] font-bold tracking-[0.02em] text-teal-700"
                  style={{ fontFamily: 'var(--font-space), sans-serif' }}
                >
                  {c.ref}
                </span>
                <h3 className="mb-1.5 mt-2 text-[16.5px] font-bold leading-[1.18]">{c.title}</h3>
                <p className="m-0 text-[13.5px] leading-[1.55] text-slate-500">{c.text}</p>
              </div>
            ))}
          </div>
          <p className="mb-0 mt-6 max-w-[860px] text-[15.5px] leading-[1.6] text-slate-700">
            One clause mandates a team composition; another requires a competency that composition does
            not supply. Since Amsterdam 2022, that assessment is no longer peripheral — sub-symptom-threshold
            aerobic exercise, prescribed from an individually <strong>measured</strong> heart-rate threshold,
            is the <strong>first-line treatment</strong>, improving recovery by roughly{' '}
            <strong style={{ color: ACCENT }}>4.6 days</strong> on average. The assessment{' '}
            <em>generates the treatment</em>.
          </p>
        </div>
      </section>

      {/* ── WHAT ACC MEASURES → what the record shows ─────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <h2 className="mb-2 text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          Measured on outcomes, quality and timeliness — from ACC&rsquo;s data, not your write-ups
        </h2>
        <p className="mb-[26px] max-w-[760px] text-[14.5px] leading-[1.6] text-slate-600">
          Performance is benchmarked at &ldquo;National Average or one deviation higher&rdquo; from ACC&rsquo;s
          own claims data. It cannot be improved by better documentation — only by better recovery. There is
          no renewal pending (the term runs to 30 June 2027); that is the argument, not against it: the
          record written across every episode <em>now</em> is what the Cl.&nbsp;1.2.2 extension decision rests on.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {MEASURES.map((m) => (
            <div key={m.k} className="rounded-[16px] border border-slate-200 bg-white p-[22px]">
              <h3 className="mb-1.5 mt-0 text-[16.5px] font-bold leading-[1.18]" style={{ color: ACCENT }}>
                {m.k}
              </h3>
              <p className="m-0 text-[13.5px] leading-[1.55] text-slate-500">{m.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE ARTIFACT: the actual ACC884, rendered live ────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-14 md:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="m-0 text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              This is the actual output
            </h2>
            <p className="m-0 mt-2 max-w-[700px] text-[14.5px] leading-[1.6] text-slate-600">
              The ACC884 Client Summary content below is rendered <strong>live</strong> from a synthetic
              sample episode — a measured threshold trajectory, fourteen monitored home sessions, and the
              outcome, structured to the form&rsquo;s fields. Your clinician reviews and transcribes onto
              ACC&rsquo;s current fillable form. It compiles the content; it does not file anything.
            </p>
          </div>
          <Link
            href="/demo/acc"
            className="flex items-center gap-2 rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[18px] py-[12px] text-[14px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
          >
            Open full screen →
          </Link>
        </div>
        <div
          className="overflow-hidden rounded-[18px] border border-slate-200 bg-white"
          style={{ boxShadow: '0 30px 60px -30px rgba(15,23,42,.25)' }}
        >
          {/* browser chrome */}
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="h-[9px] w-[9px] rounded-full bg-slate-300" />
            <span className="ml-3 truncate rounded-md bg-white px-3 py-1 text-[11.5px] font-medium text-slate-400">
              ACC884 Client Summary Report — sample episode (Alex Demo · AB12345)
            </span>
          </div>
          <iframe
            // Direct report URL (not the /demo/acc redirect) — same document,
            // avoids any iframe-redirect quirk across browsers.
            src="/api/sst/report?code=DEMO00&patient=Demo%20Patient&skin=acc884&first=Alex&last=Demo&claim=AB12345&clinician=Reviewing%20Clinician"
            title="Sample ACC884 Client Summary Report, rendered live from a synthetic episode"
            className="block h-[560px] w-full border-0"
            loading="lazy"
            sandbox="allow-same-origin"
          />
        </div>
        <p className="mt-3 text-[12.5px] leading-[1.5] text-slate-400">
          Form-level discipline, because vendors get it wrong: ACC884 is the Client Summary Report — not a
          treatment plan (further funded treatment is the ACC32). ACC885 is Did Not Attend — not progress.
          Jurisdiction is enforced in software: an Australian service code cannot emit an ACC form.
        </p>
      </section>

      {/* ── THE TWO COMPONENTS ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[60px] md:px-8">
        <h2 className="mb-2 text-[clamp(24px,2.8vw,34px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          Two components, sold together
        </h2>
        <p className="mb-[26px] max-w-[760px] text-[14.5px] leading-[1.6] text-slate-600">
          The licence without competency produces reports a clinician cannot defend; competency without the
          instrument produces trained clinicians who still cannot see the treatment.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-[16px] border border-slate-200 bg-white p-[26px]">
            <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Per-organisation licence
            </span>
            <h3 className="mb-3 mt-2 text-[19px] font-extrabold leading-[1.15]">SST Trainer</h3>
            <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
              {[
                'A measured heart-rate threshold from a guided graded test — never an age-estimated maximum.',
                'Home sessions observed, not reported: the client trains on their own wearable; the record shows time-in-band, duration, and any symptom stop-rule event.',
                'Only live-wearable sessions progress the prescription. Manual entries are retained for safety but never advance the band.',
                'Serial re-testing is the outcome measure — each re-test a documented review point.',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-[1.55] text-slate-600">
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: ACCENT }} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[16px] border border-slate-200 bg-white p-[26px]">
            <span className="text-[12px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Per-seat competency
            </span>
            <h3 className="mb-3 mt-2 text-[19px] font-extrabold leading-[1.15]">Concussion Clinical Mastery</h3>
            <p className="m-0 text-[13.5px] leading-[1.6] text-slate-600">
              Written for the physiotherapists and occupational therapists already on your team: graded
              exertion testing, derivation of the individual heart-rate threshold, prescription against it,
              progression by re-test, and the scope boundary that governs where responsibility ends.
              Endorsed by Osteopathy Australia.
            </p>
            <p className="mb-0 mt-3 rounded-[12px] p-4 text-[13.5px] leading-[1.6]" style={{ background: '#f0fdfa', color: '#134e4a' }}>
              Completion is certificated per clinician — dated, tied to a named individual. It converts
              &ldquo;our physios are experienced in concussion&rdquo; from an assertion into a documented,
              auditable statement of team competency in the specific first-line protocol.
            </p>
          </div>
        </div>
        <p className="mb-0 mt-5 max-w-[860px] text-[13.5px] leading-[1.6] text-slate-500">
          No price is quoted here deliberately. The model is a per-organisation annual licence plus per-seat
          training, and the licence figure turns on one question we would rather ask than assume: whether a
          tool of this kind is funded from supplier margin or is recoverable within the funded service. A
          number quoted against the wrong assumption wastes your procurement cycle.
        </p>
      </section>

      {/* ── CLOSING: dark panel, disclosure, entity ───────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[72px] md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-[30px] rounded-[22px] bg-slate-900 px-9 py-[34px]">
          <div className="flex-1 basis-[440px]">
            <h2 className="m-0 mb-2.5 text-[clamp(22px,2.4vw,30px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-white">
              Twenty minutes, and one commercial question
            </h2>
            <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-slate-300">
              A short scoping conversation with your clinical lead — nothing sold in it. The purpose is to
              test whether the gap above matches the one you are carrying, and to ask the funding question
              rather than guess. From there, the natural pilot is one clinician and a small number of real
              episodes end to end.
            </p>
            <ul className="mt-4 flex list-none flex-col gap-1.5 p-0">
              {[
                'Clinician-directed: the tool presents measured data and paces a published protocol — no diagnostic, prognostic or clearance claim',
                'No PMS integration offered or claimed; nothing is submitted to ACC',
                'Client data stored in Australia (NZ/AU residency per Service Schedule Cl. 14.1)',
              ].map((p) => (
                <li key={p} className="flex items-start gap-2 text-[13px] leading-[1.45] text-slate-400">
                  <span className="mt-[6px] h-[5px] w-[5px] flex-none rounded-full" style={{ background: '#5eead4' }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <a
            href={MAILTO}
            className="cursor-pointer rounded-[13px] border-none px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            Email {CONTACT_EMAIL.split('@')[0]}@…
          </a>
        </div>
        <p className="mt-5 text-center text-[12px] leading-[1.6] text-slate-400">
          Stated for the record: Concussion Education Australia is a small specialist vendor. Concussion
          Clinical Mastery is endorsed by Osteopathy Australia; that endorsement belongs to that course. The
          programmes are authored by a registered osteopath — no exercise physiologist authored them. An ESSA
          endorsement of CEA&rsquo;s separate exercise-physiology product is pending and not claimed. The
          director&rsquo;s mTBI manuscript is prepared for submission — not peer reviewed, unpublished. CEA
          holds no New Zealand accreditation.
        </p>
        <p className="mt-2 text-center text-[11.5px] leading-[1.5] text-slate-400">
          Concussion Education Australia Pty Ltd · ACN 688 155 508 · ABN 74 688 155 508 · 2 Wordsworth St,
          Byron Bay NSW 2481, Australia · Director: Zac Lewis, Registered Osteopath (AHPRA-registered),
          B.Clin.Sci, M.Ost.Med
        </p>
      </section>
    </div>
  )
}
