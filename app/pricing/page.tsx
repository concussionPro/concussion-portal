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
  GraduationCap,
  Check,
  ArrowRight,
  ExternalLink,
  Mail,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PricingOptions } from '@/components/PricingOptions'
import { CourseSchema, BreadcrumbSchema } from '@/components/SchemaMarkup'
import { createFAQSchema } from '@/lib/schema-markup'
import { CONFIG } from '@/lib/config'

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
  const toggleFaq = (i: number) => {
    setOpenFaqs(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  // Sticky mobile CTA — show after scrolling past pricing cards
  const [showStickyCta, setShowStickyCta] = useState(false)
  useEffect(() => {
    const target = document.getElementById('pricing-cards')
    if (!target) return
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyCta(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  // Enrollment count for credential bar social proof
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0)
  useEffect(() => {
    fetch('/api/enrollment-count')
      .then(res => res.json())
      .then(data => { if (data.count > 0) setEnrollmentCount(data.count) })
      .catch(() => {})
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
      a: 'Yes — contact us to arrange an upgrade. Enrolling in the complete course now locks in the registered-list price.',
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
      a: "We run workshops as demand in each city opens up. Q1 2026 workshops ran across all three cities. Drop your details on the interest list for your preferred city — you'll get 6 weeks' notice when the date is locked in, and registered-list pricing is locked in for you (no deadline). Registered participants choose their preferred date first.",
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
      a: 'The next confirmed workshop is Melbourne — Saturday 13 June 2026, Rydges Melbourne (Exhibition St), 8am–4pm with a catered lunch plus morning and afternoon tea included. Sydney and Byron Bay workshops open as soon as dates are confirmed (max 12 per session to keep hands-on practice time high). Drop your details on the interest list for your city — you\'ll get at least 6 weeks\' notice when your date is locked in.',
    },
    {
      q: 'Can I pay in instalments?',
      a: 'Yes — Afterpay and Klarna are available at checkout for both the online and complete course options. Split the cost into interest-free instalments with no additional fees.',
    },
    {
      q: 'I\'m not sure which option is right for me',
      a: 'The online course is ideal if you want flexible, self-paced concussion education you can fit around clinical work. The complete course adds a full day of supervised hands-on practice — administering SCAT6, VOMS, and BESS on real subjects with expert feedback. If you\'re unsure, start with the free SCAT6 Mastery course to experience the teaching style, or email Zac directly for a personal recommendation.',
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
                Earn 14 AHPRA CPD Hours{' '}
                <span className="text-gradient">Online</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Concussion assessment training for physiotherapists &amp; osteopaths.
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
                Concussion management training for Australian clinicians — SCAT6, VOMS &amp; BESS · 14 CPD hours · Osteopathy Australia endorsed · AHPRA aligned · Lifetime access.
              </p>
            </>
          )}
        </div>

        {/* OA endorsement — prominent block. The endorsement is one of the
            highest-trust signals in AHPRA-aligned CPD, so it carries visual
            weight here even though the H1 leads with what we do. */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
          <Image src="/osteopathy-australia-endorsed.png" alt="Endorsed by Osteopathy Australia" width={160} height={144} className="h-20 sm:h-24 w-auto" priority />
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-0.5">Endorsed by</p>
            <p className="text-lg sm:text-xl font-bold text-foreground leading-tight">Osteopathy Australia</p>
            <p className="text-xs text-muted-foreground mt-0.5">AHPRA aligned · 14 CPD hours</p>
          </div>
        </div>

        {/* Secondary trust signals — quieter row below the endorsement */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-8 text-[13px] text-muted-foreground">
          <span>7-day money-back guarantee</span>
          <span className="hidden sm:inline text-slate-300">·</span>
          <span className="font-semibold text-foreground">
            {enrollmentCount >= 100 ? `${enrollmentCount}+ clinicians enrolled` : 'Trusted by clinicians Australia-wide'}
          </span>
        </div>

        {/* International pricing link */}
        <div className="text-center mb-4">
          <Link href="/pricing-international" className="text-sm text-muted-foreground hover:text-accent transition-colors">
            Outside Australia? See international pricing (USD ${CONFIG.COURSE.PRICE_INTERNATIONAL})
          </Link>
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

        {/* Course map — orients the decision around three clear paths so the
            visitor self-selects before scrolling to pricing. Concussion Online
            and Concussion + Workshop are the focus of /pricing; the AI course
            is referenced as a separate adjacent track for visitors who landed
            here but want a different topic. */}
        <div className="max-w-4xl mx-auto mb-8">
          <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-accent mb-3 text-center">
            Choose your CPD path
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <a href="/courses/ai-in-clinical-practice" className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-accent/30 hover:shadow-sm transition-all">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">AI in Practice</p>
              <p className="text-sm font-bold text-foreground mb-1">AI in Clinical Practice</p>
              <p className="text-[11.5px] text-muted-foreground leading-snug mb-2">Heidi vs Lyrebird vs ChatGPT · AHPRA AI + Australian Privacy Principles · NDIS-audit-safe documentation.</p>
              <p className="text-[11px] text-accent font-semibold">3 CPD hrs · from ${99} →</p>
            </a>
            <a href="#pricing-cards" className="block rounded-xl border-2 border-accent/40 bg-accent/5 p-4 hover:border-accent transition-all">
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">Online · Most Flexible</p>
              <p className="text-sm font-bold text-foreground mb-1">Concussion Mastery — Online</p>
              <p className="text-[11.5px] text-muted-foreground leading-snug mb-2">8 modules · self-paced · lifetime access · OA endorsed. SCAT6, VOMS, BESS — all online.</p>
              <p className="text-[11px] text-accent font-semibold">8 CPD hrs · ${CONFIG.COURSE.PRICE_ONLINE} ↓ Below</p>
            </a>
            <a href="#pricing-cards" className="block rounded-xl border-2 border-accent bg-gradient-to-br from-accent/8 via-white to-accent/4 p-4 hover:shadow-sm transition-all">
              <p className="text-[10px] font-bold uppercase tracking-wider text-accent mb-1">Complete · Hands-On</p>
              <p className="text-sm font-bold text-foreground mb-1">Concussion Mastery — Complete</p>
              <p className="text-[11.5px] text-muted-foreground leading-snug mb-2">Online + in-person workshop day. Practical assessment with feedback. Registered-list pricing locked in.</p>
              <p className="text-[11px] text-accent font-semibold">14 CPD hrs · ${CONFIG.COURSE.PRICE_EARLY_BIRD.toLocaleString()} ↓ Below</p>
            </a>
          </div>
        </div>

        {/* Pricing Cards — visible within first scroll on mobile */}
        <div id="pricing-cards">
          <PricingOptions variant="full" />
        </div>

        {/* Social proof at decision moment — testimonial strip right after
            the pricing cards. Research: visitors who see named clinician
            quotes within the same scroll-screen as price convert higher
            than visitors who see them at page-bottom only. */}
        <div className="max-w-4xl mx-auto mt-6 mb-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {testimonials.slice(0, 3).map(t => (
              <TestimonialCard key={`pricing-${t.name}`} t={t} />
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

        {/* Regulatory context — reinforces decision after seeing price */}
        <div className="max-w-3xl mx-auto mt-12 mb-8 p-5 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Why clinicians are upskilling now</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link href="/blog/ais-concussion-brain-health-position-statement-2024" className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors">
              <span className="text-accent mt-0.5 text-lg leading-none">→</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">AIS Position Statement 2024</p>
                <p className="text-xs text-muted-foreground mt-0.5">Physiotherapists formally recognised as first-line concussion care providers</p>
              </div>
            </Link>
            <Link href="/blog/21-day-concussion-stand-down-youth-sport-australia" className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors">
              <span className="text-accent mt-0.5 text-lg leading-none">→</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">21-Day Stand-Down Rule</p>
                <p className="text-xs text-muted-foreground mt-0.5">Clubs need qualified assessors to manage the graded return protocol</p>
              </div>
            </Link>
            <Link href="/blog/nsw-mandatory-concussion-training-combat-sports" className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors">
              <span className="text-accent mt-0.5 text-lg leading-none">→</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">NSW Combat Sports Legislation</p>
                <p className="text-xs text-muted-foreground mt-0.5">First Australian jurisdiction to mandate concussion training</p>
              </div>
            </Link>
            <Link href="/blog/ahpra-cpd-requirements-concussion-education" className="group flex items-start gap-3 p-3 rounded-lg hover:bg-white transition-colors">
              <span className="text-accent mt-0.5 text-lg leading-none">→</span>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">AHPRA CPD Requirements</p>
                <p className="text-xs text-muted-foreground mt-0.5">How structured concussion education counts toward your annual obligations</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Free course card — escape hatch for not-ready visitors */}
        <div className="max-w-[900px] mx-auto mb-8">
          <div className="card rounded-2xl p-6 md:p-7 flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border-2 border-emerald-200/40">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center border border-emerald-200/50 flex-shrink-0">
              <GraduationCap className="w-7 h-7 text-emerald-600" strokeWidth={2} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h3 className="text-lg font-bold text-foreground">Not ready to commit? Start Free</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Free
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                3 focused modules on SCAT6 administration. Free, no card required. See the course quality before you commit.
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {['3 modules', 'Free', 'No payment required', 'Instant access'].map(item => (
                  <li key={item} className="flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/scat-mastery"
              className="flex-shrink-0 px-6 py-3.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              Start Free Course
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
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

        {/* Compare Plans — analytical decision support immediately after pricing (NNG: comparison tables) */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">Compare Plans</h3>
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
                      {online === true ? '\u2713' : online === false ? '\u2014' : online}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {workshop === true ? '\u2713' : workshop === false ? '\u2014' : workshop}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>

        {/* Why hands-on matters — workshop upsell nudge, placed after pricing to create desire without blocking online sale */}
        <div className="max-w-3xl mx-auto mt-10 p-5 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
          <p className="text-xs font-bold text-accent uppercase tracking-wide mb-3">Ready to take it further? Why hands-on matters</p>
          <ul className="space-y-2">
            {[
              'Practice SCAT6 administration on real subjects with expert feedback',
              'Master BESS & tandem gait scoring — the sections clinicians find most challenging',
              'Leave with a clinical toolkit you can use Monday morning',
            ].map((item, i) => (
              <li key={i} className="text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
                <span className="text-accent mt-0.5">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Testimonials — post-price objection handling (CXL: 20-30% more effective after price reveal) */}
        <div className="max-w-4xl mx-auto mt-12">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">What Clinicians Are Saying</h3>
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

        {/* Guarantee + Employer Reimbursement — final objection removal */}
        <div className="max-w-4xl mx-auto mt-16 md:mt-20 grid md:grid-cols-2 gap-4">
          {/* Money-back guarantee */}
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

          {/* Employer reimbursement */}
          <div className="glass rounded-xl p-6 border border-blue-200/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-foreground">Employer CPD Reimbursement</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Most employers and practices cover CPD training costs. We provide a
              tax invoice and AHPRA-aligned CPD certificate — everything your
              employer needs to approve reimbursement. Many clinicians pay $0 out of pocket.
            </p>
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
                  onClick={() => toggleFaq(i)}
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

        {/* Ask Zac — personal contact CTA for undecided visitors */}
        <div className="max-w-2xl mx-auto mt-10">
          <div className="glass rounded-xl p-6 flex flex-col sm:flex-row items-center gap-5">
            <Image
              src="/zac-lewis-headshot.jpg"
              alt="Zac Lewis"
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-accent/20"
            />
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-bold text-foreground mb-1">Still have questions?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Not sure which option fits your situation? Email me directly — I&apos;m happy to
                help you work out the right path. I reply within 24 hours.
              </p>
              <p className="text-xs text-muted-foreground mt-1">— Zac Lewis, Course Director</p>
            </div>
            <a
              href="mailto:zac@concussion-education-australia.com?subject=Question about the concussion course"
              className="flex-shrink-0 px-5 py-3 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Email Zac
            </a>
          </div>
        </div>

        {/* Final CTA */}
        <div id="pricing-compact" className="mt-16 md:mt-20">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Enrol today — lifetime access included
            </h3>
            <p className="text-sm text-muted-foreground">
              {enrollmentCount >= 100
                ? `Join ${enrollmentCount}+ clinicians building concussion confidence.`
                : 'Join clinicians building concussion confidence.'}
              {' '}7-day money-back guarantee.
            </p>
          </div>
          <PricingOptions variant="compact" />
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
            href="#pricing-compact"
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
