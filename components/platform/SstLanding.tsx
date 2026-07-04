'use client'

import Link from 'next/link'
import { Hanken_Grotesk, Space_Grotesk } from 'next/font/google'
import { SstTrainerDemo } from '@/components/platform/SstTrainerDemo'

// Same landing treatment as /preseason (fonts, mesh background, hero + Loom
// demo, how-it-works, stats band, cross-sell), retargeted to the SST Trainer.
// Claim discipline: methods/provenance only — the protocol literature carries
// the clinical claims, never the app.
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

const ACCENT = '#0d7377'

const STEPS = [
  {
    n: '1',
    title: 'Find your threshold',
    body: 'A guided graded test measures the heart rate where your symptoms actually begin — the Buffalo protocol, on your own equipment.',
  },
  {
    n: '2',
    title: 'Train in your band',
    body: 'Exercise at 80–90% of your measured threshold, ~20 minutes most days. Live heart rate from your watch keeps you in the band.',
  },
  {
    n: '3',
    title: 'Progress as you recover',
    body: 'Clean, verified sessions step your band up. At your ceiling you re-test — and your clinician sees the whole trajectory.',
  },
]

const COVERS = [
  { icon: '❤', title: 'Measured, not estimated', body: 'Your training band is anchored to your own symptom threshold — not a formula guessed from your age.' },
  { icon: '⌚', title: 'Your watch works here', body: 'Garmin, Polar, WHOOP, Coros, Suunto and chest straps stream live heart rate in broadcast mode.' },
  { icon: '2', title: 'Symptom stop rules', body: 'A 2-point symptom rise ends a session safely. Warning signs pause everything until you’re reviewed.' },
  { icon: '✓', title: 'Verified progression', body: 'Only live-verified sessions advance your band — typed numbers count for safety, never for progression.' },
  { icon: '⟳', title: 'Re-test as you recover', body: 'Your ceiling never ratchets past your measurement. A fresh graded test moves it — that’s progress.' },
  { icon: '⤴', title: 'Clinician oversight', body: 'Link a clinic code and every test and session syncs to your clinician’s dashboard, live.' },
]

export default function SstLanding({ onStart }: { onStart: () => void }) {
  return (
    <div
      className={`${hanken.className} ${spaceGrotesk.variable} min-h-screen w-full text-slate-900`}
      style={{
        background: 'radial-gradient(120% 75% at 82% -8%, #effbfa 0%, #f8fafc 46%, #f1f5f9 100%)',
      }}
    >
      {/* ===== HERO ===== */}
      <header className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-14 px-6 pb-16 pt-14 md:px-8">
        <div className="flex flex-1 basis-[420px] flex-col gap-[22px]">
          <span
            className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none tracking-[0.02em]"
            style={{ background: '#ccfbf1', color: '#0f766e' }}
          >
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
            Concussion exercise rehab — prescribed and overseen by your clinician
          </span>

          <h1 className="m-0 text-[clamp(36px,4.7vw,60px)] font-extrabold leading-[1.01] tracking-[-0.03em]">
            Exercise your way back, <span style={{ color: ACCENT }}>without the guesswork.</span>
          </h1>

          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
            A guided test finds the heart rate your symptoms allow. Then you train just under it —
            live from the watch you already own — and progress only when your body shows it&rsquo;s ready.
          </p>

          <div className="mt-0.5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onStart}
              className="flex cursor-pointer items-center gap-2 rounded-[13px] border-none px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.7)' }}
            >
              I have a clinic code — start
            </button>
            <Link
              href="/platform"
              className="flex items-center gap-2 rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
            >
              I&rsquo;m a clinician →
            </Link>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-[18px]">
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">
              Buffalo-protocol graded test
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">
              Live HR from your own watch
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[13px] font-semibold leading-[1.4] text-slate-500">
              No account — just your clinic code
            </span>
          </div>
        </div>

        {/* Loom-style demo */}
        <div className="flex min-w-0 flex-1 basis-[540px] justify-center">
          <SstTrainerDemo />
        </div>
      </header>

      {/* ===== HOW IT WORKS ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 pt-2 md:px-8">
        <h2 className="mb-[26px] text-center text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
          How it works
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-[18px] border border-slate-200 bg-white p-[26px]">
              <span
                className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-slate-900 text-[15px] font-bold leading-none text-white"
                style={{ fontFamily: 'var(--font-space), sans-serif' }}
              >
                {s.n}
              </span>
              <h3 className="mb-2 mt-4 text-[18px] font-extrabold leading-[1.15] tracking-[-0.01em]">
                {s.title}
              </h3>
              <p className="m-0 text-[14px] leading-[1.55] text-slate-500">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WHAT IT DOES ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[60px] md:px-8">
        <div className="mb-[26px] text-center">
          <h2 className="mb-2 text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">
            Built around your measured threshold
          </h2>
          <p className="mx-auto m-0 max-w-[560px] text-[15px] leading-[1.5] text-slate-500">
            Sub-symptom-threshold aerobic exercise, as described in the concussion literature —
            operationalised with honest verification at every step.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COVERS.map((c) => (
            <div key={c.title} className="rounded-[16px] border border-slate-200 bg-white p-5">
              <span
                className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] text-[15px] font-bold leading-none text-teal-700"
                style={{ background: '#ccfbf1', fontFamily: 'var(--font-space), sans-serif' }}
              >
                {c.icon}
              </span>
              <h3 className="mb-1.5 mt-[13px] text-[16px] font-bold leading-[1.15]">{c.title}</h3>
              <p className="m-0 text-[13px] leading-[1.5] text-slate-500">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-[18px] text-center text-[12.5px] leading-[1.5] text-slate-400">
          Not a diagnostic tool. If you have warning signs — worsening headache, repeated vomiting,
          confusion — seek medical review before exercising.
        </p>
      </section>

      {/* ===== STATS BAND ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-7 rounded-[22px] bg-slate-900 px-9 py-[34px]">
          <div className="flex flex-wrap gap-11">
            <div>
              <div className="text-[34px] font-semibold leading-none text-white" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                80<span className="text-[16px] text-teal-300">–90%</span>
              </div>
              <div className="mt-[5px] text-[12px] font-medium leading-[1.3] text-slate-400">
                Of your measured threshold
              </div>
            </div>
            <div>
              <div className="text-[34px] font-semibold leading-none text-white" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                20<span className="text-[16px] text-teal-300"> min</span>
              </div>
              <div className="mt-[5px] text-[12px] font-medium leading-[1.3] text-slate-400">
                A session, most days
              </div>
            </div>
            <div>
              <div className="text-[34px] font-semibold leading-none text-white" style={{ fontFamily: 'var(--font-space), sans-serif' }}>
                Live
              </div>
              <div className="mt-[5px] text-[12px] font-medium leading-[1.3] text-slate-400">
                From the watch you own
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="cursor-pointer rounded-[13px] border-none px-6 py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: ACCENT, boxShadow: '0 12px 26px -10px rgba(13,148,136,.6)' }}
          >
            Start with your clinic code
          </button>
        </div>
      </section>

      {/* ===== CLINICIAN CROSS-SELL ===== */}
      <section className="mx-auto max-w-[1180px] px-6 pb-[72px] md:px-8">
        <div
          className="flex flex-wrap items-center justify-between gap-[30px] rounded-[22px] border p-[38px]"
          style={{ background: 'linear-gradient(135deg,#f0fdfa,#ecfeff)', borderColor: '#cffafe' }}
        >
          <div className="flex-1 basis-[420px]">
            <span className="text-[12px] font-bold uppercase leading-none tracking-[0.1em]" style={{ color: ACCENT }}>
              For clinics
            </span>
            <h2 className="mb-2 mt-2.5 text-[clamp(24px,2.6vw,32px)] font-extrabold leading-[1.1] tracking-[-0.02em]">
              Put every patient&rsquo;s trajectory on your dashboard.
            </h2>
            <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-slate-600">
              Register your clinic in a minute and get your code: patients onboard with it, and every
              graded test and training session lands in your Clinical Hub — measured thresholds,
              verified sessions, flags for review.
            </p>
            <div className="mt-[18px] flex flex-wrap gap-3">
              <Link
                href="/platform/founding"
                className="rounded-[12px] bg-slate-900 px-5 py-[14px] text-[14px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
              >
                Get your clinic code
              </Link>
              <Link
                href="/platform"
                className="rounded-[12px] border-[1.5px] border-slate-300 bg-white px-5 py-[14px] text-[14px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]"
              >
                See the platform
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
