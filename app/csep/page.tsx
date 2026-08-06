import Link from 'next/link'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import { CONFIG, SST_TIER_FROM_AUD } from '@/lib/config'
import { intlPriceForCountry } from '@/lib/international-pricing'
import { CRM_REFERENCE_COUNT } from '@/data/reference-count'

/**
 * NOT INDEXABLE.
 * CSEP recognition is ON HOLD pending ESSA equivalency — nothing here is
 * offerable yet, so it must not be discoverable.
 * (Unlisted-but-crawlable was the worst of both: no sitemap entry, no
 * noindex — discoverable by accident and managed by nobody.)
 */
export const metadata = { robots: 'noindex, nofollow' } as const


/**
 * /csep — preview page for Canadian exercise physiologists via CSEP.
 * The CSEP recognition route is ON HOLD pending ESSA endorsement (equivalency
 * route), so this page reads as a coming-soon/preview, NOT an active sale.
 * Interest capture only.
 */

const PRICE = intlPriceForCountry('CA') // CA$475
// The bundled platform renews at the real SST entry-tier price. The old
// US$99/yr copy was never wired to any Stripe price and understated the
// actual charge ~4x (2026-08-05 live crawl).
const PLATFORM_MONTHLY = SST_TIER_FROM_AUD

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

export default function CsepLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* ── Preview banner ───────────────────────────────────────────────── */}
        <div className="mb-8 rounded-xl border border-slate-300 bg-slate-900 px-4 py-3 text-[12.5px] font-semibold text-white">
          {CONFIG.FEATURES.ESSA_ACCREDITED
            ? 'Preview · CSEP recognition pathway — ESSA accreditation now held; the equivalency application can proceed. Not yet open for enrolment in Canada.'
            : 'Preview · CSEP recognition pathway — pending ESSA endorsement (equivalency route). Not yet open for enrolment in Canada.'}
        </div>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            Coming for CSEP-CEP / CSEP-CPT professionals
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.1]">
            Concussion became an exercise-prescription condition. A CSEP
            recognition route for the rehab course is on the way.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            <strong className="text-slate-900">Concussion Rehab Mastery</strong> is
            a structured rehab-exercise course for exercise physiologists. We are
            building the CSEP recognition pathway now — register below and
            you&rsquo;ll be first to know when the Canadian route opens.
          </p>
          <a
            href="#register"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Get notified when it opens
          </a>
        </section>

        {/* ── What changed ─────────────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-7">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-500">
            What changed
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            The 6th International Consensus (Amsterdam 2022) moved concussion from
            a <strong>rest condition</strong> to an{' '}
            <strong>exercise-prescription condition</strong> — gated on graded
            exercise testing and an individually derived heart-rate threshold. In
            the pivotal randomised trial, adolescent athletes on individualised
            sub-symptom-threshold exercise recovered in a median of{' '}
            <strong>13 days versus 17</strong> on placebo-like stretching (Leddy et
            al., <em>JAMA Pediatrics</em> 2019; n=103).
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-700">
            Deriving an HR threshold from a graded test and progressing against it
            is core exercise-physiology practice. What changed is not the skill —
            it is the <strong>indication</strong>.
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500 border-t border-slate-200 pt-4">
            Evidence base includes Leddy et al., <em>Lancet Child &amp; Adolescent
            Health</em> 2021 and the Leddy et al. <em>BJSM</em> 2023 meta-analysis.
            Concussion Rehab Mastery is an independent course; it is not endorsed by
            or affiliated with CSEP.
          </p>
        </section>

        {/* ── Course structure ─────────────────────────────────────────────── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">What the course is</h2>
          <p className="mt-2 text-[14px] text-slate-600">
            Eight online modules · {TOTAL_MINS / 60} hours of learning · 80% pass
            mark · {CRM_REFERENCE_COUNT} peer-reviewed references · self-paced · lifetime access.
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

        {/* ── Offer (planned) ──────────────────────────────────────────────── */}
        <section className="mt-14 rounded-2xl border-2 border-slate-300 p-6 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Planned Canadian pricing
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight">The platform is the product</h2>
          <p className="mt-1 text-[14px] text-slate-500">
            The clinical platform — unlocked by the training to run it safely.
          </p>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight">{PRICE.display}</span>
            <span className="text-[13px] text-slate-500 font-semibold">{PRICE.code}</span>
          </div>
          <p className="text-[11px] text-slate-400">course + first year on the platform · when the CSEP route opens</p>

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

          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold">
            <Link href="/demo/review-csep" prefetch={false} className="text-teal-700 hover:underline">
              Preview the full course →
            </Link>
            <Link href="/sst-trainer?clinic=DEMO00" className="text-teal-700 hover:underline">
              See the SST Trainer walkthrough →
            </Link>
          </p>
        </section>

        {/* ── Published, citable protocol ─────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700">
            The method is published &amp; citable
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
            While the Canadian route is being built, the method itself is already a
            published, citable clinical protocol —{' '}
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

        {/* ── Honesty gate ─────────────────────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Recognition status:</strong>{' '}
            {CONFIG.FEATURES.ESSA_ACCREDITED ? (
              <>
                The course is <strong>accredited by Exercise &amp; Sports Science Australia
                (ESSA)</strong>, which is the prerequisite for the CSEP equivalency route — that
                application can now proceed. <strong>CSEP recognition is not yet held</strong> and
                the pathway is not yet open for enrolment in Canada.
              </>
            ) : (
              <>
                The <strong>CSEP recognition pathway is pending ESSA endorsement (equivalency
                route)</strong> and is not yet open. The course has been independently reviewed by
                two reviewers appointed by Exercise &amp; Sports Science Australia (ESSA); that
                endorsement is pending and not yet held.
              </>
            )}{' '}
            We don&rsquo;t claim accreditation we don&rsquo;t hold — this page updates the day the
            Canadian route confirms.
          </p>
        </section>

        {/* ── Interest capture ─────────────────────────────────────────────── */}
        <section id="register" className="mt-14 scroll-mt-8">
          <EpLeadCapture variant="full" location="csep" />
        </section>

        <p className="mt-10 text-[12px] text-slate-400">
          Provider: Concussion Education Australia (CEA Pty Ltd), ABN 74 688 155 508. Author: Zac Lewis, Osteopath, AHPRA OST0001852866 ·{' '}
          <a href="mailto:zac@concussion-education-australia.com" className="underline hover:text-slate-600">
            zac@concussion-education-australia.com
          </a>
        </p>
      </main>
    </div>
  )
}
