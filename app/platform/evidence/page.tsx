import Link from 'next/link'
import { PlatformNav, PlatformFooter, PLATFORM } from '@/components/platform/PlatformChrome'

// ─────────────────────────────────────────────────────────────────────────────
// /platform/evidence — credibility page for the SST Trainer platform site.
// Buffalo Concussion Treadmill Test / sub-symptom-threshold aerobic exercise
// literature (Leddy et al. 2010–2023). Claims framed as "associated with",
// never guarantees. Tool language: training/monitoring for clinician-supervised
// graded return — never "treats/diagnoses concussion".
// Gated + noindex by app/platform/layout.tsx — no gating/robots added here.
// ─────────────────────────────────────────────────────────────────────────────

const STATS = [
  {
    figure: '~48%',
    body: 'lower risk of persistent symptoms when sub-symptom aerobic exercise is started within ~10 days of injury, vs a stretching placebo (Leddy et al.).',
  },
  {
    figure: '13 vs 17',
    body: 'median days to recovery — aerobic-exercise group vs stretching group in adolescents with sport-related concussion.',
  },
  {
    figure: '<135 bpm',
    body: 'an example heart-rate threshold — a value this low on the test is associated with a higher risk of prolonged recovery, so the dose is also prognostic.',
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Find the threshold (the Buffalo test)',
    body: 'The Buffalo Concussion Treadmill/Bike Test adapts a cardiac stress test to stress the brain instead of the heart. Effort is raised by the minute while heart rate and symptoms are tracked; the heart rate at which symptoms first intensify is the Heart-Rate threshold (HRt) — a validated measure of exercise tolerance after concussion. A free BCTT calculator is available at portal.concussion-education-australia.com/tools/bctt-calculator.',
    callout: 'a guided per-minute ramp captures your HRt automatically, and stops the test at the +3-point symptom rise.',
  },
  {
    n: 2,
    title: 'Prescribe a sub-symptom band',
    body: 'Trials prescribe aerobic exercise at roughly 80–90% of the HRt — hard enough to stimulate recovery, low enough to stay under the symptom threshold. The dose is about 20 minutes a day, most days of the week, individualised to each patient. Some apps prescribe from an age formula (a fixed percentage of 220 − age). SST Trainer prescribes from your patient’s measured threshold.',
    callout: 'your band is computed at 80–90% of your HRt, with an adjustable 4–7 day/week schedule and a hard ceiling you should not cross.',
  },
  {
    n: 3,
    title: 'Structure each session',
    body: 'A session is built as a 5–10 minute warm-up, ~20 minutes of steady aerobic work held under the threshold, then a 5–10 minute cool-down — using any mode the patient prefers (walking, stationary bike, light jog).',
    callout: 'sessions run warm-up → main set → cool-down with a live heart-rate gauge that keeps you in-band and warns the moment you cross the ceiling.',
  },
  {
    n: 4,
    title: 'Re-test and progress',
    body: 'Because the brain heals, the threshold rises. Protocols re-test every 1–2 weeks and lift the prescription accordingly, stopping when exercise tolerance normalises. Symptoms rising 2+ points in a session is the signal to stop and rest.',
    callout: 'progress tracking nudges a re-test, advances your ceiling after clean sessions, and tells you to rest when a session provokes symptoms.',
  },
]

const REFERENCES = [
  'Leddy JJ, Willer B, et al. Early Subthreshold Aerobic Exercise for Sport-Related Concussion: a randomized clinical trial. JAMA Pediatrics, 2019.',
  'Leddy JJ, et al. Early targeted heart-rate aerobic exercise vs placebo stretching for sport-related concussion in adolescents: a randomised controlled trial. The Lancet Child & Adolescent Health, 2021.',
  'Haider MN, Leddy JJ, Willer BS, et al. Exercise for Sport-Related Concussion and Persistent Postconcussive Symptoms (review). Sports Health, 2021.',
  'Haider MN, Leddy JJ, Wilber CG, et al. The Predictive Capacity of the Buffalo Concussion Treadmill Test after Sport-Related Concussion in Adolescents. Frontiers in Neurology, 2019 (HRt <135 bpm and ΔHR ≤50 bpm predict prolonged recovery).',
  'Popoli DM, Leddy JJ, et al. Practical Management: A Standardized Aerobic Exercise Program for Adolescents with Concussion in the Absence of Graded Exercise Testing. Clinical Journal of Sport Medicine, 2023.',
  'Janssen A, Pope R, Rando N. Clinical application of the Buffalo Concussion Treadmill Test and Bike Test: a systematic review, 2022.',
  'Leddy JJ, et al. A preliminary study of sub-symptom threshold exercise training for refractory post-concussion syndrome. Clinical Journal of Sport Medicine, 2010.',
  'Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport — Amsterdam, October 2022. British Journal of Sports Medicine, 2023.',
  'Chizuk HM, et al. Evaluating User Experience and Satisfaction in a Concussion Rehabilitation App (Rhea): a Usability Study. JMIR Formative Research, 2025.',
  'Hutchison MG, Di Battista AP, Loenhart MM. A Continuous Aerobic Resistance Exercise (CARE) Protocol for Concussion Rehabilitation Delivered Remotely via a Mobile App: a Feasibility Study. JMIR Formative Research, 2023.',
]

export default function EvidencePage() {
  return (
    <div className="min-h-screen bg-[#eef2f7] text-slate-700" style={{ color: PLATFORM.slate }}>
      <PlatformNav active="/platform/evidence" />

      {/* Hero */}
      <header
        className="px-6 pt-10 pb-14"
        style={{ background: 'linear-gradient(180deg, #eaf4e6 0%, #f1f6f3 38%, #eef2f7 100%)' }}
      >
        <div className="mx-auto max-w-[820px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#3c7a1f]/25 bg-white/70 px-3.5 py-1.5 text-[12px] font-bold tracking-[0.02em] text-[#3c7a1f]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3c7a1f]" />
            Built on the Buffalo protocol
          </span>
          <h1 className="mt-6 text-balance text-[44px] font-extrabold leading-[1.04] tracking-[-0.02em] text-[#16243f] sm:text-[54px]">
            The evidence behind
            <br className="hidden sm:block" /> the threshold.
          </h1>
          <p className="mx-auto mt-6 max-w-[640px] text-[16px] leading-relaxed text-slate-600">
            For two decades, prescribed sub-symptom-threshold aerobic exercise has moved from
            &ldquo;rest in a dark room&rdquo; to a tested, individualised treatment. Here&rsquo;s what the
            research actually shows — and how this app helps it.
          </p>
        </div>
      </header>

      {/* Stat cards */}
      <section className="px-6 -mt-6">
        <div className="mx-auto grid max-w-[1080px] gap-5 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.figure}
              className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <p className="text-[34px] font-extrabold tracking-[-0.02em] text-[#16243f]">{s.figure}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Numbered steps */}
      <section className="px-6 py-16">
        <div className="mx-auto flex max-w-[860px] flex-col gap-6">
          {STEPS.map((step) => (
            <div
              key={step.n}
              className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
            >
              <div className="flex items-center gap-4">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[15px] font-bold text-white"
                  style={{ backgroundColor: PLATFORM.navy }}
                >
                  {step.n}
                </span>
                <h2 className="text-[20px] font-bold tracking-[-0.01em] text-[#16243f]">{step.title}</h2>
              </div>
              <p className="mt-4 text-[15px] leading-relaxed text-slate-600">{step.body}</p>
              <div
                className="mt-5 rounded-xl border border-[#3c7a1f]/20 px-4 py-3.5 text-[14px] leading-relaxed text-slate-700"
                style={{ backgroundColor: '#eef5e8' }}
              >
                <span className="inline-flex items-start gap-2.5">
                  <svg
                    viewBox="0 0 20 20"
                    className="mt-0.5 h-4 w-4 shrink-0"
                    fill={PLATFORM.green}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    <span className="font-bold text-[#16243f]">In the app:</span> {step.callout}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Measured vs estimated */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-[860px]">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-7 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#3c7a1f]/25 bg-[#eef5e8] px-3 py-1 text-[11.5px] font-bold tracking-[0.02em] text-[#3c7a1f]">
              Measured vs estimated
            </span>
            <h2 className="mt-4 text-[22px] font-bold tracking-[-0.01em] text-[#16243f]">
              Where the dose comes from
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
              The whole method turns on one number: the heart rate just below which symptoms intensify. It
              is individual, and how a tool obtains it is what separates them. SST Trainer measures it with
              a symptom-limited graded exertion test — the Buffalo test — for each patient. By contrast, the
              leading commercial concussion-rehab app, Rhea, prescribes from age-predicted maximum heart
              rate: the published CARE protocol it delivers targeted 55–65% of a fixed 220 − age, with no
              graded test to individualise the dose. An age formula can miss a given patient&rsquo;s
              measured threshold by 10 bpm or more. To our knowledge, no published digital
              concussion-rehab programme prescribes from each patient&rsquo;s own measured threshold — the
              dose is estimated. Measuring it, then holding the patient to it with verified live heart
              rate, is the gap this design fills.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-5">
                <p className="text-[12px] font-bold tracking-[0.06em] text-slate-500">
                  ESTIMATED · AGE FORMULA
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">
                  Dose set as a fixed share of 220 − age — the same formula for every patient of a given
                  age, with no graded test (Chizuk et al. 2025; Hutchison et al. 2023).
                </p>
              </div>
              <div className="rounded-xl border border-[#3c7a1f]/20 bg-[#eef5e8] p-5">
                <p className="text-[12px] font-bold tracking-[0.06em] text-[#3c7a1f]">
                  MEASURED · GRADED TEST
                </p>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-700">
                  Dose set just below the patient&rsquo;s own measured heart-rate threshold, re-measured as
                  they recover (Leddy &amp; Willer 2013; Leddy et al. 2019).
                </p>
              </div>
            </div>

            <p className="mt-6 text-[13.5px] leading-relaxed text-slate-500">
              Two safeguards sit on top of the measured band: progression is verification-gated — the band
              advances only on live, verified wearable sessions and is capped at the measured threshold, so
              it never ratchets up on an unverified number — and the clinician reads a serial trajectory of
              measured thresholds, not a self-reported symptom log. To our knowledge, no other commercial
              concussion app combines a measured heart-rate threshold, verification-gated training, and a
              serial measured-HRt clinician trajectory. The sub-symptom-threshold protocol itself is
              endorsed by the 6th International Consensus on Concussion in Sport and supported by
              randomised-trial evidence (Patricios et al. 2023; Leddy et al. 2019).
            </p>
          </div>
        </div>
      </section>

      {/* Progressive, not protective */}
      <section className="px-6 pb-16">
        <div
          className="mx-auto max-w-[960px] rounded-3xl p-9 text-white sm:p-11"
          style={{ background: 'linear-gradient(160deg, #16243f 0%, #1b2c4d 100%)' }}
        >
          <h2 className="text-[24px] font-bold tracking-[-0.01em]">Progressive, not protective</h2>
          <p className="mt-3 max-w-[560px] text-[15px] leading-relaxed text-slate-300">
            This is graded exposure that lifts a ceiling as you heal — the opposite of pacing apps that
            help you avoid exertion. Different mechanism, different goal.
          </p>
          <div className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-[12px] font-bold tracking-[0.06em]" style={{ color: PLATFORM.greenBright }}>
                THIS APP · PROGRESSION
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
                Train just under your symptom threshold; the band steps up as you recover. Drives the
                recovery forward.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-[12px] font-bold tracking-[0.06em] text-slate-400">RECALL APPS · PROTECTION</p>
              <p className="mt-3 text-[15px] leading-relaxed text-slate-200">
                Stay inside an energy envelope to avoid crashes. Tells you when to stop, not how to progress.
              </p>
            </div>
          </div>
          <p className="mt-7 text-[12.5px] leading-relaxed text-slate-400">
            Scope: progressive sub-symptom exercise is evidence-based for concussion / mTBI and
            exercise-intolerant recovery, under clinician oversight. It is not appropriate for every
            condition — graded exertion is contraindicated in some (e.g. ME/CFS, where pacing is
            indicated). Always follow your clinician.
          </p>
        </div>
      </section>

      {/* Key references */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-[960px]">
          <h2 className="text-[22px] font-bold tracking-[-0.01em] text-[#16243f]">Key references</h2>

          {/* The published protocol — the citable standard of the method this platform delivers */}
          <div className="mt-6 rounded-2xl border-2 border-[#3c7a1f]/30 bg-[#eef5e8] p-6">
            <p className="text-[11.5px] font-bold uppercase tracking-[0.06em] text-[#3c7a1f]">The published protocol</p>
            <p className="mt-2 text-[15.5px] font-semibold leading-relaxed text-[#16243f]">
              Lewis, Z. (2026). A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise
              Rehabilitation after Concussion (mild Traumatic Brain Injury). Zenodo. CC-BY-4.0.
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-600">
              The citable, peer-reviewable standard of the method this platform delivers — the clinical spine
              of the Concussion Rehab Mastery course, referenced to a 136-item evidence base.
            </p>
            <a
              href="https://doi.org/10.5281/zenodo.21482634"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[13.5px] font-bold text-[#3c7a1f] hover:underline"
            >
              doi.org/10.5281/zenodo.21482634 →
            </a>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {REFERENCES.map((ref) => (
              <div
                key={ref}
                className="flex gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
              >
                <span
                  className="mt-0.5 h-5 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: PLATFORM.green }}
                />
                <p className="text-[14px] leading-relaxed text-slate-600">{ref}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12.5px] leading-relaxed text-slate-400">
            Summaries are educational and not a substitute for clinical judgement. This app is a
            clinician-directed coaching and tracking tool — not a diagnosis or a return-to-play clearance.
          </p>
        </div>
      </section>

      {/* CTA band */}
      <section className="px-6 pb-20">
        <div
          className="mx-auto max-w-[1080px] rounded-3xl border border-[#3c7a1f]/20 px-8 py-14 text-center"
          style={{ background: 'linear-gradient(135deg, #eef6e7 0%, #f3f8f1 100%)' }}
        >
          <h2 className="text-[30px] font-extrabold tracking-[-0.02em] text-[#16243f] sm:text-[34px]">
            Put the evidence on the wrist.
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[16px] leading-relaxed text-slate-600">
            The protocol your clinic already trusts, delivered to the wearable your patient already owns —
            with the structure and between-visit visibility that carries a patient through their whole
            episode of care, re-test by re-test, rather than dropping off after the second visit.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/clinical-suite"
              className="rounded-full px-6 py-3 text-[15px] font-bold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: PLATFORM.navy }}
            >
              For clinicians
            </Link>
            <Link
              href="/pricing"
              className="rounded-full px-6 py-3 text-[15px] font-bold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: PLATFORM.green }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <PlatformFooter />
    </div>
  )
}
