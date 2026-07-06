import type { Metadata } from 'next'
import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { SiteNav } from '@/components/SiteNav'
import { SstWatchAnimation } from '@/components/platform/SstWatchAnimation'

/**
 * /sst — the PUBLIC, standalone SST Trainer landing page (owner 2026-07-06:
 * "standalone sst-trainer landing page in same style as baseline … it can
 * be public … then launches into CEA portal with everything pay-gated
 * except the trainer/baseline free trial period").
 *
 * Clinic-facing marketing page in the /preseason baseline visual style
 * (Hanken Grotesk, radial gradient, SiteNav). The hero shows a rendered
 * Apple Watch swiping the real app screens. CTAs launch into the founding
 * signup → portal, where Clinical Testing is free-trial and course content
 * is purchase-gated. Patients only ever reach the app via a clinic code.
 */

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-hanken',
  display: 'swap',
})
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
})

const ACCENT = '#0d9488'

export const metadata: Metadata = {
  title: 'SST Trainer — measured concussion exercise rehab | Concussion Education Australia',
  description:
    'Sub-symptom threshold exercise rehab for concussion clinics: measure the patient’s heart-rate threshold, prescribe the band, and their own watch holds them to it at home — with every session and the GP report flowing back to you.',
  alternates: { canonical: '/sst' },
}

const STEPS = [
  {
    n: '1',
    title: 'Test & prescribe',
    body: 'Run the Buffalo graded test (or enter an in-clinic result). The app measures the heart-rate threshold where symptoms begin and sets the 80–90% training band.',
  },
  {
    n: '2',
    title: 'Patient trains on their own watch',
    body: 'They enter your clinic code and train at home — Garmin, Polar, WHOOP or any Bluetooth strap. Live HR holds them under the ceiling; sessions stop at a symptom rise.',
  },
  {
    n: '3',
    title: 'Data & the GP report come back to you',
    body: 'The measured-threshold trajectory, verified sessions and flare flags land in your dashboard. At episode end the app writes the single-page GP report, ready to sign.',
  },
]

const FACTS = [
  {
    stat: '12 vs 21.5 days',
    body: 'Median recovery for patients who completed their prescribed sub-symptom sessions versus those who didn’t.',
    cite: 'Leddy et al., adolescent SRC cohort (PMC9378725), p = 0.016',
  },
  {
    stat: '~4 in 10',
    body: 'Patients fell short of even two-thirds of their prescribed volume — unseen until re-test on a paper diary.',
    cite: 'Same cohort; physiotherapy home-exercise adherence runs as low as 50%',
  },
  {
    stat: 'First-line',
    body: 'Sub-symptom aerobic exercise is first-line concussion care — measured threshold, ~20 min/day, 6 of 7 days.',
    cite: 'Patricios et al., Amsterdam consensus 2023 (BJSM); Leddy, JAMA Peds 2019',
  },
]

const COVERS = [
  { icon: '℞', title: 'Measured, not estimated', body: 'The band comes from the patient’s own graded test — not a fixed share of 220 − age applied to everyone.' },
  { icon: '%', title: 'Adherence you can see', body: 'Who trained, who drifted over the ceiling, who flared — the data rest-based care never gave you.' },
  { icon: '↺', title: 'Verified progression', body: 'The dose advances only on live, verified wearable sessions, capped at the measured threshold.' },
  { icon: '⤴', title: 'A serial recovery curve', body: 'Read a trajectory of measured thresholds over time — each point tagged with how it was captured.' },
  { icon: '📄', title: 'The GP report writes itself', body: 'Single-page episode report with trajectory, symptom tables and a clearance-or-extend recommendation.' },
  { icon: '⚑', title: 'Safety built in', body: 'Red-flag screening, a hard ceiling, and a stop at a 2-point symptom rise — every session.' },
]

export default function SstLandingPage() {
  return (
    <div
      className={`${hanken.className} ${spaceGrotesk.variable} min-h-screen w-full text-slate-900`}
      style={{ background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)' }}
    >
      <SiteNav />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-6 pb-16 pt-[100px] md:px-8 md:pt-[120px]">
        <div className="flex flex-1 basis-[430px] flex-col gap-[22px]">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none"
            style={{ background: '#d5f5f0', color: ACCENT }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            For physios · EPs · sports-med · concussion clinics
          </span>
          <h1 className="m-0 text-[clamp(34px,4.6vw,58px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            You set the threshold.
            <br />
            <span style={{ color: ACCENT }}>Their watch holds them to it.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
            Sub-symptom aerobic exercise is first-line concussion care — but the band only helps if
            the patient trains in it, every day, between appointments. SST Trainer is the delivery
            layer: you prescribe and oversee; they train on the wearable they own; the data and the
            GP report come back to you.
          </p>
          <div className="mt-0.5 flex flex-wrap gap-3">
            <Link
              href="/platform/founding"
              className="flex items-center gap-2 rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: '#16243f' }}
            >
              Become a founding clinic
            </Link>
            <Link
              href="/platform/evidence"
              className="flex items-center gap-2 rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              See the evidence →
            </Link>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-[18px]">
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">First 3 patients free</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">Buffalo-protocol graded test</span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">Their own wearable</span>
          </div>
        </div>

        {/* rendered Apple Watch, swiping the real screens */}
        <div className="flex min-w-0 flex-1 basis-[420px] justify-center">
          <SstWatchAnimation />
        </div>
      </header>

      {/* ── Research facts ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FACTS.map((f) => (
            <div key={f.stat} className="rounded-[18px] border border-slate-200 bg-white p-6">
              <div className="font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(24px,2.6vw,30px)', color: ACCENT, lineHeight: 1.05 }}>
                {f.stat}
              </div>
              <p className="mt-2 text-[13.5px] leading-[1.5] text-slate-600">{f.body}</p>
              <p className="mt-3 text-[11px] italic leading-[1.4] text-slate-400">{f.cite}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-slate-400">
          Recovery figures describe compliance with the exercise protocol, not the app — SST Trainer
          is what makes that compliance measurable.
        </p>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 pt-2 md:px-8">
        <h2 className="mb-[26px] text-center text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          The clinician loop
        </h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[18px] border border-slate-200 bg-white p-[26px]">
              <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-slate-900 text-[15px] font-bold leading-none text-white">
                {s.n}
              </span>
              <h3 className="mb-2 mt-4 text-[18px] font-extrabold leading-[1.15] tracking-[-0.01em]">{s.title}</h3>
              <p className="m-0 text-[14px] leading-[1.55] text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What clinics get ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[60px] md:px-8">
        <div className="mb-[26px] text-center">
          <h2 className="mb-2 text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Why clinics use it
          </h2>
          <p className="mx-auto m-0 max-w-[560px] text-[15px] leading-[1.5] text-slate-500">
            Everything the paper handout couldn’t do — measured, verified, and back in your dashboard
            between appointments.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COVERS.map((c) => (
            <div key={c.title} className="rounded-[16px] border border-slate-200 bg-white p-5">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-[15px] font-bold leading-none" style={{ background: '#d5f5f0', color: '#0f766e' }}>
                {c.icon}
              </span>
              <h3 className="mb-1.5 mt-[13px] text-[16px] font-bold leading-[1.15]">{c.title}</h3>
              <p className="m-0 text-[13px] leading-[1.5] text-slate-500">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA into the portal ────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-20 md:px-8">
        <div
          className="flex flex-col items-center gap-[13px] rounded-[22px] border p-9 text-center"
          style={{ background: 'linear-gradient(135deg, #effbfa, #e6f6f3)', borderColor: '#c5ebe4' }}
        >
          <h2 className="m-0 font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.1 }}>
            Your first 3 patients are free.
          </h2>
          <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-slate-600">
            Patients reach the app only through your clinic code — your tool, your patients, your
            data. Run your first three on us (no card, no time limit), then lock your founding rate.
            Signing up gives you the CEA portal too: the trainer and baseline testing are yours on
            trial, and the full concussion course is there when you want it.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-[11px]">
            <Link
              href="/platform/founding"
              className="rounded-[12px] px-[24px] py-[15px] text-[15px] font-bold leading-none text-white transition-opacity hover:opacity-90"
              style={{ background: '#16243f' }}
            >
              Become a founding clinic
            </Link>
            <Link
              href="/platform/pricing"
              className="rounded-[12px] border-[1.5px] border-slate-300 bg-white px-[24px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-colors hover:border-slate-400"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
