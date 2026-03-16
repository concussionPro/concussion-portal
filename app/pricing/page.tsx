'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  ShieldCheck,
  Building2,
} from 'lucide-react'
import { SiteNav } from '@/components/SiteNav'
import { PricingOptions } from '@/components/PricingOptions'
import { createFAQSchema } from '@/lib/schema-markup'
import { CONFIG } from '@/lib/config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FaqItem {
  q: string
  a: string
  link?: { text: string; href: string }
}

// ─── Main Pricing Content ────────────────────────────────────────────────────

function PricingContent() {
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Enrollment count for credential bar social proof
  const [enrollmentCount, setEnrollmentCount] = useState<number>(0)
  useEffect(() => {
    fetch('/api/enrollment-count')
      .then(res => res.json())
      .then(data => { if (data.count > 0) setEnrollmentCount(data.count) })
      .catch(() => {})
  }, [])

  // Per-city enrollment counts for workshop progress bars
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({})
  const [cityThreshold, setCityThreshold] = useState<number>(8)
  useEffect(() => {
    fetch('/api/enrollment-counts')
      .then(res => res.json())
      .then(data => {
        if (data.counts) setCityCounts(data.counts)
        if (data.threshold) setCityThreshold(data.threshold)
      })
      .catch(() => {})
  }, [])

  // Only show progress bars when at least one city has registrations
  const hasAnyRegistrations = Object.values(cityCounts).some(c => c > 0)

  // Early bird deadline formatted from config
  const earlyBirdDate = new Date(CONFIG.WORKSHOP.EARLY_BIRD_DEADLINE + 'T00:00:00')
    .toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  const faqs: FaqItem[] = [
    {
      q: 'Can I upgrade from online-only to the full course later?',
      a: 'Yes — contact us to arrange an upgrade. Note that early bird pricing may no longer be available, so enrolling in the complete course now locks in the best rate.',
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
      a: "We run workshops once a city reaches enough registrations — this ensures a great hands-on learning environment. Q1 2026 workshops ran across all three cities. For the next round (Jun–Aug 2026), we'll confirm your date and venue 6 weeks in advance. Registered participants choose their preferred date first.",
    },
    {
      q: 'How much time does the course take?',
      a: 'The online modules take approximately 10 hours total, completed at your own pace with no deadline. The hands-on workshop is a single full day (6 hours). Most clinicians complete the online content over 2–4 weeks alongside their clinical workload.',
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
  ]

  // FAQ schema for Google rich results (plain text for structured data)
  const faqSchemaData = faqs.map(f => ({
    question: f.q,
    answer: f.a + (f.link ? ` ${f.link.text}.` : ''),
  }))

  const testimonials = [
    {
      quote: 'Relevant, applicable and easy to absorb. A must for any clinician managing concussion',
      name: 'Sarah',
      role: 'Physiotherapist',
      initials: 'S',
    },
    {
      quote: "An outstanding blend of evidence-based knowledge and practical skills. Directly applicable to concussion diagnosis and management in real-world settings.",
      name: 'Dean',
      role: 'University Clinical Educator, QLD',
      initials: 'D',
    },
    {
      quote: 'Highly recommend for any health professional wanting to improve their concussion management skills',
      name: 'Bailey',
      role: 'Exercise Physiologist',
      initials: 'B',
    },
    {
      quote: 'Well organised...content explained in a way that was relevant and memorable',
      name: 'Alex',
      role: 'Osteopath, Melbourne',
      initials: 'A',
    },
    {
      quote: 'Incredibly thorough and well structured...hands on component was invaluable',
      name: 'Amelia',
      role: 'Physiotherapist',
      initials: 'A',
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(createFAQSchema(faqSchemaData)) }}
      />
      <SiteNav />

      <div className="max-w-6xl mx-auto px-6 pt-[80px] pb-12 md:pb-20">

        {/* Canceled notice */}
        {canceled && (
          <div className="max-w-2xl mx-auto mb-8 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              Checkout was canceled — no charge was made. You can try again whenever you&apos;re ready.
            </p>
          </div>
        )}

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Australia&apos;s Only Hands-On{' '}
            <span className="text-gradient">Concussion CPD</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Master SCAT6, VOMS &amp; BESS with expert-led training. Early bird pricing ends {earlyBirdDate}.
          </p>
        </div>

        {/* Credential bar: OA endorsement + trust signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-8 py-4 px-6 glass rounded-xl border border-accent/10">
          <div className="flex items-center gap-2">
            <img src="/osteopathy-australia-endorsed.png" alt="Endorsed by Osteopathy Australia" className="h-8 w-auto" />
            <span className="text-sm font-semibold text-foreground">Endorsed by Osteopathy Australia</span>
          </div>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="text-sm text-muted-foreground">AHPRA Aligned · Up to 14 CPD Points</span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span className="text-sm text-muted-foreground">7-day money-back guarantee</span>
          {enrollmentCount >= 10 && (
            <>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="text-sm font-semibold text-foreground">{enrollmentCount}+ clinicians enrolled</span>
            </>
          )}
        </div>

        {/* Pricing Cards */}
        <PricingOptions variant="full" />

        {/* Workshop city progress bars — urgency lever, positioned near pricing decision */}
        {hasAnyRegistrations && (
          <div className="max-w-[900px] mx-auto mt-8 p-4 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
            <p className="text-xs font-bold text-accent uppercase tracking-wide mb-3">Workshop Registrations — {CONFIG.WORKSHOP.NEXT_ROUND}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { slug: 'sydney', label: 'Sydney' },
                { slug: 'melbourne', label: 'Melbourne' },
                { slug: 'byron-bay', label: 'Byron Bay' },
              ].map(city => {
                const count = cityCounts[city.slug] || 0
                const pct = Math.min(Math.round((count / cityThreshold) * 100), 100)
                return (
                  <div key={city.slug} className="bg-white/60 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-foreground">{city.label}</span>
                      <span className="text-[10px] text-muted-foreground">{count}/{cityThreshold} registered</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {count >= cityThreshold ? (
                      <p className="text-[10px] text-emerald-600 font-medium mt-1">Threshold reached — date confirming soon</p>
                    ) : (
                      <p className="text-[10px] text-muted-foreground mt-1">{cityThreshold - count} more to confirm date</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Why hands-on matters */}
        <div className="max-w-3xl mx-auto mt-10 p-5 rounded-xl bg-[rgba(13,115,119,0.04)] border border-[rgba(13,115,119,0.12)]">
          <p className="text-xs font-bold text-accent uppercase tracking-wide mb-3">Why hands-on matters</p>
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

        {/* Compare Plans */}
        <div className="mt-12 max-w-3xl mx-auto">
          <h3 className="text-xl font-bold text-center text-foreground mb-6">Compare Plans</h3>
          <div className="overflow-x-auto -mx-4 px-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="min-w-[600px] w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-700">Feature</th>
                  <th className="text-center py-3 px-4 font-semibold text-[#5b9aa6] bg-[rgba(13,115,119,0.04)]">Complete</th>
                  <th className="text-center py-3 px-4 font-semibold text-slate-700">Online</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ['8 online modules', true, true],
                  ['Clinical Toolkit downloads', true, true],
                  ['CPD certificate (online)', '8 pts', '8 pts'],
                  ['Lifetime access', true, true],
                  ['Full-day hands-on workshop', true, false],
                  ['Workshop CPD certificate', '6 pts', false],
                  ['Total CPD points', '14', '8'],
                  ['SCAT6 live practice', true, false],
                  ['Afterpay / Klarna available', true, true],
                ] as [string, boolean | string, boolean | string][]).map(([feature, complete, online], i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="py-3 px-4 text-slate-700">{feature}</td>
                    <td className={`py-3 px-4 text-center font-medium ${i % 2 === 0 ? 'bg-[rgba(13,115,119,0.03)]' : 'bg-[rgba(13,115,119,0.06)]'}`}>
                      {complete === true ? '\u2713' : complete === false ? '\u2014' : complete}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {online === true ? '\u2713' : online === false ? '\u2014' : online}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>

        {/* Testimonials — 3 + 2 centered */}
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

        {/* Guarantee + Employer Reimbursement */}
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
              Complete Module 1. If you&apos;re not confident this course is right for you,
              email us within 7 days for a full refund — no questions asked.
              We&apos;re confident in what we&apos;ve built, and we want you to be too.
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
            <h3 className="text-xl font-bold text-foreground mb-2">Ready to start?</h3>
            <p className="text-sm text-muted-foreground">Join clinicians building concussion confidence. Enrol today.</p>
          </div>
          <PricingOptions variant="compact" />
        </div>

      </div>
    </div>
  )
}

// ─── Page Export ─────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
