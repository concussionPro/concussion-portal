'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Activity, Award, ArrowRight, CheckCircle2, Stethoscope, HeartPulse,
  ClipboardCheck, ShieldAlert, Loader2, BookOpen,
} from 'lucide-react'

/**
 * UK-facing Concussion Clinical Mastery (CCM) landing — for CSP physiotherapists.
 * Price is resolved server-side (GB → £275) and passed in, so display === charge.
 * Enrol routes to the `international-online` checkout, which grants `online-only`
 * access = the CCM 8-module course.
 *
 * SCOPE (HCPC): assessment & management within physiotherapy scope; red flags
 * referred to medical for diagnosis/clearance. Physios screen and assess — CCM,
 * not CRM, is theirs.
 */
export default function UkCourseContent({ price, embedded = false }: { price: { display: string; code: string }; embedded?: boolean }) {
  const [loading, setLoading] = useState(false)

  const enrol = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseType: 'international-online',
          utm: { source: 'csp', medium: 'course-advert', campaign: 'uk-ccm' },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data?.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const EnrolButton = ({ className = '' }: { className?: string }) => (
    <button
      onClick={enrol}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:opacity-60 ${className}`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
      Enrol now — {price.display}
      {!loading && <ArrowRight className="h-4 w-4" />}
    </button>
  )

  return (
    <div className={embedded ? 'text-slate-900' : 'min-h-screen bg-slate-50 text-slate-900'}>
      {/* Header — hidden when embedded in the tabbed international page (that shell owns the nav) */}
      {!embedded && (
        <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
            <Link href="/uk" className="text-sm font-extrabold tracking-tight text-slate-900">
              Concussion Education Australia
            </Link>
            <button onClick={enrol} disabled={loading} className="text-xs font-bold text-teal-700 hover:text-teal-800">
              Enrol — {price.display}
            </button>
          </div>
        </header>
      )}

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-5xl px-5 pt-14 pb-10 sm:pt-20">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              For physiotherapists, osteopaths &amp; chiropractors
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">
              <Award className="h-3.5 w-3.5 text-teal-600" /> Endorsed by Osteopathy Australia
            </span>
          </div>
          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Concussion Clinical Mastery <span className="text-teal-600">for physiotherapists</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            8 hours of self-paced online CPD to <strong className="text-slate-900">screen, assess, manage and
            rehabilitate</strong> concussion — within physiotherapy scope. SCAT6/VOMS/BESS, graded return-to-play,
            and phenotype-based rehabilitation, backed by the clinical tools to put it into practice.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <EnrolButton />
            <span className="text-sm text-slate-500">{price.display} · 8 CPD hours · certificate on completion</span>
          </div>
        </div>
      </section>

      {/* The differentiator: course + tools */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-teal-700">Not just a course — the clinical tools</p>
        <h2 className="mb-6 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
          The only concussion CPD that hands you the instruments to manage patients
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <HeartPulse className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold">SST Trainer</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Prescribe heart-rate-paced, sub-symptom-threshold exercise rehab and track recovery on the
              patient&rsquo;s own watch — measured progression, session by session.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
              <ClipboardCheck className="h-5 w-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold">Pre-Season Baseline Testing</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              One link per club: athletes self-complete a SCAT6 baseline and a report lands in your inbox — on
              file for the day it matters.
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          SST Trainer and Baseline testing are included with your enrolment.
        </p>
      </section>

      {/* What you'll master */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <h2 className="mb-6 text-2xl font-bold tracking-tight sm:text-3xl">What you&rsquo;ll master</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { icon: Activity, t: 'Screening & sideline recognition', d: 'SCAT6, SCOAT6 and Child SCAT6 — administered and scored with confidence.' },
            { icon: Stethoscope, t: 'Clinical assessment', d: 'VOMS and BESS, cervical and vestibular screening, clinical reasoning.' },
            { icon: BookOpen, t: 'Graded return to play & sport', d: 'Staged, criteria-based progression back to activity and competition.' },
            { icon: HeartPulse, t: 'Phenotype-based rehabilitation', d: 'Targeted reconditioning by clinical phenotype — vestibular, cervical, autonomic.' },
          ].map((f) => (
            <div key={f.t} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
              <f.icon className="mt-0.5 h-5 w-5 flex-none text-teal-600" />
              <div>
                <div className="text-sm font-bold">{f.t}</div>
                <div className="text-sm text-slate-600">{f.d}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-amber-600" />
          <p className="text-xs leading-relaxed text-amber-900">
            <strong>Within scope.</strong> The course covers concussion assessment and management within physiotherapy
            scope of practice. Diagnosis and return-to-play clearance where red flags are present remain with the
            treating medical practitioner — the course teaches when and how to refer.
          </p>
        </div>
      </section>

      {/* Who it's for + proof */}
      <section className="mx-auto max-w-5xl px-5 py-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-bold">Who it&rsquo;s for</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {['Sports and pitchside physiotherapists', 'MSK and first-contact physiotherapists', 'Any physio managing concussion or return-to-play'].map((x) => (
                <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-teal-600" />{x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 text-lg font-bold">What&rsquo;s included</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              {['8 hours of structured, self-paced CPD', 'Evidence-based, peer-reviewed content', 'SST Trainer + Baseline testing tools', 'Certificate on completion'].map((x) => (
                <li key={x} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-teal-600" />{x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="rounded-3xl bg-slate-900 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Master concussion — and get the tools to manage it
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300">
            8 CPD hours, Osteopathy Australia&ndash;endorsed, self-paced. {price.display}, one-time.
          </p>
          <div className="mt-6 flex justify-center">
            <EnrolButton />
          </div>
        </div>
      </section>

      {!embedded && (
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © Concussion Education Australia · concussion-education-australia.com
        </footer>
      )}
    </div>
  )
}
