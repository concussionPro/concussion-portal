'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ShieldCheck,
  Building2,
  ArrowRight,
  ExternalLink,
  Check,
  BookOpen,
  MapPin,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PricingOptions } from '@/components/PricingOptions'
import { CourseSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import { createFAQSchema } from '@/lib/schema-markup'
import { CONFIG } from '@/lib/config'
import { LocationInterestCard } from '@/components/LocationInterestCard'
import { trackEvent } from '@/lib/analytics'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
  q: string
  a: string
  link?: { text: string; href: string }
}

// ─── Canceled Banner (isolated Suspense for useSearchParams) ─────────────────

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


// ─── Main Pricing Content ────────────────────────────────────────────────────

function PricingContent() {
  // FAQ accordion — allow multiple open
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set())
  const toggleFaq = (i: number, question: string) => {
    setOpenFaqs(prev => {
      const next = new Set(prev)
      if (next.has(i)) {
        next.delete(i)
      } else {
        next.add(i)
        // High-intent micro-signal: FAQ opens reveal the buyer's objection
        trackEvent('faq_open', { faq_index: i, question: question.slice(0, 80), source: 'pricing_page' })
      }
      return next
    })
  }

  // Fire pricing_page view on mount with UTM context — drives channel-attribution.
  // The route-change page_view event lands too — this is an explicit higher-intent
  // signal so the dashboard can show a real "pricing-viewer → buyer" funnel.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    trackEvent('pricing_page', {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_content: params.get('utm_content') || undefined,
      promo: params.get('promo') || undefined,
      location: params.get('location') || undefined,
    })
  }, [])

  // Sticky mobile CTA — show after scrolling past pricing cards.
  // Also doubles as the high-intent "scrolled past pricing" signal.
  const [showStickyCta, setShowStickyCta] = useState(false)
  useEffect(() => {
    const target = document.getElementById('pricing-cards')
    if (!target) return
    let firedScrolledTo = false
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyCta(!entry.isIntersecting)
        if (entry.isIntersecting && !firedScrolledTo) {
          firedScrolledTo = true
          trackEvent('pricing_cards_in_view', {})
        }
      },
      { threshold: 0 }
    )
    observer.observe(target)

    // Compare-Plans + FAQ in-view trackers — both signal late-funnel intent.
    const fired = new Set<string>()
    const microTargets: Array<{ id: string; event: string }> = [
      { id: 'faq', event: 'faq_section_in_view' },
    ]
    const microObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const m = microTargets.find((t) => document.getElementById(t.id) === e.target)
          if (m && !fired.has(m.event)) {
            fired.add(m.event)
            trackEvent(m.event, {})
          }
        }
      },
      { threshold: 0.3 }
    )
    for (const t of microTargets) {
      const el = document.getElementById(t.id)
      if (el) microObserver.observe(el)
    }
    return () => {
      observer.disconnect()
      microObserver.disconnect()
    }
  }, [])

  // UTM-aware hero — match the headline to the search intent that brought
  // them. Default 'Hands-On Concussion CPD' headline was misleading for
  // online-course paid traffic (which is 50%+ of mobile users) and for
  // SCAT6-specific search intent. Pricing page bounce is highest from
  // these mismatched-headline cohorts.
  type HeroVariant = 'default' | 'cpd' | 'online' | 'scat6'
  const [heroVariant, setHeroVariant] = useState<HeroVariant>('default')
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const haystack = [
      params.get('utm_campaign'),
      params.get('utm_content'),
      params.get('utm_term'),
    ].filter(Boolean).join(' ').toLowerCase()
    if (haystack.includes('cpd')) setHeroVariant('cpd')
    else if (haystack.includes('scat')) setHeroVariant('scat6')
    else if (
      haystack.includes('online') ||
      haystack.includes('direct') ||
      haystack.includes('2a') ||
      haystack.includes('course-direct')
    ) setHeroVariant('online')
  }, [])
  const isCpdTraffic = heroVariant === 'cpd'

  const faqs: FaqItem[] = [
    {
      q: 'Can I upgrade from online-only to the full course later?',
      a: 'Yes — self-serve from your dashboard. You pay the difference between your online course and the Complete Course ($693 at the early-bird rate), and nominate your workshop city at checkout.',
    },
    {
      q: 'When do I get access to the online modules?',
      a: "Immediately after purchase. You'll receive a login link via email within minutes.",
    },
    {
      q: 'What if I can\'t make my workshop date?',
      a: 'No problem — you can reschedule to any future workshop date or location at no extra cost. There\'s no expiry. Once enrolled, you have lifetime access to the online portal — content is updated and added to regularly as concussion guidelines evolve, so your knowledge stays current. Full flexibility on when you attend the hands-on day.',
    },
    {
      q: "How are workshop dates confirmed?",
      a: "We run workshops as demand in each city opens up — Melbourne's first round ran in June 2026, and the next rounds launch city-by-city. Drop your details on the interest list for your preferred city — you'll get 6 weeks' notice when the date is locked in. Registered participants choose their preferred date first.",
    },
    {
      q: 'How much time does the course take?',
      a: 'The online modules take approximately 8 hours total (8 CPD hours), completed at your own pace with no deadline. The hands-on workshop is a single full day (6 hours, 6 CPD hours). Most clinicians complete the online content over 2–4 weeks alongside their clinical workload.',
    },
    {
      q: 'Is this course only for osteopaths?',
      a: 'No — the course is designed for any clinician managing concussion, including physiotherapists, GPs, sports medicine doctors, exercise physiologists, and athletic trainers. The curriculum is AHPRA-aligned and endorsed by Osteopathy Australia, but the clinical content is universal.',
    },
    {
      q: 'What is your refund policy?',
      a: 'We offer a 7-day satisfaction guarantee. If the course isn\'t right for you, email us within 7 days of purchase for a full refund (online content must be less than 25% accessed). Workshop cancellations: full refund 14+ days before your workshop date, 50% refund 7–13 days before. Attendee substitution is always available.',
      link: { text: 'See our full terms and conditions', href: '/terms' },
    },
    {
      q: 'Can my employer pay for this?',
      a: 'Yes — most practices and employers cover CPD training costs. After purchase, you\'ll receive a tax invoice and AHPRA-aligned CPD certificate that your employer can use for reimbursement. Many clinicians pay nothing out of pocket.',
    },
    {
      q: 'Does this count toward my AHPRA CPD requirements?',
      a: 'Yes. The online modules count as formal CPD hours (8 hours), and the workshop adds 6 hours. Log it as "Educational Activity — Reviewing & Reflecting" in your CPD portfolio. Your certificate includes completion date, CPD hours, and a unique certificate ID — everything you need for an AHPRA audit. Endorsed by Osteopathy Australia.',
    },
    {
      q: 'Where are workshops held and when is the next one?',
      a: 'Workshops run city by city as each city fills — the June 2026 Melbourne workshop ran at Rydges Melbourne with a full hands-on day (max 12 per session to keep practice time high). When you enrol in the Complete Course you nominate your city; the date launches once enough clinicians in your city have enrolled, and you get at least 6 weeks\' notice. Enrolling before your city\'s date is announced locks in the $1,190 early-bird rate.',
    },
    {
      q: 'Can I pay in instalments?',
      a: 'Yes — Afterpay and Klarna are available at checkout for both the online and complete course options. Split the cost into interest-free instalments with no additional fees.',
    },
    {
      q: 'I\'m not sure which option is right for me',
      a: 'The online course is ideal if you want flexible, self-paced concussion education you can fit around clinical work. The complete course adds a full day of supervised hands-on practice — cranial nerve examination, cervical assessment, VOMS interpretation, then designing phenotype-driven rehab protocols on real subjects with expert feedback. If you\'re unsure, start with the free SCAT6 Mastery course to experience the teaching style, or email Zac directly for a personal recommendation.',
    },
  ]

  // FAQ schema for Google rich results (plain text for structured data)
  const faqSchemaData = faqs.map(f => ({
    question: f.q,
    answer: f.a + (f.link ? ` ${f.link.text}.` : ''),
  }))

  const testimonials = [
    {
      quote: 'Before this training, our approach to concussion cases was uncertain. Now, my team has the confidence and proven skills to diagnose and manage them with clarity.',
      name: 'Andy',
      role: 'Clinic Owner, NSW',
      initials: 'A',
    },
    {
      quote: "An outstanding blend of evidence-based knowledge and practical skills. Directly applicable to concussion diagnosis and management in real-world settings.",
      name: 'Dean',
      role: 'University Clinical Educator, QLD',
      initials: 'D',
    },
    {
      quote: 'Incredibly thorough and well structured. The hands-on component was invaluable — I left feeling genuinely confident in my concussion assessments.',
      name: 'Amelia',
      role: 'Physiotherapist',
      initials: 'A',
    },
    {
      quote: 'Well organised — content explained in a way that was relevant and memorable. Changed how I approach concussion in clinic.',
      name: 'Alex',
      role: 'Osteopath, Melbourne',
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
      <CourseSchema />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Pricing', url: '/pricing' },
      ]} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createFAQSchema(faqSchemaData)) }}
      />
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 pt-[120px] pb-12 md:pb-20">

        {/* Canceled notice — own Suspense boundary so it doesn't block SSR */}
        <CanceledBanner />

        {/* Page Header — variant matched to ad-group search intent
            (utm_campaign / utm_content / utm_term). */}
        <div className="text-center mb-8">
          {heroVariant === 'cpd' ? (
            <>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Earn 8 CPD Hours Online —{' '}
                <span className="text-gradient">14 with the Workshop</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                AHPRA-aligned concussion assessment training for physiotherapists &amp; osteopaths.
                Certificate on completion. Most employers reimburse — we provide the tax invoice.
              </p>
            </>
          ) : heroVariant === 'scat6' ? (
            <>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Master <span className="text-gradient">SCAT6 &amp; SCOAT6</span>{' '}
                — for clinicians, not just sideline staff
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Beyond the form: when to use SCAT6 vs SCOAT6, red-flag triage, and how the assessment fits into a defensible return-to-play decision. Includes the full 8-module concussion management course.
              </p>
            </>
          ) : heroVariant === 'online' ? (
            <>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Online Concussion Training{' '}
                <span className="text-gradient">for Australian Clinicians</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                8 modules · 8 AHPRA-aligned CPD hours · self-paced with lifetime access. Workshop optional. Most employers reimburse — we provide the tax invoice.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
                Concussion Clinical{' '}
                <span className="text-gradient">Mastery</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Become the concussion expert in your practice — advanced clinical skill for Australian clinicians.
              </p>
              {/* Skill chips — inline pills, no text-block. Captures the
                  6 actual clinical capabilities in scannable visual form. */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-3xl mx-auto mt-4">
                {[
                  'Phenotype rehab',
                  'Cranial nerve',
                  'Cervical exam',
                  'VOMS',
                  'Persistent PCS',
                  'Return-to-play',
                ].map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent/8 border border-accent/15 text-[11.5px] sm:text-xs font-semibold text-accent whitespace-nowrap">
                    <Check className="w-3 h-3 flex-shrink-0" strokeWidth={3} />
                    {skill}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Punch stat bento — research-backed wording for CPD course
              conversion: outcome-led labels ("Practical skills" not "online
              modules"), CPD-hours-as-currency, regulatory framing, status
              ("specialist-level"), risk reversal at end. Anchors the value
              prop before the OA block. */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 max-w-4xl mx-auto mt-7">
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-white border-l-4 border-amber-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-amber-700 leading-none">14<span className="text-base font-semibold">hrs</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">CPD (8 online + 6)</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-teal-50 to-white border-l-4 border-teal-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-teal-700 leading-none">8</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Self-paced modules</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-rose-50 to-white border-l-4 border-rose-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-rose-700 leading-none">1<span className="text-base font-semibold">day</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Hands-on workshop</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-white border-l-4 border-indigo-500 p-3 sm:p-4 text-left">
              <p className="text-2xl sm:text-3xl font-bold text-indigo-700 leading-none">∞</p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Lifetime access</p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border-l-4 border-emerald-500 p-3 sm:p-4 text-left col-span-2 lg:col-span-1">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700 leading-none">7<span className="text-base font-semibold">day</span></p>
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-slate-600 mt-1">Money-back</p>
            </div>
          </div>
        </div>

        {/* OA endorsement — prominent block. The endorsement is one of the
            highest-trust signals in AHPRA-aligned CPD, so it carries visual
            weight here even though the H1 leads with what we do. */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          <Image src="/osteopathy-australia-endorsed.png" alt="Endorsed by Osteopathy Australia" width={160} height={144} className="h-20 sm:h-24 w-auto" priority />
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">Endorsed by</p>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">Osteopathy Australia</p>
            <p className="text-xs text-muted-foreground mt-0.5">AHPRA aligned · 8 CPD hrs online, 14 with the workshop</p>
          </div>
        </div>

        {/* Live workshop training photo — visual proof of the in-person
            component before pricing. Research: photos of the actual product
            being delivered convert higher than stock imagery, especially
            for healthcare CPD where buyers want certainty the experience
            is real. Caption ties to "what you get" value prop. */}
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
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold text-amber-300 mb-1">Live workshop training</p>
            <h3 className="text-base sm:text-xl font-bold leading-tight">
              Cranial nerve exam, VOMS interpretation, phenotype-driven rehab — hands-on.
            </h3>
            <p className="text-[12.5px] sm:text-sm text-white/85 mt-1 leading-snug max-w-2xl">
              Workshop day: advanced clinical skill on real subjects with expert feedback. Cervical assessment, cranial nerve, VOMS, then designing phenotype-specific rehab protocols.
            </p>
          </div>
        </div>

        {/* Clinic-owner early signal — high-ROI traffic. Surfaces the team
            inquiry path before they bounce on individual sticker shock. */}
        <div className="text-center mb-4">
          <a
            href="#team-training"
            className="inline-flex items-center gap-1.5 text-sm text-accent font-semibold hover:text-accent/80 transition-colors"
          >
            Training a team? See team pricing
            <span aria-hidden="true">↓</span>
          </a>
        </div>

        {/* Try-before-you-buy — owner 2026-07-10: pricing must link through to a
            test module, PROMINENTLY. /preview = real Module 1 content, no signup. */}
        <div className="max-w-3xl mx-auto mb-5">
          <div className="rounded-2xl p-5 sm:p-6 bg-gradient-to-br from-[rgba(13,115,119,0.08)] via-white to-white border-2 border-[rgba(13,115,119,0.35)] shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-[11px] uppercase tracking-[0.16em] font-bold text-accent mb-1.5">Try it before you buy it</p>
                <h2 className="text-lg sm:text-xl font-bold text-foreground leading-tight mb-1.5">
                  Test-drive Module 1 — free, right now
                </h2>
                <p className="text-[13px] text-muted-foreground leading-snug">
                  Real course content, not a demo reel. No signup, no card — open it and judge the teaching for yourself.
                </p>
              </div>
              <Link
                href="/preview"
                className="btn-primary px-7 py-3.5 rounded-xl text-base font-bold inline-flex items-center justify-center gap-2 shadow-lg whitespace-nowrap flex-shrink-0"
              >
                <BookOpen className="w-4.5 h-4.5" aria-hidden="true" />
                Open Module 1 free
              </Link>
            </div>
          </div>
        </div>

        {/* Employer-reimbursement callout — universal (was variant-gated, but
            research shows this is a #1 objection across ALL paid CPD traffic,
            not just cpd/online searchers). Most clinicians have an annual
            CPD budget — surface this BEFORE the price. */}
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Most clinicians pay $0 out of pocket</p>
            <p className="text-xs text-muted-foreground mt-1">Your employer or practice likely covers CPD training costs. Tax invoice + AHPRA-aligned CPD certificate emailed instantly on purchase.</p>
          </div>
        </div>

        {/* Pricing Cards — visible within first scroll on mobile */}
        <div id="pricing-cards">
          <PricingOptions variant="full" />
        </div>

        {/* Compare Plans — analytical decision support IMMEDIATELY after
            pricing cards (NNG/Baymard research: comparison tables next to
            tier cards lift conversion 8-15% in healthcare CPD because
            buyers stop scrolling to mentally compare). */}
        <div className="mt-8 max-w-3xl mx-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3 text-center">Compare plans</p>
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="min-w-[600px] w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Feature</th>
                    <th className="text-center py-3 px-4 font-semibold text-[#5b9aa6] bg-[rgba(13,115,119,0.04)]">Online</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">+ Workshop</th>
                  </tr>
                </thead>
                <tbody>
                  {([
                    ['8 online modules', true, true],
                    ['Clinical Testing suite — SST Trainer + club baseline testing (founding period)', true, true],
                    ['Your clinic code — patients & clubs link straight to you', true, true],
                    ['Clinical Toolkit downloads', true, true],
                    ['CPD certificate (online)', '8 pts', '8 pts'],
                    ['Lifetime access', true, true],
                    ['Full-day hands-on workshop', false, true],
                    ['Expert coaching & 1:1 feedback', false, true],
                    ['Supervised clinical practice', false, true],
                    ['Workshop CPD certificate', false, '6 pts'],
                    ['Total CPD hours', '8', '14'],
                    ['Afterpay / Klarna available', true, true],
                  ] as [string, boolean | string, boolean | string][]).map(([feature, online, workshop], i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="py-3 px-4 text-slate-700">{feature}</td>
                      <td className={`py-3 px-4 text-center font-medium ${i % 2 === 0 ? 'bg-[rgba(13,115,119,0.03)]' : 'bg-[rgba(13,115,119,0.06)]'}`}>
                        {online === true ? '✓' : online === false ? '—' : online}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {workshop === true ? '✓' : workshop === false ? '—' : workshop}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Social proof at decision moment — testimonial strip after the
            comparison table. Research-backed order: analytical (compare)
            then emotional (others succeeded), both adjacent to price. */}
        <div className="max-w-4xl mx-auto mt-8 mb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {testimonials.slice(0, 3).map(t => (
              <TestimonialCard key={`pricing-${t.name}`} t={t} />
            ))}
          </div>
        </div>

        {/* Workshop locations — owner 2026-07-10: city blocks belong on the
            pricing page too (Complete-course buyers ask "when's my city?"). */}
        <div id="workshop-locations" className="max-w-4xl mx-auto mt-10 mb-4">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-accent mb-2">
              <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
              Hands-on workshops across Australia
            </span>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Where the practical day runs
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto mt-2">
              Buy the Complete Course any time — you nominate your city at checkout, and the
              date launches once your city hits its threshold. At least {CONFIG.WORKSHOP.LEAD_TIME_WEEKS} weeks&apos; notice.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {([
              { city: 'Melbourne', citySlug: 'melbourne', img: '/locations/melbourne.webp', status: 'Delivered · Jun 2026', dotClass: 'bg-slate-400', statusTextClass: 'text-slate-600', caption: 'Register for the next Melbourne round' },
              { city: 'Sydney', citySlug: 'sydney', img: '/locations/sydney.jpg', status: 'Registering interest', dotClass: 'bg-orange-500 animate-pulse', statusTextClass: 'text-orange-700', caption: "Be first to know when Sydney's date is confirmed" },
              { city: 'Byron Bay', citySlug: 'byron-bay', img: '/locations/byron-bay.jpg', status: 'Registering interest', dotClass: 'bg-orange-500 animate-pulse', statusTextClass: 'text-orange-700', caption: "Be first to know when Byron Bay's date is confirmed" },
            ] as const).map((loc) => (
              <LocationInterestCard key={loc.city} {...loc} />
            ))}
          </div>
        </div>

        {/* AHPRA + reimbursement microcopy below the pricing cards — directly
            addresses the two healthcare-CPD friction questions ("will this
            count?" + "can I claim it back?") at decision moment. */}
        <div className="max-w-3xl mx-auto mt-4 mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" /> AHPRA CPD audit-ready certificate
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-blue-600" /> Tax invoice emailed instantly
          </span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" /> 7-day money-back guarantee
          </span>
        </div>

        {/* Meet Your Instructor */}
        <div className="max-w-3xl mx-auto mb-8">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">Meet Your Instructor</h3>
          <div className="glass rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Image
              src="/zac-lewis-headshot.jpg"
              alt="Zac Lewis — Osteopath, Concussion Researcher"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover flex-shrink-0 border-2 border-accent/20"
            />
            <div>
              <h4 className="text-lg font-bold text-foreground mb-0.5">Zac Lewis</h4>
              <p className="text-sm text-accent font-medium mb-1">Osteopath · Concussion Researcher</p>
              <p className="text-xs text-muted-foreground mb-3">B.Clin.Sci, M.Ost.Med</p>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                With over a decade of clinical experience, Zac has managed concussion across national and professional ice hockey in New Zealand and Canada. He now leads Concussion Education Australia, combining clinical mentorship with the latest evidence to train the next generation of concussion-confident clinicians.
              </p>
              <a
                href="https://concussion-education-australia.com/#facilitators"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-accent font-semibold hover:text-accent/80 transition-colors"
              >
                See all facilitators
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div id="faq" className="max-w-2xl mx-auto mt-16 md:mt-20">
          <h2 className="text-2xl font-bold text-center mb-8 text-foreground">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleFaq(i, item.q)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
                  aria-expanded={openFaqs.has(i)}
                >
                  <span className="font-semibold text-sm text-foreground">{item.q}</span>
                  {openFaqs.has(i) ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaqs.has(i) && (
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

      </div>

      {/* Sticky mobile CTA — appears after scrolling past pricing cards */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ${
          showStickyCta ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="backdrop-blur-lg bg-background/90 border-t border-slate-200 px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-foreground">
            Enrol — from ${CONFIG.COURSE.PRICE_ONLINE}
          </span>
          <a
            href="#pricing-cards"
            className="btn-primary px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 flex-shrink-0"
          >
            View Plans
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function PricingPage() {
  return <PricingContent />
}
