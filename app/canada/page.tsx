import { existsSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { PROTOCOL_DOI_LABEL, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'
import { InternationalCourseSchema } from '@/components/international/InternationalCourseSchema'
import { CRM_REFERENCE_COUNT } from '@/data/reference-count'

/**
 * /canada — the CATA Approved Provider landing page (see layout.tsx for the
 * approval record and honesty gates). Sibling of /acsm; same architecture.
 *
 * SHAPE: for athletic therapists this is NOT scope expansion (the ACSM-EP
 * frame) — ATs already own the acute sideline call AND the rehab room. The
 * frame is completing the loop: the consensus moved the recovery phase onto
 * their bench, gated on a measured heart-rate threshold.
 */

const PRICE_USD = CONFIG.COURSE.PRICE_INTERNATIONAL
const PLATFORM_MONTHLY = SST_TIER_FROM_AUD
// CATA enhanced Approved-Provider rate: 0.4 CEUs per contact hour. Derived,
// never hardcoded (config doctrine) — 8 contact hours → 3.2 CEUs.
const CATA_CEUS = (CONFIG.COURSE.ONLINE_CPD_POINTS * 0.4).toFixed(1)

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

const BADGE_PATH = '/logos/cata-approved-provider-2025-2027-en.png'

export const metadata = {
  alternates: { canonical: '/canada' },
}

export default function CanadaLandingPage() {
  // Official artwork only, never recreated: the badge renders the moment the
  // supplied PNG is committed; until then the designation shows as plain text.
  const hasBadge = existsSync(join(process.cwd(), 'public', BADGE_PATH))

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <InternationalCourseSchema
        name={'Concussion Rehab Mastery — for Certified Athletic Therapists'}
        description={
          'An 8-module online course teaching athletic therapists to deliver measured heart-rate-threshold concussion rehabilitation: graded exercise testing, sub-symptom-threshold prescription, phenotype-specific rehab and graded return to play.'
        }
        country="CA"
        path="/canada"
        roles={['Athletic Therapist', 'Certified Athletic Therapist']}
      />
      <main className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* ── Hero: complete the loop, not scope expansion ────────────────── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            For Certified Athletic Therapists — CAT(C)
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.1]">
            You make the sideline call. The consensus put the recovery on your
            bench too.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            <strong className="text-slate-900">Concussion Rehab Mastery</strong> is
            the course that completes the loop — from the removal decision you
            already own to measured, heart-rate-threshold rehabilitation and a
            defensible return to play — and ships with the clinical tools to
            deliver it.
          </p>
          <a
            href="#register"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Register your interest
          </a>
        </section>

        {/* ── CATA Approved Provider — badge + member CEUs ─────────────────── */}
        <section className="mt-10 flex items-center gap-5 rounded-2xl border border-teal-200 bg-teal-50 p-5 sm:p-6">
          {hasBadge ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={BADGE_PATH}
              alt="CATA Approved Provider 2025–2027"
              className="h-24 w-24 flex-none"
            />
          ) : (
            <span className="flex h-24 w-24 flex-none items-center justify-center rounded-full border-2 border-teal-600 text-center text-[10px] font-bold uppercase leading-tight text-teal-800">
              CATA
              <br />
              Approved
              <br />
              Provider
            </span>
          )}
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-teal-800">
              CATA Approved Provider {CONFIG.FEATURES.CATA_TERM}
            </p>
            <p className="mt-1 text-[14px] leading-relaxed text-teal-900">
              Concussion Education Australia is an approved provider under the
              Canadian Athletic Therapists Association&rsquo;s Approved Provider
              Program. For CATA members, the online course carries{' '}
              <strong>
                {CATA_CEUS} CEUs
              </strong>{' '}
              at the enhanced Approved-Provider rate (0.4 CEUs per contact hour ·{' '}
              {CONFIG.COURSE.ONLINE_CPD_POINTS} contact hours).
            </p>
          </div>
        </section>

        {/* ── The shift: the recovery phase changed hands ──────────────────── */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
            What changed
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            The 6th International Consensus (Amsterdam 2022) moved concussion from
            a <strong>rest condition</strong> to an{' '}
            <strong>exercise-prescription condition</strong> — gated on graded
            exercise testing and an individually measured heart-rate threshold. In
            the pivotal randomised trial, adolescent athletes prescribed
            individualised sub-symptom-threshold exercise recovered in a median of{' '}
            <strong>13 days versus 17</strong> on placebo-like stretching (Leddy et
            al., <em>JAMA Pediatrics</em>{' '}2019; n=103, ages 13&ndash;18).
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            Recognition, removal and return-to-play protocols already live with the
            athletic therapist. What the consensus added is the middle:{' '}
            <strong>the recovery itself is now an exercise programme you test,
            prescribe and progress</strong> — on the field-side and clinic skills
            you already hold.
          </p>
        </section>

        {/* ── Course structure — verifiable ────────────────────────────────── */}
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

        {/* ── Offer ────────────────────────────────────────────────────────── */}
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
              'Eight modules + the clinical toolkit',
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
            with it.
          </p>

          <p className="mt-4 text-[13px] leading-relaxed text-slate-600 border-t border-slate-200 pt-4">
            <strong className="text-slate-700">Always sold as one.</strong> The
            platform is never available without the training that teaches you to run
            it safely.
          </p>

          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold">
            <Link href="/sst-trainer?clinic=DEMO00" className="text-teal-700 hover:underline">
              See the SST Trainer walkthrough →
            </Link>
            <Link href="/preseason/b/DEMO00" className="text-teal-700 hover:underline">
              Try the baseline flow →
            </Link>
          </p>
        </section>

        {/* ── Published, citable protocol ──────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
            The method is published &amp; citable
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
            It is a published, citable clinical protocol —{' '}
            <a
              href={PROTOCOL_DOI_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-800 underline decoration-slate-300 underline-offset-2 hover:decoration-teal-500"
            >
              <em>A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise Rehabilitation after Concussion (mTBI)</em>, Lewis&nbsp;Z. (2026), Zenodo, CC-BY-4.0
            </a>{' '}
            ({PROTOCOL_DOI_LABEL}). The{' '}
            <strong className="font-semibold text-slate-700">SST Trainer</strong> is the tool
            that delivers it — graded BCTT/BCBT test → measured HR threshold →
            sub-symptom-threshold prescription → monitored home sessions with a measured
            trajectory.
          </p>
        </section>

        {/* ── Continuing-education status — the honesty gate ──────────────── */}
        <section
          className={`mt-10 rounded-xl border p-5 ${
            CONFIG.FEATURES.CATA_APPROVED
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <p
            className={`text-[13.5px] leading-relaxed ${
              CONFIG.FEATURES.CATA_APPROVED ? 'text-emerald-900' : 'text-amber-900'
            }`}
          >
            <strong>Continuing-education status:</strong>{' '}
            {CONFIG.FEATURES.CATA_APPROVED ? (
              <>
                Concussion Education Australia is a{' '}
                <strong>CATA Approved Provider ({CONFIG.FEATURES.CATA_TERM})</strong> —
                the online course carries <strong>{CATA_CEUS} CEUs for CATA members</strong>{' '}
                at the Approved-Provider rate of 0.4 CEUs per contact hour.
              </>
            ) : (
              <>
                CATA Approved-Provider status is not currently held and no CATA CEU
                value is claimed.
              </>
            )}{' '}
            {CONFIG.FEATURES.ESSA_ACCREDITED ? (
              <>
                The course is also <strong>accredited by Exercise &amp; Sports Science
                Australia (ESSA)</strong>, carrying {CONFIG.COURSE.ONLINE_CPD_POINTS} ESSA
                CPD points online, following independent review by two ESSA-appointed
                reviewers.
              </>
            ) : null}{' '}
            We don&rsquo;t claim accreditation we don&rsquo;t hold — this page updates the
            day anything changes.
          </p>
        </section>

        {/* ── Interest capture ─────────────────────────────────────────────── */}
        <section id="register" className="mt-14 scroll-mt-8">
          <EpLeadCapture
            variant="full"
            location="canada"
            kicker="Free for Athletic Therapists"
            heading={'The AT\u2019s Concussion Rehab Starter'}
            blurb={'The measured-threshold rehabilitation workflow \u2014 graded test \u2192 heart-rate threshold \u2192 sub-symptom-threshold dose \u2192 return to play \u2014 mapped to the athletic therapist\u2019s scope. Emailed to you, free.'}
            footnote={'One email with the resource, then the occasional update relevant to athletic therapists. No spam. Unsubscribe in one click, anytime.'}
            emailPlaceholder="you@clinic.ca"
          />
        </section>

        <p className="mt-10 text-[12px] text-slate-400">
          Australian and New Zealand pricing differs —{' '}
          <Link href="/courses" className="underline hover:text-slate-600">
            see AUD pricing
          </Link>
          .
        </p>
      </main>
    </div>
  )
}
