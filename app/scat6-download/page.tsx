'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AfterTheAssessment } from '@/components/scat-forms/AfterTheAssessment'
import {
  Brain,
  Mail,
  User,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
  Download,
  FileText,
  CheckCircle2,
  Zap,
  BookOpen,
  ChevronRight,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { trackEvent, trackLeadConversion } from '@/lib/analytics'


const PAGE_URL = 'https://portal.concussion-education-australia.com/scat6-download'

// Visible Q&A content — rendered below the download form AND mirrored 1:1 in
// the FAQPage JSON-LD (Google requires exact parity between schema and page).
const faqs = [
  {
    question: 'What is included in the free SCAT6 download?',
    answer:
      'You can download fillable PDF versions of the SCAT6 (the acute/sideline assessment) and the SCOAT6 (the office assessment for follow-up from 72 hours post-injury). Each PDF can be typed into directly or printed and completed by hand, and you can print as many copies as you need.',
  },
  {
    question: 'Who can use the SCAT6 and SCOAT6?',
    answer:
      'The SCAT6 and SCOAT6 are designed for licensed healthcare professionals trained in concussion assessment — doctors, physiotherapists, osteopaths and other clinicians. They support, but do not replace, clinical judgement.',
  },
  {
    question: 'Is there a version of the SCAT6 I can complete online?',
    answer:
      'Yes. Concussion Education Australia also provides free web-based SCAT6, SCOAT6 and Child SCAT6 forms that calculate scores automatically as you complete each section and export the finished assessment as a PDF for the medical record.',
  },
  {
    question: 'Is there free training on how to administer the SCAT6?',
    answer:
      'Yes. The free SCAT6 & SCOAT6 Mastery course is a ~1-hour online course covering administration, scoring and interpretation of both tools, plus red-flag recognition and documentation. It is free, self-paced, and includes a certificate on completion.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MedicalWebPage',
      '@id': `${PAGE_URL}#webpage`,
      name: 'Free SCAT6 & SCOAT6 Fillable PDF Download',
      url: PAGE_URL,
      inLanguage: 'en-AU',
      description:
        'Free fillable SCAT6 and SCOAT6 PDF forms (Amsterdam 2022 consensus, BJSM 2023) for download by healthcare professionals.',
      about: {
        '@type': 'MedicalCondition',
        name: 'Concussion',
        alternateName: 'Sport-related concussion',
      },
      audience: {
        '@type': 'MedicalAudience',
        audienceType: 'Healthcare professionals',
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${PAGE_URL}#faq`,
      inLanguage: 'en-AU',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    },
  ],
}

export default function SCAT6DownloadPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  // "You already have an account" is a SUCCESS, not a failure — it must not
  // render in the red error box. Separate state so the two read differently.
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  // Which forms they want — both on by default (SCAT6 = sideline, SCOAT6 = office).
  const [wantScat6, setWantScat6] = useState(true)
  const [wantScoat6, setWantScoat6] = useState(true)

  const validateEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)

  const triggerDownload = () => {
    const files: { href: string; name: string }[] = []
    if (wantScat6) files.push({ href: '/docs/SCAT6_Fillable.pdf', name: 'SCAT6_Fillable.pdf' })
    if (wantScoat6) files.push({ href: '/docs/SCOAT6_Fillable.pdf', name: 'SCOAT6_Fillable.pdf' })
    // Stagger so the browser doesn't block the second download.
    files.forEach((f, i) => {
      setTimeout(() => {
        const a = document.createElement('a')
        a.href = f.href
        a.download = f.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }, i * 500)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (!name.trim()) {
      setError('Please enter your first name.')
      return
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!wantScat6 && !wantScoat6) {
      setError('Select at least one form to download.')
      return
    }

    setIsLoading(true)

    // Attribution: when the Squarespace SCAT6 form points here (…?utm_source=
    // squarespace&utm_campaign=scat6-form), tag the lead so off-site capture is
    // segmentable in the dashboard. Direct portal traffic → no source → defaults
    // to 'free-course' server-side.
    const utmSource = new URLSearchParams(window.location.search).get('utm_source')
    const source = utmSource ? `${utmSource}-scat6`.toLowerCase().replace(/[^a-z0-9-]/g, '') : undefined

    try {
      const res = await fetch('/api/signup-free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          ...(source ? { source } : {}),
          // Which asset they actually asked for. Only used on the
          // requiresEmailLogin branch (existing account that owns something):
          // no session is minted there, so the magic link has to carry the
          // file or they get nothing. Server re-validates against AUTH_DOCS.
          downloadPath: wantScat6 ? '/docs/SCAT6_Fillable.pdf' : '/docs/SCOAT6_Fillable.pdf',
        }),
      })

      const data = await res.json()

      // Existing account that OWNS something: the API deliberately sets NO
      // session cookie and emails a login link instead (anti-takeover — see
      // lib/account-escalation.ts). Navigating on would land them on gated
      // content with no session, so say what actually happened.
      //
      // The forms are NOT free public assets \u2014 /docs/SCAT6_Fillable.pdf and
      // /docs/SCOAT6_Fillable.pdf are AUTH_DOCS (lib/gated-docs.ts), enforced
      // by the edge middleware. On this branch there is deliberately NO session
      // cookie, so calling triggerDownload() here fired two <a download> hits
      // that both returned 401 {"error":"Please log in to download this file."}
      // \u2014 silently, because a cancelled download raises no UI. The page then
      // told them "Your forms are downloading now". Net effect: every EXISTING
      // CUSTOMER (paid CCM/CRM buyer, SST clinic, Hub owner, bundle owner,
      // AI-course enrollee, every alumnus) who used the site's #1 landing
      // surface got a false success message and no file.
      // The login link now carries the requested doc (downloadPath above), so
      // one click on the email both signs them in AND starts the download.
      // Say exactly that instead of claiming a download that cannot happen.
      if (data.requiresEmailLogin) {
        setNotice(
          `You already have an account, so we can't hand the file straight to this browser. ` +
            `We've emailed a one-click link to ${email.trim().toLowerCase()} \u2014 opening it signs you in and starts your ` +
            `${wantScat6 && wantScoat6 ? 'SCAT6 download (SCOAT6 is one click away in the portal)' : 'download'} straight away.`,
        )
        return
      }

      if (data.success) {
        // INTERNAL event first — this is the one we can actually read.
        //
        // This page is the site's #1 landing surface (58 sessions / 28 days,
        // ~9% of all traffic) and until now its ONLY success signal was the
        // Google Ads pixel below, on a channel that has been retired — i.e.
        // firing into nothing. The signup IS recorded server-side by
        // /api/signup-free, but that row is written with a synthetic
        // session_id ('server_<ts>') and path '/api/signup-free', so it can
        // never be joined back to the visitor's session or landing page.
        // Result: every one of these 58 sessions reads as a one-page bounce in
        // any session-level funnel, and the page looks like a dead end when it
        // is plausibly the best converter on the site. Named for what the page
        // actually delivers (the fillable PDFs), so it does not collide with
        // the server's 'free_course_signup' count.
        void trackEvent('scat6_form_download', {
          forms: [wantScat6 ? 'scat6' : null, wantScoat6 ? 'scoat6' : null].filter(Boolean),
          ...(source ? { source } : {}),
          userEmail: email.trim().toLowerCase(),
        })
        // Fire gtag lead conversion with value + enhanced data
        trackLeadConversion('TVzUCLHT0IccEJWXu_9C', 10, email.trim().toLowerCase())
        // Trigger browser download immediately
        triggerDownload()
        setSuccess(true)
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-teal-50/40" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-bl from-teal-100/40 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-blue-100/30 to-transparent blur-3xl pointer-events-none" />

      <SiteNav />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12 md:py-20 pt-[120px]">
        <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-start">

          {/* ── Left column: hero copy (3 cols) ── */}
          <div className="lg:col-span-3">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full mb-6">
              <Download className="w-3.5 h-3.5 text-[#5b9aa6]" />
              <span className="text-xs font-bold text-[#5b9aa6] uppercase tracking-wide">
                Free PDF · Fillable · Instant Download
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
              Free SCAT6 &amp; SCOAT6 Forms —{' '}
              <span className="bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] bg-clip-text text-transparent">
                Fillable PDF Download
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              The official SCAT6 (sideline) and SCOAT6 (office) assessment tools, ready to use in your clinic. Choose the forms you want for instant download.
            </p>

            {/* Above-the-fold jump to the form. On a 375px phone the two-column
                grid stacks, so the capture form sits ~1,320px down the page —
                more than 1.5 viewports past the last thing a visitor can click.
                The hero had NO affordance at all: headline, five bullets, three
                trust pills and a preview card before any action. This is the
                site's #1 organic landing surface, so that dead first screen is
                the single most expensive thing on it. Desktop already shows the
                form alongside the hero, so hide it there. */}
            <a
              href="#get-the-forms"
              className="lg:hidden inline-flex items-center justify-center gap-2 w-full py-3.5 mb-8 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white shadow-lg shadow-teal-200/50"
            >
              <Download className="w-4 h-4" />
              Get the free PDF
              <ArrowRight className="w-4 h-4" />
            </a>

            {/* Feature list */}
            <div className="space-y-3 mb-8">
              {[
                'Complete SCAT6 form — all domains included',
                'Fillable PDF — type directly, or print and write',
                'Auto-scoring reference guide included',
                'Correct field layout for AHPRA documentation',
                'Print as many copies as you need — no restrictions',
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#5b9aa6] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <p className="text-sm text-slate-700 leading-snug">{point}</p>
                </div>
              ))}
            </div>

            {/* Trust signals row */}
            <div className="flex flex-wrap gap-3 mb-10">
              {[
                { icon: FileText, label: 'Fillable PDF' },
                { icon: Check, label: 'Auto-scoring' },
                { icon: Shield, label: 'Free' },
              ].map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 bg-white/80 border border-slate-200 px-3 py-2 rounded-full text-xs font-medium text-slate-700 shadow-sm"
                >
                  <Icon className="w-3.5 h-3.5 text-[#5b9aa6]" />
                  {label}
                </div>
              ))}
            </div>

            {/* PDF preview card */}
            <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-5 shadow-lg shadow-slate-200/40 flex items-center gap-5">
              <div className="w-14 h-16 bg-gradient-to-br from-[#5b9aa6]/10 to-[#5b9aa6]/5 rounded-lg border border-[#5b9aa6]/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-7 h-7 text-[#5b9aa6]" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">SCAT6_Fillable.pdf</p>
                <p className="text-xs text-slate-500 mt-0.5">Official Sport Concussion Assessment Tool · Version 6</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full font-medium">PDF</span>
                  <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Fillable</span>
                  <span className="text-xs bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full font-medium">Free</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right column: form (2 cols) ── */}
          <div id="get-the-forms" className="lg:col-span-2 lg:sticky lg:top-8 scroll-mt-24">
            {success ? (
              /* Success state */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-200 p-7 shadow-xl shadow-emerald-100/50">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <Download className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-1.5">
                    Downloading now
                  </h2>
                  <p className="text-sm text-slate-500">
                    Your form{wantScat6 && wantScoat6 ? 's are' : ' is'} downloading — and you&apos;re already logged in to your free account.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200/60 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-[#5b9aa6] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-700">
                      Account confirmation sent to <strong>{email}</strong>
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#5b9aa6] flex-shrink-0 mt-0.5" strokeWidth={3} />
                    <p className="text-xs text-slate-700">
                      Your download should start automatically. If it didn&apos;t,{' '}
                      <button
                        onClick={triggerDownload}
                        className="text-[#5b9aa6] hover:underline font-semibold"
                      >
                        click here
                      </button>
                      .
                    </p>
                  </div>
                </div>

                {/* Upsell to mastery course */}
                <div className="bg-gradient-to-br from-teal-50 to-blue-50/50 rounded-xl border border-teal-200/60 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5b9aa6]/10 border border-[#5b9aa6]/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-[#5b9aa6]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">
                        Now learn to score what you just downloaded
                      </p>
                      <p className="text-xs text-slate-600 mb-3 leading-snug">
                        Your free ~1-hour SCAT6 Mastery course is unlocked — you&apos;re logged in, start right now.
                      </p>
                      <Link
                        href="/modules/101"
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#5b9aa6] px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#4a8a96]"
                      >
                        Start Module 1 now
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Download form */
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-7 shadow-xl shadow-slate-200/40">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5b9aa6]/10 to-[#6b9da8]/10 flex items-center justify-center mx-auto mb-4 border border-[#5b9aa6]/20">
                    <Download className="w-6 h-6 text-[#5b9aa6]" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 mb-1">
                    Get your free download
                  </h2>
                  <p className="text-xs text-slate-500">
                    Instant access · No credit card required
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {notice && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <Mail className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-teal-900 leading-snug">{notice}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Which forms?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { on: wantScat6, set: setWantScat6, label: 'SCAT6', sub: 'Sideline / acute' },
                        { on: wantScoat6, set: setWantScoat6, label: 'SCOAT6', sub: 'Office / sub-acute' },
                      ].map((f) => (
                        <button
                          key={f.label}
                          type="button"
                          onClick={() => f.set(!f.on)}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition ${f.on ? 'border-[#5b9aa6] bg-[#5b9aa6]/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                        >
                          <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${f.on ? 'bg-[#5b9aa6] border-[#5b9aa6]' : 'border-slate-300'}`}>
                            {f.on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-slate-800">{f.label}</span>
                            <span className="block text-[10px] text-slate-500">{f.sub}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dl-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      First name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="dl-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your first name"
                        className="w-full bg-white/80 pl-10 pr-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm text-sm"
                        disabled={isLoading}
                        autoComplete="given-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dl-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="dl-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@clinic.com.au"
                        className="w-full bg-white/80 pl-10 pr-4 py-3 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5b9aa6]/40 focus:border-[#5b9aa6]/50 transition-all border border-slate-200 shadow-sm text-sm"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#5b9aa6] to-[#6b9da8] text-white hover:from-[#4a8a96] hover:to-[#5a8d98] transition-all shadow-lg shadow-teal-200/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Preparing download...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Download free PDF
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-center gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      No spam
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Instant download
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      Free forever
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upsell promo box (visible before submit) */}
            {!success && (
              <div className="mt-4 bg-gradient-to-br from-teal-50 to-blue-50/50 rounded-xl border border-teal-200/60 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5b9aa6]/10 border border-[#5b9aa6]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-4 h-4 text-[#5b9aa6]" />
                  </div>
                  <div>
                    {/* Routes to the free-to-read TRIAL, not the free course.
                        The free course converts 0 of 46 signups to paid — 17
                        finished it and none bought — so sending a downloader
                        there just adds another non-converting email. The trial
                        shows real paid module content and qualifies. */}
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">
                      The form gives you a score. What do you do with it?
                    </p>
                    <p className="text-xs text-slate-600 mb-2 leading-snug">
                      Read the opening of every module free — phenotypes, VOMS, BESS and
                      return-to-play reasoning. No signup.
                    </p>
                    <Link
                      href="/preview"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#5b9aa6] hover:text-[#4a8a96] transition-colors"
                    >
                      Read the course preview
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Crawlable definition block ── */}
        <div className="mt-14 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-7 shadow-lg shadow-slate-200/40">
          <h2 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">What is the SCAT6?</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>
              The SCAT6 (Sport Concussion Assessment Tool, 6th Edition) is the standardised tool
              for assessing sport-related concussion in athletes aged 13 and over, developed
              through the 2022 Amsterdam International Consensus on Concussion in Sport and
              published in the British Journal of Sports Medicine in 2023. It is an acute
              assessment — ideally used within the first 72 hours after injury — covering red
              flags, observable signs, symptom evaluation, cognitive screening and balance
              testing.
            </p>
            <p>
              Its companion tool, the SCOAT6 (Sport Concussion Office Assessment Tool), is the
              structured office assessment for follow-up from 72 hours post-injury onwards,
              typically Day 3 to Day 30. Both tools are intended for use by licensed healthcare
              professionals and are the expected standard for concussion assessment across
              Australian sport. The fillable PDF versions on this page are free to download, type
              into directly or print for clinic use.
            </p>
          </div>
          <p className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            Reviewed by Zac Lewis — Osteopath (AHPRA), B.Clin.Sci, M.Ost.Med · Updated July 2026
          </p>
        </div>

        {/* Ladder bridge — /scat6-download is the top organic page (108
            sessions/30d) and had ZERO routes to a money page (the open
            analytics finding "Organic Search sends visitors who never touch a
            money page"). Same component /scat-forms uses; free-to-read trial
            first, never another email wall. */}
        <AfterTheAssessment className="mt-6" />

        {/* ── Crawlable Q&A — mirrored exactly in the FAQPage JSON-LD ── */}
        <div className="mt-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-7 shadow-lg shadow-slate-200/40">
          <div className="space-y-6">
            {faqs.map((f) => (
              <div key={f.question}>
                <h2 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">{f.question}</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
