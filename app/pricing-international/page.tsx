import Link from 'next/link'
import { SiteNav } from '@/components/SiteNav'
import EpLeadCapture from '@/components/crm/EpLeadCapture'
import { CONFIG } from '@/lib/config'
import { Activity, HeartPulse, ShieldCheck, GraduationCap, Wrench, Quote, Check } from 'lucide-react'

/**
 * /pricing-international — CRM (Concussion Rehab Mastery), INTERNATIONAL ONLY.
 *
 * Owner 2026-07-20: this page pushes CRM only (the old build sold CCM at USD $197
 * with stale copy + text walls — retired). Audience = US/international exercise
 * physiologists & clinical exercise physiologists; the ACSM Approved-Provider
 * application is the distribution play (see docs/acsm-provider-application.md).
 *
 * POSITIONING (play 2): scope, not topic — the consensus made exercise testing
 * the gate to first-line concussion treatment; EPs already own that skill, this
 * makes it billable in a new population.
 *
 * HONESTY GUARDRAIL: ACSM CECs are PENDING (application in progress) and ESSA is
 * pending — NEVER claim credits/accreditation not yet held, and never imply ACSM
 * endorses CRM (citing ACSM's public position is fair use; endorsement is not).
 * Same discipline as CONFIG.FEATURES.ESSA_ACCREDITED. No live checkout yet
 * (global market review in progress) — founding-cohort interest capture only.
 */

const PRICE_USD = CONFIG.COURSE.PRICE_INTERNATIONAL
const RENEWAL_USD = CONFIG.COURSE.RENEWAL_INTERNATIONAL

const PILLARS = [
  {
    icon: Activity,
    title: 'A scope-of-practice unlock, not new territory',
    body: 'The consensus prescribes sub-symptom-threshold aerobic exercise from a measured heart-rate threshold — a graded exercise test. That test is already your core competency. CRM adds the concussion-specific application, expanding what you can bill and deliver into a new patient population.',
  },
  {
    icon: Wrench,
    title: 'Tools, not just content',
    body: 'Enrolment ships the working instruments: the live Baseline & Serial Testing tool and SST Trainer (graded test → HR-threshold prescription → monitored home sessions), included for 12 months. Finish Friday, run your first HR-threshold assessment Monday.',
  },
  {
    icon: GraduationCap,
    title: 'A credential stack you can stand behind',
    // The mTBI manuscript is UNDER PEER REVIEW, not published — never state it as
    // a published paper (it was previously listed as "Neurotrauma Reports, 2024").
    // Course content has been independently reviewed by two reviewers appointed by
    // ESSA as part of its PD endorsement process — that is the accurate, citable
    // form of independent exercise-physiology review. Do NOT upgrade this to
    // "EP co-authored" or "EP validated"; no EP authored the course.
    body: 'AHPRA-registered author, an mTBI manuscript under peer review, and a professional-sport clinical background. Course content independently reviewed by two reviewers appointed by ESSA through its professional development endorsement process. ACSM CEC application in progress and ESSA endorsement pending — added to your certificate the day each is confirmed.',
  },
  {
    icon: ShieldCheck,
    title: 'Built lean',
    body: 'No sales team, no franchise fees, no venue costs — so the price reflects the education and the tools, not the overhead. You get the training and the infrastructure to deliver it, at a fraction of what a franchise model charges.',
  },
]

export default function PricingInternationalPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <SiteNav />

      <main className="mx-auto max-w-5xl px-5 md:px-8 pt-28 md:pt-32 pb-24">
        {/* Hero — scope-first */}
        <section className="mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700 mb-4">
            International · for exercise physiologists &amp; clinical exercise physiologists
          </p>
          <h1 className="text-[clamp(30px,5vw,52px)] font-extrabold leading-[1.04] tracking-tight mb-5 max-w-3xl">
            You already run the exercise test.<br />
            <span className="text-teal-700">The concussion consensus just made it the gate to treatment.</span>
          </h1>
          <p className="text-[17px] leading-relaxed text-slate-600 max-w-2xl mb-7">
            The 2022 international consensus made sub-symptom-threshold aerobic exercise — prescribed from a
            graded exercise test — the first-line treatment for concussion. Delivering that is exercise
            physiology. <strong className="text-slate-900">Concussion Rehab Mastery</strong> turns your existing
            testing skill into a concussion treatment competency, and ships the tools to do it from day one.
          </p>
          <a
            href="#founding"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 text-white font-bold px-6 py-3.5 text-sm shadow-md hover:bg-slate-800 transition"
          >
            Join the founding cohort →
          </a>
        </section>

        {/* ACSM's own call — fair-use of a public position, NOT an endorsement claim */}
        <section className="mb-14 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:p-8">
          <Quote className="w-6 h-6 text-teal-600 mb-3" strokeWidth={2} />
          <p className="text-[17px] md:text-[18px] leading-relaxed text-slate-800 font-medium max-w-3xl">
            The ACSM&rsquo;s own editorial voice has named building FITT-based exercise prescriptions for
            concussion recovery as essential future work, and told clinicians it is critical to stay current as
            the guidelines evolve — while no ACSM-CEC concussion course exists to teach it.
          </p>
          <p className="text-[14px] leading-relaxed text-slate-500 mt-3 max-w-3xl">
            CRM is that training: FITT operationalised for concussion — frequency, intensity set by the measured
            HR threshold, time, and type, progressed against symptom response.
          </p>
          <p className="text-[11px] text-slate-400 mt-4">
            Reference: ACSM Hot Topic, <em>Exercise &amp; Rest in Concussion Recovery</em> (Apr 2025). Cited as a
            published position; CRM is not endorsed by or affiliated with ACSM.
          </p>
        </section>

        {/* The offer — the PLATFORM is the product; the accredited course is the
            unlock (renewal psychology: not "software rent", but "keep your tools
            + meet this year's CPD"). Bundle-only, always — see safety note. */}
        <section className="mb-14">
          <div className="rounded-2xl border-2 border-teal-600/30 bg-white p-6 md:p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-bold mb-1">Concussion Rehab Mastery — International</h2>
                <p className="text-[14px] text-slate-500">The clinical platform — unlocked by the accredited training to run it safely.</p>
              </div>
              <div className="text-right">
                <div className="flex items-baseline gap-1 justify-end">
                  <span className="text-4xl font-extrabold tracking-tight">${PRICE_USD}</span>
                  <span className="text-[13px] text-slate-500 font-semibold">USD</span>
                </div>
                <p className="text-[11px] text-slate-400">accredited course + first year on the platform</p>
              </div>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-5">
              {[
                'The live Baseline & Serial Testing platform',
                'SST Trainer — graded test → HR-threshold prescription → monitored home sessions',
                'Between-visit home-session monitoring dashboard',
                'The accredited training that unlocks it — 8 EP-scoped modules',
                'Full clinical toolkit (SSTAE templates, phenotype library)',
                'Certificate on assessment · lifetime course access',
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-700">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            {/* Renewal reframed as a CPD-compliance mechanism, not a software charge. */}
            <div className="rounded-xl bg-teal-50/60 border border-teal-200 px-4 py-3 mb-4">
              <p className="text-[13px] text-slate-700 leading-relaxed">
                <strong className="text-teal-800">Renewal ${RENEWAL_USD}/yr</strong> isn&rsquo;t a software charge — it includes your
                <strong> accredited annual concussion-update module</strong>, so it meets that year&rsquo;s recurring
                CPD requirement and keeps the platform live. The value accrues whether you saw two concussion
                patients this year or twenty.
              </p>
            </div>
            {/* Safety / bundle-only — never sell the tool without the training. */}
            <p className="text-[12px] text-slate-500 leading-relaxed">
              <strong className="text-slate-700">Always sold as one.</strong> The platform is never available
              without the training — running HR-threshold prescriptions on brain-injured patients without
              concussion education isn&rsquo;t safe, and the accreditation is for the education, not the software.
            </p>

            <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-semibold border-t border-slate-100 pt-4">
              <Link href="/sst-trainer?clinic=DEMO00" className="text-teal-700 hover:underline">
                See the SST Trainer walkthrough →
              </Link>
              <Link href="/preseason/b/DEMO00" className="text-teal-700 hover:underline">
                Try the baseline flow →
              </Link>
            </p>
          </div>
        </section>

        {/* Pillars */}
        <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-4">
          {PILLARS.map((p) => {
            const Icon = p.icon
            return (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-teal-700" strokeWidth={2} />
                </div>
                <h3 className="text-[16px] font-bold mb-1.5 leading-snug">{p.title}</h3>
                <p className="text-[13.5px] text-slate-600 leading-relaxed">{p.body}</p>
              </div>
            )
          })}
        </section>

        {/* Accreditation honesty — mirrors the ESSA-pending discipline */}
        <section className="mb-14 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 max-w-3xl">
          <HeartPulse className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Continuing-education status:</strong> the course is built to ACSM CEC standards and its
            Approved-Provider application is in progress; ESSA endorsement is pending. We don&rsquo;t claim
            credits or accreditation we don&rsquo;t yet hold — this page updates the day each is confirmed.
          </p>
        </section>

        {/* Founding cohort — interest capture (no live checkout during market review) */}
        <section id="founding" className="scroll-mt-24">
          <div className="text-center mb-6">
            <h2 className="text-[clamp(24px,3.5vw,34px)] font-extrabold tracking-tight mb-2">
              Be a founding-cohort clinic
            </h2>
            <p className="text-[15px] text-slate-600 max-w-xl mx-auto">
              Register your interest and we&rsquo;ll notify you the moment enrolment opens — founding pricing,
              locked, ahead of the ACSM listing going live.
            </p>
          </div>
          <EpLeadCapture variant="full" location="international" />
        </section>
      </main>
    </div>
  )
}
