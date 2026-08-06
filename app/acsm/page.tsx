import Link from 'next/link'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'
import { InternationalCourseSchema } from '@/components/international/InternationalCourseSchema'
import { CRM_REFERENCE_COUNT } from '@/data/reference-count'

/**
 * /acsm — the ACSM listing landing page (asset A10).
 *
 * SHAPE (owner 2026-07-20): for ACSM this is SCOPE EXPANSION, not unmet pain.
 * ACSM-EP/CEP hold 60 CECs per 3 years and there is no concussion course in the
 * catalogue — but these are not clinicians with a dangerous knowledge gap. They
 * are current on the OLD model. Sell "a new billable patient population using a
 * competency you already hold". NEVER frame this as remedial education.
 *
 * No live checkout here while the global market review runs — interest capture
 * only, same as /pricing-international.
 */

const PRICE_USD = CONFIG.COURSE.PRICE_INTERNATIONAL
// The bundled platform renews at the real SST single-tier price — the
// old US$99/yr copy was never wired to any Stripe price and understated
// the actual charge ~4x (2026-08-05 live crawl).
const PLATFORM_MONTHLY = SST_TIER_FROM_AUD

/** Real, verifiable module structure — 480 min = 8.0 instructional hours. */
const MODULES: { n: string; title: string; mins: number }[] = [
  { n: '01', title: 'Concussion for the Exercise Physiologist', mins: 60 },
  { n: '02', title: 'Recognition, Red Flags & Scope of Practice', mins: 30 },
  { n: '03', title: 'Assessment That Is the Treatment — the BCTT', mins: 90 },
  { n: '04', title: 'Sub-Symptom-Threshold Aerobic Rehabilitation', mins: 90 },
  { n: '05', title: 'Phenotype-Specific Exercise Rehabilitation', mins: 60 },
  { n: '06', title: 'Graded Return to Activity, Sport & Performance', mins: 60 },
  { n: '07', title: 'Persistent Symptoms & the Complex Case', mins: 60 },
  { n: '08', title: 'Documentation, Communication & Referral', mins: 30 },
]

const TOTAL_MINS = MODULES.reduce((s, m) => s + m.mins, 0)

export const metadata = {
  alternates: { canonical: '/acsm' },
}

export default function AcsmLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <InternationalCourseSchema
        name={"Concussion Rehab Mastery — for ACSM-certified Exercise Physiologists"}
        description={"An 8-module online course teaching exercise physiologists to deliver measured heart-rate-threshold concussion rehabilitation: graded exercise testing, sub-symptom-threshold prescription, phenotype-specific rehab and graded return to activity."}
        country="US"
        path="/acsm"
        roles={['Exercise Physiologist', 'Clinical Exercise Physiologist']}
      />
      <main className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* ── Hero: scope, not topic ─────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            For ACSM-EP and ACSM-CEP professionals
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.1]">
            You already run the graded exercise test. The consensus just made it the
            gate to first-line concussion treatment.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            <strong className="text-slate-900">Concussion Rehab Mastery</strong> is
            the course that turns a competency you already hold into a new patient
            population — and ships with the clinical tools to deliver it.
          </p>
          <a
            href="#register"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Register your interest
          </a>
        </section>

        {/* ── The shift. Not "you don't know this" — "the indication changed" ── */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
            What changed
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            The 6th International Consensus (Amsterdam 2022) moved concussion from a{' '}
            <strong>rest condition</strong> to an{' '}
            <strong>exercise-prescription condition</strong> — gated on exercise
            testing and an individually derived heart-rate threshold. In the pivotal
            randomised trial, adolescent athletes prescribed individualised
            sub-symptom-threshold exercise recovered in a median of{' '}
            <strong>13 days versus 17</strong> on placebo-like stretching (Leddy et al.,
            <em> JAMA Pediatrics</em> 2019; n=103, ages 13&ndash;18).
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            Deriving an individualised HR threshold from a graded exercise test, then
            prescribing and progressing against it, is the definitional competency of
            an exercise physiologist. What changed is not the skill — it is the{' '}
            <strong>indication</strong>.
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500 border-t border-slate-200 pt-4">
            ACSM&rsquo;s own editorial voice named FITT-based exercise prescription for
            concussion as essential unfinished work, and told clinicians to stay
            current as the guidelines evolve. Reference: ACSM Hot Topic,{' '}
            <em>Exercise &amp; Rest in Concussion Recovery</em> (Hildenbrand &amp;
            Herring, Apr 2025). Cited as a published position. Concussion Rehab
            Mastery is not endorsed by or affiliated with ACSM.
          </p>
        </section>

        {/* ── Course structure — verifiable, matches the application ──────── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">What the course is</h2>
          <p className="mt-2 text-[14px] text-slate-600">
            Eight online modules · {TOTAL_MINS / 60} instructional hours · 87
            assessment questions distributed across the modules · 80% pass mark ·{' '}
            {CRM_REFERENCE_COUNT} peer-reviewed references.
          </p>
          <ol className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {MODULES.map((m) => (
              <li key={m.n} className="flex items-baseline gap-4 px-4 py-3">
                <span className="text-[11px] font-bold text-slate-400 tabular-nums">{m.n}</span>
                <span className="text-[14px] font-medium text-slate-800 flex-1">{m.title}</span>
                <span className="text-[12px] text-slate-500 tabular-nums flex-none">{m.mins} min</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Offer ──────────────────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl border-2 border-slate-900 p-6 sm:p-7">
          <h2 className="text-xl font-bold tracking-tight">The platform is the product</h2>
          <p className="mt-1 text-[14px] text-slate-500">
            The clinical platform — unlocked by the training to run it safely.
          </p>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">${PRICE_USD}</span>
            <span className="text-[13px] text-slate-500 font-semibold">USD</span>
          </div>
          <p className="text-[11px] text-slate-400">course + first year on the platform</p>

          <ul className="mt-5 space-y-2 text-[14px] text-slate-700">
            {[
              'The live Baseline & Serial Testing platform',
              'The SST Trainer — HR-threshold sessions, measured not estimated',
              'Home-session monitoring dashboard',
              'Eight EP-scoped modules + the clinical toolkit',
              'Certificate on completion · lifetime course access',
            ].map((f) => (
              <li key={f} className="flex gap-2.5">
                <span className="text-teal-600 font-bold flex-none">·</span>
                {f}
              </li>
            ))}
          </ul>

          <p className="mt-5 rounded-xl bg-teal-50 border border-teal-100 p-4 text-[13.5px] leading-relaxed text-teal-900">
            <strong>Year one is included.</strong> After 12 months the clinical
            platform continues at <strong>A${PLATFORM_MONTHLY}/month</strong> (cancel
            any time), and your <strong>annual concussion-update module</strong> comes
            with it, so it meets that year&rsquo;s recurring CPD requirement.
          </p>

          <p className="mt-4 text-[13px] leading-relaxed text-slate-600 border-t border-slate-200 pt-4">
            <strong className="text-slate-700">Always sold as one.</strong> The
            platform is never available without the training that teaches you to run
            it safely.
          </p>

          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold">
            <Link href="/demo/review-acsm" className="text-teal-700 hover:underline">
              Review the full course →
            </Link>
            <Link href="/sst-trainer?clinic=DEMO00" className="text-teal-700 hover:underline">
              See the SST Trainer walkthrough →
            </Link>
            <Link href="/preseason/b/DEMO00" className="text-teal-700 hover:underline">
              Try the baseline flow →
            </Link>
          </p>
        </section>

        {/* ── Published, citable protocol ─────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
            The method is published &amp; citable
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
            It is a published, citable clinical protocol —{' '}
            <a
              href="https://doi.org/10.5281/zenodo.21482634"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-teal-500"
            >
              <em>A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise Rehabilitation after Concussion (mTBI)</em>, Lewis&nbsp;Z. (2026), Zenodo, CC-BY-4.0
            </a>{' '}
            (DOI 10.5281/zenodo.21482634). The{' '}
            <strong className="font-semibold text-slate-700">SST Trainer</strong> is the tool
            that delivers it — graded BCTT/BCBT test → measured HR threshold →
            sub-symptom-threshold prescription → monitored home sessions with a measured
            trajectory.
          </p>
        </section>

        {/* ── Continuing-education status — the honesty gate ────────────────
            BOTH claims are flag-driven so approval day is one flip in
            lib/config.ts, never a hunt through hand-edited copy. ESSA flipped
            2026-07-25; this block had still said "pending" the day after. */}
        <section
          className={`mt-10 rounded-xl border p-5 ${
            CONFIG.FEATURES.ACSM_ACCREDITED
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p
            className={`text-[13.5px] leading-relaxed ${
              CONFIG.FEATURES.ACSM_ACCREDITED ? 'text-emerald-900' : 'text-amber-900'
            }`}
          >
            <strong>Continuing-education status:</strong>{' '}
            {CONFIG.FEATURES.ACSM_ACCREDITED ? (
              <>
                Concussion Education Australia is an <strong>ACSM Approved Provider</strong> for
                this course
                {CONFIG.FEATURES.ACSM_CEC_HOURS
                  ? <> — it carries <strong>{CONFIG.FEATURES.ACSM_CEC_HOURS} ACSM CECs</strong></>
                  : null}
                .
              </>
            ) : (
              <>
                Concussion Education Australia holds no ACSM Approved-Provider status and is not
                currently pursuing one for this course. <strong>ACSM CECs are not held</strong>, and
                no CEC value is claimed — the course is {CONFIG.COURSE.ONLINE_CPD_POINTS}{' '}
                hours of learning, which is verifiable either way.
              </>
            )}{' '}
            {CONFIG.FEATURES.ESSA_ACCREDITED ? (
              <>
                The course is <strong>accredited by Exercise &amp; Sports Science Australia
                (ESSA)</strong>, carrying {CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA CPD points online,
                following independent review by two ESSA-appointed reviewers.
              </>
            ) : (
              <>
                The course has been independently reviewed by two reviewers appointed by Exercise
                &amp; Sports Science Australia (ESSA) through its professional development
                endorsement process; that endorsement is pending.
              </>
            )}{' '}
            We don&rsquo;t claim accreditation we don&rsquo;t hold — this page updates the day each
            is confirmed.
          </p>
        </section>

        {/* ── Interest capture ───────────────────────────────────────────── */}
        <section id="register" className="mt-14 scroll-mt-8">
          <EpLeadCapture variant="full" location="acsm" />
        </section>

        <p className="mt-10 text-[12px] text-slate-400">
          Australian and New Zealand pricing differs —{' '}
          {/* /courses, NOT /pricing. Middleware geo-redirects /pricing to
              /pricing-international for every KNOWN non-AU/NZ visitor — i.e.
              this page's entire audience — so "see AUD pricing" landed them
              back on the USD page and the link could never do what it said.
              /courses renders the same AUD CCM body and is not in the
              middleware matcher, so the AUD prices actually show. */}
          <Link href="/courses" className="underline hover:text-slate-600">
            see AUD pricing
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
