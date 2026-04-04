'use client'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CONFIG } from '@/lib/config'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ShieldCheck,
  Check,
  ArrowRight,
  Loader2,
  BookOpen,
  Building2,
  GraduationCap,
  Globe,
  User,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { BreadcrumbSchema } from '@/components/SchemaMarkup'
import { createFAQSchema } from '@/lib/schema-markup'
import { trackEvent } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
  q: string
  a: string
  link?: { text: string; href: string }
}

// ─── Canceled Banner ─────────────────────────────────────────────────────────

function CanceledBannerInner() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')
  if (!canceled) return null
  return (
    <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">
        Checkout was canceled — no charge was made. You can try again whenever you&apos;re ready.
      </p>
    </div>
  )
}

function CanceledBanner() {
  return (
    <Suspense fallback={null}>
      <CanceledBannerInner />
    </Suspense>
  )
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRICE_USD = CONFIG.COURSE.PRICE_INTERNATIONAL

// ─── Main Content ────────────────────────────────────────────────────────────

function InternationalPricingContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Enrollment count + session email (for pre-filling Stripe checkout)
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/enrollment-count')
      .then(res => res.json())
      .then(data => { if (data.count > 0) setEnrollmentCount(data.count) })
      .catch(() => {})
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => { if (data.user?.email) setSessionEmail(data.user.email) })
      .catch(() => {})
  }, [])

  // Read promo code and UTM params from URL
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})

  // Fire international pricing view event + capture UTM params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const promo = params.get('promo')
    if (promo) setPromoCode(promo)

    // Capture UTM params for Stripe attribution
    const utm: Record<string, string> = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'gclid']) {
      const val = params.get(key)
      if (val) utm[key] = val
    }
    if (Object.keys(utm).length > 0) setUtmParams(utm)

    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', 'international_pricing_view', {
        page: '/pricing-international',
      })
    }
    trackEvent('international_pricing_view', { page: '/pricing-international' })
  }, [])

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    trackEvent('checkout_start', { courseType: 'international-online', source: 'pricing_international' })

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseType: 'international-online', ...(sessionEmail ? { email: sessionEmail } : {}), ...(promoCode ? { promoCode } : {}), ...(Object.keys(utmParams).length > 0 ? { utm: utmParams } : {}) }),
      })

      const data = await res.json()

      if (data.success && data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Something went wrong. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const faqs: FaqItem[] = [
    {
      q: 'Is this course relevant outside of Australia?',
      a: 'Yes — the clinical content follows international consensus guidelines (Berlin 2023, Amsterdam 2023). SCAT6 administration, VOMS assessment, BESS scoring, and return-to-play protocols are the same worldwide. The course was built to Australian regulatory standards (AHPRA) but the clinical skills are universally applicable.',
    },
    {
      q: 'What CE credits do I receive?',
      a: '8 CE credits on completion, with a certificate of completion. The course is structured continuing education applicable across physiotherapy, athletic training, chiropractic, sports medicine, and general practice.',
    },
    {
      q: 'When do I get access?',
      a: "Immediately after purchase. You'll receive a login link via email within minutes.",
    },
    {
      q: 'How much time does the course take?',
      a: 'The 8 online modules take approximately 8 hours total (8 CPD points), completed at your own pace with no deadline. Most clinicians complete the course over 2–4 weeks alongside their clinical workload.',
    },
    {
      q: 'What is your refund policy?',
      a: 'We offer a 7-day satisfaction guarantee. If the course isn\'t right for you, email us within 7 days of purchase for a full refund (online content must be less than 25% accessed). No questions asked.',
      link: { text: 'See our full terms and conditions', href: '/terms' },
    },
    {
      q: 'Can my employer pay for this?',
      a: 'Yes — most practices and employers cover continuing education costs. After purchase, you\'ll receive an invoice and CE certificate that your employer can use for reimbursement.',
    },
  ]

  const faqSchemaData = faqs.map(f => ({
    question: f.q,
    answer: f.a + (f.link ? ` ${f.link.text}.` : ''),
  }))

  const testimonials = [
    {
      quote: 'Before this training, our approach to concussion cases was uncertain. Now, my team has the confidence and proven skills to diagnose and manage them with clarity.',
      name: 'Andy',
      role: 'Clinic Owner',
      initials: 'A',
    },
    {
      quote: "An outstanding blend of evidence-based knowledge and practical skills. Directly applicable to concussion diagnosis and management in real-world settings.",
      name: 'Dean',
      role: 'University Clinical Educator',
      initials: 'D',
    },
    {
      quote: 'Incredibly thorough and well structured. I left feeling genuinely confident in my concussion assessments.',
      name: 'Amelia',
      role: 'Physiotherapist',
      initials: 'A',
    },
    {
      quote: 'Well organised — content explained in a way that was relevant and memorable. Changed how I approach concussion in clinic.',
      name: 'Alex',
      role: 'Osteopath',
      initials: 'A',
    },
    {
      quote: 'A must for any health professional managing concussion. Relevant, applicable and easy to absorb.',
      name: 'Sarah',
      role: 'Physiotherapist',
      initials: 'S',
    },
  ]

  const TestimonialCard = ({ t }: { t: typeof testimonials[number] }) => (
    <div className="glass rounded-xl p-5">
      <div className="flex gap-0.5 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4 italic">
        &ldquo;{t.quote}&rdquo;
      </p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-[#0b6165] flex items-center justify-center text-xs font-semibold text-white shadow-sm">
          {t.initials}
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.role}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Pricing', url: '/pricing-international' },
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createFAQSchema(faqSchemaData)) }}
      />
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 pt-[80px] pb-12 md:pb-20">

        <CanceledBanner />

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            The Clinical Concussion Course{' '}
            <span className="text-gradient">for Healthcare Professionals</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master SCAT6, VOMS and BESS — the assessments that matter most in clinical practice.
            Comprehensive concussion certification at a fraction of the cost of alternatives.
          </p>
        </div>

        {/* ─── Why Clinicians Trust This Course ─────────────────────────── */}
        <div className="max-w-4xl mx-auto mb-10">
          {/* Credential badges row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { icon: Building2, label: 'Endorsed by a national medical peak body' },
              { icon: ShieldCheck, label: 'Built to national regulatory standards (AHPRA)' },
              { icon: BookOpen, label: 'Evidence-based — 140+ peer-reviewed references' },
              { icon: User, label: 'Created by a registered osteopath & concussion specialist' },
              { icon: Globe, label: 'Trusted by clinicians in AU, US, CA & UK' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-3 glass rounded-xl">
                <item.icon className="w-5 h-5 text-accent mb-2" />
                <span className="text-[11px] text-muted-foreground leading-tight">{item.label}</span>
              </div>
            ))}
          </div>

          {/* OA endorsement bar */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-4 px-6 glass rounded-xl border border-accent/10 mb-4">
            <div className="flex items-center gap-2">
              <Image src="/osteopathy-australia-endorsed.png" alt="Endorsed by Osteopathy Australia" width={36} height={32} className="h-8 w-auto" priority />
              <div>
                <span className="text-sm font-semibold text-foreground">Endorsed by Osteopathy Australia</span>
                <span className="text-xs text-muted-foreground block">Australia&apos;s national peak body for osteopathic medicine — 3,000+ registered practitioners</span>
              </div>
            </div>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-sm text-muted-foreground">8 CE Credits · Evidence-Based Certification</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-sm text-muted-foreground">7-day money-back guarantee</span>
            {enrollmentCount >= 100 && (
              <>
                <span className="hidden sm:inline text-slate-300">|</span>
                <span className="text-sm font-semibold text-foreground">{enrollmentCount}+ clinicians enrolled</span>
              </>
            )}
          </div>

          {/* Explainer paragraph */}
          <div className="glass rounded-xl p-5 border border-accent/10">
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              This course was built to meet Australia&apos;s national health practitioner regulatory standards (AHPRA) — one of the world&apos;s most rigorous clinical education frameworks. It is endorsed by Osteopathy Australia, the national peak body for osteopathic medicine. While designed in Australia, the clinical content — SCAT6 administration, VOMS assessment, BESS scoring, and return-to-play protocols — follows international consensus guidelines and is directly applicable to clinical practice worldwide.
            </p>
            <p className="text-xs text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5 inline-block mr-1 -mt-0.5" />
              Created by Zac Lewis, B.Clin.Sci., M.Ost.Med. — AHPRA-registered osteopath and concussion specialist with clinical experience across sport and primary care settings.
            </p>
          </div>
        </div>

        {/* Promo code banner */}
        {promoCode && (
          <div className="max-w-[900px] mx-auto mb-6 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-emerald-50 border border-emerald-200 text-sm">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
            <span className="text-emerald-800 font-semibold">Promo code {promoCode} will be applied at checkout</span>
          </div>
        )}

        {/* ─── Two-column: Free + Paid ─────────────────────────────── */}
        <div className="max-w-[900px] mx-auto grid md:grid-cols-2 gap-6">

          {/* Free Course — left column */}
          <div className="card rounded-2xl p-7 md:p-8 flex flex-col relative bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-2 border-emerald-200/40">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200/50">
                <GraduationCap className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Start Free
              </span>
            </div>

            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">SCAT6 Mastery</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
              6 focused modules on SCAT6 — the gold standard sideline assessment. See the course quality first, no commitment.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-emerald-700 tracking-tight">Free</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">No card required · 2 CE credits · Instant access</p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {[
                '6 SCAT6-focused modules',
                '2 CE credits on completion',
                'No card or payment required',
                'See the course quality before you commit',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-[var(--muted-foreground)]">{feature}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/scat-mastery"
              className="w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              Start Free Course
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center">
              No account needed — start learning in 30 seconds
            </p>
          </div>

          {/* Paid Course — right column */}
          <div className="card card-visible rounded-2xl p-7 md:p-8 flex flex-col relative" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
            {error && (
              <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">{error}</p>
              </div>
            )}

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
                <BookOpen className="w-5 h-5 text-[var(--accent)]" strokeWidth={2} />
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                Full Course
              </span>
            </div>

            <h3 className="text-xl font-bold text-[var(--foreground)] mb-2">ConcussionPro Online Course</h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed">
              8 comprehensive modules. Master SCAT6, VOMS, BESS and return-to-play — everything for clinical confidence.
            </p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[var(--foreground)] tracking-tight">${PRICE_USD}</span>
                <span className="text-sm text-[var(--muted-foreground)]">USD</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mt-1">One-time payment · Lifetime access · 8 CE credits</p>
            </div>

            <ul className="space-y-3 mb-6 flex-1">
              {[
                '8 online modules (8 CE credits)',
                'SCAT6, VOMS & BESS training',
                'Return-to-play decision framework',
                'Clinical Toolkit & downloadable resources',
                'Lifetime access — content updated regularly',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Check className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-[var(--muted-foreground)]">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="btn-primary w-full py-3.5 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Enrol Now — USD ${PRICE_USD}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-[11px] text-[var(--muted-foreground)] mt-3 text-center italic">
              &ldquo;An outstanding blend of evidence-based knowledge and practical skills&rdquo; — Dean, University Clinical Educator
            </p>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="max-w-[900px] mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--muted-foreground)]">
          {['7-Day Guarantee', 'Secure Checkout', 'Evidence-Based', 'Lifetime Access', 'Certificate Included'].map(item => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[var(--accent)]" strokeWidth={2.5} />
              {item}
            </div>
          ))}
        </div>

        {/* ─── Compare: Free vs Full ─────────────────────────────────── */}
        <div className="max-w-3xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">Compare Plans</h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="min-w-[500px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-emerald-700 bg-emerald-50/50">Free</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#5b9aa6] bg-[rgba(13,115,119,0.04)]">Full Course</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['SCAT6 training', true, true],
                    ['VOMS assessment', false, true],
                    ['BESS & balance testing', false, true],
                    ['Return-to-play framework', false, true],
                    ['Clinical Toolkit downloads', false, true],
                    ['140+ peer-reviewed references', false, true],
                    ['90 quiz questions', false, true],
                    ['23 video lessons', false, true],
                    ['CE credits', '2', '8'],
                    ['Lifetime access', true, true],
                    ['Certificate of completion', true, true],
                    ['7-day money-back guarantee', false, true],
                    ['Price', 'Free', `$${PRICE_USD} USD`],
                  ] as [string, boolean | string, boolean | string][]).map(([feature, free, full], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-3 px-4 text-slate-700">{feature}</td>
                      <td className={`py-3 px-4 text-center font-medium ${i % 2 === 0 ? 'bg-emerald-50/30' : 'bg-emerald-50/50'}`}>
                        {free === true ? <span className="text-emerald-600">{'\u2713'}</span> : free === false ? <span className="text-slate-300">{'\u2014'}</span> : <span className="text-emerald-700 font-semibold">{free}</span>}
                      </td>
                      <td className={`py-3 px-4 text-center font-medium ${i % 2 === 0 ? 'bg-[rgba(13,115,119,0.03)]' : 'bg-[rgba(13,115,119,0.06)]'}`}>
                        {full === true ? <span className="text-emerald-600">{'\u2713'}</span> : full === false ? <span className="text-slate-300">{'\u2014'}</span> : full}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Link href="/scat-mastery" className="px-6 py-3 rounded-xl font-semibold text-sm bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2">
              Start Free Course <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/preview" className="px-6 py-3 rounded-xl font-semibold text-sm border border-slate-200 text-[var(--foreground)] hover:bg-slate-50 transition-colors flex items-center gap-2">
              Preview Full Course <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ─── Professional Development Credits ─────────────────────── */}
        <div className="max-w-4xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">
            Recognised for Professional Development
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { flag: '\ud83c\udde6\ud83c\uddfa', country: 'Australia', detail: 'Endorsed by Osteopathy Australia \u00b7 AHPRA-aligned \u00b7 8 CPD points' },
              { flag: '\ud83c\uddec\ud83c\udde7', country: 'United Kingdom', detail: 'Accepted for HCPC CPD portfolios \u00b7 Outcomes-based learning' },
              { flag: '\ud83c\uddf3\ud83c\uddff', country: 'New Zealand', detail: 'Claimable for Physiotherapy Board NZ CPD' },
              { flag: '\ud83c\uddee\ud83c\uddea', country: 'Ireland', detail: 'Accepted for CORU CPD requirements' },
              { flag: '\ud83c\udde8\ud83c\udde6', country: 'Canada', detail: 'Claimable for CPD in most Canadian provinces' },
              { flag: '\ud83c\uddfa\ud83c\uddf8', country: 'United States', detail: '8 structured contact hours \u00b7 Self-study CE applicable in most states' },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-4 border border-slate-200/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{item.flag}</span>
                  <span className="text-sm font-bold text-foreground">{item.country}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-2">
            Built to AHPRA standards and endorsed by Osteopathy Australia. Curriculum follows international consensus guidelines (SCAT6, VOMS, return-to-play). Certificate of completion with documented learning outcomes provided.
          </p>
          <p className="text-[10px] text-slate-400">
            CE/CPD applicability varies by jurisdiction, profession and licensing board. Verify acceptance with your regulatory body before purchase.
          </p>
        </div>

        {/* Testimonials */}
        <div className="max-w-4xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-center text-foreground mb-2">What Clinicians Are Saying</h3>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Trusted by clinicians across Australia, the US, Canada and the UK
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {testimonials.slice(0, 3).map((t) => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 md:max-w-[66.666%] md:mx-auto">
            {testimonials.slice(3).map((t) => (
              <TestimonialCard key={t.name} t={t} />
            ))}
          </div>
        </div>

        {/* Guarantee + CE reimbursement */}
        <div className="max-w-4xl mx-auto mt-16 md:mt-20 grid md:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-6 border border-emerald-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-foreground">7-Day Satisfaction Guarantee</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Try the course risk-free. If it&apos;s not right for you, email us within
              7 days for a full refund — no questions asked.
            </p>
          </div>

          <div className="glass rounded-xl p-6 border border-blue-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground">Employer CE Reimbursement</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most employers and practices cover continuing education costs. We provide an
              invoice and CE certificate — everything your employer needs to approve reimbursement.
            </p>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-semibold text-sm text-foreground">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.a}
                      {item.link && (
                        <>{' '}<a href={item.link.href} className="text-accent underline underline-offset-2 hover:text-accent/80">{item.link.text}</a>.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 md:mt-20">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Start building concussion confidence today
            </h3>
            <p className="text-sm text-muted-foreground">
              {enrollmentCount >= 100
                ? `Join ${enrollmentCount}+ clinicians across 4 countries.`
                : 'Join clinicians building concussion confidence.'}
              {' '}7-day money-back guarantee.
            </p>
          </div>

          {/* Compact final CTA card */}
          <div className="max-w-md mx-auto">
            <div className="card card-visible rounded-xl p-5 flex flex-col" style={{ borderWidth: '2px', borderColor: 'rgba(13, 115, 119, 0.2)' }}>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-100 to-emerald-50 flex items-center justify-center border border-teal-200/50">
                  <BookOpen className="w-4 h-4 text-[var(--accent)]" strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[var(--accent)] border border-teal-200">
                  Online Course
                </span>
              </div>

              <div className="mb-4">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-[var(--foreground)]">${PRICE_USD}</span>
                  <span className="text-xs text-slate-400">USD</span>
                </div>
                <p className="text-[11px] text-[var(--muted-foreground)] mt-0.5">One-time · Lifetime access · 8 CE credits</p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full py-2.5 px-4 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>Enrol Now — USD ${PRICE_USD}</>
                )}
              </button>

              <p className="text-[10px] text-[var(--muted-foreground)] mt-2 text-center italic">
                &ldquo;Relevant, applicable and easy to absorb&rdquo; — Sarah, Physiotherapist
              </p>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px] text-[var(--muted-foreground)]">
              {['7-Day Guarantee', 'Secure Checkout'].map(item => (
                <div key={item} className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-[var(--accent)]" strokeWidth={2.5} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function PricingInternationalPage() {
  return <InternationalPricingContent />
}
