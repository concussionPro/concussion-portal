import Link from 'next/link'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import { CONFIG } from '@/lib/config'
import { intlPriceForCountry } from '@/lib/international-pricing'

/**
 * /cep-uk — landing page for UK exercise professionals on the AHCS
 * Accredited Register via the Clinical Exercise Physiology UK (CEP-UK) route.
 * Angle: register-recognised concussion rehab-exercise course, competency-mapped
 * to UK frameworks. Interest capture only while the global market review runs.
 */

const PRICE = intlPriceForCountry('GB') // £275
const RENEWAL_USD = CONFIG.COURSE.RENEWAL_INTERNATIONAL

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

export default function CepUkLandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <main className="max-w-3xl mx-auto px-5 py-14 sm:py-20">
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700">
            For CEP-UK &amp; AHCS-registered exercise professionals
          </p>
          <h1 className="mt-3 text-3xl sm:text-[2.6rem] font-extrabold tracking-tight leading-[1.1]">
            Concussion is now an exercise-prescription condition. That puts it
            squarely in your lane.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-600">
            <strong className="text-slate-900">Concussion Rehab Mastery</strong> is
            a structured rehab-exercise course built for clinical exercise
            physiologists — competency-mapped to UK practice frameworks and
            shipped with the clinical tools to deliver it.
          </p>
          <a
            href="#register"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Register your interest
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
            is the definitional competency of a clinical exercise physiologist.
            What changed is not the skill — it is the <strong>indication</strong>.
          </p>
          <p className="mt-4 text-[13px] leading-relaxed text-slate-500 border-t border-slate-200 pt-4">
            Evidence base includes Leddy et al., <em>Lancet Child &amp; Adolescent
            Health</em> 2021 and the Leddy et al. <em>BJSM</em> 2023 meta-analysis.
            Concussion Rehab Mastery is an independent course; it is not endorsed by
            or affiliated with CEP-UK or the AHCS.
          </p>
        </section>

        {/* ── Course structure ─────────────────────────────────────────────── */}
        <section className="mt-14">
          <h2 className="text-xl font-bold tracking-tight">What the course is</h2>
          <p className="mt-2 text-[14px] text-slate-600">
            Eight online modules · {TOTAL_MINS / 60} hours of learning · 80% pass
            mark · 136 peer-reviewed references · self-paced · lifetime access.
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
            <span className="text-4xl font-extrabold tracking-tight">{PRICE.display}</span>
            <span className="text-[13px] text-slate-500 font-semibold">{PRICE.code}</span>
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
            <strong>Renewal US${RENEWAL_USD}/yr</strong> isn&rsquo;t a software
            charge — it includes your <strong>annual concussion-update module</strong>,
            so it meets that year&rsquo;s recurring CPD requirement and keeps the
            platform live.
          </p>

          <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold">
            <Link href="/demo/review-cep-uk" className="text-teal-700 hover:underline">
              Review the full course →
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

        {/* ── Honesty gate ─────────────────────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Recognition status:</strong> Concussion Education Australia is
            pursuing AHCS Accredited Register recognition of this course through the
            CEP-UK route. The course has been{' '}
            <strong>independently reviewed by two reviewers appointed by Exercise
            &amp; Sports Science Australia (ESSA)</strong>; that endorsement is
            pending and not yet held. We don&rsquo;t claim accreditation we
            don&rsquo;t hold — this page updates the day each is confirmed.
          </p>
        </section>

        {/* ── Interest capture ─────────────────────────────────────────────── */}
        <section id="register" className="mt-14 scroll-mt-8">
          <EpLeadCapture variant="full" location="cep-uk" />
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
