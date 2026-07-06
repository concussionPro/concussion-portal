'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SstWatchAnimation } from '@/components/platform/SstWatchAnimation'
import { BaselineLaptopVisual } from '@/components/clinical/InstrumentVisuals'

/**
 * /sst — the single PUBLIC Clinical Testing landing (owner 2026-07-06:
 * "design a single landing page and tab between … land on sst with the
 * baseline as second tab … pricing includes both … think about conversion").
 *
 * Conversion thesis: SST Trainer (in-season rehab) and Baseline testing
 * (pre-season acquisition) are the two halves of a clinic's concussion year,
 * sold as ONE Clinical Testing licence. Baseline banks the clubs' athletes →
 * an injured athlete routes back to the clinic holding their baseline → SST
 * runs the rehab. Land on SST (the wedge), tab to Baseline, then one price
 * for both. Baseline (preseason) visual style.
 */

const ACCENT = '#0d9488'
const NAVY = '#16243f'

const TABS = [
  { id: 'sst', label: 'SST Trainer', sub: 'In-season rehab' },
  { id: 'baseline', label: 'Baseline Testing', sub: 'Pre-season' },
] as const
type TabId = (typeof TABS)[number]['id']

const FACTS = [
  { stat: '12 vs 21.5 days', body: 'Median recovery for patients who completed their prescribed sub-symptom sessions versus those who didn’t.', cite: 'Leddy et al., adolescent SRC cohort (PMC9378725), p = 0.016' },
  { stat: '~4 in 10', body: 'Patients fell short of even two-thirds of their prescribed volume — unseen until re-test on a paper diary.', cite: 'Same cohort; physio home-exercise adherence runs as low as 50%' },
  { stat: 'First-line', body: 'Sub-symptom aerobic exercise is first-line concussion care — measured threshold, ~20 min/day, 6 of 7 days.', cite: 'Patricios et al., Amsterdam 2023 (BJSM); Leddy, JAMA Peds 2019' },
]

const TIERS = [
  {
    name: 'Single', who: 'One clinician', price: 'A$49', popular: false,
    features: ['Both tools — SST Trainer + baseline testing', 'First 3 patients free — no card, no time limit', 'Measured-HRt trajectory, flare flags & the auto GP report', 'Free through the founding period, then lock A$49 for life'],
  },
  {
    name: 'Small clinic', who: 'Up to 5 clinicians', price: 'A$99', popular: true,
    features: ['Everything in Single, for your whole team', 'Up to 5 clinicians on one licence', 'Priority onboarding + a direct line to our clinical team', 'Free through the founding period, then lock A$99 for life'],
  },
  {
    name: 'Enterprise', who: 'Up to 15 clinicians', price: 'A$149', popular: false,
    features: ['Everything in Small clinic, up to 15 clinicians', 'Founding-clinic referral-directory listing', 'Clubs, leagues & payers — talk to us', 'Free through the founding period, then lock A$149 for life'],
  },
]

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2 self-start rounded-full px-[13px] py-[7px] text-[12px] font-bold leading-none" style={{ background: '#d5f5f0', color: ACCENT }}>
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: ACCENT }} />
      Clinical Testing suite · for concussion clinics
    </span>
  )
}

export function SstSuiteLanding() {
  const [tab, setTab] = useState<TabId>('sst')

  return (
    <>
      {/* ── Hero with tool tabs ────────────────────────────────────────── */}
      <header className="mx-auto max-w-[1180px] px-6 pb-10 pt-[100px] md:px-8 md:pt-[120px]">
        <div className="flex flex-wrap items-center gap-14">
          <div className="flex flex-1 basis-[430px] flex-col gap-[20px]">
            <Pill>x</Pill>
            <h1 className="m-0 text-[clamp(33px,4.5vw,56px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
              {tab === 'sst' ? (
                <>You set the threshold.<br /><span style={{ color: ACCENT }}>Their watch holds them to it.</span></>
              ) : (
                <>Bank every athlete&rsquo;s baseline<br /><span style={{ color: ACCENT }}>before the season starts.</span></>
              )}
            </h1>
            <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
              {tab === 'sst' ? (
                <>Sub-symptom aerobic exercise is first-line concussion care — but the band only helps if the patient trains in it between appointments. SST Trainer is the delivery layer: you prescribe and oversee; they train on the wearable they own; the data and the GP report come back to you.</>
              ) : (
                <>One club link sends every athlete a self-administered SCAT6 baseline — done in ~5 minutes on any computer, report to your clinic inbox. When an injury happens mid-season, you&rsquo;re the clinic holding their baseline — and the rehab that follows.</>
              )}
            </p>

            {/* tab toggle */}
            <div className="mt-1 inline-flex rounded-[14px] border border-slate-200 bg-white p-1 shadow-sm">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="rounded-[10px] px-[18px] py-[9px] text-left transition-colors"
                  style={{ background: tab === t.id ? NAVY : 'transparent', color: tab === t.id ? '#fff' : '#475569' }}
                >
                  <span className="block text-[14px] font-bold leading-none">{t.label}</span>
                  <span className="mt-0.5 block text-[10.5px] font-medium opacity-70">{t.sub}</span>
                </button>
              ))}
            </div>

            <div className="mt-1 flex flex-wrap gap-3">
              <Link href="/sst/founding" className="rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]" style={{ background: NAVY }}>
                Become a founding clinic
              </Link>
              <Link href="/sst/pricing" className="rounded-[13px] border-[1.5px] border-slate-300 bg-white px-[22px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-transform active:scale-[0.98]">
                See pricing
              </Link>
            </div>
            <p className="mt-0.5 text-[13px] font-semibold text-slate-500">
              One licence covers both tools · your first 3 patients free · patients only reach the app through your clinic code
            </p>
          </div>

          {/* device — swaps with tab */}
          <div className="flex min-w-0 flex-1 basis-[420px] justify-center">
            {tab === 'sst' ? (
              <SstWatchAnimation />
            ) : (
              <div className="w-full max-w-[440px]">
                <BaselineLaptopVisual />
                <p className="mt-3 text-center text-[12px] font-semibold text-slate-500">
                  One club link · ~5 min per athlete · PDF report to your clinic
                </p>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Research facts (SST) ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FACTS.map((f) => (
            <div key={f.stat} className="rounded-[18px] border border-slate-200 bg-white p-6">
              <div className="font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(24px,2.6vw,30px)', color: ACCENT, lineHeight: 1.05 }}>{f.stat}</div>
              <p className="mt-2 text-[13.5px] leading-[1.5] text-slate-600">{f.body}</p>
              <p className="mt-3 text-[11px] italic leading-[1.4] text-slate-400">{f.cite}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-slate-400">Recovery figures describe compliance with the exercise protocol, not the app — SST Trainer is what makes that compliance measurable.</p>
      </section>

      {/* ── One clinic, both tools, across the season ──────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:px-8">
        <div className="rounded-[22px] border border-slate-200 bg-white px-8 py-9 sm:px-10">
          <h2 className="m-0 mb-2 text-center font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.1 }}>
            One clinic. Both tools. The whole season.
          </h2>
          <p className="mx-auto mb-7 max-w-[620px] text-center text-[14.5px] leading-[1.55] text-slate-600">
            Baseline testing brings the clubs&rsquo; athletes to you before the season. When one gets
            concussed, you already hold their baseline — and SST Trainer runs the measured rehab that
            follows. Two halves of your concussion year, on one licence.
          </p>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { t: 'Pre-season', tool: 'Baseline', body: 'Send clubs your link; athletes bank a SCAT6 baseline in 5 minutes. Their records sit with your clinic.' },
              { t: 'The injury', tool: 'Both', body: 'A concussed athlete comes back to the clinic holding their baseline — the comparison only you can make.' },
              { t: 'In-season', tool: 'SST Trainer', body: 'Measured graded test, prescribed band, home training on their watch, and the GP report at episode end.' },
            ].map((s) => (
              <div key={s.t} className="rounded-[16px] border border-slate-200 bg-slate-50 p-5">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: ACCENT }}>{s.tool}</span>
                <h3 className="m-0 mb-1.5 mt-1 text-[16px] font-extrabold">{s.t}</h3>
                <p className="m-0 text-[13px] leading-[1.5] text-slate-500">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing (both tools, 3 tiers) ──────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-16 md:px-8">
        <div className="mb-[26px] text-center">
          <h2 className="mb-2 text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">One price, both tools.</h2>
          <p className="mx-auto m-0 max-w-[560px] text-[15px] leading-[1.5] text-slate-500">
            Every plan includes SST Trainer and baseline testing. Free through the founding period —
            then founding clinics lock their rate for life. Patients never pay.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className="relative flex flex-col rounded-[20px] bg-white p-7" style={{ border: t.popular ? `2px solid ${ACCENT}` : '1px solid #e2e8f0', boxShadow: t.popular ? '0 16px 40px -18px rgba(13,148,136,.35)' : '0 1px 3px rgba(22,36,63,.06)' }}>
              {t.popular && <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: ACCENT }}>Most clinics</span>}
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t.name}</p>
              <p className="m-0 text-[13px] text-slate-500">{t.who}</p>
              <p className="m-0 mt-3 font-extrabold tracking-[-0.02em]" style={{ fontSize: '38px', color: NAVY, lineHeight: 1 }}>
                {t.price}<span className="text-[14px] font-semibold text-slate-400"> / month</span>
              </p>
              <Link href="/sst/founding" className="mt-5 rounded-[12px] py-[13px] text-center text-[14px] font-bold transition-opacity hover:opacity-90" style={{ background: t.popular ? NAVY : '#fff', color: t.popular ? '#fff' : NAVY, border: t.popular ? 'none' : '1.5px solid #cbd5e1' }}>
                Start free
              </Link>
              <ul className="mt-5 flex flex-col gap-2.5 p-0">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] leading-[1.45] text-slate-600">
                    <span className="mt-0.5 inline-flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full text-[10px] text-white" style={{ background: ACCENT }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-[12px] text-slate-400">Prices in AUD ex GST. Free during the founding period; founding rates lock for life and rise for clinics who join later.</p>
      </section>

      {/* ── Founding CTA ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1180px] px-6 pb-20 md:px-8">
        <div className="flex flex-col items-center gap-[13px] rounded-[22px] border p-9 text-center" style={{ background: 'linear-gradient(135deg, #effbfa, #e6f6f3)', borderColor: '#c5ebe4' }}>
          <h2 className="m-0 font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.1 }}>Be one of our first 20 founding clinics.</h2>
          <p className="m-0 max-w-[560px] text-[14.5px] leading-[1.55] text-slate-600">
            First-line concussion care, delivered — measured rehab and pre-season baselines on one
            licence. Free through the founding period, your first three patients free, and your rate
            locked for life.
          </p>
          <div className="mt-1 flex flex-wrap justify-center gap-[11px]">
            <Link href="/sst/founding" className="rounded-[12px] px-[24px] py-[15px] text-[15px] font-bold leading-none text-white transition-opacity hover:opacity-90" style={{ background: NAVY }}>Become a founding clinic</Link>
            <Link href="/sst/evidence" className="rounded-[12px] border-[1.5px] border-slate-300 bg-white px-[24px] py-[15px] text-[15px] font-bold leading-none text-slate-900 transition-colors hover:border-slate-400">See the evidence</Link>
          </div>
        </div>
      </section>
    </>
  )
}
