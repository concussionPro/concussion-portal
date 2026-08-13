'use client'

import { PROTOCOL_DOI, PROTOCOL_DOI_URL } from '@/lib/protocol-reference'
import Link from 'next/link'
import { SstWatchAnimation } from '@/components/platform/SstWatchAnimation'
import { BaselineLaptopAnimation } from '@/components/platform/BaselineLaptopAnimation'
import { Clock, Link2, FileText } from 'lucide-react'
import { REFERENCE_COUNT } from '@/data/reference-count'
import { SST_TIERS, SST_TIER_FROM_AUD, sstTierAllowance } from '@/lib/config'

/**
 * /sst — the Clinical Testing landing with a top toggle between TWO FULL
 * tool landing pages (owner 2026-07-06: "two distinct tabs for each tool …
 * toggle between landing pages … not just the demo animations"). Land on
 * SST Trainer. Each tab is a complete landing (hero + facts + how-it-works).
 * Pricing (both tools) + an evidence block are shared below. Tools are
 * included with CCM/CRM enrolment; from A$49/mo standalone. Preseason visual style.
 */

const ACCENT = '#0d9488'
const NAVY = '#16243f'

const TABS = [
  { id: 'sst', label: 'SST Trainer', sub: 'Concussion rehab' },
  { id: 'baseline', label: 'Baseline Testing', sub: 'Pre-season screening' },
] as const
type TabId = (typeof TABS)[number]['id']

// Plan names, monthly amounts and caseload allowances come from CONFIG's
// SST_TIERS — the same source the /clinical-testing/subscribe page and the
// enforced TIER_MONTHLY_PATIENT_CAP read. Hardcoding them here meant a pricing
// change had to be remembered in four places to keep display == charge.
const TIER_EXTRAS: Record<string, string[]> = {
  // 'each with their own login' was sold here and is NOT how access works:
  // auth is a clinic-level code + viewKey, `sst_clinic_members` has never held
  // a row, and sessions carry no clinician reference. Unlimited clinicians is
  // true; per-clinician logins do not exist. Same class of defect as the
  // 'Referral-directory listing' this block already had removed — never
  // advertise an offering that doesn't ship.
  starter: ['Both tools — SST Trainer + baseline', 'Unlimited clinicians on one clinic code', 'Measured trajectory, flare flags & auto GP report'],
  clinic: ['Everything in Starter, for a bigger caseload', 'Unlimited clinicians on one licence', 'Priority onboarding + direct line to our team'],
  pro: ['Everything in Clinic, for a dedicated concussion service', 'Unlimited clinicians on one licence', 'Priority onboarding + direct line to our team'],
  enterprise: ['Everything in Pro, with no monthly patient limit', 'Priority onboarding + direct line to our team', 'Clubs, leagues, payers & occupational rehab — talk to us'],
}

const TIERS = SST_TIERS.map((t) => ({
  name: t.name,
  who: sstTierAllowance(t),
  // Enterprise is quote-only and carries NO published number — a printed
  // ceiling would cap the scheme and occupational-rehab negotiations, which
  // are an order of magnitude above Pro.
  price: t.monthlyAud === null ? 'Talk to us' : `A$${t.monthlyAud}`,
  // Suppresses the "/ month" suffix — "Talk to us / month" rendered live on
  // /clinical-suite until the prod-build check caught it. Types and 1,498 tests
  // were green; only the rendered HTML showed it.
  quoteOnly: t.monthlyAud === null,
  popular: t.popular,
  features: [
    ...(TIER_EXTRAS[t.plan] ?? []),
    t.monthlyAud === null
      ? 'Priced per organisation'
      : `A$${t.monthlyAud}/mo standalone — or included with course enrolment`,
  ],
}))

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-[1180px] px-6 md:px-8 ${className}`}>{children}</section>
}

/** Zac's Cal.com booking link — the same event the outreach funnel uses.
 *  GTM research 2026-08-13: the evidence-backed motion at this price point is
 *  Jane's dual path — public pricing + self-serve trial AND a book-a-call
 *  option side by side. Enquiry-only (hidden pricing) is the most-evidenced
 *  buyer deterrent and would break the Cliniko/Nookal marketplace funnel,
 *  whose listings land on /clinical-suite/start. */
const CAL_WALKTHROUGH_URL = 'https://cal.com/zac-lewis-so8zjs/30min'

function Cta({ variant = 'primary', href, children }: { variant?: 'primary' | 'ghost'; href: string; children: React.ReactNode }) {
  const primary = variant === 'primary'
  return (
    <Link
      href={href}
      className="rounded-[13px] px-[22px] py-[15px] text-[15px] font-bold leading-none transition-transform active:scale-[0.98]"
      style={primary ? { background: NAVY, color: '#fff' } : { border: '1.5px solid #cbd5e1', background: '#fff', color: '#0f172a' }}
    >
      {children}
    </Link>
  )
}

function FreeBadge({ note }: { note: string }) {
  return (
    <div className="mt-1 flex flex-col gap-1.5">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-[13.5px] font-bold text-emerald-800">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white">✓</span>
        Included with your CCM / CRM course enrolment
      </span>
      <span className="text-[12.5px] font-bold text-emerald-700">Standalone from A${SST_TIER_FROM_AUD}/month — priced by new patients a month, unlimited clinicians.</span>
      <span className="text-[12px] font-medium text-slate-400">{note}</span>
    </div>
  )
}

/* ── SST Trainer — full landing ─────────────────────────────────────────── */
const SST_FACTS = [
  { stat: '12 vs 21.5 days', body: 'Median recovery for patients who completed their prescribed sub-symptom sessions versus those who didn’t.', cite: 'Leddy et al., adolescent SRC cohort (PMC9378725), p = 0.016' },
  { stat: '~4 in 10', body: 'Fell short of even two-thirds of their prescribed volume — unseen until re-test on a paper diary.', cite: 'Same cohort; physio home-exercise adherence runs as low as 50%' },
  { stat: 'First-line', body: 'Sub-symptom aerobic exercise is first-line concussion care — measured threshold, ~20 min/day, 6 of 7 days.', cite: 'Patricios et al., Amsterdam 2023 (BJSM); Leddy, JAMA Peds 2019' },
]
const SST_STEPS = [
  { n: '1', t: 'Test & prescribe', b: 'The Buffalo graded test measures the heart-rate threshold where symptoms begin, and sets the 80–90% training band.' },
  { n: '2', t: 'They train on their own watch', b: 'Patient enters your clinic code and trains at home — Garmin, Polar, WHOOP or a strap. Live HR holds the band; sessions stop at a symptom rise.' },
  { n: '3', t: 'Data & the GP report return to you', b: 'The measured-threshold trajectory, verified sessions and flare flags land in your dashboard. At episode end, the GP report writes itself.' },
]

function SstTab() {
  return (
    <>
      <Section className="flex flex-wrap items-center gap-14 pb-14 pt-2">
        <div className="flex flex-1 basis-[430px] flex-col gap-[20px]">
          <h1 className="m-0 text-[clamp(33px,4.5vw,56px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            You set the threshold.<br /><span style={{ color: ACCENT }}>Their watch holds them to it.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
            Sub-symptom aerobic exercise is first-line concussion care — but the band only helps if the
            patient trains in it between appointments. SST Trainer is the delivery layer: you prescribe
            and oversee; they train on the wearable they own; the data and the GP report come back to you.
          </p>
          <div className="mt-1 flex flex-wrap gap-3"><Cta href="/pricing">Enrol to unlock the tools</Cta><Cta variant="ghost" href="/clinical-suite/start">Start free trial →</Cta>{/* "Try it live" promised a hands-on trial to an evaluating clinician, but
    /sst-trainer is the PATIENT entry: its two CTAs are "I have a clinic code
    — start" and "Start with your clinic code", which an evaluator does not
    have. The clinician's actual try-it path is "Start free trial →" next to
    this. Label it for what it shows. */}
<Cta variant="ghost" href={CAL_WALKTHROUGH_URL}>Book a walkthrough</Cta><Cta variant="ghost" href="/sst-trainer?landing=1">See the patient app</Cta><Cta variant="ghost" href="/clinical-suite/evidence">See the evidence</Cta></div>
          <FreeBadge note="Buffalo-protocol graded test · their own wearable · files into your PMS" />
        </div>
        <div className="flex min-w-0 flex-1 basis-[420px] justify-center"><SstWatchAnimation /></div>
      </Section>

      {/* PMS logo strip (owner, 2026-08-11) — the integrations we ACTUALLY
          ship: Cliniko (live), Nookal (MSCC onboarding), Gensolve (NZ rail).
          PracSuite/corePlus exist but are deliberately unsurfaced, and Jane is
          NOT built — no logo until an adapter exists (no fabricated
          offerings). Official marks, self-hosted; Nookal's wordmark is their
          white asset with the type set in ink for light backgrounds. */}
      <Section className="pb-12">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 rounded-[18px] border border-slate-200 bg-white/70 px-6 py-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Files straight into
          </span>
          {/* Fixed-height centered wells + per-mark heights tuned for equal
              OPTICAL size (owner: "logos are all uneven") — raw equal heights
              read wrong because Nookal is heavy all-caps and Gensolve is
              icon-dominant. Verified by screenshot against a shared centreline. */}
          <a href="/integrations/cliniko" aria-label="Cliniko integration" className="flex h-8 items-center opacity-85 transition hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/pms/cliniko.svg" alt="Cliniko" className="block h-6 w-auto" />
          </a>
          <a href="/integrations/nookal" aria-label="Nookal integration" className="flex h-8 items-center opacity-85 transition hover:opacity-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/pms/nookal.png" alt="Nookal" className="block h-[15px] w-auto" />
          </a>
          <span title="Gensolve Practice Manager — New Zealand" className="flex h-8 items-center opacity-85">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/pms/gensolve.png" alt="Gensolve" className="block h-[23px] w-auto" />
          </span>
        </div>
      </Section>

      <Section className="pb-14">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {SST_FACTS.map((f) => (
            <div key={f.stat} className="rounded-[18px] border border-slate-200 bg-white p-6">
              <div className="font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(24px,2.6vw,30px)', color: ACCENT, lineHeight: 1.05 }}>{f.stat}</div>
              <p className="mt-2 text-[13.5px] leading-[1.5] text-slate-600">{f.body}</p>
              <p className="mt-3 text-[11px] italic leading-[1.4] text-slate-400">{f.cite}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-slate-400">Recovery figures describe compliance with the exercise protocol, not the app — SST Trainer makes that compliance measurable.</p>
      </Section>

      <Section className="pb-14">
        <div className="mx-auto max-w-[860px]">
          <h2 className="mb-5 text-center text-[clamp(24px,2.8vw,32px)] font-extrabold leading-[1.05] tracking-[-0.02em]">See it in 60 seconds</h2>
          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm">
            {/* Self-hosted (owner: keep viewers on the portal — no YouTube click-out) */}
            <video
              className="aspect-video w-full"
              src="/sst-demo.mp4"
              poster="/sst-demo-poster.jpg"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        </div>
      </Section>

      <Section className="pb-16">
        <h2 className="mb-[26px] text-center text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">The clinician loop</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {SST_STEPS.map((s) => (
            <div key={s.n} className="rounded-[18px] border border-slate-200 bg-white p-[26px]">
              <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-slate-900 text-[15px] font-bold leading-none text-white">{s.n}</span>
              <h3 className="mb-2 mt-4 text-[18px] font-extrabold leading-[1.15] tracking-[-0.01em]">{s.t}</h3>
              <p className="m-0 text-[14px] leading-[1.55] text-slate-500">{s.b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

/* ── Baseline Testing — full landing ────────────────────────────────────── */
const BASE_COVERS = [
  { Icon: Clock, t: '~5 minutes per athlete', b: 'Self-administered SCAT6 sections on any computer — symptoms, orientation, memory, concentration, delayed recall.' },
  { Icon: Link2, t: 'One club link', b: 'Send it to team managers; every athlete completes their own baseline. No app, no account for the athlete.' },
  { Icon: FileText, t: 'Reports to your inbox', b: 'A PDF baseline per athlete, stored against your clinic code — ready the day an injury comparison is needed.' },
]
const BASE_STEPS = [
  { n: '1', t: 'Register your clinic', b: 'Enter your clinic name and email, get your code and club link in seconds.' },
  { n: '2', t: 'Share with clubs', b: 'Send the link to your sports clubs; athletes complete the baseline on any computer, pre-season.' },
  { n: '3', t: 'Hold the baseline that matters', b: 'When one is concussed mid-season, you’re the clinic with their baseline — and the SST rehab that follows.' },
]

function BaselineTab() {
  return (
    <>
      <Section className="flex flex-wrap items-center gap-14 pb-14 pt-2">
        <div className="flex flex-1 basis-[430px] flex-col gap-[20px]">
          <h1 className="m-0 text-[clamp(33px,4.5vw,56px)] font-extrabold leading-[1.02] tracking-[-0.03em]">
            Bank every athlete’s baseline<br /><span style={{ color: ACCENT }}>before the season starts.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-[clamp(15px,1.4vw,18px)] leading-[1.55] text-slate-600">
            One club link sends every athlete a self-administered SCAT6 baseline — done in ~5 minutes on
            any computer, report to your clinic inbox. When an injury happens mid-season, you’re the clinic
            holding their baseline, and the rehab that follows.
          </p>
          <div className="mt-1 flex flex-wrap gap-3"><Cta href="/pricing">Enrol to unlock the tools</Cta><Cta variant="ghost" href="/clinical-suite/start">Start free trial →</Cta><Cta variant="ghost" href={CAL_WALKTHROUGH_URL}>Book a walkthrough</Cta><Cta variant="ghost" href="/preseason">Try the athlete flow</Cta><Cta variant="ghost" href="/clinical-suite/evidence">See the evidence</Cta></div>
          <FreeBadge note="One link per club · ~5 min per athlete · report to your clinic" />
        </div>
        <div className="flex min-w-0 flex-1 basis-[420px] justify-center">
          <BaselineLaptopAnimation />
        </div>
      </Section>

      <Section className="pb-14">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {BASE_COVERS.map((c) => (
            <div key={c.t} className="rounded-[18px] border border-slate-200 bg-white p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-[11px]" style={{ background: '#d5f5f0', color: '#0f766e' }}><c.Icon size={18} /></span>
              <h3 className="mb-1.5 mt-3 text-[16px] font-extrabold leading-[1.15]">{c.t}</h3>
              <p className="m-0 text-[13px] leading-[1.5] text-slate-500">{c.b}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="pb-16">
        <h2 className="mb-[26px] text-center text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">How pre-season baselines work</h2>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {BASE_STEPS.map((s) => (
            <div key={s.n} className="rounded-[18px] border border-slate-200 bg-white p-[26px]">
              <span className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-slate-900 text-[15px] font-bold leading-none text-white">{s.n}</span>
              <h3 className="mb-2 mt-4 text-[18px] font-extrabold leading-[1.15] tracking-[-0.01em]">{s.t}</h3>
              <p className="m-0 text-[14px] leading-[1.55] text-slate-500">{s.b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  )
}

/* ── The data comes back to you (clinician portal loopback) ─────────────── */
function ClinicianLoopback() {
  const items = [
    { t: 'Every session, live', b: 'Each home session syncs to your dashboard as it happens — heart rate, minutes in-band, symptom score.' },
    { t: 'Flares flag to you', b: 'A symptom flare surfaces in your review queue the same day, not at the next appointment.' },
    { t: 'The recovery trajectory', b: 'A serial measured-threshold curve per patient — the instrument your re-test and clearance calls read from.' },
    { t: 'The GP report writes itself', b: 'At episode end, a single-page PDF: trajectory, symptom tables, and a clearance-or-extend recommendation to sign.' },
  ]
  return (
    <Section className="pb-16">
      <div className="rounded-[22px] border p-8 sm:p-10" style={{ background: NAVY, borderColor: NAVY }}>
        <span className="text-[12px] font-bold uppercase tracking-[0.1em]" style={{ color: '#7fd4c8' }}>Your clinician portal</span>
        <h2 className="mb-2 mt-2 font-extrabold tracking-[-0.02em] text-white" style={{ fontSize: 'clamp(24px,3vw,34px)', lineHeight: 1.1 }}>
          The patient trains at home. Everything comes back to you.
        </h2>
        <p className="m-0 mb-7 max-w-[660px] text-[14.5px] leading-[1.55]" style={{ color: '#b9c6da' }}>
          Signing up gives you a login to the CEA portal. That&rsquo;s where the data lands — you don&rsquo;t
          chase the patient, you review what the app sends back between appointments. And because the tool
          lives on your patient&rsquo;s own phone at home, they keep following the program <em>you</em>{' '}
          prescribed between visits, instead of it stalling until the next appointment.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((i) => (
            <div key={i.t} className="rounded-[16px] p-5" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <h3 className="m-0 mb-1.5 text-[15px] font-extrabold text-white">{i.t}</h3>
              <p className="m-0 text-[12.5px] leading-[1.5]" style={{ color: '#a7c2c5' }}>{i.b}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-[16px] px-6 py-5" style={{ background: 'rgba(127,212,200,0.1)', border: '1px solid rgba(127,212,200,0.22)' }}>
          <h3 className="m-0 mb-1.5 text-[15px] font-extrabold" style={{ color: '#7fd4c8' }}>Built for continuation, not one-off visits</h3>
          <p className="m-0 max-w-[720px] text-[13px] leading-[1.55]" style={{ color: '#cdd9e8' }}>
            Every scheduled re-test is a checkpoint — a reason the patient books back in rather than drifting
            off after visit two. Patients who complete a structured program tend to stay engaged, and engaged
            patients are the ones who refer the next athlete, coach and teammate. The monthly licence is a
            fraction of the value of a single completed episode of care.
          </p>
        </div>
      </div>
    </Section>
  )
}

/* ── Shared: pricing + evidence ─────────────────────────────────────────── */

function SharedPricing() {
  return (
    <>
      <Section className="pb-16">
        <div className="mb-[26px] text-center">
          <h2 className="mb-2 text-[clamp(26px,3vw,36px)] font-extrabold leading-[1.05] tracking-[-0.02em]">One price, both tools.</h2>
          <p className="mx-auto m-0 max-w-[560px] text-[15px] leading-[1.5] text-slate-500">Every plan includes SST Trainer and baseline testing — included with your CCM / CRM enrolment. Patients never pay.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {TIERS.map((t) => (
            <div key={t.name} className="relative flex flex-col rounded-[20px] bg-white p-7" style={{ border: t.popular ? `2px solid ${ACCENT}` : '1px solid #e2e8f0', boxShadow: t.popular ? '0 16px 40px -18px rgba(13,148,136,.35)' : '0 1px 3px rgba(22,36,63,.06)' }}>
              {t.popular && <span className="absolute -top-3 left-6 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: ACCENT }}>Most clinics</span>}
              <p className="m-0 text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{t.name}</p>
              <p className="m-0 text-[13px] text-slate-500">{t.who}</p>
              <p className="m-0 mt-0.5 font-extrabold tracking-[-0.02em]" style={{ fontSize: '38px', color: NAVY, lineHeight: 1 }}>{t.price}{!t.quoteOnly && <span className="text-[14px] font-semibold text-slate-400"> / month</span>}</p>
              {/* Enterprise is negotiated, so it gets a contact CTA rather than
                  "Get with the course" + a self-serve trial link — neither of
                  which is the path a league, payer or occ-rehab provider takes. */}
              {t.quoteOnly ? (
                <>
                  <a href={CAL_WALKTHROUGH_URL} className="mt-5 rounded-[12px] py-[13px] text-center text-[14px] font-bold transition-opacity hover:opacity-90" style={{ background: NAVY, color: '#fff' }}>Book a call</a>
                  <a href="mailto:zac@concussion-education-australia.com?subject=SST%20Enterprise%20enquiry" className="mt-2 text-center text-[13px] font-bold underline-offset-2 hover:underline" style={{ color: ACCENT }}>or email us →</a>
                </>
              ) : (
                <>
                  <Link href="/pricing" className="mt-5 rounded-[12px] py-[13px] text-center text-[14px] font-bold transition-opacity hover:opacity-90" style={{ background: t.popular ? NAVY : '#fff', color: t.popular ? '#fff' : NAVY, border: t.popular ? 'none' : '1.5px solid #cbd5e1' }}>Get with the course</Link>
                  <Link href="/clinical-suite/start" className="mt-2 text-center text-[13px] font-bold underline-offset-2 hover:underline" style={{ color: ACCENT }}>or start a free trial →</Link>
                </>
              )}
              <ul className="mt-5 flex flex-col gap-2.5 p-0">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] leading-[1.45] text-slate-600">
                    <span className="mt-0.5 inline-flex h-[17px] w-[17px] flex-none items-center justify-center rounded-full text-[10px] text-white" style={{ background: ACCENT }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {/* GST: every CEA price is quoted and charged GST-INCLUSIVE (see
            lib/tax-invoice.ts, which breaks GST out of the total at 1/11) —
            "ex GST" implied a 10% surcharge that is never added at checkout. */}
        <p className="mt-5 text-center text-[12px] text-slate-400">Prices in AUD, inclusive of GST. Included with CCM / CRM enrolment; from A${SST_TIER_FROM_AUD}/mo standalone thereafter.</p>

        {/* Dual-path rail (GTM research 2026-08-13): most clinicians won't buy a
            clinical tool sight-unseen — but hiding pricing behind an enquiry
            form is the bigger deterrent. So the trial stays self-serve and the
            conversation is offered beside it, Jane-style, not instead of it. */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 rounded-[20px] border border-slate-200 bg-white p-7 shadow-[0_1px_3px_rgba(22,36,63,.06)]">
          <div className="min-w-[260px] flex-1">
            <h3 className="m-0 text-[19px] font-extrabold tracking-[-0.02em]" style={{ color: NAVY }}>Rather see it before you start?</h3>
            <p className="m-0 mt-1.5 max-w-[560px] text-[14px] leading-[1.55] text-slate-600">
              Book a 30-minute walkthrough with the developer — a live run of the threshold test, a home
              session and the GP report against your own caseload type, plus your questions. No obligation,
              and the free trial is still there afterwards.
            </p>
          </div>
          <a
            href={CAL_WALKTHROUGH_URL}
            className="rounded-[13px] px-[26px] py-[15px] text-[15px] font-bold leading-none text-white transition-transform active:scale-[0.98]"
            style={{ background: NAVY }}
          >
            Book a walkthrough
          </a>
        </div>
      </Section>

      <Section className="pb-20">
        <div className="rounded-[22px] border p-8 sm:p-9" style={{ background: 'linear-gradient(135deg, #effbfa, #e6f6f3)', borderColor: '#c5ebe4' }}>
          <div className="flex items-start gap-3">
            <FileText size={20} style={{ color: ACCENT }} className="mt-0.5 flex-none" />
            <div>
              <h2 className="m-0 font-extrabold tracking-[-0.02em]" style={{ fontSize: 'clamp(20px,2.4vw,26px)', lineHeight: 1.15 }}>The evidence, and the published method</h2>
              <p className="m-0 mt-2 max-w-[760px] text-[14px] leading-[1.6] text-slate-600">
                Sub-symptom-threshold aerobic exercise is first-line concussion care (Patricios et al.,
                Amsterdam 2023, BJSM; Leddy, JAMA Peds 2019), and completing the prescribed sessions roughly
                halves recovery time (Leddy et al., PMC9378725). The method the tools deliver is a citable
                open-access protocol — <em>A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic
                Exercise Rehabilitation after Concussion (mTBI)</em>, Lewis Z. (2026), Zenodo, CC-BY-4.0,{' '}
                <a href={PROTOCOL_DOI_URL} target="_blank" rel="noopener noreferrer" className="font-bold underline" style={{ color: ACCENT }}>{PROTOCOL_DOI}</a>
                {' '}— backed by the course&rsquo;s {REFERENCE_COUNT}-reference evidence base.
              </p>
              <div className="mt-4 flex flex-wrap gap-[11px]">
                <Cta href="/pricing">Enrol to unlock the tools</Cta>
                <Cta variant="ghost" href="/clinical-suite/evidence">See all the evidence →</Cta>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}

/** Two standalone pages share this shell — /clinical-suite (SST Trainer) and
 *  /clinical-suite/baseline. The toggle NAVIGATES between them (owner: each
 *  tool "must be a standalone page", not a tab that duplicates the other's
 *  below-fold). Combined pricing shows on both; the SST-specific clinician
 *  loopback only on the SST page. */
export function SstSuiteLanding({ tool = 'sst' }: { tool?: TabId }) {
  const HREF: Record<TabId, string> = { sst: '/clinical-suite', baseline: '/clinical-suite/baseline' }
  return (
    <div className="pt-[92px] md:pt-[110px]">
      {/* prominent tool toggle — links to each tool's standalone page */}
      <div className="mx-auto mb-4 flex max-w-[1180px] flex-col items-center gap-2 px-6 md:px-8">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">The Clinical Testing suite — pick a tool</p>
        <div className="inline-flex w-full max-w-[560px] rounded-[18px] border border-slate-200 bg-white p-2 shadow-[0_10px_30px_-18px_rgba(22,36,63,.4)]">
          {TABS.map((t) => {
            const active = tool === t.id
            return (
              <Link
                key={t.id}
                href={HREF[t.id]}
                className="flex-1 rounded-[13px] px-6 py-4 text-center transition-colors"
                style={{ background: active ? NAVY : 'transparent', color: active ? '#fff' : '#475569' }}
              >
                <span className="block text-[19px] font-extrabold leading-none tracking-[-0.01em]">{t.label}</span>
                <span className="mt-1.5 block text-[12.5px] font-medium opacity-70">{t.sub}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {tool === 'sst' ? (
        <>
          <SstTab />
          <ClinicianLoopback />
        </>
      ) : (
        <BaselineTab />
      )}
      <SharedPricing />
    </div>
  )
}
