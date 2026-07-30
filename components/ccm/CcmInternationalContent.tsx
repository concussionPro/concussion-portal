'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, Check, ShieldCheck, HeartPulse, Activity, ClipboardList,
  LineChart, Award, ChevronDown, ChevronUp, Building2, Stethoscope, ExternalLink, FileText,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { trackEvent } from '@/lib/analytics'
import { SstWatchVisual, BaselineLaptopVisual, InstrumentKeyframes } from '@/components/clinical/InstrumentVisuals'

/**
 * CCM (Concussion Clinical Mastery) — INTERNATIONAL landing.
 *
 * A section-for-section adaptation of CrmInternationalContent (the international
 * landing design) — SAME hero/stat-bento/standards/pricing-card/instruments/
 * tools/instructor/FAQ/sticky structure — with the facts swapped for CCM:
 *   - audience = physiotherapists, osteopaths & chiropractors (they SCREEN and
 *     assess — SCAT6/VOMS/BESS — then manage & rehab; CRM is the EP course)
 *   - Osteopathy Australia endorsement is HELD (not pending)
 *   - geo-derived local price from the server page (GB → £275); display always
 *     matches the `international-online` checkout charge, which grants online-only
 *     = the CCM 8-module course
 *   - 8 CPD hours only (no in-person day sold overseas — never "14")
 *   - SST + Baseline tools BOTH included (CCM covers screening/baseline AND rehab)
 *
 * SCOPE (HCPC/AHPRA): assessment & management within scope; diagnosis and
 * return-to-play clearance for red flags stay with the treating medical
 * practitioner — the course teaches when and how to refer. Never "diagnose".
 */
export interface IntlPriceView {
  display: string // e.g. "£275"
  code: string // e.g. "GBP"
}

const INTL_FAQS: { q: string; a: string }[] = [
  {
    q: 'Who is this course for?',
    a: 'Physiotherapists, osteopaths and chiropractors — the clinicians who screen, assess and manage concussion (sports, MSK and first-contact practitioners especially). It covers the full pathway you work in: recognition, SCAT6/VOMS/BESS assessment, graded return-to-play and phenotype-based rehabilitation. Exercise physiologists who deliver rehab-only should take Concussion Rehab Mastery instead.',
  },
  {
    q: 'Does it cover diagnosis — is that in my scope?',
    a: 'The course teaches concussion assessment and management within physiotherapy/allied-health scope: screening, sideline recognition, clinical assessment, graded return-to-play and rehabilitation. Formal diagnosis and return-to-play clearance where red flags are present remain with the treating medical practitioner — the course teaches exactly when and how to refer.',
  },
  {
    q: 'What accreditation does it carry?',
    a: 'Concussion Clinical Mastery is endorsed by Osteopathy Australia. Your certificate states 8 hours of assessed CPD. UK and other overseas CPD is self-directed/self-recorded — the 8 assessed hours count toward your annual requirement.',
  },
  {
    q: 'Is there an ongoing cost?',
    a: 'The course is a one-time purchase — lifetime access. The clinical platform (SST Trainer + SCAT6 baseline testing) is included free for your first year. After that, keeping the platform is A$49/month (the standard single-clinician rate); it starts automatically at the 12-month mark and you can cancel anytime.',
  },
  {
    q: 'What’s the refund policy?',
    a: 'A 7-day full refund applies if you’ve accessed less than 25% of the modules. Refunds process in 5–10 business days to the original payment method. Full terms are published at /terms.',
  },
]

/**
 * Low-commitment capture — the missing middle step (2026-07-30 UK-lane audit:
 * engaged readers spent 2–13 minutes on the page, then left with nothing
 * captured, because the only action was the full-price Enrol). Posts to
 * /api/intl-syllabus which emails the real 8-module syllabus + demo links.
 */
function SyllabusCapture({ uk, price }: { uk: boolean; price: IntlPriceView }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (state === 'sending' || state === 'done') return
    setState('sending')
    trackEvent('intl_syllabus_submit', { location: uk ? 'uk' : 'international' })
    try {
      const res = await fetch('/api/intl-syllabus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, location: uk ? 'uk' : 'international', priceDisplay: price.display }),
      })
      setState(res.ok ? 'done' : 'error')
    } catch {
      setState('error')
    }
  }

  return (
    <div className="max-w-3xl mx-auto mb-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
      {state === 'done' ? (
        <div className="flex items-center gap-2.5">
          <Check className="w-5 h-5 text-teal-600 flex-shrink-0" strokeWidth={2.5} />
          <p className="text-sm font-semibold text-foreground">Sent — the full syllabus is on its way to your inbox.</p>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold text-foreground">Not ready to enrol today?</p>
          <p className="text-xs text-muted-foreground mt-1">
            Get the full syllabus by email — all 8 modules, the included clinical tools and the published protocol.
          </p>
          <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={uk ? 'you@nhs.net' : 'your@email.com'}
              className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            <button
              type="submit"
              disabled={state === 'sending'}
              className="btn-primary rounded-lg px-5 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {state === 'sending' ? 'Sending…' : 'Email me the syllabus'}
              {state !== 'sending' && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
          {state === 'error' && (
            <p className="text-xs text-red-600 mt-2">Something went wrong — please try again.</p>
          )}
        </>
      )}
    </div>
  )
}

export default function CcmInternationalContent({ price, hideNav = false, uk = false }: { price: IntlPriceView; hideNav?: boolean;
  /** /uk (CSP directory arrivals): acknowledge the listing + lead with UK CPD relevance. */
  uk?: boolean }) {
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set())
  const [enrolling, setEnrolling] = useState(false)
  const [enrolError, setEnrolError] = useState<string | null>(null)

  // CCM international checkout is LIVE (not gated) — `international-online` grants
  // online-only = the CCM 8-module course. Currency is resolved server-side.
  const handleEnrol = async () => {
    if (enrolling) return
    setEnrolling(true)
    setEnrolError(null)
    trackEvent('checkout_start', {
      courseType: 'international-online',
      source: uk ? 'uk-page' : 'international-page',
      currency: price.code,
    })
    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseType: 'international-online', utm: { source: 'csp', medium: 'course-advert', campaign: 'intl-ccm' } }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.url) {
        setEnrolError(data?.error || 'Could not start checkout. Please try again.')
        setEnrolling(false)
        return
      }
      window.location.href = data.url
    } catch {
      setEnrolError('Could not start checkout. Please try again.')
      setEnrolling(false)
    }
  }

  const toggleFaq = (i: number) => {
    setOpenFaqs((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  const [showStickyCta, setShowStickyCta] = useState(false)
  useEffect(() => {
    const target = document.getElementById('pricing-cards')
    if (!target) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyCta(!entry.isIntersecting), { threshold: 0 })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {!hideNav && <SiteNav />}
      <InstrumentKeyframes />

      <div className="max-w-6xl mx-auto px-6 pb-12 md:pb-20 pt-[120px]">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="badge mb-5 inline-flex">
            <Award className="w-3.5 h-3.5 mr-1.5" />
            {uk ? <>For UK Physiotherapists — as listed in the CSP course directory</> : <>International · For Physiotherapists, Osteopaths &amp; Chiropractors</>}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Concussion is <span className="text-gradient">your scope</span>.
            <br className="hidden sm:block" /> Master the whole pathway.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You screen, assess, manage and rehabilitate concussion every week — this is the course
            that makes you the clinician who does it to guideline standard, with the working tools
            to start Monday. Diagnosis and clearance for red flags stay with medical; you own the rest.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-3xl mx-auto mt-4">
            {[
              'SCAT6 / SCOAT6',
              'VOMS & BESS',
              'Sideline recognition',
              'Graded return-to-play',
              'Phenotype rehab',
              'Red-flag referral',
            ].map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/8 border border-accent/15 text-[11.5px] sm:text-xs font-semibold text-accent whitespace-nowrap">
                <Check className="w-3 h-3 flex-shrink-0" strokeWidth={3} />
                {skill}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-w-4xl mx-auto mt-7">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-amber-700 leading-none">8<span className="text-base font-semibold">hrs</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Assessed CPD</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-white border-l-4 border-teal-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-teal-700 leading-none">8</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Online modules</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 leading-none">{uk ? 'CSP' : 'OA'}</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">{uk ? 'Directory listed' : 'Endorsed'}</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700 leading-none">∞</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Lifetime access</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-50 to-white border-l-4 border-rose-500 p-3 sm:p-4 text-left col-span-2 lg:col-span-1">
              <p className="text-2xl sm:text-3xl font-bold text-rose-700 leading-none">7<span className="text-base font-semibold">day</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Money-back</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-5">
            8 CPD hours online, self-paced, delivered entirely from wherever you practise — plus the
            clinical tools to put it into practice with patients from day one.
          </p>

          <div className="mt-5 flex justify-center">
            <a href="#pricing-cards" className="btn-primary inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm">
              See enrolment options
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Standards / endorsement. For /uk the authority stack is FLIPPED
            (2026-07-30 UK-lane audit: every CSP session was read-and-leave —
            an Australian osteopathy endorsement is a foreign, other-profession
            credential to a UK physio, so CSP/portfolio relevance and the
            published protocol lead, and OA becomes the supporting line). */}
        {uk ? (
          <div className="max-w-3xl mx-auto mb-6 space-y-3">
            <div className="flex items-start justify-center gap-3 sm:gap-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 px-5 py-4">
              <ShieldCheck className="w-9 h-9 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.8} />
              <div className="text-left">
                <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">UK CPD</p>
                <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">Listed in the CSP course directory</p>
                <p className="text-xs text-muted-foreground mt-0.5">8 hours of structured, assessed CPD for your HCPC / CSP portfolio — certificate and hours statement provided on completion.</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href="https://doi.org/10.5281/zenodo.21482634"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
              >
                <FileText className="w-6 h-6 text-accent flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground leading-tight inline-flex items-center gap-1.5">
                    Published clinical protocol
                    <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={2.2} />
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">Open-access, peer-reviewable — DOI 10.5281/zenodo.21482634</p>
                </div>
              </a>
              <a
                href="https://osteopathy.org.au/Web/Web/cpd/endorsed-courses.aspx?hkey=3c85c306-c65a-4a5d-90f1-782a78dedd86"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 transition-colors hover:border-teal-300 hover:bg-teal-50/40"
              >
                <Image
                  src="/osteopathy-australia-endorsed.png"
                  alt="Endorsed by Osteopathy Australia"
                  width={80}
                  height={72}
                  className="h-9 w-auto flex-shrink-0"
                />
                <div className="text-left">
                  <p className="text-sm font-bold text-foreground leading-tight inline-flex items-center gap-1.5">
                    Endorsed by Osteopathy Australia
                    <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={2.2} />
                  </p>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">Australia&rsquo;s peak osteopathy body</p>
                </div>
              </a>
            </div>
          </div>
        ) : (
          <a
            href="https://osteopathy.org.au/Web/Web/cpd/endorsed-courses.aspx?hkey=3c85c306-c65a-4a5d-90f1-782a78dedd86"
            target="_blank"
            rel="noopener noreferrer"
            className="max-w-3xl mx-auto mb-6 flex items-center justify-center gap-3 sm:gap-4 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-emerald-50/40 px-5 py-4 transition-colors hover:border-teal-300 hover:bg-teal-50/80"
          >
            <Image
              src="/osteopathy-australia-endorsed.png"
              alt="Endorsed by Osteopathy Australia"
              width={80}
              height={72}
              className="h-12 sm:h-14 w-auto flex-shrink-0"
            />
            <div className="text-left">
              <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">Endorsed CPD</p>
              <p className="text-lg sm:text-xl font-bold text-foreground leading-tight inline-flex items-center gap-1.5">
                Endorsed by Osteopathy Australia
                <ExternalLink className="w-3.5 h-3.5 opacity-50" strokeWidth={2.2} />
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">8 CPD hours · certificate on completion · self-recorded for UK/overseas CPD</p>
            </div>
          </a>
        )}

        {/* Training photo */}
        <div className="max-w-4xl mx-auto mb-6 rounded-2xl overflow-hidden relative shadow-lg">
          <Image
            src="/workshop-training.jpg"
            alt="Zac Lewis training a team of clinicians — hands-on concussion examination practice"
            width={1200}
            height={675}
            className="w-full h-[220px] sm:h-[280px] md:h-[340px] object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold text-amber-300 mb-1">Clinician-built, clinician-taught</p>
            <h3 className="text-base sm:text-xl font-bold leading-tight">The same training delivered hands-on to clinical teams across Australia.</h3>
            <p className="text-[12.5px] sm:text-sm text-white/85 mt-1 leading-snug max-w-2xl">
              Recognition &rarr; SCAT6/VOMS/BESS assessment &rarr; graded return-to-play &rarr; phenotype rehab — the
              online course is the same clinical method, taught by the same clinician, self-paced from wherever you practise.
            </p>
          </div>
        </div>

        {/* Employer callout */}
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Most practitioners pay £0 out of pocket</p>
            <p className="text-xs text-muted-foreground mt-1">Your employer or practice likely covers CPD training costs. Tax invoice + certificate emailed on completion.</p>
          </div>
        </div>

        <SyllabusCapture uk={uk} price={price} />

        {/* Value intro */}
        <div className="text-center max-w-2xl mx-auto mb-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-3">Built for you</p>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
            Screen, assess, manage — and get the tools to <span className="text-gradient">deliver it</span>
          </h2>
          <p className="text-base text-muted-foreground">
            You don&rsquo;t just learn the pathway — you leave with the instruments to run it. Every
            enrolment includes the working clinical platform: SCAT6 baseline &amp; serial testing,
            the Sub-Symptom-Threshold (SST) Trainer app, the BCTT calculator and the full Clinical
            Toolkit — the screening, monitoring and reporting done.
          </p>
        </div>

        {/* Pricing card */}
        <div id="pricing-cards" className="mt-6">
          <div className="max-w-xl mx-auto pt-2">
            <div className="card card-visible rounded-2xl p-5 md:p-6 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.35)' }}>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5 min-w-0 flex-wrap">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50 flex-shrink-0">
                    <Stethoscope className="w-4.5 h-4.5 text-[var(--accent)]" strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">International</span>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">8 CPD hrs</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-baseline gap-1 justify-end">
                    <span className="text-2xl font-bold text-[var(--foreground)] tracking-tight">{price.display}</span>
                    <span className="text-[11px] text-[var(--muted-foreground)]">{price.code}</span>
                  </div>
                  <p className="text-[10px] text-[var(--muted-foreground)]">course + first year on the platform</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-[var(--foreground)] mb-0.5">CCM International</h3>
              <p className="text-[12px] text-slate-500 mb-2 font-medium">The full clinical course + the tools — certify entirely online</p>
              <p className="text-[13px] text-[var(--muted-foreground)] leading-relaxed mb-4">
                8 modules at your own pace, plus the working clinical tools to screen, monitor and
                rehabilitate concussion — delivered wholly online, wherever you practise.
              </p>

              <ul className="grid grid-cols-1 gap-x-3 gap-y-1.5 mb-5">
                {[
                  '8 clinical modules · 8 CPD hours',
                  'SCAT6 baseline & serial testing tool',
                  'SST Trainer — test → prescription → monitoring',
                  'BCTT calculator + full Clinical Toolkit',
                  'VOMS/BESS guides + phenotype rehab library',
                  'Certificate on 75% pass · lifetime access',
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12.5px]">
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="text-[var(--muted-foreground)]">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="rounded-xl bg-teal-50/60 border border-teal-200 px-4 py-3 mb-4">
                <p className="text-[12.5px] text-slate-700 leading-relaxed">
                  <strong className="text-teal-800">Course is one-time — lifetime access.</strong>{' '}
                  The clinical platform (SST Trainer + baseline testing) is <strong>included free for your
                  first year</strong>, then <strong>A$49/month</strong> to keep it — starts automatically
                  at 12 months, cancel anytime.
                </p>
              </div>

              <div className="mt-auto">
                <button
                  type="button"
                  onClick={handleEnrol}
                  disabled={enrolling}
                  className="btn-primary w-full py-3 px-5 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {enrolling ? 'Starting checkout…' : `Enrol — ${price.display}`}
                  {!enrolling && <ArrowRight className="w-4 h-4" />}
                </button>
                {enrolError && <p className="text-[11px] text-center text-red-600 mt-2">{enrolError}</p>}
                <p className="text-[11px] text-center text-[var(--muted-foreground)] mt-2">
                  Prices shown in your region&rsquo;s currency · secure checkout · 7-day money-back guarantee
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
            {['7-Day Guarantee', 'Lifetime Access', 'Clinical Tools Included', 'Certificate Included', 'OA-Endorsed'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Instrument visuals */}
        <div className="max-w-4xl mx-auto mt-10 mb-2">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col overflow-hidden rounded-2xl bg-[#16243f] shadow-[0_18px_40px_-18px_rgba(22,36,63,0.55)]">
              <SstWatchVisual />
              <div className="p-5">
                <h3 className="m-0 text-lg font-extrabold tracking-tight text-white">SST Trainer</h3>
                <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-300/90">
                  A graded test measures each patient&rsquo;s symptom threshold; they train just under
                  it — live heart rate, verified progression, every session on your dashboard.
                </p>
                <Link href="/sst-trainer?clinic=DEMO00" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-teal-300 hover:text-teal-200">
                  See the patient app <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
            <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_40px_-24px_rgba(100,116,139,0.45)]">
              <BaselineLaptopVisual />
              <div className="p-5">
                <h3 className="m-0 text-lg font-extrabold tracking-tight text-[#16243f]">SCAT6 Baseline Testing</h3>
                <p className="m-0 mt-1 text-[13px] leading-relaxed text-slate-500">
                  One link per club: athletes self-complete the SCAT6 baseline in ~5 minutes and a PDF
                  report lands in your inbox — on file for the day it matters.
                </p>
                <Link href="/preseason/b/DEMO00" className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#b45309] hover:text-[#92400e]">
                  Try the baseline flow <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tools grid */}
        <div className="max-w-4xl mx-auto mt-10 mb-2">
          <div className="text-center mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent mb-2">Included with every enrolment</p>
            <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">The clinical platform, not just the lessons</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">You leave with the working tools CEA&rsquo;s clinics run on — ready to use with patients from day one.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: LineChart, title: 'SCAT6 Baseline & Serial Testing', desc: 'Capture the athlete’s healthy baseline, then auto-build the serial-comparison report on the day it matters — measured against their own normal, not a generic zero.' },
              { icon: HeartPulse, title: 'Sub-Symptom-Threshold (SST) Trainer', desc: 'The patient app: threshold test → in-band heart-rate training on the wearable they already own → guided progression, clinician-set and overseen by you.' },
              { icon: Activity, title: 'BCTT Calculator → Prescription', desc: 'Enter the Buffalo test stages; get the heart-rate threshold (HRt) and the 80–90% training band with the plain-language prescription.' },
              { icon: ClipboardList, title: 'Clinical Toolkit + Reporting Templates', desc: 'VOMS/BESS guides, the phenotype library, return-to-play protocols and referrer-ready reporting — the paperwork done.' },
            ].map((tool) => (
              <div key={tool.title} className="glass rounded-2xl p-5 flex gap-4">
                <div className="icon-container w-11 h-11 flex-shrink-0">
                  <tool.icon className="w-5 h-5 text-accent" strokeWidth={1.75} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-1">{tool.title}</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scope honesty */}
        <div className="max-w-3xl mx-auto mt-8 mb-8 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4">
          <ShieldCheck className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <strong>Within scope.</strong> The course covers concussion assessment and management within
            physiotherapy/allied-health scope of practice. Diagnosis and return-to-play clearance where
            red flags are present remain with the treating medical practitioner — the course teaches when
            and how to refer.
          </p>
        </div>

        {/* Evidence base + published protocol — the citable method behind the tools */}
        <div className="max-w-3xl mx-auto mb-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <FileText className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
          <p className="text-[13.5px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Evidence-based, and the rehab method is published.</strong>{' '}
            The course is referenced to a 140+ source peer-reviewed evidence base, and the
            sub-symptom-threshold rehabilitation method behind the SST Trainer is a citable open-access
            protocol — <em>A Standardised Clinical Protocol for Sub-Symptom-Threshold Aerobic Exercise
            Rehabilitation after Concussion (mTBI)</em>, Lewis Z. (2026), Zenodo, CC-BY-4.0,{' '}
            <a href="https://doi.org/10.5281/zenodo.21482634" target="_blank" rel="noopener noreferrer" className="text-accent font-semibold hover:underline">
              doi.org/10.5281/zenodo.21482634
            </a>.
          </p>
        </div>

        {/* Instructor */}
        <div className="max-w-3xl mx-auto mb-8">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">Who built it</h3>
          <div className="glass rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Image src="/zac-lewis-headshot.jpg" alt="Zac Lewis — Osteopath, Concussion Researcher" width={96} height={96} className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-2 border-accent/20" />
            <div>
              <h4 className="text-lg font-bold text-foreground mb-0.5">Zac Lewis</h4>
              <p className="text-sm text-accent font-medium mb-1">Osteopath · Founder</p>
              <p className="text-xs text-muted-foreground mb-3">B.Clin.Sci, M.Ost.Med</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Zac has over a decade of clinical experience in neurological health and concussion
                management, including work with national and professional ice hockey across New Zealand
                and Canada, and is a co-author of concussion research currently under external review
                (Lewis &amp; Baker). The course is grounded in the SCAT6/Amsterdam consensus and the
                Leddy / Buffalo evidence base, translated for the assessing clinician.
              </p>
              <div className="mt-4 flex items-center justify-end gap-2">
                <span className="text-[11px] font-medium text-muted-foreground">Member, Sports Medicine Australia</span>
                <Image src="/sma-member-2026.png" alt="Sports Medicine Australia — Member 2026" width={225} height={99} className="h-8 w-auto opacity-90" />
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {INTL_FAQS.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button type="button" onClick={() => toggleFaq(i)} className="w-full flex items-center justify-between px-5 py-4 text-left gap-3" aria-expanded={openFaqs.has(i)}>
                  <span className="font-semibold text-sm text-foreground">{item.q}</span>
                  {openFaqs.has(i) ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                </button>
                {openFaqs.has(i) && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <button type="button" onClick={handleEnrol} disabled={enrolling} className="btn-primary px-10 py-4 rounded-xl text-base font-bold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {enrolling ? 'Starting checkout…' : `Enrol — ${price.display}`}
              {!enrolling && <ArrowRight className="w-5 h-5" />}
            </button>
            <p className="text-xs text-muted-foreground mt-4">Endorsed by Osteopathy Australia · 8 CPD hours · lifetime access</p>
          </div>
        </div>

      </div>

      {/* Sticky mobile CTA */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="backdrop-blur-lg bg-background/90 border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">{price.display} · 8 CPD</span>
          <button type="button" onClick={handleEnrol} disabled={enrolling} className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed">
            {enrolling ? 'Starting…' : 'Enrol'}
            {!enrolling && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
