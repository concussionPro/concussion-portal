/**
 * /acc — the NZ ACC Concussion Services supplier landing page.
 *
 * SHAPE (owner 2026-07-20): the buyer is an ORGANISATION holding an ACC
 * Concussion Services contract — a clinical director or contract lead, not a
 * clinician shopping for CPD. So the product sold on this page is THE REPORT
 * and DOCUMENTED TEAM COMPETENCY. The rehabilitation is the mechanism, never
 * the pitch. Never frame any of this as professional development.
 *
 * The argument is the contract's own internal tension: Cl. 5.2.1 mandates a
 * team of five disciplines, none trained at entry to practice in exercise
 * testing; Cl. 5.8.2.1.2 obliges the supplier to deliver assessment of exercise
 * tolerance. That is stated in ACC's words, not as CEA's opinion.
 *
 * NO renewal hook — the term runs to 30 June 2027 and a supplier who is told
 * otherwise knows immediately the sender has not read the contract. The real
 * lever is Cl. 1.2.2: the extension is performance-conditional, so the file
 * being built now is the file the decision gets made on.
 *
 * Robots noindex/nofollow and the full claim-discipline list live in layout.tsx.
 */

import Link from 'next/link'
import { CONFIG } from '@/lib/config'

const CONTACT_EMAIL = CONFIG.CONTACT_EMAIL

const MAILTO = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
  'ACC Concussion Services — exercise tolerance assessment and ACC884 reporting',
)}&body=${encodeURIComponent(
  'Hi Zac — I hold (or support) an ACC Concussion Services contract and would like 20 minutes to look at the ACC884 Client Summary Report output and the competency component.\n\nOrganisation:\nRole:\nBest time:',
)}`

/** Verified against the executed Service Schedule. Substance first, clause second. */
const CLAUSES: { ref: string; text: string }[] = [
  {
    ref: 'Cl. 5.2.1',
    text: 'Mandates the concussion team: medical, neuropsychology, psychology, occupational therapy and physiotherapy.',
  },
  {
    ref: 'Cl. 5.8.2.1.2',
    text: 'Obliges the supplier to deliver “assessment of exercise tolerance and/or functional capacity”.',
  },
  {
    ref: 'Cl. 1.2.2',
    text: 'Makes the one-year extension conditional on ACC being satisfied with supplier performance.',
  },
]

/** What the tool supplies against each ACC884 field. Content only — never filing. */
const REPORT_FIELDS: { field: string; supplied: string }[] = [
  {
    field: 'Service provided',
    supplied:
      'Clinician-supervised sub-symptom-threshold aerobic exercise delivered against a measured heart-rate threshold, including the prescription actually issued and the monitored between-visit sessions.',
  },
  {
    field: 'Risk assessment',
    supplied:
      'Whether the measured threshold fell below the validated prolonged-recovery cut-off, with the clinician’s note.',
  },
  {
    field: 'Outcomes',
    supplied:
      'The serial threshold trajectory and the most recent re-test, stated as whether objective exercise tolerance has recovered or remains symptom-limited.',
  },
  {
    field: 'Services still needed',
    supplied:
      'Whether a further supervised programme is indicated on the measured outcome — noting that additional funded treatment is requested separately via ACC32.',
  },
  {
    field: 'Supporting detail',
    supplied:
      'Adherence and review record across the episode — evidence that outcome measures were reviewed during delivery rather than reconstructed at exit.',
  },
]

export default function AccSupplierPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* ── Hero: the contract's own tension, not a pain narrative ─────── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            For organisations holding an ACC Concussion Services contract
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.1]">
            Your Service Schedule requires a capability its own mandated team
            composition does not supply.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            Two components close it: a tool that measures the treatment and
            compiles your <strong className="text-slate-900">ACC884 Client Summary Report</strong>{' '}
            content, and certificated per-clinician competency that goes in the
            contract file as documentation rather than as an assertion.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={MAILTO}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
            >
              Start a conversation
            </a>
            <Link
              href="/demo/acc"
              className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-900 font-bold px-6 py-3.5 text-sm hover:border-slate-400 transition"
            >
              See a sample ACC884 →
            </Link>
            <Link
              href="/clinical-hub?clinic=DEMO00"
              className="inline-flex items-center gap-2 rounded-xl border-[1.5px] border-slate-300 bg-white text-slate-900 font-bold px-6 py-3.5 text-sm hover:border-slate-400 transition"
            >
              Explore the demo dashboard →
            </Link>
          </div>
          <p className="mt-2.5 text-[12.5px] text-slate-500">
            Both demos are self-serve on a synthetic sample episode — no sign-in, no real client data.
          </p>
        </section>

        {/* ── The spine. ACC's words, not ours ───────────────────────────── */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
            The gap, in the contract&rsquo;s own words
          </h2>
          <dl className="mt-4 space-y-3">
            {CLAUSES.map((c) => (
              <div key={c.ref} className="flex gap-4">
                <dt className="text-[12px] font-bold text-slate-900 tabular-nums flex-none w-[6.5rem] pt-0.5">
                  {c.ref}
                </dt>
                <dd className="text-[14.5px] leading-relaxed text-slate-700">{c.text}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-700 border-t border-slate-200 pt-5">
            The same document mandates a team composition in one clause and
            requires, in another, a competency that composition does not supply.
            None of the five mandated disciplines is trained at entry to practice
            in graded exercise testing. That is not a criticism of any supplier
            — it is an unresolved tension in a contract everyone in the scheme
            signed.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            It got sharper in October 2022. The Amsterdam international consensus
            made sub-symptom-threshold aerobic exercise — prescribed from an
            individually <strong>measured</strong> heart-rate threshold, derived
            by a graded exercise test — the{' '}
            <strong>first-line treatment</strong> for concussion, improving
            recovery by roughly <strong>4.6 days</strong> on average. The
            assessment Cl. 5.8.2.1.2 asks for is no longer a peripheral measure.
            It generates the treatment.
          </p>
        </section>

        {/* ── Why it matters to a contract lead specifically ──────────────── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">
            Why this matters to the file you are building now
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            Suppliers are measured on <strong>client outcomes</strong>,{' '}
            <strong>quality</strong> and <strong>timeliness</strong>. The
            performance measures are recovery-duration and return-to-work
            metrics, benchmarked at &ldquo;National Average or one deviation
            higher&rdquo; and drawn from{' '}
            <strong className="text-slate-900">
              ACC&rsquo;s own data rather than supplier self-report
            </strong>{' '}
            — so they cannot be improved by better write-ups, only by better
            outcomes.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            There is no renewal decision pending; the term runs to 30 June 2027.
            That is the argument, not against it. Cl. 1.2.2 makes the one-year
            extension conditional on ACC&rsquo;s satisfaction with performance,
            which means the record being written across every episode today is
            the record that decision will rest on, well before anyone asks for
            it.
          </p>

          <div className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {[
              {
                k: 'Client outcomes',
                v: 'A serial measured heart-rate threshold is a physiological outcome, not a symptom score. Re-tested across the episode it produces a trajectory — an objective record of exercise tolerance recovering, or not.',
              },
              {
                k: 'Quality',
                v: 'Every home session is recorded against the prescribed heart-rate band, so dose and adherence are observed rather than assumed. Every graded re-test is a documented review point during delivery.',
              },
              {
                k: 'Timeliness',
                v: 'Reporting is six-monthly — within 15 business days after 31 December and 10 business days after 30 June. Because content accumulates as the service is delivered, the deadline task becomes review-and-transcribe rather than reconstruct-from-notes.',
              },
            ].map((r) => (
              <div key={r.k} className="px-4 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
                  {r.k}
                </p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-slate-700">{r.v}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── The two components. Sold together on purpose ────────────────── */}
        <section className="mt-14 rounded-2xl border-2 border-slate-900 p-6 sm:p-7">
          <h2 className="text-xl font-bold tracking-tight">What is offered</h2>
          <p className="mt-1 text-[14px] text-slate-500">
            Two components, sold together. The licence without competency
            produces reports a clinician cannot defend; competency without the
            instrument produces trained clinicians who still cannot see the
            treatment.
          </p>

          <div className="mt-6">
            <h3 className="text-[15px] font-bold text-slate-900">
              SST Trainer — per-organisation software licence
            </h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-700">
              {[
                'A measured heart-rate threshold from a guided graded test — not an age-estimated maximum. The training band is derived from, and capped at, the measured value.',
                'Home sessions are observed rather than reported: the client trains with their own wearable, so the record shows time-in-band, duration and any symptom stop-rule event.',
                'Only sessions recorded from a live wearable progress the prescription. Manually entered values are retained for safety but never advance the band.',
                'Serial re-testing is the outcome measure — a physiological trajectory across the episode, with each re-test also a documented review point.',
              ].map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="text-teal-600 font-bold flex-none">·</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-7 border-t border-slate-200 pt-6">
            <h3 className="text-[15px] font-bold text-slate-900">
              Concussion Clinical Mastery — per-seat competency training
            </h3>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
              A clinical concussion programme written for the physiotherapists
              and occupational therapists already on your team: graded exertion
              testing, derivation of the individual heart-rate threshold,
              prescription against it, progression by re-test, and the scope
              boundary that governs where the clinician&rsquo;s responsibility
              ends.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-700">
              Completion is certificated per clinician, dated and tied to a named
              individual. That converts &ldquo;our physiotherapists are
              experienced in concussion&rdquo; — an assertion — into a
              documented, auditable statement of team competency in the specific
              first-line protocol. Endorsed by Osteopathy Australia.
            </p>
          </div>

          <p className="mt-6 rounded-xl bg-teal-50 border border-teal-100 p-4 text-[13.5px] leading-relaxed text-teal-900">
            <strong>No price is quoted here.</strong> The commercial model is a
            per-organisation annual licence plus per-seat competency training,
            and the licence figure turns on one question we would rather ask than
            assume: whether a tool of this kind is funded from supplier margin or
            is recoverable within the funded service. A number quoted against the
            wrong assumption wastes your procurement cycle.
          </p>
        </section>

        {/* ── The honesty gate. This section IS the credibility ───────────── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">
            What the ACC884 output is — and what it is not
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            SST Trainer produces <strong>print-ready ACC884 content</strong> for
            a given service episode, structured to match the form&rsquo;s
            fields, which your clinician reviews and{' '}
            <strong>transcribes onto ACC&rsquo;s own current fillable form</strong>.
            It compiles the content. It does not replace the prescribed form, does
            not submit anything to ACC, and does not connect to the ACC provider
            portal. What it removes is the hour spent reconstructing an episode
            from appointment notes — not the submission.
          </p>

          <ol className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {REPORT_FIELDS.map((r) => (
              <li key={r.field} className="px-4 py-3.5">
                <p className="text-[13px] font-bold text-slate-900">{r.field}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-slate-600">
                  {r.supplied}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-[13.5px] leading-relaxed text-slate-700">
              <strong>Two form-level points, because vendors get them wrong.</strong>{' '}
              ACC884 is the <strong>Client Summary Report</strong> — it is not a
              treatment plan, and a request for further funded treatment is the{' '}
              <strong>ACC32</strong>. <strong>ACC885</strong> is the{' '}
              <strong>Did Not Attend</strong> form, not a progress report.
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-slate-700">
              <strong>Jurisdictional integrity is enforced in software, not by policy.</strong>{' '}
              The requested report skin is validated against the service&rsquo;s
              jurisdiction, so an Australian service code cannot emit an ACC form.
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-slate-700">
              <strong>No practice-management integration is offered or claimed.</strong>{' '}
              The tool is clinician-directed throughout: it presents measured data
              and paces a published protocol. It makes no diagnostic, prognostic
              or return-to-activity clearance claim, and the supervising clinician
              holds every clinical decision.
            </p>
          </div>
        </section>

        {/* ── Vendor position, stated before it is asked for ──────────────── */}
        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Stated for the record, so nothing is discovered later.</strong>{' '}
            Concussion Education Australia is a small specialist vendor.
            Concussion Clinical Mastery is endorsed by{' '}
            <strong>Osteopathy Australia</strong>; that endorsement belongs to
            that course. The programmes are authored by a registered osteopath —{' '}
            <strong>no exercise physiologist authored or co-authored them</strong>.
            An ESSA professional-development endorsement of CEA&rsquo;s separate
            exercise-physiology product has been independently reviewed but is{' '}
            <strong>pending, and is not claimed</strong>. The director&rsquo;s
            mTBI manuscript is <strong>prepared for submission — not submitted, not
            peer reviewed and unpublished</strong>.
            CEA holds no New Zealand accreditation and does not represent that it
            does.
          </p>
        </section>

        {/* ── CTA: a conversation, not a purchase ─────────────────────────── */}
        <section id="contact" className="mt-14 scroll-mt-8 rounded-2xl border border-slate-200 p-6 sm:p-7">
          <h2 className="text-xl font-bold tracking-tight">
            Twenty minutes, and one commercial question
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            The useful next step is a short scoping conversation with your
            clinical lead and, if it helps, whoever holds the reporting
            obligation. Nothing is being sold in it. The purpose is to test
            whether the gap described above matches the one you are actually
            carrying — and to ask the funding question rather than guess at it.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            If it is useful from there, the natural pilot is one clinician and a
            small number of real episodes end to end, producing an ACC884 content
            pack from a real service rather than a demo.
          </p>
          <a
            href={MAILTO}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Email {CONTACT_EMAIL}
          </a>
        </section>

        <p className="mt-10 text-[12px] leading-relaxed text-slate-400">
          Concussion Education Australia Pty Ltd · ACN 688 155 508 · ABN 74 688
          155 508 · 2 Wordsworth St, Byron Bay NSW 2481, Australia. Director: Zac
          Lewis, Registered Osteopath (AHPRA-registered), B.Clin.Sci, M.Ost.Med.
        </p>
      </main>
    </div>
  )
}
