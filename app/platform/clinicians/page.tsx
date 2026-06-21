import type { Metadata } from 'next'
import Link from 'next/link'
import { PlatformNav, PlatformFooter, PLATFORM } from '@/components/platform/PlatformChrome'

// ─────────────────────────────────────────────────────────────────────────────
// /platform/clinicians — the "For clinicians" CONVERSION page for the SST Trainer.
// Faithful to the CEA-Site build: navy #16243f hero loop card, green accents,
// Hanken Grotesk (applied by the route-group layout). Primary action =
// "Become a founding clinic" → /platform/pricing. Gated + noindex by layout.
// Clinical framing: a training/monitoring tool for clinician-supervised graded
// return — never "treats/diagnoses".
// ─────────────────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: 'For clinicians — SST Trainer · Concussion Education Australia',
  description:
    'You set the threshold; we hold patients to it. A training and monitoring tool for clinician-supervised graded return — prescribe a sub-symptom heart-rate band, watch adherence, and get the data back between appointments.',
}

const LOOP: { n: string; t: string; d: string }[] = [
  {
    n: '1',
    t: 'You test & prescribe',
    d: 'Run the Buffalo test (or enter an in-clinic result) and set the heart-rate threshold + band.',
  },
  {
    n: '2',
    t: 'Patient pairs a wearable',
    d: 'They enter your clinic code and train on the Apple Watch, Garmin, WHOOP or chest strap they already own.',
  },
  {
    n: '3',
    t: 'They train in-band, daily',
    d: 'Live HR keeps them under the ceiling; the app logs every session and flags symptom flares.',
  },
  {
    n: '4',
    t: 'Data returns to you',
    d: 'Adherence, symptom trend and re-test prompts arrive for your review — between appointments.',
  },
]

const VALUES: { icon: string; title: string; body: string }[] = [
  {
    icon: '℞',
    title: 'Prescribe, don’t hope',
    body: 'Your exact band and dose go to the wrist — no paper handout that gets lost or misread.',
  },
  {
    icon: '%',
    title: 'Adherence you can see',
    body: 'Know who trained, who drifted over the ceiling, and who flared — the data rest-based care never gave you.',
  },
  {
    icon: '↺',
    title: 'Automatic re-test loop',
    body: 'The fortnightly recalculation runs itself and surfaces when a patient is ready to step up.',
  },
  {
    icon: '⚑',
    title: 'Safety built in',
    body: 'Red-flag screening, a hard ceiling, and a stop signal at a 2-point symptom rise — every session.',
  },
]

const DASH = [
  'Threshold & prescribed band',
  'Session-by-session adherence',
  'Symptom trend vs baseline',
  'Re-test & progression prompts',
]

export default function CliniciansPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        background:
          'radial-gradient(120% 75% at 82% -8%, #f2f8eb 0%, #f8fafc 46%, #f1f5f9 100%)',
        color: PLATFORM.navy,
      }}
    >
      <PlatformNav active="/platform/clinicians" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-12 px-8 pb-[52px] pt-9">
        <div className="flex flex-[1_1_430px] flex-col gap-5">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold"
            style={{ background: '#e6f3da', color: PLATFORM.green }}
          >
            For physios · EPs · sports-med · concussion clinics
          </span>
          <h1
            className="m-0 font-extrabold tracking-[-0.03em]"
            style={{ fontSize: 'clamp(33px, 4.3vw, 52px)', lineHeight: 1.04 }}
          >
            You set the threshold.
            <br />
            <span style={{ color: '#3f9020' }}>We hold them to it.</span>
          </h1>
          <p
            className="m-0 max-w-[520px] font-normal text-slate-600"
            style={{ fontSize: 'clamp(15px, 1.4vw, 17px)', lineHeight: 1.55 }}
          >
            The Buffalo protocol works — but the band only helps if the patient actually trains in
            it, every day, between appointments. This app is the adherence layer: you prescribe and
            oversee; they train on the wearable they own; their recovery flows back to you.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/platform/pricing"
              className="rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: PLATFORM.navy }}
            >
              Become a founding clinic
            </Link>
            <Link
              href="/platform/evidence"
              className="rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold transition-colors hover:border-slate-400"
              style={{ color: PLATFORM.navy }}
            >
              See the evidence →
            </Link>
          </div>
        </div>

        {/* Clinician loop card */}
        <div
          className="flex min-w-0 flex-[1_1_360px] flex-col gap-[14px] rounded-[22px] p-[26px]"
          style={{ background: PLATFORM.navy }}
        >
          <span
            className="text-[11px] font-bold uppercase tracking-[0.08em]"
            style={{ color: '#8ed35a' }}
          >
            The clinician loop
          </span>
          {LOOP.map((step) => (
            <div key={step.n} className="flex items-start gap-3">
              <span
                className="flex h-[30px] w-[30px] flex-[0_0_auto] items-center justify-center rounded-[9px] text-[13px] font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.1)' }}
              >
                {step.n}
              </span>
              <div>
                <div className="text-[14px] font-bold leading-[1.2] text-white">{step.t}</div>
                <div
                  className="mt-[3px] text-[12.5px] font-normal"
                  style={{ color: '#a7c2c5', lineHeight: 1.45 }}
                >
                  {step.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* ── Why clinics use it ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-8 pb-11 pt-1.5">
        <h2
          className="mx-0 mb-[22px] mt-0 text-center font-extrabold tracking-[-0.02em]"
          style={{ fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.1 }}
        >
          Why clinics use it
        </h2>
        <div className="grid gap-[18px] [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="rounded-[18px] border border-slate-200 bg-white p-6"
            >
              <span
                className="inline-flex h-10 w-10 items-center justify-center rounded-[11px] text-[17px] font-bold"
                style={{ background: '#e6f3da', color: PLATFORM.green }}
              >
                {v.icon}
              </span>
              <h3 className="mb-[7px] mt-[14px] text-[16px] font-extrabold leading-[1.2] tracking-[-0.01em]">
                {v.title}
              </h3>
              <p className="m-0 text-[13px] font-normal leading-[1.5] text-slate-500">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dashboard / oversight ──────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-8 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-[30px] rounded-[22px] border border-slate-200 bg-white px-[34px] py-[30px]">
          <div className="flex-[1_1_360px]">
            <span
              className="text-[12px] font-bold uppercase tracking-[0.08em]"
              style={{ color: PLATFORM.green }}
            >
              Oversight, not guesswork
            </span>
            <h2
              className="mb-2 mt-[9px] font-extrabold tracking-[-0.02em]"
              style={{ fontSize: 'clamp(22px, 2.6vw, 30px)', lineHeight: 1.12 }}
            >
              Every patient&apos;s recovery, on one dashboard.
            </h2>
            <p className="m-0 max-w-[540px] text-[14px] font-normal leading-[1.55] text-slate-600">
              Threshold, prescribed band, session adherence, symptom trend and re-test prompts — for
              each patient on your clinic code. The fortnightly recalculation that used to tie up an
              appointment happens automatically and arrives ready for your review.
            </p>
          </div>
          <div className="flex flex-[0_0_auto] flex-col gap-[9px]">
            {DASH.map((item) => (
              <span
                key={item}
                className="flex items-center gap-[9px] text-[13px] font-semibold leading-[1.3]"
                style={{ color: PLATFORM.navy }}
              >
                <span
                  className="inline-flex h-5 w-5 flex-[0_0_auto] items-center justify-center rounded-full text-[11px] text-white"
                  style={{ background: '#57a82e' }}
                >
                  ✓
                </span>
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founding-clinic CTA band ───────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-8 pb-2">
        <div
          className="flex flex-col items-center gap-[13px] rounded-[22px] border p-8 text-center"
          style={{
            background: 'linear-gradient(135deg, #f2f8eb, #eef6e4)',
            borderColor: '#d8ecc4',
          }}
        >
          <h2
            className="m-0 font-extrabold tracking-[-0.02em]"
            style={{ fontSize: 'clamp(22px, 2.6vw, 28px)', lineHeight: 1.1 }}
          >
            Free for your first patients.
          </h2>
          <p className="m-0 max-w-[520px] text-[14px] font-normal leading-[1.55] text-slate-600">
            Join the founding program — full access, your founding rate locked, and a say in the
            roadmap. The patient app is always free.
          </p>
          <div className="flex flex-wrap justify-center gap-[11px]">
            <Link
              href="/platform/pricing"
              className="rounded-[12px] px-[22px] py-[14px] text-[14px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: PLATFORM.navy }}
            >
              See pricing
            </Link>
            <Link
              href="/platform/evidence"
              className="rounded-[12px] px-[22px] py-[14px] text-[14px] font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#57a82e' }}
            >
              The evidence
            </Link>
          </div>
        </div>
      </section>

      <PlatformFooter />
    </div>
  )
}
